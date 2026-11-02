from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db.checkpoint import get_checkpointer
from app.db.store import get_store
from app.graph.builder import build_graph
from app.db.pool import get_pool
from app.db.threads import init_threads_table

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Initialize chatbot on startup
@app.on_event("startup")
async def startup_event():
    pool = await get_pool()
    app.state.pool = pool
    await init_threads_table(pool)
    store = await get_store(pool)
    checkpointer = await get_checkpointer(pool)
    app.state.chatbot = build_graph(checkpointer, store)


# include routes
app.include_router(router)