'use client'

import { useState, useEffect } from 'react'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatWindow } from '@/components/chat/chat-window'
import { ThemeToggle } from '@/components/theme-toggle'
import { useChat } from '@/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, PanelLeft } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => {
    setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches) // changed this LOC
  }, [])
  const {
    threads,
    activeThreadId,
    messages,
    isLoading,
    isLoadingThreads,
    error,
    createNewChat,
    selectThread,
    sendMessage,
    retry,
  } = useChat()

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={selectThread}
        onNewChat={createNewChat}
        isLoading={isLoadingThreads}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header               // changed this LOC
          className="flex items-center justify-between border-b border-border bg-background px-4 py-3"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2 pl-12 lg:pl-0"> 
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            )}
            <h2 className="text-lg font-medium text-foreground">
              {activeThreadId
                ? threads.find((t) => t.thread_id === activeThreadId)?.title ||
                  'Chat'
                : 'New Chat'}
            </h2>
          </div>
          <ThemeToggle />
        </header>

        {/* Error alert */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={retry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Chat window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}
