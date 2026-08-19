
import serverless_wsgi
from backend.vitals import vitals

def handler(event, context):
    return serverless_wsgi.handle_request(vitals, event, context)
