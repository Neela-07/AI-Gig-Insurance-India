import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase_client = None

def get_supabase_client() -> Client:
    """Returns a singleton Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        url: str = os.environ.get("SUPABASE_URL", "")
        key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
        
        if not url or not key:
            print("[SmartShield] Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY missing.")
            
        _supabase_client = create_client(url, key)
        
    return _supabase_client
