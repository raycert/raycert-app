"use server";

import { joinGameSession, resolveSessionByPin } from "@/lib/data/participants";
import { setParticipantCookie } from "@/lib/game/participant-cookie";

export async function resolvePinAction(pin: string): Promise<{ sessionId: string } | { error: string }> {
  const session = await resolveSessionByPin(pin);
  if (!session) return { error: "PIN không hợp lệ." };
  if (session.status !== "WAITING") return { error: "Trò chơi đã bắt đầu, không thể tham gia." };
  return { sessionId: session.id };
}

export async function joinAction(
  sessionId: string,
  nickname: string
): Promise<{ participantId: string } | { error: string }> {
  const result = await joinGameSession(sessionId, nickname);
  if ("error" in result) return result;
  await setParticipantCookie(sessionId, result.token);
  return { participantId: result.id };
}
