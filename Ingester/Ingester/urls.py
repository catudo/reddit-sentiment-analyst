"""
URL configuration for Ingester project.

The `urlpatterns` list routes URLs to views.py. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views.py
    1. Add an import:  from my_app import views.py
    2. Add a URL to urlpatterns:  path('', views.py.home, name='home')
Class-based views.py
    1. Add an import:  from other_app.views.py import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
from django.urls import path
from .views import IngestView, UserRegister, CommentListView, CommentsAggregationView, DownloadFileView, SuggestionView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    #    path('admin/', admin.site.urls),
    path('ingest', IngestView.as_view()),
    path('create_user', UserRegister.as_view(),name='create_user'),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/token/verify/', TokenObtainPairView.as_view(), name='token_verify'),

    path('comments/', CommentListView.as_view(), name='comment-list'),

    path('comments/download', DownloadFileView.as_view(), name='download-comment'),

    path('comments/aggregate/', CommentsAggregationView.as_view(), name='comments-aggregate'),
    path('suggestions/', SuggestionView.as_view(), name='suggestions')

]
