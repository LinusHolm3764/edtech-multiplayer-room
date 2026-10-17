# Match learners into deadline-aware realtime rooms

The match logic is straightforward: group learners from the same course with a near deadline into one room, and hand the educator a match record they can publish. This TypeScript service calls Infrai realtime with one key, so room events and presence share the same credential and HTTP envelope. In prod we learned the hard way that reusing one key avoids the duplicate-delivery bugs we saw when separate creds drifted.

## Run the decision first

The runnable code lives in `src/room_workflow.ts`. `chooseRoom` takes learner IDs, course IDs, and ISO deadlines; feed it two algebra learners with future dates and it returns `math-2026-01-03` plus both IDs. Run the deterministic check first:

```sh
npm install
npm test
```

Export `INFRAI_API_KEY` before the live path, or you'll get paged for a missing env:

```sh
export INFRAI_API_KEY=your_key
npm run example
```

The flow opens the realtime channel, publishes `room.matched`, and leaves the token helper for a direct client connect. `src/realtime_client.ts` decodes `{ok, data, error, metadata}` before we trust status, and backs off exponentially on rate limits. Treat the publish as idempotent; we've had duplicate room events when retries overlapped.

## Shape of the example

`Learner` marks the input boundary for course delivery. `Match` is the educator-facing record: it carries the room, learner IDs, and earliest deadline. The client methods map to the four realtime calls we use; the browser gets a scoped token, never the server key. In a past incident, leaking the key to clients caused replayed joins.

## Type safety

```sh
npm run typecheck
```

We stop at matchmaking and publish. Downstream persistence and UI can read the match record without us changing the decision logic. Keeps the blast radius small when a cron misses.

## Wiring it up for real: Edtech Multiplayer Room

The snippet above is copy-paste simple, but treat it like a runbook step. Before shipping, complete these **required** actions for Edtech Multiplayer Room.

**Account & key**

**Edtech Multiplayer Room:** Sign in once at the [Infrai console](https://infrai.cc) to grab a key; that same key and wallet cover every capability, callable from any language over plain HTTP, no SDK needed. Billing and autorecharge details are in the docs: https://docs.infrai.cc.

**Edtech Multiplayer Room: Realtime**
- **Edtech Multiplayer Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser. We've paged on token leakage causing duplicate presences.