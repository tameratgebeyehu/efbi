import urllib.request
import json

url = "https://script.google.com/macros/s/AKfycbxTVnBEFdPvpFTAxQlh9pnsSqSkr_W3A5-FH2E___shLhp-tDEd4LYwh4zxp6HwsqjP/exec"

def send_request(payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={'Content-Type': 'text/plain; charset=utf-8'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        return f"Error: {e}"

print("1. Sending ping...")
print("Response:", send_request({"action": "ping"}))

print("\n2. Sending test addStudent...")
student_payload = {
    "action": "addStudent",
    "name": "Test Student",
    "email": "test@email.com",
    "region": "Addis Ababa",
    "school": "Test School",
    "grade": "Grade 11-12",
    "interest": "Artificial Intelligence",
    "why": "Testing database connectivity."
}
print("Response:", send_request(student_payload))
