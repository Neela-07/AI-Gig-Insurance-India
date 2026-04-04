import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

try:
    print("Listing policies...")
    res = supabase.table("policies").select("*").limit(1).execute()
    print("Policy List:", res.data)
except Exception as e:
    print("FAILED:", e)
