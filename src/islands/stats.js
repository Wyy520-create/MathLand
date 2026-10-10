// 统计岛：条形统计图。读图答题、移多补少找平均数、按数据搭图
import { el, askChoice, numPad } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)
const pick = arr => arr[(Math.random() * arr.length) | 0]

const TOPICS = [
  { items: [['🍎', '苹果'], ['🍐', '梨'], ['🍌', '香蕉'], ['🍇', '葡萄']], verb: '个数' },
  { items: [['⚽', '足球'], ['🏀', '篮球'], ['🏓', '乒乓球'], ['🎾', '网球']], verb: '人数' },
  { items: [['🐶', '狗'], ['🐱', '猫'], ['🐰', '兔'], ['🐦', '鸟']], verb: '只数' },
]

function drawBars(labels, values, { highlight = -1 } = {}) {
  const cv = document.createElement('canvas')
  const W = 440, H = 300
  cv.width = W; cv.height = H
  cv.style.maxWidth = '86vw'
  const g = cv.getContext('2d')
  g.fillStyle = '#fff'
  const colors = ['#6ea8ff', '#ffb26b', '#7bd88f', '#ff8fa3']
  const base = H - 50
  const bw = 60, gap = (W - 40 - bw * labels.length) / (labels.length + 1)
  // 轴
  g.strokeStyle = '#2b3a55'; g.lineWidth = 3
  g.beginPath(); g.moveTo(24, 20); g.lineTo(24, base); g.lineTo(W - 12, base); g.stroke()
  labels.forEach((lb, i) => {
    const x = 40 + gap + i * (bw + gap)
    const h = values[i] * 24
    g.fillStyle = i === highlight ? '#ffc93c' : colors[i % colors.length]
    g.beginPath()
    g.roundRect(x, base - h, bw, h, 8)
    g.fill()
    g.fillStyle = '#2b3a55'
    g.font = 'bold 20px sans-serif'
    g.textAlign = 'center'
    g.fillText(String(values[i]), x + bw / 2, base - h - 8)
    g.font = '26px sans-serif'
    g.fillText(lb, x + bw / 2, base + 32)
  })
  return cv
}

