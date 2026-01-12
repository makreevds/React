from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
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
import os
from uuid import uuid4

# Опциональный импорт Pillow для обработки изображений
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    Image = None

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
        
        # Фильтрация по reserved_by_id если передан
        reserved_by_id = self.request.query_params.get('reserved_by_id', None)
        if reserved_by_id:
            try:
                reserved_by_id_int = int(reserved_by_id)
                queryset = queryset.filter(reserved_by_id=reserved_by_id_int)
                logger.info(f'[WishViewSet] Фильтруем по reserved_by_id={reserved_by_id_int}, осталось: {queryset.count()}')
            except ValueError:
                logger.warning(f'[WishViewSet] Некорректный reserved_by_id: {reserved_by_id}')
                pass
        
        # Фильтрация по gifted_by_id если передан
        gifted_by_id = self.request.query_params.get('gifted_by_id', None)
        if gifted_by_id:
            try:
                gifted_by_id_int = int(gifted_by_id)
                queryset = queryset.filter(gifted_by_id=gifted_by_id_int)
                logger.info(f'[WishViewSet] Фильтруем по gifted_by_id={gifted_by_id_int}, осталось: {queryset.count()}')
            except ValueError:
                logger.warning(f'[WishViewSet] Некорректный gifted_by_id: {gifted_by_id}')
                pass
        
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
        
        # Если gifted_by_id не передан, но подарок зарезервирован, используем reserved_by
        if not gifted_by_id and wish.reserved_by:
            gifted_by_id = wish.reserved_by.id
        
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
    
    @action(detail=False, methods=['post'], url_path='upload-image')
    def upload_image(self, request: Request) -> Response:
        """Загружает изображение и возвращает URL."""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Изображение не найдено'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Проверяем тип файла
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, WebP, GIF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем размер файла (максимум 10 МБ)
        max_size = 10 * 1024 * 1024  # 10 МБ
        if image_file.size > max_size:
            return Response(
                {'error': 'Размер файла превышает 10 МБ'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Создаем директорию для изображений, если её нет
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'wish_images')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Генерируем уникальное имя файла (всегда сохраняем как JPEG после обработки)
            unique_filename = f"{uuid4().hex}.jpg"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Обрабатываем и сохраняем изображение
            if HAS_PIL and Image:
                try:
                    img = Image.open(image_file)
                    # Конвертируем в RGB, если нужно (для PNG с прозрачностью)
                    if img.mode in ('RGBA', 'LA', 'P'):
                        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                        img = rgb_img
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Изменяем размер, если изображение слишком большое (максимум 2000px по большей стороне)
                    max_dimension = 2000
                    if max(img.size) > max_dimension:
                        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                    
                    # Сохраняем с оптимизацией
                    img.save(file_path, 'JPEG', quality=85, optimize=True)
                except Exception as e:
                    logger.warning(f'Ошибка при обработке изображения: {e}')
                    # Если обработка не удалась, сохраняем оригинал
                    with open(file_path, 'wb+') as destination:
                        for chunk in image_file.chunks():
                            destination.write(chunk)
            else:
                # Если Pillow не установлен, сохраняем оригинал
                logger.warning('Pillow не установлен, изображение сохраняется без обработки')
                with open(file_path, 'wb+') as destination:
                    for chunk in image_file.chunks():
                        destination.write(chunk)
            
            # Формируем URL
            media_url = settings.MEDIA_URL
            if not media_url.startswith('http'):
                # Если это относительный URL, формируем полный URL
                image_url = request.build_absolute_uri(f"{media_url}wish_images/{unique_filename}")
            else:
                image_url = f"{media_url}wish_images/{unique_filename}"
            
            logger.info(f'Изображение успешно загружено: {image_url}')
            
            return Response({
                'image_url': image_url,
                'filename': unique_filename
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f'Ошибка при загрузке изображения: {e}')
            return Response(
                {'error': f'Ошибка при загрузке изображения: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
