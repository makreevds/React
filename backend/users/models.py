from django.db import models
from django.utils import timezone


class User(models.Model):
    """Модель пользователя для хранения информации о пользователях приложения."""
    
    telegram_id = models.BigIntegerField(
        unique=True,
        verbose_name='Telegram ID',
        help_text='Уникальный идентификатор пользователя в Telegram'
    )
    
    first_name = models.CharField(
        max_length=150,
        verbose_name='Имя',
        help_text='Имя пользователя'
    )
    
    last_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name='Фамилия',
        help_text='Фамилия пользователя'
    )
    
    username = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name='Username Telegram',
        help_text='Username пользователя в Telegram'
    )
    
    registration_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Время регистрации',
        help_text='Дата и время регистрации пользователя'
    )
    
    last_visit = models.DateTimeField(
        auto_now=True,
        verbose_name='Время последнего посещения',
        help_text='Дата и время последнего посещения приложения'
    )
    
    language = models.CharField(
        max_length=10,
        default='ru',
        verbose_name='Язык',
        help_text='Язык интерфейса пользователя'
    )
    
    theme_color = models.CharField(
        max_length=50,
        default='light',
        verbose_name='Цвет темы',
        help_text='Цветовая тема приложения'
    )
    
    invited_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='invited_users',
        verbose_name='Кто пригласил',
        help_text='Пользователь, который пригласил данного пользователя'
    )
    
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Дата рождения',
        help_text='Дата рождения пользователя'
    )
    
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Адрес проживания',
        help_text='Адрес проживания пользователя'
    )
    
    hobbies = models.TextField(
        blank=True,
        null=True,
        verbose_name='Хобби',
        help_text='Хобби и интересы пользователя'
    )
    
    gifts_given = models.IntegerField(
        default=0,
        verbose_name='Количество подаренных подарков',
        help_text='Количество подарков, которые пользователь подарил'
    )
    
    gifts_received = models.IntegerField(
        default=0,
        verbose_name='Количество полученных подарков',
        help_text='Количество подарков, которые пользователь получил'
    )
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-registration_time']
        indexes = [
            models.Index(fields=['telegram_id']),
            models.Index(fields=['registration_time']),
        ]
    
    def __str__(self) -> str:
        """Возвращает строковое представление пользователя."""
        return f"{self.first_name} {self.last_name or ''} ({self.telegram_id})".strip()
