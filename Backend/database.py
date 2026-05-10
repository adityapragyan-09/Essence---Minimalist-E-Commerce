import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "").strip('"').strip("'")
key: str = os.environ.get("SUPABASE_KEY", "").strip('"').strip("'")

supabase: Client = create_client(url, key) if url and key else None



def get_supabase():
    return supabase

