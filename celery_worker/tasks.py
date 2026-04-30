import os
from celery import Celery

# Get Redis URL from environment or default to localhost
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

app = Celery('tasks', broker=REDIS_URL, backend=REDIS_URL)

@app.task
def add(x, y):
    """Simple task to add two numbers."""
    return x + y

@app.task
def process_data(data):
    """Example task to process some data."""
    print(f"Processing data: {data}")
    return {"status": "processed", "data": data}
