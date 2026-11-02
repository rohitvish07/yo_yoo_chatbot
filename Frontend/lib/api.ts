// API service for chatbot backend integration

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  toolUsage?: string
}

export interface Thread {
  thread_id: string
  title: string
  created_at?: Date
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Every backend call must carry the signed-in user's Clerk token
function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Fetch all threads
export async function getThreads(token: string | null): Promise<Thread[]> {
  const response = await fetch(`${API_BASE_URL}/threads`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch threads')
  }
  const threads: { thread_id: string; title: string }[] = await response.json()
  return threads.map((t) => ({
    thread_id: t.thread_id,
    title: t.title,
  }))
}
// Fetch chat history for a specific thread
export async function getChatHistory(
  threadId: string,
  token: string | null
): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/chat/${threadId}`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch chat history')
  }
  const data = await response.json()
  return (data.messages || []).map((msg: any) => ({
  id: crypto.randomUUID(),
  role: msg.role,
  content: msg.content,
  timestamp: new Date(),
  }))
}

// Send a message and stream the response
export async function sendMessage(
  message: string,
  threadId: string,
  token: string | null,
  onChunk: (chunk: string) => void,
  onToolUsage: (tool: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...authHeaders(token),
      },
      body: JSON.stringify({
        message,
        thread_id: threadId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onComplete()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.tool) {
              onToolUsage(parsed.tool)
            } else if (parsed.content) {
              if (parsed.tool) {
  onToolUsage(parsed.tool)

} else if (parsed.content) {

  // 🔥 FIX START
  if (typeof parsed.content === 'string') {
    onChunk(parsed.content)

  } else if (Array.isArray(parsed.content)) {
    parsed.content.forEach((item: any) => {
      if (typeof item === 'string') {
        onChunk(item)
      } else if (item?.text) {
        onChunk(item.text)
      }
    })

  } else if (parsed.content?.text) {
    onChunk(parsed.content.text)
  }
  // 🔥 FIX END

} else if (typeof parsed === 'string') {
  onChunk(parsed)
}
            } else if (typeof parsed === 'string') {
              onChunk(parsed)
            }
          } catch {
            // If not JSON, treat as plain text
            if (data.trim()) {
              onChunk(data)
            }
          }
        } else if (line.trim() && !line.startsWith(':')) {
          // Handle plain text streaming
          onChunk(line)
        }
      }
    }
    onComplete()
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'))
  }
}

// Generate a new thread ID
export function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}