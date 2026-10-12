// 入口：hash 路由 + 主菜单地图
import './styles.css'
import { el, runIsland } from './core/ui.js'
import * as store from './core/store.js'
import { sfx } from './core/sound.js'

import blocks from './islands/blocks/index.js'
import mental from './islands/mental.js'
import clock from './islands/clock.js'
import shop from './islands/shop.js'
import fraction from './islands/fraction.js'
import maze from './islands/maze.js'
import chicken from './islands/chicken.js'
import statsIsland from './islands/stats.js'
import geometry from './islands/geometry.js'
import { renderReport } from './report.js'

export const ISLANDS = [blocks, mental, clock, shop, fraction, maze, chicken, statsIsland, geometry]

function renderMenu() {
  const app = document.getElementById('app')
  app.innerHTML = ''
  const wrap = el('div', 'wrap')

  const hero = el('div', 'hero')
  hero.innerHTML = `<h1><span class="logo floaty">🏰</span> 数学王国 MathLand</h1>
    <p>九大主题岛，玩一玩就会了 · 适合 1-6 年级</p>`
  wrap.appendChild(hero)

  const grid = el('div', 'island-grid')
  for (const isl of ISLANDS) {
    const { got, max } = store.islandTotal(isl.id, isl.levelCount)
    const card = el('button', 'island-card')
    card.style.setProperty('--c', isl.color)
    const stars = store.getStars(isl.id)
    const cleared = Object.keys(stars).length
    card.innerHTML = `
      <div class="icon">${isl.icon}</div>
      <h3>${isl.name}</h3>
      <div class="blurb">${isl.blurb}</div>
      <span class="grades">${isl.grades}</span>
      <div class="stars-line">${got > 0 ? '⭐'.repeat(Math.min(3, Math.round((got / max) * 3) || 1)) + ` ${got}/${max}` : '还没开始'}</div>`
    card.onclick = () => { sfx.click(); location.hash = `#/island/${isl.id}` }
    grid.appendChild(card)
  }
  wrap.appendChild(grid)

  const row = el('div', 'row')
  row.style.margin = '0 auto 40px'
  const rep = el('button', 'btn green', '📊 学习报告')
  rep.onclick = () => { sfx.click(); location.hash = '#/report' }
  row.appendChild(rep)
  wrap.appendChild(row)
  app.appendChild(wrap)
}

function renderLevelSelect(isl) {
  const app = document.getElementById('app')
  app.innerHTML = ''
  const wrap = el('div', 'wrap')

  const bar = el('div', 'topbar')
  const home = el('button', 'home', '🏠')
  home.onclick = () => (location.hash = '')
  bar.append(home, el('span', 'island-name', `${isl.icon} ${isl.name}`), el('span', 'spacer'),
    el('span', '', isl.grades))
  wrap.appendChild(bar)

  const hero = el('div', 'hero')
  const { got, max } = store.islandTotal(isl.id, isl.levelCount)
  hero.innerHTML = `<h1>${isl.icon} ${isl.name}</h1><p>${isl.blurb} · 已获 ${got}/${max} ⭐</p>`
  wrap.appendChild(hero)

  const grid = el('div', 'island-grid')
  const stars = store.getStars(isl.id)
  for (let i = 1; i <= isl.levelCount; i++) {
    const unlocked = i === 1 || (stars[i - 1] || 0) > 0
    const card = el('button', 'island-card')
    card.style.setProperty('--c', unlocked ? isl.color : '#b9c6d8')
    const s = stars[i] || 0
    card.innerHTML = unlocked
      ? `<div class="icon">${isl.icon}</div><h3>第 ${i} 关</h3>
         <div class="stars-line">${'⭐'.repeat(s)}${'☆'.repeat(3 - s)}</div>`
      : `<div class="icon">🔒</div><h3>第 ${i} 关</h3><div class="blurb">先通关上一关</div>`
    if (unlocked) {
      card.onclick = () => {
        sfx.click()
        runIsland(isl, i)
      }
    } else {
      card.disabled = true
      card.style.opacity = '.6'
    }
    grid.appendChild(card)
  }
  wrap.appendChild(grid)

  // 自由模式入口（如积木岛沙盘）：不判星、自由玩
  if (isl.freePlayName) {
    const free = el('button', 'island-card')
    free.style.setProperty('--c', isl.color)
    free.style.gridColumn = '1 / -1'
    free.innerHTML = `<div class="icon">${isl.freePlayName.split(' ')[0]}</div>
      <h3>${isl.freePlayName.slice(2)}</h3>
      <div class="blurb">把试卷上没看懂的题摆出来，转着看一看、剥开数一数，一清二楚！</div>`
    free.onclick = () => { sfx.click(); runIsland(isl, 0) }
    wrap.appendChild(free)
  }

  app.appendChild(wrap)
}

function route() {
  const h = location.hash
  if (h.startsWith('#/island/')) {
    const isl = ISLANDS.find(x => x.id === h.split('/')[2])
    if (isl) renderLevelSelect(isl)
    else renderMenu()
  } else if (h.startsWith('#/report')) {
    renderReport(ISLANDS)
  } else {
    renderMenu()
  }
}

window.addEventListener('hashchange', route)
route()
