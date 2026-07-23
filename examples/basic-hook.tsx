import { useGuardedStream, StreamBoundary } from "streamguard-react";

async function* fakeStream() {
  yield { type: "token" as const, text: "Hello from streamguard" };
  yield { type: "done" as const };
}

export function Example() {
  const stream = useGuardedStream({
    start: async () => fakeStream(),
    parse: (e) => e as any,
  });

  return (
    <div>
      <button onClick={stream.start}>Start</button>
      <StreamBoundary
        stream={stream}
        fallback={({ partial, error, retry }) => (
          <div>
            <pre>{partial}</pre>
            <p>{error.message}</p>
            <button onClick={retry}>Retry</button>
          </div>
        )}
      >
        <pre>{stream.tokens}</pre>
      </StreamBoundary>
    </div>
  );
}
