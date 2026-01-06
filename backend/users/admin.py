from django.contrib import admin
from django.utils import timezone
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Административная панель для модели User."""
    
    def formatted_registration_time(self, obj):
        """Форматирует время регистрации с секундами."""
        if obj.registration_time:
            return timezone.localtime(obj.registration_time).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_registration_time.short_description = 'Время регистрации'
    formatted_registration_time.admin_order_field = 'registration_time'
    
    def formatted_last_visit(self, obj):
        """Форматирует время последнего посещения с секундами."""
        if obj.last_visit:
            return timezone.localtime(obj.last_visit).strftime('%d.%m.%Y %H:%M:%S')
        return '-'
    formatted_last_visit.short_description = 'Время последнего посещения'
    formatted_last_visit.admin_order_field = 'last_visit'
    
    list_display = (
        'id',
        'telegram_id',
        'first_name',
        'last_name',
        'username',
        'formatted_registration_time',
        'formatted_last_visit',
        'language',
        'theme_color',
        'birth_date',
        'gifts_given',
        'gifts_received',
        'invited_by',
    )
    
    list_filter = (
        'language',
        'theme_color',
        'registration_time',
        'last_visit',
        'birth_date',
    )
    
    search_fields = (
        'telegram_id',
        'first_name',
        'last_name',
        'username',
    )
    
    readonly_fields = (
        'formatted_registration_time',
        'formatted_last_visit',
    )
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'telegram_id',
                'first_name',
                'last_name',
                'username',
            )
        }),
        ('Личная информация', {
            'fields': (
                'birth_date',
                'address',
                'hobbies',
            )
        }),
        ('Статистика подарков', {
            'fields': (
                'gifts_given',
                'gifts_received',
            )
        }),
        ('Настройки', {
            'fields': (
                'language',
                'theme_color',
            )
        }),
        ('Реферальная система', {
            'fields': (
                'invited_by',
            )
        }),
        ('Подписки', {
            'fields': (
                'subscriptions',
            )
        }),
        ('Временные метки', {
            'fields': (
                'formatted_registration_time',
                'formatted_last_visit',
            )
        }),
    )
    
    filter_horizontal = ('subscriptions',)
    
    ordering = ('-registration_time',)
