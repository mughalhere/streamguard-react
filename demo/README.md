# streamguard-react demo

Minimal chaos demo notes. Wire `useGuardedStream` to a mock async generator and add sliders that inject:

- connection drop (throw mid-iteration)
- stall (await forever after N tokens)
- server error event
- tool_call failure event

See `examples/basic-hook.tsx` for the UI pattern.
