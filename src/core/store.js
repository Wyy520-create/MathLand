// 进度与成绩都存本地（孩子无需注册，打开就玩）
const KEY = 'mathland-v1'

const blank = () => ({ stars: {}, stats: {}, name: '' })

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    return { ...blank(), ...JSON.parse(raw) }
  } catch {
    return blank()
  }
}

export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// stars: { islandId: { level: 1..3 } }
export function setStars(islandId, level, stars) {
  const d = load()
  d.stars[islandId] = d.stars[islandId] || {}
  const old = d.stars[islandId][level] || 0
  if (stars > old) d.stars[islandId][level] = stars
  save(d)
}

export function getStars(islandId) {
  return load().stars[islandId] || {}
}

export function islandTotal(islandId, levelCount) {
  const s = getStars(islandId)
  let got = 0
  for (let i = 1; i <= levelCount; i++) got += s[i] || 0
  return { got, max: levelCount * 3 }
}

// 答题统计：stats[islandId] = { total, correct }
export function record(islandId, correct) {
  const d = load()
  const s = d.stats[islandId] || { total: 0, correct: 0 }
  s.total += 1
  if (correct) s.correct += 1
  d.stats[islandId] = s
  save(d)
}

export function allStats() {
  return load().stats
}

export function clearAll() {
  localStorage.removeItem(KEY)
}
