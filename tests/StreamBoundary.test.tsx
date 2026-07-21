import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreamBoundary } from "../src/StreamBoundary.js";
import type { GuardedStream } from "../src/types.js";

function stream(partial: Partial<GuardedStream>): GuardedStream {
  return {
    state: "idle",
    tokens: "",
    toolCalls: [],
    error: null,
    lastEventId: null,
    retry: () => undefined,
    abort: () => undefined,
    start: () => undefined,
    ...partial,
  };
}

describe("StreamBoundary", () => {
  it("renders children while streaming", () => {
    render(
      <StreamBoundary
        stream={stream({ state: "streaming", tokens: "hi" })}
        fallback={() => <div>fallback</div>}
      >
        <div>ok</div>
      </StreamBoundary>,
    );
    expect(screen.getByText("ok")).toBeTruthy();
  });

  it("renders fallback with partial on failure", () => {
    render(
      <StreamBoundary
        stream={stream({
          state: "failed",
          tokens: "kept",
          error: { message: "x", failureClass: "connection_drop" },
        })}
        fallback={({ partial }) => <div>partial:{partial}</div>}
      >
        <div>ok</div>
      </StreamBoundary>,
    );
    expect(screen.getByText("partial:kept")).toBeTruthy();
  });
});
