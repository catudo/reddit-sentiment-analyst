from django.db.models import Count
from rest_framework import status

from .models import Comments, QueryComments
from .send_kafka_topic import retrieve_from_reddit
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializer import UserSerializer, CommentsSerializer, SubjectSubredditSerializer, SuggestionSerializer
from rest_framework.permissions import IsAuthenticated
import pandas as pd
from django.http import HttpResponse, JsonResponse


class IngestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        subreddit = request.data['subreddit']
        subject = request.data['subject']
        user = request.user.email
        count = int(request.data['count'])

        self.delete_existing_records(subreddit, subject, user)
        query_comment = self.create_query_comment(subject, subreddit, user)
        
        self.process_comments(subreddit, subject, user, query_comment, count )
        
        return Response({'result': 'processing', 'query_id': query_comment.id}, status=status.HTTP_202_ACCEPTED)
    
    def process_comments(self, subreddit, subject, user, query_comment, count, ):

        counter = retrieve_from_reddit(subreddit, subject, user, query_comment,count)
        print(f"Processed {counter} comments for {subject} in {subreddit}")
    
    def delete_existing_records(self, subreddit, subject, user):
        Comments.objects.filter(
            subreddit=subreddit,
            subject=subject,
            user=user
        ).delete()
        
        QueryComments.objects.filter(
            subreddit=subreddit,
            subject=subject,
            user=user
        ).delete()
    
    def create_query_comment(self, subject, subreddit, user):
        # Crear un nuevo QueryComments de forma síncrona
        query_comment = QueryComments(
            subject=subject,
            subreddit=subreddit,
            user=user,
            finished=False
        )
        
        query_comment.save()
        return query_comment

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class UserRegister(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.create(request.data)  # This will call the create method in the serializer
            return Response(
                {"message": "User created successfully.", "user_id": str(user.id)},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommentListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user.email
        comments = QueryComments.objects.filter(user=user).values('subject', 'subreddit','finished')
        serializer = SubjectSubredditSerializer(comments, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class DownloadFileView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user.email
        subreddit = request.data['subreddit']
        subject = request.data['subject']


        comments = Comments.objects.filter(user=user, subject__iexact=subject,  subreddit__iexact=subreddit)
        serializer = CommentsSerializer(comments, many=True)

        data = serializer.data


        df = pd.DataFrame(data)


        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="comments_{user}.xlsx"'


        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Comments')

        return response

class CommentsAggregationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subject = request.data.get('subject') or request.query_params.get('subject')
        subreddit = request.data.get('subreddit') or request.query_params.get('subreddit')
        user = request.user.email

        # Start with base query
        query = Comments.objects.all()

        # Apply filters
        if subject:
            query = query.filter(subject__iexact=subject)
        if subreddit:
            query = query.filter(subreddit__iexact=subreddit)
        if user:
            query = query.filter(user=user)

        results = query.values(
            'sentiment'
        ).annotate(
            count=Count('id')
        ).order_by('sentiment')

        # Convert queryset to list for JSON response
        data = list(results)

        return JsonResponse(data, safe=False, status=200)

class SuggestionView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SuggestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
