import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGuardedStream } from "../src/useGuardedStream.js";
import type { StreamEvent } from "../src/types.js";

async function* scripted(events: StreamEvent[], delayMs = 5) {
  for (const e of events) {
    await new Promise((r) => setTimeout(r, delayMs));
    yield e;
  }
}

describe("useGuardedStream", () => {
  it("streams tokens to done", async () => {
    const { result } = renderHook(() =>
      useGuardedStream({
        start: async () => scripted([
          { type: "token", text: "Hello ", id: "1" },
          { type: "token", text: "world", id: "2" },
          { type: "done", id: "3" },
        ]),
        parse: (e) => e as StreamEvent,
        stallTimeoutMs: 5_000,
      }),
    );

    act(() => result.current.start());
    await waitFor(() => expect(result.current.state).toBe("done"));
    expect(result.current.tokens).toBe("Hello world");
  });

  it("preserves partials on server error", async () => {
    const { result } = renderHook(() =>
      useGuardedStream({
        start: async () =>
          scripted([
            { type: "token", text: "partial", id: "1" },
            { type: "error", message: "boom", failureClass: "server_error", id: "2" },
          ]),
        parse: (e) => e as StreamEvent,
      }),
    );
    act(() => result.current.start());
    await waitFor(() => expect(result.current.state).toBe("failed"));
    expect(result.current.tokens).toBe("partial");
    expect(result.current.error?.failureClass).toBe("server_error");
  });

  it("detects stalls", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGuardedStream({
        start: async () =>
          (async function* () {
            yield { type: "token", text: "hi", id: "1" } satisfies StreamEvent;
            await new Promise(() => undefined); // hang
          })(),
        parse: (e) => e as StreamEvent,
        stallTimeoutMs: 100,
      }),
    );
    act(() => result.current.start());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(result.current.state).toBe("stalled");
    expect(result.current.tokens).toBe("hi");
    vi.useRealTimers();
  });
});
