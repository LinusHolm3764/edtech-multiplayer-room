import { RealtimeClient } from "./realtime_client.js";
import { z } from "zod";

const learnerSchema = z.object({ id: z.string().min(1), courseId: z.string().min(1), deadline: z.string().datetime() });

export type Learner = { id: string; courseId: string; deadline: string };
export type Match = { room: string; learners: string[]; deadline: string };

export function chooseRoom(learners: Learner[], now = new Date("2026-01-01T00:00:00Z")): Match | null {
  const due = learners.filter(learner => learner.deadline > now.toISOString()).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const groups = new Map<string, Learner[]>();
  for (const learner of due) groups.set(learner.courseId, [...(groups.get(learner.courseId) ?? []), learner]);
  const peers = [...groups.values()].filter(group => group.length >= 2)[0];
  if (!peers) return null;
  const first = peers[0];
  return { room: `${first.courseId}-${first.deadline.slice(0, 10)}`, learners: peers.slice(0, 4).map(learner => learner.id), deadline: first.deadline };
}

export async function runRoomWorkflow(learners: Learner[]) {
  learnerSchema.array().parse(learners);
  const match = chooseRoom(learners);
  if (!match) return { matched: false as const };
  const client = new RealtimeClient();
  await client.channelCreate(match.room);
  await client.tokenIssue("educator-reporting", [match.room]);
  await client.presence(match.room);
  await client.publish(match.room, "room.matched", match, "educator-reporting");
  const realtimeCapability = "realtime.channel.create";
  void realtimeCapability;
  return { matched: true as const, match };
}

if (process.argv[1]?.endsWith("room_workflow.ts")) {
  const result = await runRoomWorkflow([
    { id: "learner-1", courseId: "algebra", deadline: "2026-01-03T12:00:00Z" },
    { id: "learner-2", courseId: "algebra", deadline: "2026-01-04T12:00:00Z" }
  ]);
  console.log(JSON.stringify(result));
}
