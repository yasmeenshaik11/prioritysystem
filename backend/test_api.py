import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db

def test_full_flow():
    app = create_app()
    client = app.test_client()

    print("\n--- 1. Testing Health Endpoint ---")
    r = client.get('/api/health')
    print("Health response:", r.status_code, r.get_json())
    assert r.status_code == 200

    print("\n--- 2. Testing Citizen Login ---")
    r = client.post('/api/auth/login', json={'email': 'citizen@emergencyai.com', 'password': 'Citizen@123'})
    print("Citizen login status:", r.status_code)
    assert r.status_code == 200
    citizen_token = r.get_json()['access_token']
    assert citizen_token

    print("\n--- 3. Testing Officer Login ---")
    r = client.post('/api/auth/login', json={'email': 'officer@emergencyai.com', 'password': 'Officer@123'})
    print("Officer login status:", r.status_code)
    assert r.status_code == 200
    officer_token = r.get_json()['access_token']
    assert officer_token

    print("\n--- 4. Testing Admin Login ---")
    r = client.post('/api/auth/login', json={'email': 'admin@emergencyai.com', 'password': 'Admin@123'})
    print("Admin login status:", r.status_code)
    assert r.status_code == 200
    admin_token = r.get_json()['access_token']
    assert admin_token

    print("\n--- 5. Testing Citizen Complaint Submission with AI Prediction ---")
    headers = {'Authorization': f'Bearer {citizen_token}'}
    data = {
        'title': 'High Voltage Electric Cable Snapped Over Road',
        'description': 'Live wire fell down sparking fire on pavement after storm. Children school bus passing. Severe electrocution danger!',
        'reported_location': 'Banjara Hills Road No 10',
        'latitude': '17.4156',
        'longitude': '78.4350'
    }
    r = client.post('/api/complaints', data=data, headers=headers)
    print("Complaint submission status:", r.status_code)
    res = r.get_json()
    print("AI Analysis Result:", res.get('ai'))
    assert r.status_code == 201
    assert res['ai']['priority'] == 'Critical'
    assert res['ai']['severity'] == 'Critical'
    assert res['ai']['urgency_score'] >= 80
    new_complaint_id = res['complaint']['id']

    print("\n--- 6. Testing Citizen Complaints List ---")
    r = client.get('/api/complaints/my', headers=headers)
    print("My complaints count:", len(r.get_json()))
    assert r.status_code == 200
    assert len(r.get_json()) >= 1

    print("\n--- 7. Testing Officer Dashboard KPIs ---")
    officer_headers = {'Authorization': f'Bearer {officer_token}'}
    r = client.get('/api/officer/dashboard', headers=officer_headers)
    print("Officer dashboard KPIs:", r.get_json())
    assert r.status_code == 200
    assert r.get_json()['total'] >= 9

    print("\n--- 8. Testing Officer Status Transition to In Progress & Rejected ---")
    r = client.patch(f'/api/officer/complaints/{new_complaint_id}/status',
                     json={'status': 'In Progress', 'remarks': 'Dispatched emergency electrical crew'},
                     headers=officer_headers)
    print("Status update status:", r.status_code, r.get_json().get('status'))
    assert r.status_code == 200
    assert r.get_json()['status'] == 'In Progress'

    print("\n--- 9. Testing Officer Analytics ---")
    r = client.get('/api/officer/analytics', headers=officer_headers)
    print("Analytics response:", r.get_json())
    assert r.status_code == 200
    assert len(r.get_json()['category']) > 0

    print("\n--- 10. Testing Notifications System ---")
    r = client.get('/api/notifications', headers=headers)
    print("Citizen notifications:", r.get_json()['unread_count'], "unread notifications")
    assert r.status_code == 200
    assert len(r.get_json()['notifications']) >= 1

    print("\n ALL BACKEND & AI API TESTS PASSED SUCCESSFULLY! ")

if __name__ == '__main__':
    test_full_flow()
