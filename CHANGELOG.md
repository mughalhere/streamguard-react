# Changelog

## [0.1.0] - 2026-07-23

### Added
- Initial release: `useGuardedStream` hook + `StreamBoundary`
- Failure classes: connection drop, stall, server error, tool-call failure, abort
- Partial token preservation in fallbacks
- Exponential backoff retry and optional resume-from-checkpoint
- Transport-agnostic `start` / `parse` API
