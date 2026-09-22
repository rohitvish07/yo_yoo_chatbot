from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    user_id:str = "test_user_1" # this is a placeholder until I don not integrate clerk