from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Административная панель для модели User."""
    
    list_display = (
        'id',
        'telegram_id',
        'first_name',
        'last_name',
        'username',
        'registration_time',
        'last_visit',
        'language',
        'theme_color',
        'invited_by',
    )
    
    list_filter = (
        'language',
        'theme_color',
        'registration_time',
        'last_visit',
    )
    
    search_fields = (
        'telegram_id',
        'first_name',
        'last_name',
        'username',
    )
    
    readonly_fields = (
        'registration_time',
        'last_visit',
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
        ('Временные метки', {
            'fields': (
                'registration_time',
                'last_visit',
            )
        }),
    )
    
    ordering = ('-registration_time',)
