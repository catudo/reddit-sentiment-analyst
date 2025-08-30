from rest_framework import serializers
from .models import QueryComments, UserApi, Comments, Suggestion


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UserApi
        fields = ['username', 'email', 'password']  # Add other fields as needed
        extra_kwargs = {'password': {'write_only': True}}  # Make password write-only

    def create(self, validated_data):
        user = UserApi(
            username=validated_data['email'],
            name=validated_data['email'],
            email=validated_data['email'],
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class CommentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comments
        fields = '__all__'

class SubjectSubredditSerializer(serializers.ModelSerializer):
    class Meta:
        model = QueryComments
        fields = ['subject', 'subreddit', 'finished']

class CommentsAggregationSerializer(serializers.Serializer):
    subject = serializers.CharField()
    subreddit = serializers.CharField()
    sentiment = serializers.CharField()
    count = serializers.IntegerField()

class SuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suggestion
        fields = ['name', 'email', 'text', 'created_at']
        read_only_fields = ['created_at']
