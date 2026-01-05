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
    
    @action(detail=True, methods=['post'])
    def update_last_visit(self, request: Request, pk: int = None) -> Response:
        """Обновляет время последнего посещения пользователя."""
        user = self.get_object()
        user.save()  # auto_now обновит last_visit
        serializer = self.get_serializer(user)
        return Response(serializer.data)
