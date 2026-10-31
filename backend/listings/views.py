import math
from datetime import datetime

from django.conf import settings
from django.db.models import Count
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Lead, Locality, Property
from .serializers import (
    LeadSerializer,
    LeadUpdateSerializer,
    LocalitySerializer,
    PropertyCreateSerializer,
    PropertySerializer,
)


def distance_km(a_lat, a_lng, b_lat, b_lng):
    to_rad = math.radians
    r = 6371
    d_lat = to_rad(b_lat - a_lat)
    d_lng = to_rad(b_lng - a_lng)
    lat1 = to_rad(a_lat)
    lat2 = to_rad(b_lat)
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


class PropertyListAPI(generics.ListAPIView):
    serializer_class = PropertySerializer

    def get_queryset(self):
        qs = Property.objects.select_related('locality').all()
        property_type = self.request.query_params.get('type')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        nearby = self.request.query_params.get('nearby')
        localities = self.request.query_params.getlist('locality')
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = float(self.request.query_params.get('radius_km', 4))

        if property_type:
            qs = qs.filter(property_type=property_type)
        if min_price not in (None, ''):
            qs = qs.filter(price__gte=int(min_price))
        if max_price not in (None, ''):
            qs = qs.filter(price__lte=int(max_price))
        if localities:
            qs = qs.filter(locality__name__in=localities)

        if nearby in ('1', 'true', 'True'):
            if lat and lng:
                user_lat = float(lat)
                user_lng = float(lng)
                nearby_ids = []
                for prop in qs:
                    loc = prop.locality
                    if loc.lat is None or loc.lng is None:
                        if prop.nearby:
                            nearby_ids.append(prop.id)
                        continue
                    if distance_km(user_lat, user_lng, loc.lat, loc.lng) <= radius:
                        nearby_ids.append(prop.id)
                qs = qs.filter(id__in=nearby_ids)
            else:
                qs = qs.filter(nearby=True)

        return qs


class LocalityListAPI(generics.ListAPIView):
    queryset = Locality.objects.all()
    serializer_class = LocalitySerializer


class LeadCreateAPI(generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


class MetaAPI(APIView):
    def get(self, request):
        return Response(
            {
                'city': 'Jind',
                'state': 'Haryana',
                'nearby_radius_km': 4,
                'property_types': ['house', 'plot', 'rent', 'shop', 'killa'],
            }
        )


class AdminStatsAPI(APIView):
    def get(self, request):
        now = timezone.localtime()
        start = datetime(now.year, now.month, now.day, tzinfo=now.tzinfo)
        total_leads = Lead.objects.count()
        today_leads = Lead.objects.filter(created_at__gte=start).count()
        pending_calls = Lead.objects.filter(status=Lead.STATUS_NEW).count()
        by_status = {
            row['status']: row['c']
            for row in Lead.objects.values('status').annotate(c=Count('id'))
        }
        for key, _ in Lead.STATUS_CHOICES:
            by_status.setdefault(key, 0)
        total_listings = Property.objects.count()
        by_category = {
            row['property_type']: row['c']
            for row in Property.objects.values('property_type').annotate(c=Count('id'))
        }
        for key, _ in Property.TYPE_CHOICES:
            by_category.setdefault(key, 0)
        lead_rate = getattr(settings, 'LEAD_VALUE_RUPEES', 50)
        return Response(
            {
                'total_leads': total_leads,
                'today_leads': today_leads,
                'pending_calls': pending_calls,
                'by_status': by_status,
                'to_call': by_status.get(Lead.STATUS_NEW, 0),
                'call_done': by_status.get(Lead.STATUS_CALLED, 0),
                'interested': by_status.get(Lead.STATUS_INTERESTED, 0),
                'not_interested': by_status.get(Lead.STATUS_NOT_INTERESTED, 0),
                'total_listings': total_listings,
                'by_category': by_category,
                'lead_value_rate': lead_rate,
                'lead_value': pending_calls * lead_rate,
                'recent_leads': LeadSerializer(
                    Lead.objects.all()[:5], many=True
                ).data,
            }
        )


class AdminLeadListAPI(generics.ListAPIView):
    serializer_class = LeadSerializer

    def get_queryset(self):
        qs = Lead.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminLeadDetailAPI(generics.UpdateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadUpdateSerializer
    http_method_names = ['patch', 'put', 'options', 'head']

    def perform_update(self, serializer):
        status_value = serializer.validated_data.get('status')
        extra = {}
        if status_value in (
            Lead.STATUS_CALLED,
            Lead.STATUS_INTERESTED,
            Lead.STATUS_NOT_INTERESTED,
        ):
            extra['called_at'] = timezone.now()
        serializer.save(**extra)


class AdminPropertyListCreateAPI(generics.ListCreateAPIView):
    def get_queryset(self):
        return Property.objects.select_related('locality').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PropertyCreateSerializer
        return PropertySerializer

    def create(self, request, *args, **kwargs):
        serializer = PropertyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prop = serializer.save()
        return Response(PropertySerializer(prop).data, status=status.HTTP_201_CREATED)
