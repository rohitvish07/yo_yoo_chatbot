from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

from app.api.schemas import ChatRequest
from app.services.streaming import stream_chat
import uuid
router = APIRouter()


# ✅ SSE Chat Endpoint
@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    chatbot = request.app.state.chatbot

    return StreamingResponse(
        stream_chat(chatbot, req.message, req.thread_id, req.user_id),
        media_type="text/event-stream"
    )

@router.get("/threads")
async def get_threads(request: Request):
    chatbot = request.app.state.chatbot

    thread_ids = set()
    async for checkpoint in chatbot.checkpointer.alist(None):
        thread_id = checkpoint.config["configurable"]["thread_id"]
        thread_ids.add(thread_id)

    threads = []
    for thread_id in thread_ids:
        title = "New Chat"
        try:
            state = await chatbot.aget_state(
                config={"configurable": {"thread_id": thread_id}}
            )
            messages = state.values.get("messages", [])
            first_user_msg = next(
                (m for m in messages if isinstance(m, HumanMessage)), None
            )
            if first_user_msg:
                text = extract_text(first_user_msg.content)
                title = text[:50] + ("..." if len(text) > 50 else "")
        except Exception:
            pass

        threads.append({"thread_id": thread_id, "title": title})

    return threads

# ✅ Get chat history
def extract_text(content):
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        return "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in content
        )
    return str(content)

@router.get("/chat/{thread_id}")
async def get_chat(thread_id: str, request: Request):
    chatbot = request.app.state.chatbot

    try:
        state = await chatbot.aget_state(
            config={"configurable": {"thread_id": thread_id}}
        )

        messages = state.values.get("messages", [])

        formatted = []
        for m in messages:
            if isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                continue

            formatted.append({
                "id": str(uuid.uuid4()),
                "role": role,
                "content": extract_text(m.content)
            })

        return {"messages": formatted}

    except Exception:
        return {"messages": []}