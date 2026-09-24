import { supabase } from './supabase'

// Ignore an older presence response arriving after a successful acknowledgement.
const acknowledgedResults = new Set<string>()

export function isGameRoomResultAcknowledged(roomId: string) {
  return acknowledgedResults.has(roomId)
}

export async function acknowledgeGameRoomResult(roomId: string) {
  const { error } = await supabase.rpc('acknowledge_game_room_result', { p_room_id: roomId })
  if (error) throw error
  acknowledgedResults.add(roomId)
}
