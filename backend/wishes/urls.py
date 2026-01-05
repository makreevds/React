from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WishlistViewSet, WishViewSet

router = DefaultRouter()
router.register(r'wishlists', WishlistViewSet, basename='wishlist')
router.register(r'wishes', WishViewSet, basename='wish')

urlpatterns = [
    path('', include(router.urls)),
]

