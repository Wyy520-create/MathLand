// 积木数据模型 + 随机出题器
// 坐标系：x 向右，y 向里（深度），z 向上。所有方块必须落地：z>0 时正下方必须有方块

export const key = (x, y, z) => `${x},${y},${z}`

export function normalize(cells) {
  const minX = Math.min(...cells.map(c => c[0]))
  const minY = Math.min(...cells.map(c => c[1]))
  const minZ = Math.min(...cells.map(c => c[2]))
  return cells
    .map(([x, y, z]) => [x - minX, y - minY, z - minZ])
    .sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0])
}

// 生长法生成：从地面种子出发，每次在上表面或侧向（有支撑处）合法位置长一块
export function genStack(n, { footprint = 3 } = {}) {
  const cells = [[0, 0, 0]]
  const set = new Set([key(0, 0, 0)])
  let guard = 0
  while (cells.length < n && guard++ < 500) {
    const [x, y, z] = cells[(Math.random() * cells.length) | 0]
    const cands = []
    // 正上方
    cands.push([x, y, z + 1])
    // 四个侧向
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (z === 0) cands.push([nx, ny, 0])
      else if (set.has(key(nx, ny, z - 1))) cands.push([nx, ny, z])
    }
    const c = cands[(Math.random() * cands.length) | 0]
    if (!c) continue
    if (Math.abs(c[0]) > footprint || Math.abs(c[1]) > footprint) continue
    const k = key(...c)
    if (set.has(k)) continue
    set.add(k)
    cells.push(c)
  }
  return normalize(cells)
}

export const count = cells => cells.length
