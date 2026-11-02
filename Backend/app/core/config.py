import os 
from dotenv import load_dotenv 
load_dotenv() 
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
NEON_DATABASE_URL = os.getenv("NEON_DATABASE_URL")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")