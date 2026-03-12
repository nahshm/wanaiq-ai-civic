import requests

url = "http://localhost:8080/api/profile/update"
headers = {
    "Content-Type": "application/json"
}
data = {
    "displayName": "Test User Updated",
    "bio": "Updated bio for testing.",
    "location": "Nairobi",
    "expertise": ["Civic Engagement"]
}

response = requests.post(url, json=data, headers=headers)
print("Status Code:", response.status_code)
print("Response Body:", response.text)
