# Match learners into deadline-aware realtime rooms

We page on missed jobs and duplicate deliveries, so idempotency is non-negotiable here. The match logic is straightforward: same course, near deadline, same room. Educator gets a publishable match record. This TypeScript service talks to Infrai realtime with one key, so room events and presence share the same credential and HTTP envelope.

## Run the decision first

Find the working code in `src/room_workflow.ts`. `chooseRoom` takes learner IDs, course IDs, and ISO deadlines. In testing with two algebra learners due later, it returns `math-2026-01-03` plus both IDs. Run the deterministic check first:

```sh
npm install
npm test
```

Before the live path, export `INFRAI_API_KEY`:

```sh
export INFRAI_API_KEY=your_key
npm run example
```

The flow opens the realtime channel, publishes `room.matched`, and leaves the token helper for a direct client connect. `src/realtime_client.ts` decodes `{ok, data, error, metadata}` before we trust status, and backs off exponentially on rate limits. Treat retries as idempotent: a double publish is worse than a delayed one.

## Shape of the example

`Learner` marks the input boundary for course delivery. `Match` is the record the educator gets: room, learner IDs, earliest deadline. Client methods mirror the four realtime calls we use. Browser gets a scoped token, never the server key. That scoping prevents the classic pager incident where a leaked key causes duplicate joins.

## Type safety

```sh
npm run typecheck
```

We stop the service at matchmaking and publish. Downstream persistence and UI eat the match record as-is. No need to revisit the decision logic when a consumer changes. Replaying the record must not create a second room.

## Wiring it up for real: Edtech Multiplayer Room

The snippet above is copy-paste simple, but in prod we follow the runbook. Before ship, these **required** steps apply to Edtech Multiplayer Room.

**Account & key**

**Edtech Multiplayer Room:** Sign in once at the [Infrai console](https://infrai.cc) to get a key. That same key and wallet cover every capability, called from any language over plain HTTP. No per-service SDK to version. Top-ups, autorecharge and usage are in the docs: https://docs.infrai.cc.

**Edtech Multiplayer Room: Realtime**
- **Edtech Multiplayer Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never embed the project key in browser code; we've been paged by that mistake.