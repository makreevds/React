from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели User."""
    
    invited_by_telegram_id = serializers.IntegerField(
        source='invited_by.telegram_id',
        read_only=True,
        allow_null=True
    )
    
    registration_time = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True
    )
    
    last_visit = serializers.DateTimeField(
        format='%Y-%m-%d %H:%M:%S',
        read_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id',
            'telegram_id',
            'first_name',
            'last_name',
            'username',
            'photo_url',
            'registration_time',
            'last_visit',
            'language',
            'theme_color',
            'invited_by_telegram_id',
            'birth_date',
            'address',
            'hobbies',
            'gifts_given',
            'gifts_received',
            'subscriptions',
        ]
        read_only_fields = [
            'id',
            'registration_time',
            'last_visit',
        ]
    
    def validate_subscriptions(self, value):
        """Валидация подписок: пользователь не может подписаться сам на себя."""
        user = self.instance
        if user and user.id in [sub.id for sub in value]:
            raise serializers.ValidationError('Пользователь не может подписаться сам на себя')
        return value


class UserCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания пользователя."""
    
    invited_by_telegram_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text='Telegram ID пользователя, который пригласил'
    )
    
    class Meta:
        model = User
        fields = [
            'telegram_id',
            'first_name',
            'last_name',
            'username',
            'photo_url',
            'language',
            'theme_color',
            'invited_by_telegram_id',
        ]
    
    def create(self, validated_data: dict) -> User:
        """Создает пользователя с обработкой пригласившего."""
        invited_by_telegram_id = validated_data.pop('invited_by_telegram_id', None)
        
        if invited_by_telegram_id:
            try:
                invited_by = User.objects.get(telegram_id=invited_by_telegram_id)
                validated_data['invited_by'] = invited_by
            except User.DoesNotExist:
                pass  # Если пригласивший не найден, просто пропускаем
        
        return super().create(validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления пользователя."""
    
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'username',
            'language',
            'theme_color',
            'birth_date',
            'address',
            'hobbies',
            'subscriptions',
        ]
    
    def validate_subscriptions(self, value):
        """Валидация подписок: пользователь не может подписаться сам на себя."""
        user = self.instance
        if user and user.id in [sub.id for sub in value]:
            raise serializers.ValidationError('Пользователь не может подписаться сам на себя')
        return value

