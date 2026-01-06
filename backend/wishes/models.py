from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import User


class Wishlist(models.Model):
    """Модель вишлиста (списка желаний)."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='wishlists',
        verbose_name='Пользователь',
        help_text='Владелец вишлиста'
    )
    
    name = models.CharField(
        max_length=200,
        verbose_name='Название',
        help_text='Название вишлиста'
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание',
        help_text='Описание вишлиста'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания',
        help_text='Дата и время создания вишлиста'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления',
        help_text='Дата и время последнего обновления вишлиста'
    )
    
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок',
        help_text='Порядок сортировки вишлистов'
    )
    
    class Meta:
        verbose_name = 'Вишлист'
        verbose_name_plural = 'Вишлисты'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['user', 'order']),
        ]
    
    def __str__(self) -> str:
        """Возвращает строковое представление вишлиста."""
        return f"{self.name} ({self.user.first_name})"
    


class Wish(models.Model):
    """Модель желания (подарка)."""
    
    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('reserved', 'Зарезервировано'),
        ('fulfilled', 'Исполнено'),
    ]
    
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name='wishes',
        verbose_name='Вишлист',
        help_text='Вишлист, к которому относится желание'
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='wishes',
        verbose_name='Пользователь',
        help_text='Владелец желания'
    )
    
    title = models.CharField(
        max_length=200,
        verbose_name='Название',
        help_text='Название желания'
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание',
        help_text='Описание желания'
    )
    
    link = models.URLField(
        blank=True,
        null=True,
        verbose_name='Ссылка',
        help_text='Ссылка на товар или услугу'
    )
    
    image_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL изображения',
        help_text='Ссылка на изображение желания'
    )
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Цена',
        help_text='Цена желания'
    )
    
    currency = models.CharField(
        max_length=10,
        default='₽',
        verbose_name='Валюта',
        help_text='Валюта цены'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Статус',
        help_text='Текущий статус желания'
    )
    
    reserved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reserved_wishes',
        verbose_name='Зарезервировано пользователем',
        help_text='Пользователь, который зарезервировал желание'
    )
    
    gifted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='gifted_wishes',
        verbose_name='Подарено пользователем',
        help_text='Пользователь, который подарил желание'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания',
        help_text='Дата и время создания желания'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления',
        help_text='Дата и время последнего обновления желания'
    )
    
    reserved_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Дата резервирования',
        help_text='Дата и время резервирования желания'
    )
    
    gifted_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Дата дарения',
        help_text='Дата и время дарения желания'
    )
    
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок',
        help_text='Порядок сортировки желаний в вишлисте'
    )
    
    class Meta:
        verbose_name = 'Желание'
        verbose_name_plural = 'Желания'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['wishlist', 'order']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self) -> str:
        """Возвращает строковое представление желания."""
        return f"{self.title} ({self.user.first_name})"
    
    def clean(self):
        """Валидация модели."""
        super().clean()
        # Убеждаемся, что пользователь вишлиста совпадает с пользователем желания
        if self.wishlist and self.user and self.wishlist.user != self.user:
            raise ValidationError('Пользователь желания должен совпадать с пользователем вишлиста')
    
    def save(self, *args, **kwargs):
        """Переопределяем save для автоматической установки user из wishlist."""
        if self.wishlist and not self.user:
            self.user = self.wishlist.user
        super().save(*args, **kwargs)
