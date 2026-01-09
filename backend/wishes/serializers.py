from rest_framework import serializers
from .models import Wishlist, Wish
from users.models import User


class WishlistSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Wishlist."""
    
    wishes_count = serializers.IntegerField(
        source='wishes.count',
        read_only=True,
        help_text='Количество желаний в вишлисте'
    )
    
    created_at = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True
    )
    
    updated_at = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True
    )
    
    class Meta:
        model = Wishlist
        fields = [
            'id',
            'user',
            'name',
            'description',
            'created_at',
            'updated_at',
            'order',
            'wishes_count',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'wishes_count',
        ]


class WishlistCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания вишлиста."""
    
    class Meta:
        model = Wishlist
        fields = [
            'id',
            'name',
            'description',
            'order',
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data: dict) -> Wishlist:
        """Создает вишлист с автоматической установкой пользователя."""
        # Пользователь должен быть передан через контекст
        user = self.context.get('user')
        
        if not user:
            raise serializers.ValidationError('Пользователь не указан')
        
        validated_data['user'] = user
        return super().create(validated_data)


class WishlistUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления вишлиста."""
    
    class Meta:
        model = Wishlist
        fields = [
            'name',
            'description',
            'order',
        ]


class WishSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Wish."""
    
    wishlist_id = serializers.IntegerField(
        source='wishlist.id',
        read_only=True
    )
    
    wishlist_name = serializers.CharField(
        source='wishlist.name',
        read_only=True
    )
    
    user_id = serializers.IntegerField(
        source='user.id',
        read_only=True
    )
    
    user_telegram_id = serializers.IntegerField(
        source='user.telegram_id',
        read_only=True
    )
    
    reserved_by_id = serializers.IntegerField(
        source='reserved_by.id',
        read_only=True,
        allow_null=True
    )
    
    gifted_by_id = serializers.IntegerField(
        source='gifted_by.id',
        read_only=True,
        allow_null=True
    )
    
    created_at = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True
    )
    
    updated_at = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True
    )
    
    reserved_at = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True,
        allow_null=True
    )
    
    gifted_at = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True,
        allow_null=True
    )
    
    # Для совместимости с фронтендом
    is_fulfilled = serializers.SerializerMethodField()
    fulfilled_by = serializers.SerializerMethodField()
    fulfilled_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Wish
        fields = [
            'id',
            'wishlist',
            'wishlist_id',
            'wishlist_name',
            'user',
            'user_id',
            'user_telegram_id',
            'title',
            'comment',
            'link',
            'image_url',
            'price',
            'currency',
            'status',
            'reserved_by',
            'reserved_by_id',
            'gifted_by',
            'gifted_by_id',
            'created_at',
            'updated_at',
            'reserved_at',
            'gifted_at',
            'order',
            # Для совместимости с фронтендом
            'is_fulfilled',
            'fulfilled_by',
            'fulfilled_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'reserved_at',
            'gifted_at',
            'is_fulfilled',
            'fulfilled_by',
            'fulfilled_at',
        ]
    
    def get_is_fulfilled(self, obj: Wish) -> bool:
        """Возвращает True, если желание исполнено."""
        return obj.status == 'fulfilled'
    
    def get_fulfilled_by(self, obj: Wish) -> int | None:
        """Возвращает ID пользователя, который подарил желание."""
        return obj.gifted_by.id if obj.gifted_by else None
    
    def get_fulfilled_at(self, obj: Wish) -> str | None:
        """Возвращает дату дарения в формате строки."""
        if obj.gifted_at:
            return obj.gifted_at.strftime('%Y-%m-%d %H:%M:%S')
        return None


class WishCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания желания."""
    
    class Meta:
        model = Wish
        fields = [
            'wishlist',
            'title',
            'comment',
            'link',
            'image_url',
            'price',
            'currency',
            'order',
        ]
    
    def create(self, validated_data: dict) -> Wish:
        """Создает желание с автоматической установкой пользователя."""
        wishlist = validated_data.get('wishlist')
        if wishlist:
            validated_data['user'] = wishlist.user
        return super().create(validated_data)


class WishUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления желания."""
    
    class Meta:
        model = Wish
        fields = [
            'wishlist',
            'title',
            'comment',
            'link',
            'image_url',
            'price',
            'currency',
            'status',
            'reserved_by',
            'order',
        ]
    
    def update(self, instance: Wish, validated_data: dict) -> Wish:
        """Обновляет желание с обработкой reserved_at."""
        from django.utils import timezone
        
        # Сохраняем старое значение статуса
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Если статус меняется на 'reserved', устанавливаем reserved_at
        if old_status != 'reserved' and new_status == 'reserved':
            instance.reserved_at = timezone.now()
        # Если статус меняется с 'reserved' на другой, очищаем reserved_at и reserved_by
        elif old_status == 'reserved' and new_status != 'reserved':
            instance.reserved_at = None
            if 'reserved_by' not in validated_data:
                validated_data['reserved_by'] = None
        
        return super().update(instance, validated_data)

