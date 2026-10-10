// WebAudio 合成音效：零素材，答对答错都有即时反馈
let ctx = null

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, t0, dur, type = 'sine', vol = 0.22) {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, a.currentTime + t0)
  g.gain.linearRampToValueAtTime(vol, a.currentTime + t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(a.currentTime + t0)
  o.stop(a.currentTime + t0 + dur + 0.05)
}

export const sfx = {
  click() { tone(660, 0, 0.07, 'triangle', 0.12) },
  flip() { tone(440, 0, 0.09, 'triangle', 0.15); tone(554, 0.06, 0.09, 'triangle', 0.15) },
  right() { tone(523, 0, 0.12, 'triangle'); tone(659, 0.09, 0.12, 'triangle'); tone(784, 0.18, 0.22, 'triangle') },
  wrong() { tone(220, 0, 0.18, 'sawtooth', 0.12); tone(175, 0.12, 0.26, 'sawtooth', 0.12) },
  win() { [523, 587, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.24, 'triangle', 0.2)) },
  pop() { tone(880, 0, 0.06, 'square', 0.08) },
  place() { tone(392, 0, 0.08, 'triangle', 0.18); tone(523, 0.05, 0.1, 'triangle', 0.14) },
}

// 页面任意首次交互后解锁音频（浏览器自动播放策略）
window.addEventListener('pointerdown', () => ac(), { once: true })
