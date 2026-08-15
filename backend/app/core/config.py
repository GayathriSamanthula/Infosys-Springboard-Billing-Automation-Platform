import os
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY", "8e7d2f1c5a9b4f6e8d3c7a1b5f9e2d6c4a8b7e1d3f5c9a2b6e8d1f4a7c5b9e2")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
)