# app/db/threads.py
#
# The LangGraph checkpointer stores conversation contents, but not WHO a
# conversation belongs to. This small table fills that gap so each user
# only sees (and can only open) their own chats.

from psycopg.rows import dict_row


async def init_threads_table(pool):
    """Create the ownership table if it doesn't exist (safe to run on every start)."""
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS thread_owners (
                    thread_id  TEXT PRIMARY KEY,
                    user_id    TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            await cur.execute(
                "CREATE INDEX IF NOT EXISTS thread_owners_user_idx "
                "ON thread_owners (user_id, created_at DESC)"
            )


async def claim_thread(pool, thread_id: str, user_id: str) -> bool:
    """
    Register thread_id for user_id if nobody owns it yet.
    Returns True if this user owns the thread afterwards, False if it
    already belongs to someone else.
    """
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "INSERT INTO thread_owners (thread_id, user_id) VALUES (%s, %s) "
                "ON CONFLICT (thread_id) DO NOTHING",
                (thread_id, user_id),
            )
            await cur.execute(
                "SELECT user_id FROM thread_owners WHERE thread_id = %s", (thread_id,)
            )
            row = await cur.fetchone()
    return row is not None and row["user_id"] == user_id


async def user_owns_thread(pool, thread_id: str, user_id: str) -> bool:
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "SELECT 1 AS ok FROM thread_owners WHERE thread_id = %s AND user_id = %s",
                (thread_id, user_id),
            )
            return await cur.fetchone() is not None


async def list_user_threads(pool, user_id: str) -> list[str]:
    """This user's thread ids, newest first."""
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "SELECT thread_id FROM thread_owners WHERE user_id = %s "
                "ORDER BY created_at DESC",
                (user_id,),
            )
            rows = await cur.fetchall()
    return [r["thread_id"] for r in rows]