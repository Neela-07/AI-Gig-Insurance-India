import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

supabase = create_client(url, key)

try:
    print("Testing Policy Insert...")
    res = supabase.table("policies").insert({
        "worker_id": "WRK-TEST",
        "plan_name": "Test Plan",
        "premium_amount": 100,
        "coverage_amount": 5000,
        "status": "active"
    }).execute()
    print("Success:", res.data)
except Exception as e:
    print("FAILED:", e)
