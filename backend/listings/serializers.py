from rest_framework import serializers

from .models import Lead, Locality, Property


class LocalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Locality
        fields = ['id', 'name', 'lat', 'lng']


class PropertySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='code')
    type = serializers.CharField(source='property_type')
    locality = serializers.CharField(source='locality.name')
    noLoan = serializers.BooleanField(source='no_loan')
    intKaal = serializers.BooleanField(source='int_kaal')

    class Meta:
        model = Property
        fields = [
            'id',
            'title',
            'type',
            'price',
            'negotiable',
            'locality',
            'area',
            'dimensions',
            'facing',
            'corner',
            'submersible',
            'nearby',
            'registry',
            'noLoan',
            'intKaal',
            'images',
        ]


class PropertyCreateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32, required=False, allow_blank=True)
    title = serializers.CharField(max_length=200)
    type = serializers.ChoiceField(choices=[c[0] for c in Property.TYPE_CHOICES])
    price = serializers.IntegerField(min_value=0)
    negotiable = serializers.BooleanField(required=False, default=False)
    locality = serializers.CharField(max_length=120)
    area = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
    dimensions = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
    facing = serializers.CharField(max_length=32, required=False, allow_blank=True, default='')
    corner = serializers.BooleanField(required=False, default=False)
    submersible = serializers.BooleanField(required=False, default=False)
    nearby = serializers.BooleanField(required=False, default=False)
    registry = serializers.BooleanField(required=False, default=True)
    noLoan = serializers.BooleanField(required=False, default=True)
    intKaal = serializers.BooleanField(required=False, default=False)
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=list,
    )

    def create(self, validated_data):
        locality_name = validated_data.pop('locality').strip()
        locality, _ = Locality.objects.get_or_create(name=locality_name)
        property_type = validated_data.pop('type')
        code = (validated_data.pop('code', '') or '').strip()
        if not code:
            prefix = {
                'house': 'BH',
                'plot': 'PL',
                'rent': 'RH',
                'shop': 'SH',
                'killa': 'KL',
            }.get(property_type, 'PR')
            n = Property.objects.filter(property_type=property_type).count() + 1
            code = f'{prefix}-{1000 + n}'
            while Property.objects.filter(code=code).exists():
                n += 1
                code = f'{prefix}-{1000 + n}'

        return Property.objects.create(
            code=code,
            title=validated_data['title'],
            property_type=property_type,
            price=validated_data['price'],
            negotiable=validated_data.get('negotiable', False),
            locality=locality,
            area=validated_data.get('area', ''),
            dimensions=validated_data.get('dimensions', ''),
            facing=validated_data.get('facing', ''),
            corner=validated_data.get('corner', False),
            submersible=validated_data.get('submersible', False),
            nearby=validated_data.get('nearby', False),
            registry=validated_data.get('registry', True),
            no_loan=validated_data.get('noLoan', True),
            int_kaal=validated_data.get('intKaal', False),
            images=validated_data.get('images') or [],
        )


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id', 'phone', 'source', 'status', 'notes', 'called_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class LeadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['status', 'notes']
