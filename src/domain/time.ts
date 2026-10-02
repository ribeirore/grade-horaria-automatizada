export function timeLabel(value: number) {
  const rounded = Math.round(value)
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`
}
