# app/db/checkpoint.py

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

async def get_checkpointer(pool):
    """
    Builds the checkpointer using the same shared Neon pool the store
    uses — conversation history now lives in Postgres, not a local
    SQLite file.
    """
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    return checkpointer