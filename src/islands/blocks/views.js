// 视图计算：三视图 / 露在外面的面 / 2D 网格图画布 / 干扰项生成
import { key } from './cubes.js'

// 三个方向（教材口径）：前面(-y 看)、上面(+z 看)、左面(-x 看)
// 返回 {grid, w, h}，grid[row][col]，row 0 在最上面
export function viewOf(cells, dir) {
  const set = new Set(cells.map(c => key(...c)))
  if (dir === 'top') {
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1])
    const w = Math.max(...xs) + 1, h = Math.max(...ys) + 1
    const grid = Array.from({ length: h }, () => Array(w).fill(0))
    for (const [x, y] of cells) grid[y][x] = 1
    return { grid, w, h }
  }
  // front: 每根 x 列沿 y 压缩，取 z 轮廓；left: 每根 y 列沿 x 压缩
  const a = dir === 'front' ? 0 : 1 // 水平轴
  const hs = cells.map(c => c[a]), zs = cells.map(c => c[2])
  const w = Math.max(...hs) + 1, h = Math.max(...zs) + 1
  const grid = Array.from({ length: h }, () => Array(w).fill(0))
  for (const c of cells) {
    const col = c[a], row = h - 1 - c[2]
    grid[row][col] = 1
  }
  return { grid, w, h }
}

// 三视图全等判定（搭一搭用：孩子搭的形状允许与目标不同构，只要三视图一致）
export function sameView(a, cellsB, dir) {
  const va = viewOf(a, dir)
  const vb = viewOf(cellsB, dir)
  if (va.w !== vb.w || va.h !== vb.h) return false
  return va.grid.flat().join('') === vb.grid.flat().join('')
}

// 露在外面的面数：每块 6 个方向查邻居
export function exposedFaces(cells) {
  const set = new Set(cells.map(c => key(...c)))
  let n = 0
  for (const [x, y, z] of cells) {
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      if (!set.has(key(x + dx, y + dy, z + dz))) n++
    }
  }
  return n
}

// 把 2D 视图画成小方格画布（选择题选项用）
export function drawGrid(v, { size = 34, color = '#4f8ef7', gap = 3 } = {}) {
  const cv = document.createElement('canvas')
  cv.width = v.w * size + gap * 2
  cv.height = v.h * size + gap * 2
  const g = cv.getContext('2d')
  for (let r = 0; r < v.h; r++) {
    for (let c = 0; c < v.w; c++) {
      if (!v.grid[r][c]) continue
      const x = gap + c * size, y = gap + r * size
      g.fillStyle = color
      g.beginPath()
      g.roundRect(x + 1.5, y + 1.5, size - 3, size - 3, 7)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,.35)'
      g.beginPath()
      g.roundRect(x + 4, y + 4, size - 12, size - 12, 5)
      g.fill()
    }
  }
  return cv
}

function gridKey(g) { return g.flat().join('') }

// 生成 count 个与 correct 不同形的干扰视图
export function distractors(correct, count) {
  const out = []
  const seen = new Set([gridKey(correct.grid)])
  let guard = 0
  while (out.length < count && guard++ < 200) {
    const g = correct.grid.map(r => r.slice())
    const kind = (Math.random() * 4) | 0
    if (kind === 0) g.reverse()                       // 上下翻转
    else if (kind === 1) g.forEach(r => r.reverse())  // 左右翻转
    else if (kind === 2) {                            // 平移一格
      const dr = Math.random() < .5 ? 1 : -1
      if (dr > 0) g.pop(); else g.unshift(Array(g[0].length).fill(0))
      if (g.every(r => r.every(v => !v))) continue
    } else {                                          // 随机挪动一格实心块
      const solid = []
      g.forEach((r, ri) => r.forEach((v, ci) => v && solid.push([ri, ci])))
      const [ri, ci] = solid[(Math.random() * solid.length) | 0]
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => {
        const nr = ri + dr, nc = ci + dc
        return nr >= 0 && nr < g.length && nc >= 0 && nc < g[0].length && !g[nr][nc]
      })
      if (!dirs.length) continue
      const [dr, dc] = dirs[(Math.random() * dirs.length) | 0]
      g[ri][ci] = 0
      g[ri + dr][ci + dc] = 1
    }
    if (g.every(r => r.every(v => !v))) continue
    const k = gridKey(g)
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ grid: g, w: correct.w, h: correct.h })
  }
  // 兜底：尺寸变一点
  while (out.length < count) {
    out.push({ grid: [[1]], w: 1, h: 1 })
  }
  return out
}

// 打乱数组
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
