from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser

class QueryComments(models.Model):
    subject = models.CharField(max_length=100)
    subreddit = models.CharField(max_length=100)
    user = models.CharField(max_length=100)
    finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'query_comments'
        verbose_name = 'Query Comment'
        verbose_name_plural = 'Query Comments'
    
    def __str__(self):
        return f"{self.subject} - {self.subreddit} by {self.user}"

class Suggestion(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Suggestion from {self.name}"

class Comments(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    url = models.URLField()
    score = models.DecimalField(decimal_places=2,max_digits=10)
    author = models.CharField(max_length=100)
    subreddit = models.CharField(max_length=100)
    created_utc = models.DateTimeField(auto_now_add=True)
    subject = models.CharField(max_length=100)
    sentiment = models.CharField(max_length=20, blank=True, null=True)
    sentiment_score = models.DecimalField(decimal_places=2,max_digits=10, null=True)
    user = models.CharField(max_length=100)
    query = models.ForeignKey(QueryComments, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)

    class Meta:
        db_table = 'comments'


class UserManager(BaseUserManager):

    use_in_migration = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is Required')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff = True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser = True')

        return self.create_user(email, password, **extra_fields)

class UserApi(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=100, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']



    def __str__(self):
        return self.name
