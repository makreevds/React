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
    
    is_public = models.BooleanField(
        default=False,
        verbose_name='Публичный',
        help_text='Виден ли вишлист другим пользователям'
    )
    
    is_default = models.BooleanField(
        default=False,
        verbose_name='По умолчанию',
        help_text='Вишлист по умолчанию для пользователя'
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
            models.Index(fields=['user', 'is_default']),
        ]
        constraints = [
            # Один вишлист по умолчанию на пользователя
            models.UniqueConstraint(
                fields=['user', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_wishlist_per_user'
            ),
        ]
    
    def __str__(self) -> str:
        """Возвращает строковое представление вишлиста."""
        return f"{self.name} ({self.user.first_name})"
    
    def clean(self):
        """Валидация модели."""
        super().clean()
        # Если это вишлист по умолчанию, убеждаемся что у пользователя нет другого
        if self.is_default and self.pk:
            existing_default = Wishlist.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk)
            if existing_default.exists():
                raise ValidationError('У пользователя уже есть вишлист по умолчанию')
    
    def save(self, *args, **kwargs):
        """Переопределяем save для автоматической установки is_default."""
        # Если устанавливается is_default=True, снимаем флаг с других вишлистов
        if self.is_default and self.user:
            Wishlist.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk if self.pk else None).update(is_default=False)
        
        # Если это новый вишлист (не pk) и is_default не был установлен явно
        # и это первый вишлист пользователя, делаем его по умолчанию
        if not self.pk and self.user:
            # Проверяем, был ли is_default установлен явно через validated_data
            # Если is_default не был установлен явно, проверяем, есть ли уже вишлисты
            if not hasattr(self, '_is_default_set') or not getattr(self, '_is_default_set', False):
                if not Wishlist.objects.filter(user=self.user).exists():
                    self.is_default = True
                else:
                    # Если уже есть вишлисты, новый вишлист не должен быть по умолчанию
                    self.is_default = False
        
        super().save(*args, **kwargs)


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
