# app/tools/memory.py

import uuid
from typing import Annotated

from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langgraph.store.base import BaseStore
from langgraph.prebuilt import InjectedStore


@tool
async def save_memory(
    fact: str,
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore()],
) -> str:
    """
    Save a durable fact about the user that should be remembered across
    ALL future conversations — not just this one. Use this when the user
    states a preference, a piece of personal info, or anything they'd
    expect you to recall later in a different chat.

    Examples: "I'm vegetarian", "I work as a backend engineer",
    "my name is Alex", "I prefer short answers".

    Do NOT use this for things only relevant to the current message.
    """
    user_id = config["configurable"]["user_id"]
    namespace = (user_id, "memories")
    key = str(uuid.uuid4())

    await store.aput(namespace, key, {"fact": fact})

    return f"Saved to long-term memory: {fact}"