export default {
  id: 'stats',
  icon: '📊',
  name: '统计岛',
  color: '#5b8def',
  grades: '2-5 年级',
  blurb: '条形统计图：会看图、会画图、认识平均数',
  levelCount: 8,
  hintFor(level) {
    if (level <= 4) return '读条形图三步：<b>一看标题</b>（统计什么），<b>二看一格表示几</b>（这里一格就是 1），<b>三比高低</b>。柱子越高数量越多。'
    if (level <= 6) return '平均数就是「<b>移多补少</b>」：把多的补给少的，最后每份一样多，这个相等的数就是平均数。也可以（总数 ÷ 份数）。'
    return '搭图时先找最高的要搭到几格，再一根一根搭。每根柱子的高度要和表格里的数字一样高。'
  },
  async play(ctx, level) {
    const topic = pick(TOPICS)
    const kind = level <= 4 ? 'read' : level <= 6 ? 'avg' : 'build'

    // ---- 读图 ----
    if (kind === 'read') {
      const n = ri(3, 4)
      const items = topic.items.slice(0, n)
      const values = items.map(() => ri(2, 9))
      const q = Math.random()
      const maxI = values.indexOf(Math.max(...values))
      const areaEl = el('div', 'play-area')
      ctx.stage.appendChild(areaEl)
      if (q < .5) {
        ctx.setPrompt(`下面是全班最喜欢的${topic.verb}统计图，哪种<span class="hl">最多</span>？`)
        areaEl.appendChild(drawBars(items.map(i => i[0]), values, { highlight: maxI }))
        const names = items.map(i => i[1])
        const list = names.slice().sort(() => Math.random() - .5)
        const ok = await askChoice(areaEl, list, list.indexOf(names[maxI]))
        ctx.report(ok)
      } else {
        let other = ri(0, n - 1)
        while (other === maxI) other = ri(0, n - 1)
        const diff = values[maxI] - values[other]
        ctx.setPrompt(`${items[maxI][1]}比${items[other][1]}多<span class="hl">几个</span>？`)
        areaEl.appendChild(drawBars(items.map(i => i[0]), values, { highlight: maxI }))
        const pad = numPad(ans => {
          if (ans == null) return
          if (ctx.report(ans === diff)) return
          pad.reset()
          ctx.info(`找到两个柱子顶上的数字，用减法：${values[maxI]} − ${values[other]}`)
        })
        areaEl.appendChild(pad.holder)
      }
      return
    }

    // ---- 平均数 ----
    if (kind === 'avg') {
      const n = pick([3, 4])
      let base = ri(3, 7)
      const values = Array.from({ length: n }, () => Math.max(1, base + ri(-2, 3)))
      const sum = values.reduce((a, b) => a + b, 0)
      if (sum % n !== 0) values[values.length - 1] += n - (sum % n) // 保证整除
      const avg = values.reduce((a, b) => a + b, 0) / n
      ctx.setPrompt(`${n} 个筐里分别装着这些水果（看图），<span class="hl">平均每筐</span>几个？`)
      const areaEl = el('div', 'play-area')
      ctx.stage.appendChild(areaEl)
      areaEl.appendChild(drawBars(values.map((_, i) => `${i + 1} 号`), values))
      const wrongs = new Set([avg + 1, Math.max(1, avg - 1), avg + 2])
      wrongs.delete(avg)
      const list = [avg, ...[...wrongs].slice(0, 3)].sort(() => Math.random() - .5)
      const ok = await askChoice(areaEl, list.map(String), list.indexOf(String(avg)))
      ctx.report(ok)
      return
    }

    // ---- 搭图 ----
    const n = ri(3, 4)
    const items = topic.items.slice(0, n)
    const values = items.map(() => ri(2, 8))
    ctx.setPrompt(`根据表格搭出统计图：点柱子<b>＋</b>加一格，点<b>－</b>减一格`)
    const areaEl = el('div', 'play-area')
    ctx.stage.appendChild(areaEl)

    const table = el('div', 'row')
    items.forEach(([e, name], i) => {
      const t = el('span', '', `${e}${name}:${values[i]}`)
      t.style.cssText = 'background:#f2f7ff;border-radius:10px;padding:6px 12px;font-weight:800'
      table.appendChild(t)
    })
    areaEl.appendChild(table)

    const cur = values.map(() => 0)
    const barsEl = el('div', 'row')
    const barEls = []
    items.forEach(([e], i) => {
      const col = el('div', '')
      col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px'
      const num = el('b', '', '0')
      const bar = el('div', '')
      bar.style.cssText = 'width:52px;height:0;background:#6ea8ff;border-radius:8px 8px 0 0;transition:height .15s'
      const plus = el('button', 'choice-btn', '＋')
      const minus = el('button', 'choice-btn', '－')
      plus.style.cssText = minus.style.cssText = 'min-width:44px;padding:6px 10px;font-size:18px'
      plus.onclick = () => { if (cur[i] < 9) { cur[i]++; sfx.pop(); paint() } }
      minus.onclick = () => { if (cur[i] > 0) { cur[i]--; sfx.pop(); paint() } }
      col.append(num, bar, plus, minus, el('span', '', e))
      col.style.fontSize = '26px'
      barsEl.appendChild(col)
      barEls.push({ num, bar })
    })
    const barBox = el('div', '')
    barBox.style.cssText = 'display:flex;align-items:flex-end;gap:18px;background:#fff;border:3px solid #dbe8fa;border-bottom:6px solid #dbe8fa;border-radius:14px 14px 0 0;padding:14px 20px 0;height:280px'
    barBox.appendChild(barsEl)
    areaEl.appendChild(barBox)

    function paint() {
      cur.forEach((v, i) => {
        barEls[i].num.textContent = v
        barEls[i].bar.style.height = `${v * 26}px`
      })
    }
    paint()

    const btn = el('button', 'btn green', '搭好了 ✓')
    btn.onclick = () => {
      if (cur.every((v, i) => v === values[i])) ctx.report(true)
      else {
        ctx.report(false)
        const wrong = cur.findIndex((v, i) => v !== values[i])
        ctx.info(`第 ${wrong + 1} 根柱子的高度和表格不一样，再看看`)
      }
    }
    areaEl.appendChild(btn)
  },
}
