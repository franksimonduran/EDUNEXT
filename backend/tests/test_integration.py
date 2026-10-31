import subprocess
import time
import requests
import sys

def main():
    # Start the server
    server_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=r"D:\Programing\ATHRON EDU1\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(3)
    
    try:
        base_url = "http://127.0.0.1:8000"
        endpoints = [
            "/api/v1/health/live",
            "/api/v1/health/ready",
            "/api/v1/meta",
            "/api/v1/meta/version",
            "/api/v1/system/status"
        ]
        
        all_passed = True
        for path in endpoints:
            try:
                response = requests.get(f"http://127.0.0.1:8000{path}", timeout=5)
                if response.status_code == 200:
                    print("[OK] " + path + ": " + str(response.status_code) + " - " + str(response.json()))
                else:
                    print("FAIL " + path + ": " + str(response.status_code))
                    return False
            except Exception as e:
                print("FAIL " + path + ": " + str(e))
                return False
        
        print("All endpoints working!")
        return True
        
    except Exception as e:
        print("Test failed: " + str(e))
        return False
    finally:
        pass


if __name__ == "__main__":
    import subprocess
    import time
    import requests
    import sys
    
    server_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=r"D:\Programing\ATHRON EDU1\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(3)
    
    try:
        base_url = "http://127.0.0.1:8000"
        endpoints = [
            "/api/v1/health/live",
            "/api/v1/health/ready",
            "/api/v1/meta",
            "/api/v1/meta/version",
            "/api/v1/system/status"
        ]
        
        all_passed = True
        for path in endpoints:
            try:
                response = requests.get("http://127.0.0.1:8000" + path, timeout=5)
                if response.status_code == 200:
                    print("[OK] " + path + ": " + str(response.status_code) + " - " + str(response.json()))
                else:
                    print("FAIL " + path + ": " + str(response.status_code))
                    sys.exit(1)
            except Exception as e:
                print("FAIL " + path + ": " + str(e))
                sys.exit(1)
        
        print("All endpoints working!")
        
    except Exception as e:
        print("Test failed: " + str(e))
        sys.exit(1)
    finally:
        pass