from django.contrib import admin

from .models import Lead, Locality, Property


@admin.register(Locality)
class LocalityAdmin(admin.ModelAdmin):
    list_display = ('name', 'lat', 'lng')
    search_fields = ('name',)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'code',
        'title',
        'property_type',
        'price',
        'locality',
        'dimensions',
        'facing',
        'corner',
        'submersible',
        'negotiable',
        'nearby',
    )
    list_filter = ('property_type', 'facing', 'corner', 'submersible', 'negotiable', 'nearby', 'registry')
    search_fields = ('code', 'title', 'locality__name', 'dimensions')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('phone', 'source', 'status', 'called_at', 'created_at')
    list_filter = ('status', 'source')
    search_fields = ('phone', 'notes')
