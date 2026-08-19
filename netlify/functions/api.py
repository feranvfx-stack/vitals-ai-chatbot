import os
import sys

# 1. This looks at your machine's path and cuts it off exactly at your root folder "vitals"
current_file_path = os.path.abspath(__file__)
project_root = current_file_path.split("/netlify/functions")[0]
sys.path.append(project_root)

# 2. Serverless adapter import
import serverless_wsgi

# 3. Import your Flask instance ('vitals') from your 'backend/vitals.py' file
from backend.vitals import vitals

# 4. Netlify's execution entry point handler
def handler(event, context):
    return serverless_wsgi.handle_request(vitals, event, context)
