export type StreamState = "idle" | "streaming" | "stalled" | "failed" | "done";

export type FailureClass =
  | "connection_drop"
  | "stall"
  | "server_error"
  | "tool_call_failure"
  | "abort";

export type StreamEvent =
  | { type: "token"; text: string; id?: string }
  | { type: "tool_call"; name: string; args?: unknown; id?: string }
  | { type: "tool_result"; name: string; result?: unknown; id?: string }
  | { type: "error"; message: string; failureClass?: FailureClass; id?: string }
  | { type: "done"; id?: string };

export type StreamError = {
  message: string;
  failureClass: FailureClass;
};

export type ToolCall = { name: string; args?: unknown; id?: string };

export type GuardedStream = {
  state: StreamState;
  tokens: string;
  toolCalls: ToolCall[];
  error: StreamError | null;
  lastEventId: string | null;
  retry: () => void;
  abort: () => void;
  start: () => void;
};

export type UseGuardedStreamOptions = {
  start: (signal: AbortSignal, lastEventId?: string | null) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>;
  parse: (event: unknown) => StreamEvent | null;
  stallTimeoutMs?: number;
  maxRetries?: number;
  resume?: (lastEventId: string | null) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>;
  backoffMs?: (attempt: number) => number;
  debug?: boolean;
};
