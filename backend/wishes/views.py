from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from .models import Wishlist, Wish
from .serializers import (
    WishlistSerializer,
    WishlistCreateSerializer,
    WishlistUpdateSerializer,
    WishSerializer,
    WishCreateSerializer,
    WishUpdateSerializer,
)
from users.models import User
import logging

logger = logging.getLogger(__name__)


class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с вишлистами через API."""
    
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    
    def get_serializer_class(self):
        """Возвращает соответствующий сериализатор в зависимости от действия."""
        if self.action == 'create':
            return WishlistCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WishlistUpdateSerializer
        return WishlistSerializer
    
    def get_serializer_context(self):
        """Добавляет user в контекст сериализатора."""
        context = super().get_serializer_context()
        
        # Получаем user из request (через telegram_id или user_id)
        telegram_id = self.request.data.get('telegram_id') or self.request.query_params.get('telegram_id')
        user_id = self.request.data.get('user_id') or self.request.query_params.get('user_id')
        
        if telegram_id:
            try:
                user = User.objects.get(telegram_id=int(telegram_id))
                context['user'] = user
            except (User.DoesNotExist, ValueError):
                pass
        elif user_id:
            try:
                user = User.objects.get(id=int(user_id))
                context['user'] = user
            except (User.DoesNotExist, ValueError):
                pass
        
        return context
    
    def get_queryset(self):
        """Возвращает queryset с возможностью фильтрации."""
        queryset = super().get_queryset()
        
        # Фильтрация по user_id если передан
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            try:
                queryset = queryset.filter(user_id=int(user_id))
            except ValueError:
                pass
        
        # Фильтрация по telegram_id если передан
        telegram_id = self.request.query_params.get('telegram_id', None)
        if telegram_id:
            try:
                user = User.objects.get(telegram_id=int(telegram_id))
                queryset = queryset.filter(user=user)
            except (User.DoesNotExist, ValueError):
                queryset = queryset.none()
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_telegram_id(self, request: Request) -> Response:
        """Получает вишлисты пользователя по Telegram ID."""
        telegram_id = request.query_params.get('telegram_id')
        
        if not telegram_id:
            return Response(
                {'error': 'Параметр telegram_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = get_object_or_404(User, telegram_id=int(telegram_id))
            wishlists = Wishlist.objects.filter(user=user)
            serializer = self.get_serializer(wishlists, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Некорректный telegram_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class WishViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с желаниями через API."""
    
    queryset = Wish.objects.all()
    serializer_class = WishSerializer
    
    def get_serializer_class(self):
        """Возвращает соответствующий сериализатор в зависимости от действия."""
        if self.action == 'create':
            return WishCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WishUpdateSerializer
        return WishSerializer
    
    def get_queryset(self):
        """Возвращает queryset с возможностью фильтрации."""
        queryset = super().get_queryset()
        
        # Фильтрация по wishlist_id если передан
        wishlist_id = self.request.query_params.get('wishlist_id', None)
        if wishlist_id:
            try:
                wishlist_id_int = int(wishlist_id)
                logger.info(f'[WishViewSet] Фильтруем желания по wishlist_id={wishlist_id_int}')
                queryset = queryset.filter(wishlist_id=wishlist_id_int)
                count = queryset.count()
                logger.info(f'[WishViewSet] Найдено желаний: {count}')
                # Логируем первые несколько ID для отладки
                if count > 0:
                    ids = list(queryset.values_list('id', flat=True)[:5])
                    logger.info(f'[WishViewSet] ID найденных желаний: {ids}')
            except ValueError:
                logger.warning(f'[WishViewSet] Некорректный wishlist_id: {wishlist_id}')
                pass
        
        # Фильтрация по user_id если передан
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            try:
                queryset = queryset.filter(user_id=int(user_id))
                logger.info(f'[WishViewSet] Фильтруем по user_id={user_id}, осталось: {queryset.count()}')
            except ValueError:
                pass
        
        # Фильтрация по telegram_id если передан
        telegram_id = self.request.query_params.get('telegram_id', None)
        if telegram_id:
            try:
                user = User.objects.get(telegram_id=int(telegram_id))
                queryset = queryset.filter(user=user)
                logger.info(f'[WishViewSet] Фильтруем по telegram_id={telegram_id}, осталось: {queryset.count()}')
            except (User.DoesNotExist, ValueError):
                logger.warning(f'[WishViewSet] Пользователь с telegram_id={telegram_id} не найден')
                queryset = queryset.none()
        
        # Фильтрация по status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            logger.info(f'[WishViewSet] Фильтруем по status={status_filter}, осталось: {queryset.count()}')
        
        return queryset
    
    def list(self, request: Request, *args, **kwargs) -> Response:
        """Переопределяем list для логирования."""
        logger.info(f'[WishViewSet] Запрос списка желаний. Параметры: {dict(request.query_params)}')
        response = super().list(request, *args, **kwargs)
        logger.info(f'[WishViewSet] Возвращено желаний: {len(response.data) if isinstance(response.data, list) else "не список"}')
        return response
    
    @action(detail=False, methods=['get'])
    def by_telegram_id(self, request: Request) -> Response:
        """Получает желания пользователя по Telegram ID."""
        telegram_id = request.query_params.get('telegram_id')
        
        if not telegram_id:
            return Response(
                {'error': 'Параметр telegram_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = get_object_or_404(User, telegram_id=int(telegram_id))
            wishes = Wish.objects.filter(user=user)
            logger.info(f'[WishViewSet.by_telegram_id] Найдено желаний для пользователя {telegram_id}: {wishes.count()}')
            serializer = self.get_serializer(wishes, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Некорректный telegram_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='test-wishlist/(?P<wishlist_id>[^/.]+)')
    def test_wishlist(self, request: Request, wishlist_id: int = None) -> Response:
        """Тестовый endpoint для проверки желаний вишлиста."""
        try:
            wishlist = get_object_or_404(Wishlist, id=int(wishlist_id))
            wishes = Wish.objects.filter(wishlist=wishlist)
            logger.info(f'[WishViewSet.test_wishlist] Вишлист {wishlist_id}: найдено желаний {wishes.count()}')
            serializer = self.get_serializer(wishes, many=True)
            return Response({
                'wishlist_id': wishlist_id,
                'wishlist_name': wishlist.name,
                'wishes_count': wishes.count(),
                'wishes': serializer.data
            })
        except (ValueError, Wishlist.DoesNotExist) as e:
            logger.error(f'[WishViewSet.test_wishlist] Ошибка: {e}')
            return Response(
                {'error': f'Ошибка: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def fulfill(self, request: Request, pk: int = None) -> Response:
        """Отмечает желание как исполненное."""
        wish = self.get_object()
        
        # Получаем пользователя, который дарит (из request или query params)
        gifted_by_id = request.data.get('gifted_by_id') or request.query_params.get('gifted_by_id')
        
        if gifted_by_id:
            try:
                gifted_by = User.objects.get(id=int(gifted_by_id))
                wish.gifted_by = gifted_by
            except (User.DoesNotExist, ValueError):
                return Response(
                    {'error': 'Пользователь не найден'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        wish.status = 'fulfilled'
        wish.gifted_at = timezone.now()
        wish.save()
        
        # Обновляем статистику пользователей
        if wish.user:
            wish.user.gifts_received += 1
            wish.user.save()
        
        if wish.gifted_by:
            wish.gifted_by.gifts_given += 1
            wish.gifted_by.save()
        
        serializer = self.get_serializer(wish)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'], url_path='fulfill')
    def unfulfill(self, request: Request, pk: int = None) -> Response:
        """Отменяет исполнение желания."""
        wish = self.get_object()
        
        # Обновляем статистику пользователей (уменьшаем)
        if wish.user and wish.gifted_by:
            wish.user.gifts_received = max(0, wish.user.gifts_received - 1)
            wish.user.save()
            
            wish.gifted_by.gifts_given = max(0, wish.gifted_by.gifts_given - 1)
            wish.gifted_by.save()
        
        wish.status = 'active'
        wish.gifted_by = None
        wish.gifted_at = None
        wish.save()
        
        serializer = self.get_serializer(wish)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reserve(self, request: Request, pk: int = None) -> Response:
        """Резервирует желание."""
        wish = self.get_object()
        
        if wish.status != 'active':
            return Response(
                {'error': 'Можно зарезервировать только активное желание'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем пользователя, который резервирует
        reserved_by_id = request.data.get('reserved_by_id') or request.query_params.get('reserved_by_id')
        
        if reserved_by_id:
            try:
                reserved_by = User.objects.get(id=int(reserved_by_id))
                wish.reserved_by = reserved_by
            except (User.DoesNotExist, ValueError):
                return Response(
                    {'error': 'Пользователь не найден'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        wish.status = 'reserved'
        wish.reserved_at = timezone.now()
        wish.save()
        
        serializer = self.get_serializer(wish)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def move(self, request: Request, pk: int = None) -> Response:
        """Перемещает желание в другой вишлист."""
        wish = self.get_object()
        
        wishlist_id = request.data.get('wishlist_id')
        if not wishlist_id:
            return Response(
                {'error': 'Параметр wishlist_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_wishlist = get_object_or_404(Wishlist, id=int(wishlist_id))
            
            # Проверяем, что пользователь вишлиста совпадает с пользователем желания
            if new_wishlist.user != wish.user:
                return Response(
                    {'error': 'Нельзя переместить желание в вишлист другого пользователя'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            wish.wishlist = new_wishlist
            wish.save()
            
            serializer = self.get_serializer(wish)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Некорректный wishlist_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
