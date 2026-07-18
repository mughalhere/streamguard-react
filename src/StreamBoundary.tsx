import type { ReactNode } from "react";
import type { GuardedStream, StreamError } from "./types.js";

export type StreamBoundaryFallbackProps = {
  error: StreamError;
  partial: string;
  retry: () => void;
  abort: () => void;
};

export type StreamBoundaryProps = {
  stream: GuardedStream;
  children: ReactNode;
  fallback: (props: StreamBoundaryFallbackProps) => ReactNode;
  /** Also show fallback on stalled (default true). */
  treatStallAsFailure?: boolean;
};

export function StreamBoundary({
  stream,
  children,
  fallback,
  treatStallAsFailure = true,
}: StreamBoundaryProps) {
  const show =
    stream.state === "failed" ||
    (treatStallAsFailure && stream.state === "stalled");

  if (show && stream.error) {
    return (
      <>
        {fallback({
          error: stream.error,
          partial: stream.tokens,
          retry: stream.retry,
          abort: stream.abort,
        })}
      </>
    );
  }

  return <>{children}</>;
}
