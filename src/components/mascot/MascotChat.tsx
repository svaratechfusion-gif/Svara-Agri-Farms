"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { MAX_INPUT_LENGTH, type ChatState } from "@/lib/mascot/chat/conversation";
import { QUICK_REPLIES, SCRIPT, type ReplyId } from "@/lib/mascot/chat/script";

interface MascotChatProps {
  chat: ChatState;
  pathname: string;
  /** A quick reply that answers in the chat. */
  onChoose: (reply: ReplyId) => void;
  /** A typed message. */
  onSay: (text: string) => void;
  /** A link out of the chat was followed (a navigating reply passes its id). */
  onNavigate: (reply?: ReplyId) => void;
}

const QUICK_REPLY_CLASS =
  "inline-flex min-h-10 items-center rounded-full border border-[color:var(--vein)] bg-ivory px-4 py-1.5 type-small text-forest transition-colors hover:bg-ivory-deep focus-visible:bg-ivory-deep";

/**
 * SVARA's conversation: a log of messages, the latest answer's quick
 * replies, and a box for typed questions. Scripted, not generative — the
 * panel says so. Enter sends, Shift+Enter starts a new line; Escape (handled
 * by the companion) closes the panel.
 */
export function MascotChat({ chat, pathname, onChoose, onSay, onNavigate }: MascotChatProps) {
  const inputId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chat.messages.length]);

  const last = chat.messages.at(-1);
  const replies = last?.from === "svara" && last.node ? SCRIPT[last.node].replies : [];

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.trim()) return;
    onSay(draft);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) send(event);
  };

  return (
    <div className="mt-4">
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with SVARA"
        className="mascot-chat-log max-h-[min(20rem,42dvh)] space-y-3 overflow-y-auto overscroll-contain pr-1"
      >
        {chat.messages.map((message) => {
          if (message.from === "visitor") {
            return (
              <div key={message.id} className="flex justify-end pl-8">
                <p className="rounded-[1.1rem_1.1rem_0.3rem_1.1rem] bg-forest px-3.5 py-2 type-small break-words whitespace-pre-line text-ivory">
                  <span className="sr-only">You: </span>
                  {message.text}
                </p>
              </div>
            );
          }
          const node = message.node ? SCRIPT[message.node] : undefined;
          return (
            <div
              key={message.id}
              className="mr-6 rounded-[1.1rem_1.1rem_1.1rem_0.3rem] border border-[color:var(--vein)] bg-ivory-deep/60 px-3.5 py-2.5"
            >
              <p className="type-small text-forest">
                <span className="sr-only">SVARA: </span>
                {message.text}
              </p>
              {node?.facts && (
                <ul className="mt-2 space-y-0.5 type-small text-ink-soft">
                  {node.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              )}
              {node?.links?.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 type-small font-medium text-botanical underline-offset-4 hover:underline"
                  >
                    {link.label} <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => onNavigate()}
                    className="mt-2 inline-flex items-center gap-1.5 type-small font-medium text-botanical underline-offset-4 hover:underline"
                  >
                    {link.label} <span aria-hidden="true">→</span>
                  </Link>
                ),
              )}
            </div>
          );
        })}
      </div>

      {replies.length > 0 && (
        <ul aria-label="Quick replies" className="mt-3 flex flex-wrap gap-2">
          {replies.map((id) => {
            const reply = QUICK_REPLIES[id];
            return (
              <li key={id}>
                {reply.action.kind === "go" ? (
                  <Link
                    href={reply.action.href}
                    onClick={() => onNavigate(id)}
                    aria-current={pathname === reply.action.href ? "page" : undefined}
                    className={QUICK_REPLY_CLASS}
                  >
                    {reply.label} <span aria-hidden="true">&nbsp;→</span>
                  </Link>
                ) : (
                  <button type="button" onClick={() => onChoose(id)} className={QUICK_REPLY_CLASS}>
                    {reply.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={send} className="mt-4 flex items-end gap-2">
        <label htmlFor={inputId} className="sr-only">
          Ask SVARA a question
        </label>
        <textarea
          id={inputId}
          rows={1}
          value={draft}
          maxLength={MAX_INPUT_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby={hintId}
          placeholder="Ask SVARA…"
          className="mascot-chat-input min-h-11 flex-1 resize-none rounded-2xl border border-[color:var(--vein)] bg-ivory px-3.5 py-2.5 type-small text-forest placeholder:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-botanical"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="min-h-11 shrink-0 rounded-full bg-forest px-4 type-small font-medium text-ivory transition-opacity disabled:opacity-45"
        >
          Send
        </button>
      </form>
      <p id={hintId} className="mt-2 type-small text-ink-soft">
        I&rsquo;m a scripted guide, not an AI assistant: I understand a few set questions.
      </p>
    </div>
  );
}
