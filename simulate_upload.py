
import requests
import io

# 1. Check current metrics
print("Initial Metrics:", requests.get('http://localhost:8000/api/metrics').json().get('total_detections'))

# 2. Simulate Upload
csv_content = """scientific_name,common_name,status
Panthera tigris,Tiger,Endangered
Canis lupus,Grey Wolf,Endangered
Ailurus fulgens,Red Panda,Endangered
"""
files = {'file': ('test_study.csv', csv_content)}
data = {'region': 'Test Basin', 'country': 'Test Country'}

print("Uploading simulated dataset...")
r = requests.post('http://localhost:8000/api/upload', files=files, data=data)
print("Upload Status:", r.json())

# 3. Check metrics again
print("Updated Metrics:", requests.get('http://localhost:8000/api/metrics').json().get('total_detections'))
