// 方向岛：位置与方向。帮小猫按方向走到小旗（BFS 保证地图有解）
import { el } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)

function genMaze(size, wallCount, start, goal) {
  for (let t = 0; t < 200; t++) {
    const walls = new Set()
    let placed = 0
    while (placed < wallCount) {
      const x = ri(0, size - 1), y = ri(0, size - 1)
      const k = `${x},${y}`
      if (k === start || k === goal || walls.has(k)) continue
      walls.add(k)
      placed++
    }
    // BFS 验证可达
    const q = [start], seen = new Set([start])
    while (q.length) {
      const [x, y] = q.shift()
      if (x === goal[0] && y === goal[1]) return walls
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, nk = `${nx},${ny}`
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || walls.has(nk) || seen.has(nk)) continue
        seen.add(nk)
        q.push([nx, ny])
      }
    }
  }
  return new Set()
}

export default {
  id: 'maze',
  icon: '🧭',
  name: '方向岛',
  color: '#2ec4b6',
  grades: '1-4 年级',
  blurb: '东南西北走迷宫：帮小猫找到小旗',
  levelCount: 8,
  hintFor(level) {
    if (level <= 4) return '方向口诀：<b>上北下南，左西右东</b>。先看小旗在小猫的哪一边：在右边就按「东」走，在上边就按「北」走。撞到大树会弹回来，不着急慢慢试。'
    return '斜向也认识一下：<b>东北</b>就是东和北之间（↗）。走斜线一步同时走一格横一格竖。'
  },
  play(ctx, level) {
    const size = level <= 2 ? 5 : level <= 4 ? 6 : 7
    const diag = level >= 5
    const start = [0, size - 1]
    const goal = [size - 1, 0]
    const walls = genMaze(size, Math.round(size * (level <= 2 ? 1.1 : level <= 4 ? 1.6 : 2.2)), start, goal)

    const route = []
    // 简单生成一句提示路线
    {
      let [x, y] = start
      while (x !== goal[0] || y !== goal[1]) {
        if (x < goal[0] && !walls.has(`${x + 1},${y}`)) { route.push('东'); x++ }
        else { route.push('北'); y-- }
      }
    }
    const routeText = route.join('、')

    ctx.setPrompt(`帮 <span class="hl">小猫</span>走到 <span class="hl">小旗</span>🚩${level >= 3 ? `（提示：先试着${routeText.slice(0, 14)}…）` : ''}`)

    const area = el('div', 'play-area')
    ctx.stage.appendChild(area)

    const board = el('div', '')
    board.style.cssText = `display:grid;grid-template-columns:repeat(${size},1fr);gap:4px;background:#dbe8fa;padding:8px;border-radius:16px;width:min(88vw,${size * 56}px)`
    const cells = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = el('div', '', '')
        c.style.cssText = 'aspect-ratio:1;display:grid;place-items:center;font-size:clamp(18px,4.5vw,30px);background:#fff;border-radius:8px;transition:transform .1s'
        board.appendChild(c)
        cells.push(c)
      }
    }
    const idx = (x, y) => y * size + x
    for (const w of walls) {
      const [x, y] = w.split(',').map(Number)
      cells[idx(x, y)].textContent = '🌳'
    }
    cells[idx(goal[0], goal[1])].textContent = '🚩'
    area.appendChild(board)

    const pad = el('div', '')
    pad.style.cssText = 'display:grid;gap:8px;justify-items:center'
    if (diag) {
      pad.style.gridTemplateAreas = '". ne n nw ." "w nebtn nbtn nwbtn e" "w ebtn sbtn sebtn e" ". se s sw ."'
      // 坐标：x 向东（右），y 向南（下）
      const map = { '↗': ['ne', 1, -1, '东北'], '↑': ['n', 0, -1, '北'], '↖': ['nw', -1, -1, '西北'], '→': ['e', 1, 0, '东'], '←': ['w', -1, 0, '西'], '↘': ['se', 1, 1, '东南'], '↓': ['s', 0, 1, '南'], '↙': ['sw', -1, 1, '西南'] }
      pad.innerHTML = ''
      for (const [sym, [ga, dx, dy, name]] of Object.entries(map)) {
        const b = el('button', 'choice-btn', sym)
        b.style.gridArea = ga
        b.style.minWidth = '54px'
        b.title = name
        b.onclick = () => move(dx, dy, name, b)
        pad.appendChild(b)
      }
    } else {
      pad.style.gridTemplateColumns = 'repeat(3,64px)'
      const grid4 = [['', null], ['↑', [0, -1, '北']], ['', null],
        ['←', [-1, 0, '西']], ['🐾', 'paw'], ['→', [1, 0, '东']],
        ['', null], ['↓', [0, 1, '南']], ['', null]]
      for (const [sym, d] of grid4) {
        if (sym === '') { pad.appendChild(el('span')); continue }
        if (d === 'paw') { const s = el('span', '', '🐾'); s.style.fontSize = '22px'; s.style.alignSelf = 'center'; s.style.justifySelf = 'center'; pad.appendChild(s); continue }
        const b = el('button', 'choice-btn', sym)
        b.onclick = () => move(d[0], d[1], d[2], b)
        pad.appendChild(b)
      }
    }
    area.appendChild(pad)

    let pos = [...start]
    let steps = 0
    const counter = el('div', '', '走了 0 步')
    counter.style.color = '#6b7a99'
    area.appendChild(counter)

    function paintCat() {
      cells.forEach(c => { if (c.textContent === '🐱' || c.textContent === '🐾') c.textContent = '' })
      for (const w of walls) {
        const [x, y] = w.split(',').map(Number)
        cells[idx(x, y)].textContent = '🌳'
      }
      cells[idx(goal[0], goal[1])].textContent = '🚩'
      cells[idx(pos[0], pos[1])].textContent = '🐱'
    }
    paintCat()

    function move(dx, dy, name, btn) {
      if (btn) { btn.style.transform = 'scale(.9)'; setTimeout(() => (btn.style.transform = ''), 90) }
      const nx = pos[0] + dx, ny = pos[1] + dy
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || walls.has(`${nx},${ny}`)) {
        sfx.wrong()
        ctx.no(`那边走不通！${name}边被挡住了`)
        return
      }
      const from = cells[idx(pos[0], pos[1])]
      from.textContent = '🐾'
      pos = [nx, ny]
      steps++
      counter.textContent = `走了 ${steps} 步`
      sfx.pop()
      if (nx === goal[0] && ny === goal[1]) {
        paintCat()
        ctx.report(true)
      } else {
        paintCat()
        ctx.clearFb()
      }
    }
  },
}
