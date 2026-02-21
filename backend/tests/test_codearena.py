"""
CodeArena Backend Tests - Auth, Problems, Contests, Submissions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ─── Auth Tests ───

class TestAuth:
    def test_root_health(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "CodeArena" in r.json().get("message", "")
        print("✅ Health check passed")

    def test_admin_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login: {data['user']['username']}")

    def test_login_invalid_credentials(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert r.status_code == 401
        print("✅ Invalid credentials rejected")

    def test_register_new_user(self):
        import uuid
        unique = uuid.uuid4().hex[:8]
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"TEST_{unique}",
            "email": f"TEST_{unique}@example.com",
            "password": "testpass123"
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["role"] == "user"
        print(f"✅ User registered: {data['user']['username']}")

    def test_register_duplicate_email(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": "anyname",
            "email": "admin@codearena.com",
            "password": "somepass"
        })
        assert r.status_code == 400
        print("✅ Duplicate email rejected")


# ─── Problems Tests ───

class TestProblems:
    @pytest.fixture(autouse=True)
    def setup(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        self.token = r.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_list_problems(self):
        r = requests.get(f"{BASE_URL}/api/problems")
        assert r.status_code == 200
        problems = r.json()
        assert len(problems) >= 5, f"Expected 5 seeded problems, got {len(problems)}"
        print(f"✅ Problems list: {len(problems)} problems")

    def test_filter_by_difficulty(self):
        r = requests.get(f"{BASE_URL}/api/problems?difficulty=easy")
        assert r.status_code == 200
        problems = r.json()
        for p in problems:
            assert p["difficulty"] == "easy"
        print(f"✅ Difficulty filter: {len(problems)} easy problems")

    def test_get_problem_by_id(self):
        r = requests.get(f"{BASE_URL}/api/problems")
        problems = r.json()
        assert len(problems) > 0
        pid = problems[0]["id"]
        r2 = requests.get(f"{BASE_URL}/api/problems/{pid}")
        assert r2.status_code == 200
        assert r2.json()["id"] == pid
        print(f"✅ Get problem by ID: {r2.json()['title']}")

    def test_two_sum_exists(self):
        r = requests.get(f"{BASE_URL}/api/problems")
        titles = [p["title"] for p in r.json()]
        assert "Two Sum" in titles
        print("✅ Two Sum problem exists")

    def test_create_problem_admin(self):
        r = requests.post(f"{BASE_URL}/api/problems", headers=self.headers, json={
            "title": "TEST_Problem",
            "description": "Test description",
            "difficulty": "easy",
            "tags": ["test"],
            "sample_input": "1",
            "sample_output": "1",
            "test_cases": [{"input": "1", "output": "1"}],
            "hints": ["hint1"],
            "constraints": "n >= 1",
            "time_limit": 5
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_Problem"
        # Cleanup
        requests.delete(f"{BASE_URL}/api/problems/{data['id']}", headers=self.headers)
        print("✅ Admin can create problem")

    def test_create_problem_unauthorized(self):
        r = requests.post(f"{BASE_URL}/api/problems", json={
            "title": "Unauthorized",
            "description": "test",
            "difficulty": "easy",
            "tags": [],
            "sample_input": "1",
            "sample_output": "1",
            "test_cases": [],
        })
        assert r.status_code == 401
        print("✅ Unauthorized problem creation rejected")


# ─── Submission Tests ───

class TestSubmissions:
    @pytest.fixture(autouse=True)
    def setup(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        self.token = r.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Get Two Sum problem ID
        problems = requests.get(f"{BASE_URL}/api/problems").json()
        self.two_sum = next((p for p in problems if p["title"] == "Two Sum"), None)

    def test_submit_python_two_sum_accepted(self):
        assert self.two_sum, "Two Sum problem not found"
        code = """nums=list(map(int,input().split()))
