from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langgraph.store.base import BaseStore
from app.tools.stock import get_stock_price
from app.tools.search import web_search
from app.tools.memory import save_memory
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)

tools = [web_search, get_stock_price, save_memory]

llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """
You are a real-time AI assistant.

IMPORTANT RULES:

- For any question about:
  current news,
  latest events,
  today's updates,
  weather,
  politics,
  sports,
  stock prices,
  real-time information,
  trending topics,
  current date,
  or recent updates,

  you MUST use the appropriate tool.

- Use:
  web_search → for news/current information
  get_stock_price → for stocks
  save_memory → when the user states a durable fact/preference that should be
  remembered in future conversations, not just this one (e.g. "I'm vegetarian",
  "call me Alex", "I prefer short answers")

- Never answer current-event questions from memory.
- Never hallucinate dates or news.
- Never claim information is current unless verified using tools.
- Base your answer ONLY on tool output.

"""


async def load_memory(state, config, *, store: BaseStore):
    """
    Runs before the chat node on every turn. Searches the user's
    long-term memory for facts relevant to their latest message and
    stores the result in state["memory_context"] for the chat node to use.
    """
    user_id = config["configurable"]["user_id"]
    namespace = (user_id, "memories")

    messages = state["messages"]
    if not messages:
        return {"memory_context": ""}

    last_message = messages[-1].content

    results = await store.asearch(namespace, query=str(last_message), limit=5)
    facts = [r.value.get("fact", "") for r in results]

    memory_context = "\n".join(f"- {fact}" for fact in facts if fact)
    return {"memory_context": memory_context}


async def chat_node(state):
    messages = state["messages"]
    memory_context = state.get("memory_context", "")

    system_content = SYSTEM_PROMPT
    if memory_context:
        system_content += (
            "\n\nKnown facts about this user (from long-term memory):\n"
            + memory_context
        )

    response = await llm_with_tools.ainvoke(
        [SystemMessage(content=system_content)] + messages
    )

    return {"messages": [response]}