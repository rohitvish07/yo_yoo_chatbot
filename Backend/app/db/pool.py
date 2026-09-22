# app/db/pool.py

from psycopg_pool import AsyncConnectionPool
from app.core.config import NEON_DATABASE_URL


async def get_pool() -> AsyncConnectionPool:
    """
    Opens ONE shared connection pool to Neon. Both the long-term memory
    store and the checkpointer use this same pool.
    """
    pool = AsyncConnectionPool(
        conninfo=NEON_DATABASE_URL,
        min_size=1,
        max_size=5,
        kwargs={"autocommit": True, "row_factory": "dict_row"},
        open=False,
    )
    await pool.open()
    return pool