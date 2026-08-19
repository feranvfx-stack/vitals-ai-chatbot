import os
import sys

# 1. Fallback mapping to resolve path boundaries
current_file_path = os.path.abspath(__file__)
# Splitting gives a list; we take the first element [0] to get the root path string
project_root = current_file_path.split("/netlify/functions")[0]
sys.path.append(project_root)

# 2. Serverless adapter import
import serverless_wsgi

# 3. Import your Flask instance ('vitals') from your 'backend/vitals.py' file
from backend.vitals import vitals

# 4. Netlify execution entry point handler
def handler(event, context):
    return serverless_wsgi.handle_request(vitals, event, context)
