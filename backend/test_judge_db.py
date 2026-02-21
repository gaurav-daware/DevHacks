import requests
import uuid

def trigger_run():
    uid = uuid.uuid4().hex
    dummy_email = f"test_{uid}@test.com"
    dummy_user = f"user_{uid}"
    dummy_pass = "password"
    
    # Register dummy
    res = requests.post("http://localhost:8000/api/auth/register", json={
        "username": dummy_user,
        "email": dummy_email,
        "password": dummy_pass
    })
    
    token = res.json().get("token")
    if not token:
        print("Failed to register:", res.text)
        return
        
    print("Registered. Submitting code...")
    # Now submit code to daily challenge
    submit_res = requests.post("http://localhost:8000/api/submit", 
        headers={"Authorization": f"Bearer {token}"},
        json={
            "language": "python",
            "code": "print(input())", # Wrong Answer but will test endpoint
            "problem_id": "59b14ee9-63c8-4d74-8f8c-1f845f0e5ca1",
            "keystrokes": []
        }
    )
    print("Verdict:", submit_res.json().get("verdict"))
    
    # test fetch user streak
    me_res = requests.get("http://localhost:8000/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("User Auth Me after submit:", me_res.json())

trigger_run()
