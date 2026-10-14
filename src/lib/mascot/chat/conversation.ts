import { matchIntent } from "./intents";
import { QUICK_REPLIES, SCRIPT, type NodeId, type ReplyId, type ScriptNode } from "./script";

/**
 * The conversation state machine: a pure function from (state, action) to
 * the next state plus the answer SVARA gave, if any. Answers are immediate —
 * nothing asynchronous happens, so there is no typing indicator.
 */

export interface ChatMessage {
  id: number;
  from: "svara" | "visitor";
  text: string;
  /** The script node an answer came from (its links and replies). */
  node?: NodeId;
}

export interface ChatState {
  messages: readonly ChatMessage[];
  nextId: number;
}

export type ChatAction =
  { type: "start" } | { type: "choose"; reply: ReplyId } | { type: "say"; text: string };

export interface ChatStep {
  state: ChatState;
  /** SVARA's answer in this step, or null if it said nothing new. */
  node: ScriptNode | null;
}

export const EMPTY_CHAT: ChatState = { messages: [], nextId: 1 };
/** History kept in the panel; older lines fall away. */
export const MAX_MESSAGES = 40;
export const MAX_INPUT_LENGTH = 280;

function append(state: ChatState, ...messages: Omit<ChatMessage, "id">[]): ChatState {
  const added = messages.map((message, index) => ({ ...message, id: state.nextId + index }));
  return {
    messages: [...state.messages, ...added].slice(-MAX_MESSAGES),
    nextId: state.nextId + added.length,
  };
}

function answer(node: ScriptNode) {
  return { from: "svara" as const, text: node.text, node: node.id };
}

export function converse(state: ChatState, action: ChatAction): ChatStep {
  switch (action.type) {
    case "start": {
      // Idempotent: a second start (a re-render, Strict Mode) adds nothing.
      if (state.messages.length > 0) return { state, node: null };
      return { state: append(state, answer(SCRIPT.hello)), node: SCRIPT.hello };
    }
    case "choose": {
      const reply = QUICK_REPLIES[action.reply];
      const said = { from: "visitor" as const, text: reply.label };
      // A navigating reply is answered by the page it opens.
      if (reply.action.kind === "go") return { state: append(state, said), node: null };
      const node = SCRIPT[reply.action.node];
      return { state: append(state, said, answer(node)), node };
    }
    case "say": {
      const text = action.text.trim().slice(0, MAX_INPUT_LENGTH);
      if (!text) return { state, node: null };
      const node = SCRIPT[matchIntent(text) ?? "unknown"];
      return { state: append(state, { from: "visitor", text }, answer(node)), node };
    }
  }
}
