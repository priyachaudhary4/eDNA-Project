import requests

sample_id_to_delete = 1
url = f"http://localhost:8000/api/samples/{sample_id_to_delete}"

try:
    print(f"Attempting to delete sample {sample_id_to_delete} ({url})...")
    response = requests.delete(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
