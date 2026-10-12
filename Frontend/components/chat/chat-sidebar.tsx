'use client'

import { cn } from '@/lib/utils'
import type { Thread } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquarePlus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface ChatSidebarProps {
  threads: Thread[]
  activeThreadId: string | null
  onSelectThread: (threadId: string) => void
  onNewChat: () => void
  isLoading: boolean
  isOpen: boolean
  onToggle: () => void
}

export function ChatSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  isLoading,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:relative lg:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            Yo-Yo-Bot
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-11 w-11 text-sidebar-foreground hover:bg-sidebar-accent" // changed this LOC
          >
            <PanelLeftClose className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Threads list */}
        <ScrollArea className="flex-1 min-h-0 px-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-sidebar-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-sm text-sidebar-foreground/60">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {threads.map((thread) => (
                <button
                  key={thread.thread_id}
                  onClick={() => onSelectThread(thread.thread_id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    activeThreadId === thread.thread_id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{thread.title}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60">
            Powered by FastAPI + LangGraph
          </p>
        </div>
      </aside>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="fixed left-4 z-50 h-11 w-11 lg:hidden"
          style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      )}
    </>
  )
}
