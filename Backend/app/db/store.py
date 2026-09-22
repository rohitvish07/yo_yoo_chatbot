# app/db/store.py

from langgraph.store.postgres.aio import AsyncPostgresStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import GOOGLE_API_KEY

EMBEDDING_DIMS = 768


async def get_store(pool):
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=GOOGLE_API_KEY,
        output_dimensionality=EMBEDDING_DIMS,
    )

    store = AsyncPostgresStore(
        pool,
        index={
            "dims": EMBEDDING_DIMS,
            "embed": embeddings,
        },
    )
    await store.setup()

    return store