import urllib.request
import urllib.error
import json

url = "http://localhost:8000/api/token/"
data = json.dumps({"username": "admin", "password": "admin123"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

print(f"Attempting POST to {url} with admin / admin123")

try:
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req) as response:
        print(f"SUCCESS: Status {response.status}")
        print("Response body:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"FAILURE: Status {e.code}")
    print("Error body:", e.read().decode())
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
