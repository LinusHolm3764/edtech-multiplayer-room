import assert from "node:assert/strict";
import { chooseRoom } from "./room_workflow.js";

const result = chooseRoom([
  { id: "a", courseId: "math", deadline: "2026-01-03T12:00:00Z" },
  { id: "b", courseId: "math", deadline: "2026-01-03T15:00:00Z" },
  { id: "c", courseId: "history", deadline: "2026-01-02T12:00:00Z" }
]);
assert.deepEqual(result, { room: "math-2026-01-03", learners: ["a", "b"], deadline: "2026-01-03T12:00:00Z" });
console.log("room decision test passed");
