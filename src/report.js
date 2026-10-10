// 学习报告页：给家长看的总览——各岛正确率、星星、薄弱点建议
import { el } from './core/ui.js'
import * as store from './core/store.js'

function barChart(islands) {
  const stats = store.allStats()
  const cv = document.createElement('canvas')
  const W = 720, H = 340
  cv.width = W; cv.height = H
  cv.style.cssText = 'width:100%;max-width:680px'
  const g = cv.getContext('2d')
  const base = H - 46
  const bw = W / islands.length - 22

  // 参考线
  for (let p = 0; p <= 100; p += 25) {
    const y = base - (p / 100) * (H - 90)
    g.strokeStyle = p === 70 ? '#ffb26b' : '#e7eef8'
    g.lineWidth = p === 70 ? 2 : 1
    g.beginPath(); g.moveTo(34, y); g.lineTo(W - 8, y); g.stroke()
    g.fillStyle = '#9aa9c2'; g.font = '13px sans-serif'; g.textAlign = 'right'
    g.fillText(`${p}%`, 30, y + 4)
  }
  g.fillStyle = '#e2703a'; g.font = '12px sans-serif'; g.textAlign = 'left'
  g.fillText('虚线是 70% 达标线', 40, base - (70 / 100) * (H - 90) - 6)

  islands.forEach((isl, i) => {
    const s = stats[isl.id]
    const rate = s && s.total ? s.correct / s.total : 0
    const x = 40 + i * (bw + 20)
    const h = rate * (H - 90)
    g.fillStyle = s && s.total ? isl.color : '#dfe9f5'
    g.beginPath()
    g.roundRect(x, base - h, bw, Math.max(h, s && s.total ? 4 : 3), 6)
    g.fill()
    g.fillStyle = '#2b3a55'
    g.font = 'bold 13px sans-serif'
    g.textAlign = 'center'
    g.fillText(s && s.total ? `${Math.round(rate * 100)}%` : '未练', x + bw / 2, base - h - 8)
    g.font = '20px sans-serif'
    g.fillText(isl.icon, x + bw / 2, base + 26)
    g.font = '12px sans-serif'
    g.fillText(isl.name, x + bw / 2, base + 42)
  })
  return cv
}

export function renderReport(islands) {
  const app = document.getElementById('app')
  app.innerHTML = ''
  const wrap = el('div', 'wrap')

  const bar = el('div', 'topbar')
  const home = el('button', 'home', '🏠')
  home.onclick = () => (location.hash = '')
  bar.append(home, el('span', 'island-name', '📊 学习报告'), el('span', 'spacer'))
  wrap.appendChild(bar)

  const hero = el('div', 'hero')
  let totalStars = 0
  islands.forEach(i => {
    const s = store.getStars(i.id)
    Object.values(s).forEach(v => (totalStars += v))
  })
  hero.innerHTML = `<h1>📊 学习报告</h1><p>共获得 <b style="color:#e8a200">${totalStars}</b> ⭐ · 数据保存在本机，放心使用</p>`
  wrap.appendChild(hero)

  const stage = el('div', 'stage')
  const card = el('div', 'report-card')
  card.appendChild(barChart(islands))
  stage.appendChild(card)

  // 薄弱点建议
  const stats = store.allStats()
  const weak = islands.filter(isl => {
    const s = stats[isl.id]
    return s && s.total >= 3 && s.correct / s.total < 0.7
  })
  const tips = el('div', 'hint-box')
  tips.style.display = 'block'
  tips.style.marginTop = '14px'
  if (weak.length) {
    tips.innerHTML = `<b>💡 给家长的建议：</b>${weak.map(w => `${w.icon}${w.name}`).join('、')}的正确率还不到 70%，建议陪孩子多练这几个岛。答错时不着急报答案，先点题目旁边的「💡 提示」看讲解。`
  } else {
    tips.innerHTML = '<b>💡 给家长的建议：</b>孩子目前表现不错！可以每天玩 1-2 个关卡，保持兴趣最重要。'
  }
  stage.appendChild(tips)
  wrap.appendChild(stage)

  const row = el('div', 'row')
  row.style.margin = '0 auto 40px'
  const clear = el('button', 'btn ghost small', '🗑 清空全部进度')
  clear.onclick = () => {
    if (confirm('确定要清空所有星星和记录吗？')) {
      store.clearAll()
      renderReport(islands)
    }
  }
  const back = el('button', 'btn', '返回地图 🗺')
  back.onclick = () => (location.hash = '')
  row.append(clear, back)
  wrap.appendChild(row)

  app.appendChild(wrap)
}
