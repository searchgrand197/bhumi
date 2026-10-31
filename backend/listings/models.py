from django.db import models


class Locality(models.Model):
    name = models.CharField(max_length=120, unique=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'localities'
        ordering = ['name']

    def __str__(self):
        return self.name


class Property(models.Model):
    TYPE_HOUSE = 'house'
    TYPE_PLOT = 'plot'
    TYPE_RENT = 'rent'
    TYPE_SHOP = 'shop'
    TYPE_KILLA = 'killa'
    TYPE_CHOICES = [
        (TYPE_HOUSE, 'House'),
        (TYPE_PLOT, 'Plot'),
        (TYPE_RENT, 'Rent'),
        (TYPE_SHOP, 'Shop / Showroom'),
        (TYPE_KILLA, 'Killa / Field'),
    ]

    code = models.CharField(max_length=32, unique=True)
    title = models.CharField(max_length=200)
    property_type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    price = models.PositiveIntegerField()
    negotiable = models.BooleanField(default=False)
    locality = models.ForeignKey(Locality, on_delete=models.PROTECT, related_name='properties')
    area = models.CharField(max_length=64)
    dimensions = models.CharField(max_length=64, blank=True, default='')
    facing = models.CharField(max_length=32, blank=True, default='')
    corner = models.BooleanField(default=False)
    submersible = models.BooleanField(default=False)
    nearby = models.BooleanField(default=False)
    registry = models.BooleanField(default=True)
    no_loan = models.BooleanField(default=True)
    int_kaal = models.BooleanField(default=False)
    images = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'properties'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} — {self.title}'


class Lead(models.Model):
    STATUS_NEW = 'new'
    STATUS_CALLED = 'called'
    STATUS_INTERESTED = 'interested'
    STATUS_NOT_INTERESTED = 'not_interested'
    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_CALLED, 'Call done'),
        (STATUS_INTERESTED, 'Interested'),
        (STATUS_NOT_INTERESTED, 'Not interested'),
    ]

    phone = models.CharField(max_length=20)
    source = models.CharField(max_length=64, blank=True, default='popup')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_NEW)
    notes = models.TextField(blank=True, default='')
    called_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.phone
