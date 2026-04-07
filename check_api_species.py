import requests
try:
    r = requests.get('http://localhost:8000/api/species')
    print(f"Status: {r.status_code}")
    data = r.json()
    print(f"Total Species: {len(data)}")
    if data:
        print("First item:", data[0])
except Exception as e:
    print(f"Error: {e}")
