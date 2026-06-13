"use client";

import { Send, Upload } from "lucide-react";
import { useState } from "react";
import type { Socket } from "socket.io-client";
import type { ChatMessage } from "@/types/domain";

export function ChatPanel({ socket, sessionId, messages }: { socket?: Socket; sessionId: string; messages: ChatMessage[] }) {
  const [body, setBody] = useState("");

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    socket?.emit("chat:send", { sessionId, body }, () => setBody(""));
  }

  return (
    <aside className="flex h-full min-h-[420px] flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 font-medium">Chat</div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message._id} className="rounded border border-slate-200 p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>{message.senderName}</span>
              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm leading-6">{message.body}</p>
            {message.fileUrl && <a className="mt-2 block text-sm text-signal" href={message.fileUrl}>Download attachment</a>}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <button type="button" className="rounded border border-slate-300 p-2 text-slate-600" title="Upload file">
          <Upload size={18} />
        </button>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message" className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2" />
        <button className="rounded bg-signal p-2 text-white" title="Send message">
          <Send size={18} />
        </button>
      </form>
    </aside>
  );
}
