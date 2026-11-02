'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  type Message,
  type Thread,
  getThreads,
  getChatHistory,
  sendMessage,
  generateThreadId,
} from '@/lib/api'

export function useChat() {
  const { getToken } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [error, setError] = useState<string | null>(null)

  
  const skipNextLoadRef = useRef(false)

  // Load threads on mount
  useEffect(() => {
    loadThreads()
  }, [])

  // Load messages when thread changes
  useEffect(() => {
    if (activeThreadId) {
      if (skipNextLoadRef.current) {
        
        skipNextLoadRef.current = false
        return
      }
      loadChatHistory(activeThreadId)
    } else {
      setMessages([])
    }
  }, [activeThreadId])

  const loadThreads = async () => {
    setIsLoadingThreads(true)
    try {
      const fetchedThreads = await getThreads(await getToken())
      setThreads(fetchedThreads)
      setError(null)
    } catch {
      // If API is not available, start with empty threads
      setThreads([])
    } finally {
      setIsLoadingThreads(false)
    }
  }

  const loadChatHistory = async (threadId: string) => {
    setIsLoading(true)
    try {
      const history = await getChatHistory(threadId, await getToken())
      setMessages(history)
      setError(null)
    } catch {
      // If API is not available, start with empty messages
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const createNewChat = useCallback(() => {
    const newThreadId = generateThreadId()
    const newThread: Thread = {
      thread_id: newThreadId,
      title: 'New Chat',
    }
    setThreads((prev) => [newThread, ...prev])
    skipNextLoadRef.current = true
    setActiveThreadId(newThreadId)
    setMessages([])
  }, [])

  const selectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId)
  }, [])

  const sendUserMessage = useCallback(
    async (content: string) => {
      // Resolve thread ID once — don't rely on activeThreadId state being
      // updated yet within this same function call (React state updates
      // are asynchronous, so re-reading activeThreadId below would be stale).
      const threadId = activeThreadId ?? generateThreadId()

      if (!activeThreadId) {
        // Brand-new thread: create it, name it from the first message,
        // and tell the effect above to skip fetching (empty) history for it.
        const newThread: Thread = {
          thread_id: threadId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        }
        setThreads((prev) => [newThread, ...prev])
        skipNextLoadRef.current = true
        setActiveThreadId(threadId)
        setMessages([])
      } else {
        // Existing thread: update its title if this is still its first message
        setThreads((prev) =>
          prev.map((t) =>
            t.thread_id === threadId && t.title === 'New Chat'
              ? {
                  ...t,
                  title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
                }
              : t
          )
        )
      }

      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Add placeholder for assistant response
      const assistantMessageId = `msg_${Date.now()}_assistant`
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(true)
      setError(null)

      const token = await getToken()

      await sendMessage(
        content,
        threadId,
        token,
        // onChunk
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          )
        },
        // onToolUsage
        (tool) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, toolUsage: tool } : msg
            )
          )
        },
        // onComplete
        () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false, toolUsage: undefined }
                : msg
            )
          )
          setIsLoading(false)
        },
        // onError
        (err) => {
          setError(err.message)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content:
                      'Sorry, I encountered an error. Please try again.',
                    isStreaming: false,
                  }
                : msg
            )
          )
          setIsLoading(false)
        }
      )
    },
    [activeThreadId, getToken]
  )

  const retry = useCallback(() => {
    setError(null)
    if (messages.length >= 2) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user')
      if (lastUserMessage) {
        // Remove the last failed assistant message
        setMessages((prev) => prev.slice(0, -1))
        sendUserMessage(lastUserMessage.content)
      }
    }
  }, [messages, sendUserMessage])

  return {
    threads,
    activeThreadId,
    messages,
    isLoading,
    isLoadingThreads,
    error,
    createNewChat,
    selectThread,
    sendMessage: sendUserMessage,
    retry,
  }
}