target=int(input())
seen={}
for i,n in enumerate(nums):
    if target-n in seen:
        print(seen[target-n],i)
        break
    seen[n]=i"""
        r = requests.post(f"{BASE_URL}/api/submit", headers=self.headers, json={
            "language": "python",
            "code": code,
            "problem_id": self.two_sum["id"]
        })
        assert r.status_code == 200
        data = r.json()
        assert data["verdict"] == "Accepted", f"Expected Accepted, got {data['verdict']}"
        print(f"✅ Two Sum Python submission: {data['verdict']}")

    def test_submit_wrong_answer(self):
        assert self.two_sum, "Two Sum problem not found"
        r = requests.post(f"{BASE_URL}/api/submit", headers=self.headers, json={
            "language": "python",
            "code": "print('wrong')",
            "problem_id": self.two_sum["id"]
        })
        assert r.status_code == 200
        assert r.json()["verdict"] in ["Wrong Answer", "Runtime Error"]
        print(f"✅ Wrong answer detected: {r.json()['verdict']}")

    def test_submit_cpp_mocked(self):
        assert self.two_sum, "Two Sum problem not found"
        r = requests.post(f"{BASE_URL}/api/submit", headers=self.headers, json={
            "language": "cpp",
            "code": "// mock cpp",
            "problem_id": self.two_sum["id"]
        })
        assert r.status_code == 200
        assert r.json()["verdict"] == "Accepted"  # C++ is mocked
        print("✅ C++ mock submission accepted")

    def test_submit_unauthenticated(self):
        assert self.two_sum, "Two Sum problem not found"
        r = requests.post(f"{BASE_URL}/api/submit", json={
            "language": "python",
            "code": "print(1)",
            "problem_id": self.two_sum["id"]
        })
        assert r.status_code == 401
        print("✅ Unauthenticated submission rejected")


# ─── AI Hint Tests ───

class TestHints:
    @pytest.fixture(autouse=True)
    def setup(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        self.token = r.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        problems = requests.get(f"{BASE_URL}/api/problems").json()
        self.two_sum = next((p for p in problems if p["title"] == "Two Sum"), None)

    def test_get_hint_level1(self):
        assert self.two_sum
        r = requests.post(f"{BASE_URL}/api/problems/{self.two_sum['id']}/hint",
                          headers=self.headers,
                          json={"problem_id": self.two_sum["id"], "code": "", "hint_level": 1})
        assert r.status_code == 200
        data = r.json()
        assert "hint" in data
        assert len(data["hint"]) > 5
        print(f"✅ Hint level 1: source={data.get('source')}")


# ─── Contest Tests ───

class TestContests:
    @pytest.fixture(autouse=True)
    def setup(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        self.token = r.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        problems = requests.get(f"{BASE_URL}/api/problems").json()
        self.problem_ids = [p["id"] for p in problems[:2]]

    def test_list_contests(self):
        r = requests.get(f"{BASE_URL}/api/contests")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"✅ Contests listed: {len(r.json())}")

    def test_create_contest(self):
        r = requests.post(f"{BASE_URL}/api/contests", headers=self.headers, json={
            "title": "TEST_Contest",
            "description": "Test contest",
            "problem_ids": self.problem_ids,
            "duration": 60
        })
        assert r.status_code == 200
        data = r.json()
        assert "join_code" in data
        assert len(data["join_code"]) == 6
        self.contest_id = data["id"]
        print(f"✅ Contest created with join code: {data['join_code']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/contests/{data['id']}", headers=self.headers)

    def test_join_contest(self):
        # Create first
        r = requests.post(f"{BASE_URL}/api/contests", headers=self.headers, json={
            "title": "TEST_JoinContest",
            "description": "Test",
            "problem_ids": self.problem_ids,
            "duration": 60
        })
        assert r.status_code == 200
        join_code = r.json()["join_code"]
        contest_id = r.json()["id"]

        # Register a test user and join
        import uuid
        uid = uuid.uuid4().hex[:8]
        reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"TEST_{uid}",
            "email": f"TEST_{uid}@test.com",
            "password": "pass123"
        })
        user_token = reg.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        join_r = requests.post(f"{BASE_URL}/api/contests/join",
                               headers=user_headers,
                               json={"join_code": join_code})
        assert join_r.status_code == 200
        assert join_r.json()["contest_id"] == contest_id
        print(f"✅ Contest join successful")

        # Cleanup
        requests.delete(f"{BASE_URL}/api/contests/{contest_id}", headers=self.headers)

    def test_join_invalid_code(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        headers = {"Authorization": f"Bearer {r.json()['token']}"}
        jr = requests.post(f"{BASE_URL}/api/contests/join",
                           headers=headers,
                           json={"join_code": "XXXXXX"})
        assert jr.status_code == 404
        print("✅ Invalid join code rejected")


# ─── Admin Stats ───

class TestAdmin:
    def test_admin_stats(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        token = r.json()["token"]
        stats = requests.get(f"{BASE_URL}/api/admin/stats",
                             headers={"Authorization": f"Bearer {token}"})
        assert stats.status_code == 200
        data = stats.json()
        assert "total_users" in data
        assert "total_problems" in data
        print(f"✅ Admin stats: {data}")

    def test_user_profile(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@codearena.com",
            "password": "Admin@123"
        })
        token = r.json()["token"]
        profile = requests.get(f"{BASE_URL}/api/users/profile",
                               headers={"Authorization": f"Bearer {token}"})
        assert profile.status_code == 200
        data = profile.json()
        assert "solved_count" in data
        assert "recent_submissions" in data
        print(f"✅ User profile: solved={data['solved_count']}")
