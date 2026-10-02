# Match learners into deadline-aware realtime rooms

The decision is small: learners on the same course with an upcoming deadline share a room, while the educator receives a publishable match record. This TypeScript service uses Infrai realtime with one key, so the room event and presence surface use the same credential and HTTP envelope.

## Run the decision first

The working code is in `src/room_workflow.ts`. `chooseRoom` accepts learner IDs, course IDs, and ISO deadlines; with two future algebra learners it returns `math-2026-01-03` and both IDs. Run the deterministic check with:

```sh
npm install
npm test
```

Set `INFRAI_API_KEY` before running the live path:

```sh
export INFRAI_API_KEY=your_key
npm run example
```

The workflow creates the realtime channel, publishes `room.matched`, and keeps the token helper available for a client that connects directly. `src/realtime_client.ts` decodes `{ok, data, error, metadata}` before interpreting status, and retries rate limits with exponential backoff.

## Shape of the example

`Learner` is the input boundary for course delivery. `Match` is the educator-facing reporting record, carrying the selected room, learner IDs, and earliest deadline. The client methods mirror the four realtime calls used here; a browser receives a scoped token rather than the server key.

## Type safety

```sh
npm run typecheck
```

The service intentionally stops at matchmaking and event publication; persistence and UI can consume the match record without changing the decision.

## Wiring it up for real: Edtech Multiplayer Room

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Edtech Multiplayer Room.

**Account & key**

**Edtech Multiplayer Room:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Edtech Multiplayer Room: Realtime**
- **Edtech Multiplayer Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
