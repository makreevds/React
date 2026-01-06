from django.contrib import admin
from django.utils import timezone
from .models import Wishlist, Wish


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    """Административная панель для модели Wishlist."""
    
    def formatted_created_at(self, obj):
        """Форматирует время создания с секундами."""
        if obj.created_at:
            return timezone.localtime(obj.created_at).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_created_at.short_description = 'Дата создания'
    formatted_created_at.admin_order_field = 'created_at'
    
    def formatted_updated_at(self, obj):
        """Форматирует время обновления с секундами."""
        if obj.updated_at:
            return timezone.localtime(obj.updated_at).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_updated_at.short_description = 'Дата обновления'
    formatted_updated_at.admin_order_field = 'updated_at'
    
    def wishes_count(self, obj):
        """Возвращает количество желаний в вишлисте."""
        return obj.wishes.count()
    wishes_count.short_description = 'Количество желаний'
    
    list_display = (
        'id',
        'name',
        'user',
        'wishes_count',
        'order',
        'formatted_created_at',
        'formatted_updated_at',
    )
    
    list_filter = (
        'created_at',
        'updated_at',
    )
    
    search_fields = (
        'name',
        'description',
        'user__first_name',
        'user__last_name',
        'user__telegram_id',
    )
    
    readonly_fields = (
        'formatted_created_at',
        'formatted_updated_at',
        'wishes_count',
    )
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'user',
                'name',
                'description',
            )
        }),
        ('Настройки', {
            'fields': (
                'order',
            )
        }),
        ('Временные метки', {
            'fields': (
                'formatted_created_at',
                'formatted_updated_at',
            )
        }),
        ('Статистика', {
            'fields': (
                'wishes_count',
            )
        }),
    )
    
    ordering = ('-created_at',)


@admin.register(Wish)
class WishAdmin(admin.ModelAdmin):
    """Административная панель для модели Wish."""
    
    def formatted_created_at(self, obj):
        """Форматирует время создания с секундами."""
        if obj.created_at:
            return timezone.localtime(obj.created_at).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_created_at.short_description = 'Дата создания'
    formatted_created_at.admin_order_field = 'created_at'
    
    def formatted_updated_at(self, obj):
        """Форматирует время обновления с секундами."""
        if obj.updated_at:
            return timezone.localtime(obj.updated_at).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_updated_at.short_description = 'Дата обновления'
    formatted_updated_at.admin_order_field = 'updated_at'
    
    def formatted_reserved_at(self, obj):
        """Форматирует время резервирования с секундами."""
        if obj.reserved_at:
            return timezone.localtime(obj.reserved_at).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_reserved_at.short_description = 'Дата резервирования'
    formatted_reserved_at.admin_order_field = 'reserved_at'
    
    def formatted_gifted_at(self, obj):
        """Форматирует время дарения с секундами."""
        if obj.gifted_at:
            return timezone.localtime(obj.gifted_at).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_gifted_at.short_description = 'Дата дарения'
    formatted_gifted_at.admin_order_field = 'gifted_at'
    
    def price_display(self, obj):
        """Отображает цену с валютой."""
        if obj.price:
            return f"{obj.price} {obj.currency}"
        return '-'
    price_display.short_description = 'Цена'
    
    list_display = (
        'id',
        'title',
        'user',
        'wishlist',
        'status',
        'price_display',
        'reserved_by',
        'gifted_by',
        'order',
        'formatted_created_at',
    )
    
    list_filter = (
        'status',
        'wishlist',
        'created_at',
        'updated_at',
        'reserved_at',
        'gifted_at',
    )
    
    search_fields = (
        'title',
        'description',
        'user__first_name',
        'user__last_name',
        'user__telegram_id',
        'wishlist__name',
    )
    
    readonly_fields = (
        'formatted_created_at',
        'formatted_updated_at',
        'formatted_reserved_at',
        'formatted_gifted_at',
    )
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'wishlist',
                'user',
                'title',
                'description',
            )
        }),
        ('Детали желания', {
            'fields': (
                'link',
                'image_url',
                'price',
                'currency',
            )
        }),
        ('Статус', {
            'fields': (
                'status',
                'reserved_by',
                'gifted_by',
            )
        }),
        ('Временные метки', {
            'fields': (
                'formatted_created_at',
                'formatted_updated_at',
                'formatted_reserved_at',
                'formatted_gifted_at',
            )
        }),
        ('Сортировка', {
            'fields': (
                'order',
            )
        }),
    )
    
    ordering = ('-created_at',)
