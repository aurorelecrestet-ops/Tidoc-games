export const LOCAL_RECORD_KEYS = [
  'tidoc-ecg-best-score',
  'tidoc-bacteria-slash-best',
  'tidoc-surgically-insane-best',
  'tidoc-stock-and-stack-best-score',
] as const

export function clearLocalRecords(storage: Pick<Storage, 'removeItem'> = window.localStorage) {
  for (const key of LOCAL_RECORD_KEYS) storage.removeItem(key)
}
