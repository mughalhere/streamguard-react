import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FailureClass,
  GuardedStream,
  StreamError,
  StreamEvent,
  StreamState,
  ToolCall,
  UseGuardedStreamOptions,
} from "./types.js";

function defaultBackoff(attempt: number): number {
  return Math.min(8_000, 250 * 2 ** attempt);
}

export function useGuardedStream(options: UseGuardedStreamOptions): GuardedStream {
  const [state, setState] = useState<StreamState>("idle");
  const [tokens, setTokens] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [error, setError] = useState<StreamError | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const attemptRef = useRef(0);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokensRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearStall = () => {
    if (stallTimer.current) clearTimeout(stallTimer.current);
    stallTimer.current = null;
  };

  const armStall = useCallback(() => {
    clearStall();
    const ms = optionsRef.current.stallTimeoutMs ?? 10_000;
    stallTimer.current = setTimeout(() => {
      setState("stalled");
      setError({ message: `No tokens for ${ms}ms`, failureClass: "stall" });
      abortRef.current?.abort();
    }, ms);
  }, []);

  const fail = useCallback((message: string, failureClass: FailureClass) => {
    clearStall();
    setError({ message, failureClass });
    setState("failed");
  }, []);

  const run = useCallback(async (fromRetry = false) => {
    clearStall();
    setError(null);
    setState("streaming");
    if (!fromRetry) {
      setTokens("");
      tokensRef.current = "";
      setToolCalls([]);
      attemptRef.current = 0;
    }

    const ac = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ac;

    const opts = optionsRef.current;
    try {
      const iterable =
        fromRetry && opts.resume && lastEventId
          ? await opts.resume(lastEventId)
          : await opts.start(ac.signal, lastEventId);

      armStall();
      for await (const raw of iterable) {
        if (ac.signal.aborted) break;
        const event = opts.parse(raw);
        if (!event) continue;
        if (event.id) setLastEventId(event.id);
        armStall();

        if (event.type === "token") {
          tokensRef.current += event.text;
          setTokens(tokensRef.current);
        } else if (event.type === "tool_call") {
          setToolCalls((prev) => [...prev, { name: event.name, args: event.args, id: event.id }]);
        } else if (event.type === "error") {
          fail(event.message, event.failureClass ?? "server_error");
          return;
        } else if (event.type === "done") {
          clearStall();
          setState("done");
          return;
        } else if (event.type === "tool_result") {
          // no-op for now; surface via toolCalls if needed
        }
      }

      if (ac.signal.aborted) {
        // aborted externally or by stall
        setState((s) => (s === "stalled" || s === "failed" ? s : "failed"));
        setError((e) => e ?? { message: "aborted", failureClass: "abort" });
        return;
      }
      clearStall();
      setState("done");
    } catch (err) {
      if (ac.signal.aborted) {
        setError((e) => e ?? { message: "aborted", failureClass: "abort" });
        setState((s) => (s === "stalled" ? s : "failed"));
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      const maxRetries = opts.maxRetries ?? 2;
      if (attemptRef.current < maxRetries) {
        attemptRef.current += 1;
        const wait = (opts.backoffMs ?? defaultBackoff)(attemptRef.current);
        await new Promise((r) => setTimeout(r, wait));
        await run(true);
        return;
      }
      fail(message, "connection_drop");
    }
  }, [armStall, fail, lastEventId]);

  const start = useCallback(() => {
    void run(false);
  }, [run]);

  const retry = useCallback(() => {
    void run(true);
  }, [run]);

  const abort = useCallback(() => {
    clearStall();
    abortRef.current?.abort();
    setError({ message: "aborted by user", failureClass: "abort" });
    setState("failed");
  }, []);

  useEffect(() => () => {
    clearStall();
    abortRef.current?.abort();
  }, []);

  return { state, tokens, toolCalls, error, lastEventId, retry, abort, start };
}

export type { StreamEvent };
