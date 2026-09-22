from langchain_tavily import TavilySearch
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

search = TavilySearch()

@tool
def web_search(query: str) -> str:
    """
    Search the internet for latest news and real-time information.
    Use this tool for current events, politics, sports, weather, and trending topics.
    """

    improved_query = f"latest current information and news about: {query}"

    results = search.run(improved_query)

    # Normalize output
    if isinstance(results, dict) and "results" in results:
        cleaned = []

        for r in results["results"]:
            content = r.get("content", "")
            url = r.get("url", "")

            cleaned.append(
                f"{content}\nSource: {url}"
            )

        return "\n\n".join(cleaned)

    return "No reliable search results found."