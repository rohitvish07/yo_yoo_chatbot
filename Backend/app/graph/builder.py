# app/graph/builder.py

from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition

from app.graph.state import ChatState
from app.graph.nodes import chat_node, load_memory, tools

def build_graph(checkpointer, store):
    graph = StateGraph(ChatState)

    tool_node = ToolNode(tools)

    graph.add_node("load_memory", load_memory)
    graph.add_node("chat", chat_node)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "load_memory")
    graph.add_edge("load_memory", "chat")
    graph.add_conditional_edges("chat", tools_condition)
    graph.add_edge("tools", "chat")
    

    return graph.compile(checkpointer=checkpointer, store=store)