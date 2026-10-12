// 图形岛：认识角 → 量角器 → 拼角/平角 → 轴对称/平移 → 周长/面积
// 对齐人教版：二上认角、四上角的度量、二下/五下图形运动、三上周长面积
import { el, numPad, askChoice } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const NS = 'http://www.w3.org/2000/svg'
const ri = n => (Math.random() * n) | 0
const pick = arr => arr[ri(arr.length)]
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1])

function S(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(e)
  return e
}
function svg(w, h) {
  const s = S('svg', { viewBox: `0 0 ${w} ${h}` })
  s.setAttribute('width', Math.min(w, 460))
  s.setAttribute('height', Math.min(h, 340))
  return s
}

// 画一个角：底边水平向右，另一边 deg 度（逆时针），可选量角器/标注
function drawAngleBox(holder, deg, { len = 110, protractor = false, label = null, baseAngle = 0 } = {}) {
  const W = 360, H = 250, cx = 90, cy = 200
  const s = svg(W, H)
  const rad = a => (a * Math.PI) / 180
  const pt = a => [cx + len * Math.cos(rad(a)), cy - len * Math.sin(rad(a))]
  if (protractor) {
    // 半圆量角器：0° 在右边，逆时针到 180°
    S('path', {
      d: `M ${cx + 92} ${cy} A 92 92 0 0 0 ${cx - 92} ${cy} Z`,
      fill: '#fdf3d7', stroke: '#f0c36d', 'stroke-width': 2,
    }, s)
    for (let a = 0; a <= 180; a += 5) {
      const big = a % 30 === 0, mid = a % 10 === 0
      const r1 = big ? 70 : mid ? 76 : 81
      const [x1, y1] = [cx + r1 * Math.cos(rad(a)), cy - r1 * Math.sin(rad(a))]
      const [x2, y2] = [cx + 88 * Math.cos(rad(a)), cy - 88 * Math.sin(rad(a))]
      S('line', { x1, y1, x2, y2, stroke: big ? '#c98a2b' : '#e0b877', 'stroke-width': big ? 2.4 : 1.2 }, s)
      if (big) {
        const [tx, ty] = [cx + 56 * Math.cos(rad(a)), cy - 56 * Math.sin(rad(a))]
        S('text', { x: tx, y: ty + 4, 'text-anchor': 'middle', 'font-size': 12, fill: '#a06a1c', 'font-weight': 700 }, s)
          .textContent = a
      }
    }
  }
  // 两条边
  const [x2, y2] = pt(deg)
  S('line', { x1: cx, y1: cy, x2: cx + (protractor ? 130 : len), y2: cy, stroke: '#2f3e56', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('line', { x1: cx, y1: cy, x2, y2, stroke: '#ff8a5c', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('circle', { cx, cy, r: 7, fill: '#2f3e56' }, s)
  // 角度弧
  const [ax, ay] = [cx + 34 * Math.cos(rad(deg)), cy - 34 * Math.sin(rad(deg))]
  S('path', {
    d: `M ${cx + 34} ${cy} A 34 34 0 ${deg > 180 ? 1 : 0} 0 ${ax} ${ay}`,
    fill: 'none', stroke: '#4f8ef7', 'stroke-width': 3,
  }, s)
  if (label != null) {
    const [lx, ly] = [cx + 56 * Math.cos(rad(deg / 2)), cy - 56 * Math.sin(rad(deg / 2))]
    S('text', { x: lx, y: ly, 'text-anchor': 'middle', 'font-size': 17, fill: '#4f8ef7', 'font-weight': 800 }, s)
      .textContent = label
  }
  holder.appendChild(s)
  return s
}

const angleType = deg => (deg < 85 ? '锐角' : deg <= 95 ? '直角' : '钝角')

// ---------- 1. 认识角（可拖滑块探索 + 判断） ----------
async function playMeetAngle(ctx) {
  ctx.setPrompt('先拖一拖滑块，看看<span class="hl">角</span>是怎么张开的，再接受小考验！')
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const tag = el('div', '', '')
  tag.style.cssText = 'font-size:26px;font-weight:800;min-height:38px'
  area.appendChild(tag)
  const slider = el('input')
  slider.type = 'range'; slider.min = 10; slider.max = 170; slider.value = 60; slider.style.width = '260px'
  area.appendChild(slider)
  const upd = () => {
    box.innerHTML = ''
    const deg = Number(slider.value)
    drawAngleBox(box, deg, { label: deg + '°' })
    const t = angleType(deg)
    tag.textContent = `${deg}° · ${t}${deg < 85 ? '（比直角小）' : deg <= 95 ? '（方方正正的角）' : '（比直角大）'}`
  }
  slider.oninput = upd
  upd()

  const go = el('button', 'btn green', '我认识了，考考我 ▶')
  area.appendChild(go)
  await new Promise(res => (go.onclick = res))
  area.innerHTML = ''
  const deg = pick([25, 35, 55, 70, 100, 115, 130, 145, 155])
  drawAngleBox(area, deg, {})
  ctx.setPrompt(`这个角是<span class="hl">什么角</span>？`)
  const options = shuffle(['锐角', '直角', '钝角'])
  const answer = options.indexOf(angleType(deg))
  ctx.report(await askChoice(area, options, answer))
}

// ---------- 2. 判断角（边长迷惑：角的大小与边长无关） ----------
async function playAngleJudge(ctx) {
  const deg = pick([30, 40, 55, 65, 75, 105, 120, 135, 150])
  const len = pick([[60, 130], [140, 70], [70, 120]])
  ctx.setPrompt('这个角是<span class="hl">什么角</span>？（小心：两条边一长一短也没关系，角只看张开多大！）')
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const s = svg(360, 250)
  const cx = 110, cy = 200, rad = deg * Math.PI / 180
  S('line', { x1: cx, y1: cy, x2: cx + len[0], y2: cy, stroke: '#2f3e56', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('line', { x1: cx, y1: cy, x2: cx + len[1] * Math.cos(rad), y2: cy - len[1] * Math.sin(rad), stroke: '#ff8a5c', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('circle', { cx, cy, r: 7, fill: '#2f3e56' }, s)
  const [ax, ay] = [cx + 32 * Math.cos(rad / 2), cy - 32 * Math.sin(rad / 2)]
  S('path', { d: `M ${cx + 32} ${cy} A 32 32 0 0 0 ${ax} ${ay}`, fill: 'none', stroke: '#4f8ef7', 'stroke-width': 3 }, s)
  box.appendChild(s)
  const options = shuffle(['锐角', '直角', '钝角'])
  const answer = options.indexOf(angleType(deg))
  ctx.report(await askChoice(area, options, answer))
}

// ---------- 3/4. 量角器读数 ----------
async function playProtractor(ctx, advanced) {
  const deg = advanced
    ? pick([35, 55, 65, 80, 100, 110, 125, 140, 160])
    : pick([30, 45, 60, 90, 120, 135, 150])
  ctx.setPrompt(advanced
    ? '看准刻度读一读：这个角是<span class="hl">多少度</span>？'
    : '量角器的中心对着角的顶点，0 刻度线对着一条边，读另一条边指的度数：这个角是<span class="hl">多少度</span>？')
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  drawAngleBox(box, deg, { protractor: true })
  const near = [...new Set([deg, deg + 10, deg - 10, deg + 20, deg - 20].filter(v => v > 5 && v <= 170))].slice(0, 4)
  const options = shuffle(near.length === 4 ? near : [deg, deg + 10, deg - 10, deg + 30])
  const answer = options.indexOf(deg)
  ctx.report(await askChoice(area, options.map(v => `${v}°`), answer))
}

// ---------- 5. 拼角 ----------
async function playCombine(ctx) {
  const a = pick([30, 45, 60])
  const b = pick([30, 45, 60, 90])
  if (a + b > 170) return playCombine(ctx)
  ctx.setPrompt(`两把三角尺的角拼在一起：先是一个 ${a}° 的角，又拼上一个 ${b}° 的角，拼出来的大角是<span class="hl">多少度</span>？`)
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const W = 360, H = 250, cx = 90, cy = 200, rad = d => (d * Math.PI) / 180
  const s = svg(W, H)
  const ray = (d, color) => S('line', {
    x1: cx, y1: cy, x2: cx + 150 * Math.cos(rad(d)), y2: cy - 150 * Math.sin(rad(d)),
    stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round',
  }, s)
  ray(0, '#2f3e56'); ray(a, '#7bd88f'); ray(a + b, '#ff8a5c')
  S('circle', { cx, cy, r: 7, fill: '#2f3e56' }, s)
  const arc = (from, to, r) => {
    S('path', {
      d: `M ${cx + r * Math.cos(rad(from))} ${cy - r * Math.sin(rad(from))} A ${r} ${r} 0 0 0 ${cx + r * Math.cos(rad(to))} ${cy - r * Math.sin(rad(to))}`,
      fill: 'none', stroke: '#4f8ef7', 'stroke-width': 3,
    }, s)
  }
  arc(0, a, 34); arc(a, a + b, 52)
  S('text', { x: cx + 46 * Math.cos(rad(a / 2)), y: cy - 46 * Math.sin(rad(a / 2)) + 5, 'font-size': 15, fill: '#4f8ef7', 'font-weight': 800, 'text-anchor': 'middle' }, s).textContent = a + '°'
  S('text', { x: cx + 68 * Math.cos(rad(a + b / 2)), y: cy - 68 * Math.sin(rad(a + b / 2)) + 5, 'font-size': 15, fill: '#4f8ef7', 'font-weight': 800, 'text-anchor': 'middle' }, s).textContent = b + '°'
  box.appendChild(s)
  const options = shuffle([...new Set([a + b, a + b - 10, a + b + 10, a + b - 15])])
  const answer = options.indexOf(a + b)
  ctx.report(await askChoice(area, options.map(v => `${v}°`), answer))
}

// ---------- 6. 平角补角 ----------
async function playSupplement(ctx) {
  const x = pick([35, 45, 55, 65, 70, 110, 120, 130])
  const other = 180 - x
  ctx.setPrompt(`两个角正好拼成一个<span class="hl">平角</span>（一条直直的线，180°）。绿色的角是 ${x}°，橙色的角是多少度？`)
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const W = 380, H = 220, cx = 190, cy = 160, rad = d => (d * Math.PI) / 180
  const s = svg(W, H)
  S('line', { x1: 30, y1: cy, x2: 350, y2: cy, stroke: '#2f3e56', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('line', { x1: cx, y1: cy, x2: cx + 130 * Math.cos(rad(x)), y2: cy - 130 * Math.sin(rad(x)), stroke: '#7bd88f', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('line', { x1: cx, y1: cy, x2: cx + 130 * Math.cos(rad(180 - other)), y2: cy - 130 * Math.sin(rad(180 - other)), stroke: '#ff8a5c', 'stroke-width': 5, 'stroke-linecap': 'round' }, s)
  S('circle', { cx, cy, r: 7, fill: '#2f3e56' }, s)
  S('path', { d: `M ${cx + 34} ${cy} A 34 34 0 0 0 ${cx + 34 * Math.cos(rad(x))} ${cy - 34 * Math.sin(rad(x))}`, fill: 'none', stroke: '#7bd88f', 'stroke-width': 3 }, s)
  S('path', { d: `M ${cx + 46 * Math.cos(rad(x))} ${cy - 46 * Math.sin(rad(x))} A 46 46 0 0 0 ${cx - 46} ${cy}`, fill: 'none', stroke: '#ff8a5c', 'stroke-width': 3 }, s)
  S('text', { x: cx + 58 * Math.cos(rad(x / 2)), y: cy - 58 * Math.sin(rad(x / 2)) + 5, 'font-size': 15, fill: '#3d9b57', 'font-weight': 800, 'text-anchor': 'middle' }, s).textContent = x + '°'
  S('text', { x: cx + 66 * Math.cos(rad(x + other / 2)), y: cy - 66 * Math.sin(rad(x + other / 2)) + 5, 'font-size': 15, fill: '#e0722f', 'font-weight': 800, 'text-anchor': 'middle' }, s).textContent = '?'
  box.appendChild(s)
  const options = shuffle([...new Set([other, x, 180 - other + 10, other - 10])])
  const answer = options.indexOf(other)
  ctx.report(await askChoice(area, options.map(v => `${v}°`), answer))
}

// ---------- 7. 轴对称 ----------
function drawHeart(s, cx, cy, k) {
  const pts = []
  for (let t = 0; t <= Math.PI * 2 + 0.1; t += 0.15) {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    pts.push(`${cx + x * k},${cy - y * k}`)
  }
  S('polygon', { points: pts.join(' '), fill: '#ff8fa3', stroke: '#e05a75', 'stroke-width': 2 }, s)
}
const SYM_SHAPES = [
  { name: '心形', sym: true, draw(s) { drawHeart(s, 60, 60, 2.2) } },
  { name: '圆形', sym: true, draw(s) { S('circle', { cx: 60, cy: 62, r: 42, fill: '#6ea8ff', stroke: '#3b6fd4', 'stroke-width': 2 }, s) } },
  { name: '五角星', sym: true, draw(s) {
    const pts = []
    for (let i = 0; i < 5; i++) {
      const a1 = -Math.PI / 2 + i * (Math.PI * 4 / 5)
      pts.push(`${60 + 44 * Math.cos(a1)},${62 + 44 * Math.sin(a1)}`)
    }
    S('polygon', { points: pts.join(' '), fill: '#ffd166', stroke: '#e0a92e', 'stroke-width': 2 }, s)
  } },
  { name: '等腰梯形', sym: true, draw(s) { S('polygon', { points: '30,105 90,105 74,25 46,25', fill: '#7bd88f', stroke: '#4cae64', 'stroke-width': 2 }, s) } },
  { name: '平行四边形', sym: false, draw(s) { S('polygon', { points: '22,105 78,105 98,25 42,25', fill: '#b39dff', stroke: '#8a6fe0', 'stroke-width': 2 }, s) } },
  { name: '字母Z', sym: false, draw(s) {
    S('polyline', { points: '25,30 92,30 30,100 95,100', fill: 'none', stroke: '#5fd4d0', 'stroke-width': 12, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s)
  } },
  { name: '小旗子', sym: false, draw(s) {
    S('line', { x1: 35, y1: 15, x2: 35, y2: 105, stroke: '#8a94a6', 'stroke-width': 6, 'stroke-linecap': 'round' }, s)
    S('polygon', { points: '38,20 92,36 38,55', fill: '#ff8a5c', stroke: '#e0722f', 'stroke-width': 2 }, s)
  } },
]
async function playSymmetry(ctx) {
  ctx.setPrompt('沿着一条线对折后，两边能<span class="hl">完全重合</span>的图形叫轴对称图形。下面哪个是轴对称图形？')
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const syms = shuffle(SYM_SHAPES.filter(x => x.sym)).slice(0, 1)
  const nonSyms = shuffle(SYM_SHAPES.filter(x => !x.sym)).slice(0, 3)
  const four = shuffle([...syms, ...nonSyms])
  const answer = four.findIndex(x => x.sym)
  const options = four.map(sh => {
    const box = el('div')
    const s = svg(120, 125)
    s.setAttribute('width', 110); s.setAttribute('height', 112)
    sh.draw(s)
    box.append(s, el('div', '', sh.name))
    return box
  })
  const ok = await askChoice(area, options, answer)
  if (ok) {
    ctx.report(true)
    const win = four[answer]
    const box = el('div', 'play-area')
    ctx.stage.appendChild(box)
    const s = svg(300, 260)
    win.draw(s)
    S('line', { x1: 150, y1: 8, x2: 150, y2: 252, stroke: '#4f8ef7', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, s)
    S('text', { x: 230, y: 30, 'font-size': 16, fill: '#4f8ef7', 'font-weight': 800 }, s).textContent = '← 对折线'
    box.appendChild(s)
    box.appendChild(el('p', '', '看！沿着这条虚线对折，两边正好完全重合。'))
  } else ctx.report(false)
}

// ---------- 8. 平移 ----------
async function playTranslate(ctx) {
  const dx = pick([-4, -3, -2, 2, 3, 4])
  const dy = pick([-2, -1, 0, 1, 2].filter(v => !(v === 0 && Math.abs(dx) < 3)))
  const dirName = dx > 0 ? '右' : dx < 0 ? '左' : ''
  const dirName2 = dy > 0 ? '下' : dy < 0 ? '上' : ''
  const stepsX = Math.abs(dx), stepsY = Math.abs(dy)
  const desc = (() => {
    let t = ''
    if (stepsX) t += `${dirName} ${stepsX} 格`
    if (stepsX && stepsY) t += '、'
    if (stepsY) t += `${dirName2} ${stepsY} 格`
    return t
  })()
  const alt = shuffle([
    `${dx > 0 ? '左' : '右'} ${stepsX} 格`,
    dy ? `${dy > 0 ? '上' : '下'} ${stepsY} 格` : `上 2 格`,
    stepsX > 2 ? `${dirName} ${stepsX - 1} 格` : `${dirName} ${stepsX + 1} 格`,
  ].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3)
  ctx.setPrompt('虚线是原来的位置，实线是移动后的位置。小鱼是怎么平移过去的？')
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const W = 430, H = 300, cell = 40, ox = 25, oy = 20
  const s = svg(W, H)
  for (let i = 0; i <= 9; i++) S('line', { x1: ox + i * cell, y1: oy, x2: ox + i * cell, y2: oy + 7 * cell, stroke: '#dbe7f5', 'stroke-width': 1.5 }, s)
  for (let i = 0; i <= 7; i++) S('line', { x1: ox, y1: oy + i * cell, x2: ox + 9 * cell, y2: oy + i * cell, stroke: '#dbe7f5', 'stroke-width': 1.5 }, s)
  const fish = (gx, gy, color, dash) => {
    const x = ox + gx * cell, y = oy + gy * cell
    const g = S('g', {}, s)
    S('polygon', { points: `${x},${y} ${x + cell * 0.62},${y - cell * 0.36} ${x + cell * 0.62},${y + cell * 0.36}`, fill: color, 'fill-opacity': dash ? 0.25 : 0.9, stroke: color, 'stroke-width': 2, 'stroke-dasharray': dash ? '6 4' : 'none' }, g)
    S('polygon', { points: `${x + cell * 0.62},${y - cell * 0.3} ${x + cell * 0.9},${y} ${x + cell * 0.62},${y + cell * 0.3}`, fill: color, 'fill-opacity': dash ? 0.25 : 0.85, stroke: color, 'stroke-width': 2, 'stroke-dasharray': dash ? '6 4' : 'none' }, g)
  }
  let sx = dx > 0 ? 1 : 6, sy = dy > 0 ? 1 : dy < 0 ? 5 : 3
  if (sx + dx < 0 || sx + dx > 8) sx = dx > 0 ? 1 : 5
  if (sy + dy < 0 || sy + dy > 6) sy = 3
  fish(sx, sy, '#9ab0cc', true)
  fish(sx + dx, sy + dy, '#4f8ef7', false)
  S('line', { x1: ox + sx * cell + cell * 0.45, y1: oy + sy * cell, x2: ox + (sx + dx) * cell + cell * 0.45, y2: oy + (sy + dy) * cell, stroke: '#ff8a5c', 'stroke-width': 3, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, s)
  box.appendChild(s)
  const options = shuffle([desc, ...alt])
  const answer = options.indexOf(desc)
  ctx.report(await askChoice(area, options, answer))
}

// ---------- 9. 周长 ----------
async function playPerimeter(ctx) {
  const isSq = Math.random() < 0.4
  const a = 3 + ri(6), b = isSq ? a : 3 + ri(5)
  const ans = 2 * (a + b)
  ctx.setPrompt(isSq
    ? `正方形的花坛边长是 ${a} 厘米，给它的四周围上栏杆，栏杆长<span class="hl">多少厘米</span>？（周长 = 边长 × 4）`
    : `长方形操场长 ${a} 米、宽 ${b} 米，绕操场跑一圈是<span class="hl">多少米</span>？（周长 = （长+宽）× 2）`)
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const s = svg(380, 240)
  const w = 90 + a * 22, h = 50 + b * 16, x = (380 - w) / 2, y = 60
  S('rect', { x, y, width: w, height: h, rx: 10, fill: '#e8f1fe', stroke: '#4f8ef7', 'stroke-width': 4 }, s)
  S('text', { x: x + w / 2, y: y + h + 30, 'text-anchor': 'middle', 'font-size': 18, fill: '#2f3e56', 'font-weight': 800 }, s).textContent = isSq ? `边长 ${a} 厘米` : `长 ${a} 米`
  if (!isSq) S('text', { x: x + w + 26, y: y + h / 2 + 6, 'text-anchor': 'middle', 'font-size': 18, fill: '#2f3e56', 'font-weight': 800 }, s).textContent = `${b} 米`
  box.appendChild(s)
  const pad = numPad(v => {
    if (v == null) return
    if (ctx.report(v === ans)) return
    pad.reset()
  })
  area.appendChild(pad.holder)
}

// ---------- 10. 面积 ----------
async function playArea(ctx) {
  const a = 3 + ri(5), b = 2 + ri(4)
  const ans = a * b
  ctx.setPrompt(`每个小方格是 1 平方厘米。这个长方形占了多少格？它的面积是<span class="hl">多少平方厘米</span>？`)
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)
  const box = el('div')
  area.appendChild(box)
  const cell = Math.min(42, Math.floor(340 / a)), W = a * cell + 20, H = b * cell + 60
  const s = svg(W, H)
  const x0 = 10, y0 = 15
  for (let r = 0; r < b; r++) for (let c = 0; c < a; c++)
    S('rect', { x: x0 + c * cell, y: y0 + r * cell, width: cell - 2, height: cell - 2, rx: 5, fill: '#c9e4ff', stroke: '#4f8ef7', 'stroke-width': 1.5 }, s)
  S('text', { x: x0 + (a * cell) / 2, y: y0 + b * cell + 32, 'text-anchor': 'middle', 'font-size': 17, fill: '#2f3e56', 'font-weight': 800 }, s).textContent = `长 ${a} 厘米`
  S('text', { x: x0 + a * cell + 24, y: y0 + (b * cell) / 2 + 6, 'text-anchor': 'middle', 'font-size': 17, fill: '#2f3e56', 'font-weight': 800 }, s).textContent = `${b} 厘米`
  box.appendChild(s)
  const pad = numPad(v => {
    if (v == null) return
    if (ctx.report(v === ans)) return
    pad.reset()
  })
  area.appendChild(pad.holder)
}

// ---------- 岛定义 ----------
export default {
  id: 'geometry',
  icon: '📐',
  name: '图形岛',
  color: '#e06666',
  grades: '2-5 年级',
  blurb: '角的度量与图形运动：认角 · 量角器 · 拼角 · 轴对称 · 平移 · 周长面积',
  levelCount: 10,
  hintFor(level) {
    if (level === 1) return '角有一个顶点和两条直直的边。<b>锐角</b>比直角小（尖尖的），<b>直角</b>像书本的角方方正正（90°），<b>钝角</b>比直角大（张得很开）。拖一拖滑块感受一下吧！'
    if (level === 2) return '记住：<b>角的大小只和两条边张开的大小有关</b>，和边的长短没有关系！用三角尺上的直角比一比：比它小是锐角，一样大是直角，比它大是钝角。'
    if (level <= 4) return '用量角器三步走：<b>中心对顶点</b>，<b>0 刻度线对一条边</b>，再看另一条边指着几。看内圈刻度从右边的 0 开始数，一格是 1 度，十格就是 10 度。'
    if (level === 5) return '两个角拼在一起，总度数就是<b>两个度数加起来</b>。可以用第一个角 + 第二个角算一算。'
    if (level === 6) return '平角是一条直直的线，正好是 <b>180°</b>。两个角拼成平角，就是 180° − 已知角 = 另一个角。'
    if (level === 7) return '想象把图形沿着一条线<b>对折</b>：如果两边能完全重合，就是轴对称。圆形、心形对折都能重合；平行四边形斜斜的，对折合不上哦。'
    if (level === 8) return '数格子时，盯住小鱼身上的一个点（比如眼睛）：它向右数了几格、又向上下数了几格？<b>选一个点跟着数</b>就不会乱。'
    if (level === 9) return '周长是<b>绕图形一圈的长度</b>。长方形周长 = （长 + 宽）× 2，正方形周长 = 边长 × 4。'
    return '面积是<b>面有多大</b>。每格是 1 平方厘米，数一数：每行有几格（长），有几行（宽），长 × 宽 = 面积。'
  },
  play(ctx, level) {
    if (level === 1) return playMeetAngle(ctx)
    if (level === 2) return playAngleJudge(ctx)
    if (level <= 4) return playProtractor(ctx, level === 4)
    if (level === 5) return playCombine(ctx)
    if (level === 6) return playSupplement(ctx)
    if (level === 7) return playSymmetry(ctx)
    if (level === 8) return playTranslate(ctx)
    if (level === 9) return playPerimeter(ctx)
    return playArea(ctx)
  },
}
