import requests
import json

try:
    response = requests.get('http://localhost:8000/api/species')
    data = response.json()
    if data:
        print(f"Total items: {len(data)}")
        first_item = data[0]
        print(f"First item keys: {list(first_item.keys())}")
        print(f"First item confidence: {first_item.get('confidence')}")
        print(f"JSON example: {json.dumps(first_item, indent=2)}")
    else:
        print("No species found")
except Exception as e:
    print(f"Error: {e}")
