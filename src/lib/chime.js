let ctx

/** Short, friendly two-tone chime generated with Web Audio (no audio files needed). */
export function playChime(urgent = false) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    ctx = ctx || new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const notes = urgent ? [880, 660, 880, 660] : [660, 880]
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.22
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.22)
    })
  } catch {
    // Audio is a nice-to-have; the visual reminder is the source of truth
  }
  if (navigator.vibrate) navigator.vibrate(urgent ? [200, 100, 200, 100, 200] : [150, 80, 150])
}
