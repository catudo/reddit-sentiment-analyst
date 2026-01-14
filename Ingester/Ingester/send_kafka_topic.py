import json
import os

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from confluent_kafka import Producer

producer = Producer({
    'bootstrap.servers': os.environ.get('KAFKA_SERVER'),
    'group.id': 'reddit-sentiment-group'
})

@permission_classes([IsAuthenticated])
def retrieve_from_reddit(subreddit, subject, user, query_comment, count=100):
    data = {
        'subreddit':subreddit,
        'subject':subject,
        'query_comment_id': query_comment.id,
        'user':user,
        'count':count
    }
    producer.produce(
        topic='reddit-sentiment-topic',
        key= 'comment_' + str(query_comment.id),
        value=json.dumps(data).encode('utf-8')
    )
    return query_comment.id




