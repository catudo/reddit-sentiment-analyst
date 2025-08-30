import os
import praw
from prawcore.exceptions import NotFound, PrawcoreException
from transformers import pipeline
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
pipe = pipeline("text-classification", model="tabularisai/multilingual-sentiment-analysis")
from Ingester.models import Comments

reddit = praw.Reddit(
    client_id=os.environ.get('REDDIT_CLIENT_ID'),
    client_secret=os.environ.get('REDDIT_CLIENT_SECRET'),
    user_agent=os.environ.get('REDDIT_USER_AGENT')
)



@permission_classes([IsAuthenticated])
def retrieve_from_reddit(subreddit, subject, user, query_comment=None, count=100):
    try:
        subreddit = reddit.subreddit(subreddit)
        counter = 0
        submissions = subreddit.search(subject, sort='hot', limit=count, time_filter='month')
        for submission in submissions :  # Adjust limit as needed
            submission.comments.replace_more(limit=count)
            comment_list = submission.comments.list()
            for comment in comment_list[:3]:
                try:
                    result = pipe(comment.body)
                    # Print the result
                    comment = Comments(
                        title=submission.title,
                        content=comment.body,
                        url=submission.url,
                        score=submission.score,
                        author=user,
                        subreddit=subreddit,
                        subject=subject,
                        sentiment=result[0]['label'],
                        sentiment_score=result[0]['score'],
                        user=user,
                        query=query_comment
                    )
                    counter += 1
                    comment.save()
                except Exception as e:
                    print(f"An unexpected error occurred: {e}")
                    continue
        
        query_comment.finished = True
        query_comment.save()

        return counter

    except NotFound as e:
        print(f"Error: {e} - The subreddit or submission was not found.")
    except PrawcoreException as e:
        print(f"Error: {e} - A PRAW core exception occurred.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
