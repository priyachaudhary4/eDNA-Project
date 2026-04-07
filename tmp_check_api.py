import http.client
import json

conn = http.client.HTTPConnection("localhost", 8000)
conn.request("GET", "/api/metrics")
r1 = conn.getresponse()
print(r1.status, r1.reason)
data1 = r1.read()
print(json.loads(data1))
conn.close()
