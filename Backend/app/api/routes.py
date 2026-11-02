from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

from app.api.schemas import ChatRequest
from app.services.streaming import stream_chat
from app.core.auth import get_current_user_id
from app.db.threads import claim_thread, user_owns_thread, list_user_threads
import uuid
router = APIRouter()


# ✅ SSE Chat Endpoint
@router.post("/chat")
async def chat(req: ChatRequest, request: Request, user_id: str = Depends(get_current_user_id)):
    chatbot = request.app.state.chatbot

    # First message in a thread registers it to this user; if it already
    # belongs to someone else, refuse.
    if not await claim_thread(request.app.state.pool, req.thread_id, user_id):
        raise HTTPException(status_code=403, detail="This conversation belongs to another user")

    return StreamingResponse(
        stream_chat(chatbot, req.message, req.thread_id, user_id),
        media_type="text/event-stream"
    )

@router.get("/threads")
async def get_threads(request: Request, user_id: str = Depends(get_current_user_id)):
    chatbot = request.app.state.chatbot

    thread_ids = await list_user_threads(request.app.state.pool, user_id)

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
async def get_chat(thread_id: str, request: Request, user_id: str = Depends(get_current_user_id)):
    chatbot = request.app.state.chatbot

    if not await user_owns_thread(request.app.state.pool, thread_id, user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")

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