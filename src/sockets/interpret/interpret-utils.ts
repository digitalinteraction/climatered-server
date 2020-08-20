import { isStruct, SessionChannelStruct } from '../../structs'
import { RedisService } from '../../services/redis'
import { ScheduleService } from '../../services/schedule'
import { AuthService } from '../../services/auth'
import { Context } from '../../server'

export async function setupInterpretation(
  socketId: string,
  sessionId: string,
  channel: string,
  ctx: Context
) {
  //
  // Ensure the correct arguments were passed
  //
  if (!isStruct({ sessionId, channel }, SessionChannelStruct)) {
    throw new Error('Bad arguments')
  }

  //
  // Check the sender is a translator
  //
  const authToken = await ctx.auth.fromSocket(socketId)
  if (!authToken || !authToken.user_roles.includes('translator')) {
    throw new Error('Bad authentication')
  }

  //
  // Get the session
  //
  const session = await ctx.schedule.findSession(sessionId)
  if (
    !session ||
    !session.enableTranslation ||
    !session.hostLanguage.includes(channel)
  ) {
    throw new Error('Cannot broadcast to that session/channel')
  }

  return { authToken, session }
}

export function getPacketKey(socketId: string) {
  return `interpreter_${socketId}`
}

export function getActiveKey(sessionId: string, channel: string) {
  return `interpreter_${sessionId}_${channel}`
}

export function getInterpretRoom(sessionId: string, channel: string) {
  return `interpret_${sessionId}_${channel}`
}

export function getChannelRoom(sessionId: string, channel: string) {
  return `channel_${sessionId}_${channel}`
}
