from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с пользователями через API."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        """Возвращает соответствующий сериализатор в зависимости от действия."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Возвращает queryset с возможностью фильтрации."""
        queryset = super().get_queryset()
        
        # Фильтрация по telegram_id если передан
        telegram_id = self.request.query_params.get('telegram_id', None)
        if telegram_id:
            try:
                queryset = queryset.filter(telegram_id=int(telegram_id))
            except ValueError:
                pass
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_telegram_id(self, request: Request) -> Response:
        """Получает пользователя по Telegram ID."""
        telegram_id = request.query_params.get('telegram_id')
        
        if not telegram_id:
            return Response(
                {'error': 'Параметр telegram_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = get_object_or_404(User, telegram_id=int(telegram_id))
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Некорректный telegram_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='register-or-get')
    def register_or_get(self, request: Request) -> Response:
        """Регистрирует пользователя или возвращает существующего (get_or_create)."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f'Получен запрос на регистрацию: {request.data}')
        
        telegram_id = request.data.get('telegram_id')
        
        if not telegram_id:
            logger.warning('Отсутствует telegram_id в запросе')
            return Response(
                {'error': 'Параметр telegram_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            telegram_id = int(telegram_id)
        except (ValueError, TypeError):
            logger.warning(f'Некорректный telegram_id: {request.data.get("telegram_id")}')
            return Response(
                {'error': 'Некорректный telegram_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем или создаём пользователя
        user, created = User.objects.get_or_create(
            telegram_id=telegram_id,
            defaults={
                'first_name': request.data.get('first_name', ''),
                'last_name': request.data.get('last_name', ''),
                'username': request.data.get('username', ''),
                'language': request.data.get('language', 'ru'),
                'theme_color': request.data.get('theme_color', 'light'),
            }
        )
        
        # Если пользователь уже существовал, обновляем его данные
        if not created:
            updated = False
            if 'first_name' in request.data and user.first_name != request.data['first_name']:
                user.first_name = request.data['first_name']
                updated = True
            if 'last_name' in request.data and user.last_name != request.data.get('last_name', ''):
                user.last_name = request.data.get('last_name', '')
                updated = True
            if 'username' in request.data and user.username != request.data.get('username', ''):
                user.username = request.data.get('username', '')
                updated = True
            if 'language' in request.data and user.language != request.data['language']:
                user.language = request.data['language']
                updated = True
            if 'theme_color' in request.data and user.theme_color != request.data['theme_color']:
                user.theme_color = request.data['theme_color']
                updated = True
            
            # Всегда сохраняем пользователя, чтобы обновить last_visit (auto_now=True)
            user.save()
        
        # Обработка пригласившего (start_param)
        start_param = request.data.get('start_param')
        if start_param and not user.invited_by:
            try:
                inviter_telegram_id = int(start_param)
                if inviter_telegram_id != telegram_id:  # Нельзя пригласить самого себя
                    try:
                        inviter = User.objects.get(telegram_id=inviter_telegram_id)
                        user.invited_by = inviter
                        user.save()
                    except User.DoesNotExist:
                        pass  # Пригласивший не найден, пропускаем
            except (ValueError, TypeError):
                pass  # Некорректный start_param, пропускаем
        
        logger.info(f'Пользователь {"создан" if created else "найден"}: telegram_id={telegram_id}, id={user.id}')
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
