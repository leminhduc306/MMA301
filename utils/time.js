export const formatSeconds = (sec = 0) => {
  const m = Math.floor(sec / 60)
  const s = `${sec % 60}`.padStart(2, "0")
  return `${m}:${s}`
}
export const formatMillis = (ms = 0) => formatSeconds(Math.floor(ms / 1000))
