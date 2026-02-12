import os
import sys
import psycopg
from urllib.parse import urlparse

# Updated URL with encoded password
DATABASE_URL = "postgres://Azeem:S%40leh2004@127.0.0.1:5432/smart_erp"

def check_db():
    print(f"Testing connection to: {DATABASE_URL}")
    try:
        conn = psycopg.connect(DATABASE_URL)
        print("PASS: Successfully connected to PostgreSQL.")
        
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM auth_user;")
        count = cur.fetchone()[0]
        print(f"PASS: Query successful. Found {count} users.")
        conn.close()
        return True
    except Exception as e:
        print(f"FAIL: Database connection failed. Error: {e}")
        return False

if __name__ == "__main__":
    if not check_db():
        sys.exit(1)