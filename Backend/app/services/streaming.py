from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
import json

async def stream_chat(chatbot, message, thread_id, user_id):

    CONFIG = {
        "configurable": {"thread_id": thread_id, "user_id": user_id},
    }

    async for chunk, metadata in chatbot.astream(
        {"messages": [HumanMessage(content=message)]},
        config=CONFIG,
        stream_mode="messages",
    ):

        # Tool usage
        if isinstance(chunk, ToolMessage):
            yield f"data: {json.dumps({'tool': chunk.name})}\n\n"

        # AI tokens
        elif isinstance(chunk, AIMessage):
            yield f"data: {json.dumps({'content': chunk.content})}\n\n"

    yield "data: [DONE]\n\n"