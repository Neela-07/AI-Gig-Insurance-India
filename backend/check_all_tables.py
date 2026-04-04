import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

for table in ["users", "claims", "risk_telemetry", "policies"]:
    try:
        supabase.table(table).select("*").limit(1).execute()
        print(f"[OK] Table '{table}' exists.")
    except Exception as e:
        print(f"[MISSING] Table '{table}' error: {e}")
