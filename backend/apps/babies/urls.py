from rest_framework.routers import DefaultRouter

from .views import BabyViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"", BabyViewSet, basename="baby")

urlpatterns = router.urls
