import urllib.request
import json

url = "https://script.google.com/macros/s/AKfycbxTVnBEFdPvpFTAxQlh9pnsSqSkr_W3A5-FH2E___shLhp-tDEd4LYwh4zxp6HwsqjP/exec"

def test_action(payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={'Content-Type': 'text/plain; charset=utf-8'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            print(f"Action '{payload.get('action')}' response:")
            print(html)
            print("-" * 40)
    except Exception as e:
        print(f"Action '{payload.get('action')}' failed: {e}")
        print("-" * 40)

print("Starting live backend API tests...")
test_action({"action": "ping"})
test_action({"action": "getStudents"})
test_action({"action": "verifyAdmin", "username": "admin", "password": "efbi2026"})

