// 积木岛：数一数 / 看一看 / 搭一搭 / 找面数，四种子玩法按关卡递进
import { el, numPad, askChoice } from '../../core/ui.js'
import { genStack, normalize, key } from './cubes.js'
import { viewOf, sameView, exposedFaces, drawGrid, distractors, shuffle } from './views.js'
import { createScene } from './render3d.js'
import { sfx } from '../../core/sound.js'

const DIR_NAME = { front: '前面', top: '上面', left: '左面' }

function makeHolder(stage) {
  const area = el('div', 'play-area')
  const holder = el('div', 'canvas3d-holder')
  area.appendChild(holder)
  stage.appendChild(area)
  return { area, holder }
}

function sceneSize(n) { return Math.min(12, 3 + Math.ceil(n / 2)) }

// ---------- 1. 数一数 ----------
async function playCount(ctx, level) {
  const n = level === 1 ? 3 + ((Math.random() * 2) | 0) : level === 2 ? 5 + ((Math.random() * 3) | 0) : 8 + ((Math.random() * 4) | 0)
  const target = genStack(n)
  ctx.setPrompt(`这堆积木一共有 <em>${target.length > 0 ? '多少' : ''}</em> 块小正方体？（看不见的也要数哦）`)
  const { area, holder } = makeHolder(ctx.stage)
  const sc = createScene(holder)
  sc.setCells(target)

  // 辅助：剥洋葱滑块
  const maxZ = Math.max(...target.map(c => c[2]))
  const slider = el('input')
  slider.type = 'range'
  slider.min = 1
  slider.max = maxZ + 1
  slider.value = maxZ + 1
  slider.style.width = '240px'
  const peelRow = el('div', 'row', '🔍 剥开看看：')
  peelRow.appendChild(slider)
  peelRow.style.display = 'none'
  slider.oninput = () => sc.setLayerLimit(Number(slider.value))
  area.appendChild(peelRow)

  const pad = numPad(ans => {
    if (ans == null) return
    if (ctx.report(ans === target.length)) sc.dispose()
    else pad.reset()
  })
  area.appendChild(pad.holder)

  const oldHint = ctx.hint.bind(ctx)
  ctx.hint = html => {
    oldHint(html)
    peelRow.style.display = 'flex'
  }
}

// ---------- 2. 看一看 ----------
async function playView(ctx, level) {
  const n = level <= 2 ? 4 + ((Math.random() * 3) | 0) : 7 + ((Math.random() * 4) | 0)
  const target = genStack(n)
  const dir = ['front', 'top', 'left'][(Math.random() * 3) | 0]
  const correct = viewOf(target, dir)
  ctx.setPrompt(`转动小脑袋想一想：从<span class="hl">${DIR_NAME[dir]}</span>看过去，是什么形状？`)
  const { area, holder } = makeHolder(ctx.stage)
  const sc = createScene(holder)
  sc.setCells(target)

  const lookBtn = el('button', 'btn ghost small', `👀 飞到${DIR_NAME[dir]}看一眼`)
  lookBtn.onclick = () => { sfx.flip(); sc.flyTo(dir, 1400) }
  area.appendChild(lookBtn)

  const wrongs = distractors(correct, 3)
  const options = shuffle([{ v: correct, ok: true }, ...wrongs.map(v => ({ v, ok: false }))])
  const answer = options.findIndex(o => o.ok)
  const ok = await askChoice(area, options.map(o => drawGrid(o.v)), answer)
  sc.dispose()
  ctx.report(ok)
}

// ---------- 3. 搭一搭 ----------
async function playBuild(ctx, level) {
  const n = level <= 2 ? 4 + ((Math.random() * 2) | 0) : 6 + ((Math.random() * 3) | 0)
  const target = genStack(n)
  const front = viewOf(target, 'front')
  const top = viewOf(target, 'top')
  const left = viewOf(target, 'left')

  ctx.setPrompt(`按<span class="hl">前面</span>和<span class="hl">上面</span>的样子搭积木，搭好后点「我搭好了」（一共要用 ${target.length} 块）`)
  const { area, holder } = makeHolder(ctx.stage)

  // 题目视图卡
  const cards = el('div', 'row')
  const cardF = el('div', '', ''), cardT = el('div', '', '')
  cardF.append('前面', drawGrid(front)); cardT.append('上面', drawGrid(top))
  cardF.style.textAlign = cardT.style.textAlign = 'center'
  cardF.style.fontWeight = cardT.style.fontWeight = '800'
  cards.append(cardF, cardT)
  area.appendChild(cards)

  const mine = []
  const sc = createScene(holder, {
    onTapCell(cell) {
      const k = key(...cell)
      if (mine.some(c => key(...c) === k)) return
      mine.push(cell)
      sc.setCells(mine)
      sfx.place()
    },
  })

  const row = el('div', 'row')
  const undo = el('button', 'btn ghost small', '↩ 撤掉一块')
  undo.onclick = () => { mine.pop(); sc.setCells(mine); sfx.pop() }
  const checkBtn = el('button', 'btn green', '我搭好了 ✓')
  checkBtn.onclick = () => {
    if (!mine.length) { ctx.no('先搭几块积木吧'); return }
    const okFront = sameView(mine, target, 'front')
    const okTop = sameView(mine, target, 'top')
    const okLeft = sameView(mine, target, 'left')
    if (okFront && okTop && okLeft) {
      ctx.report(true)
      sc.dispose()
    } else {
      const hintDir = !okFront ? '前面' : !okTop ? '上面' : '左面'
      ctx.report(false)
      ctx.info(`再看看<span class="hl">${hintDir}</span>的形状对不对（拖动积木堆可以转着看）`)
    }
  }
  row.append(undo, checkBtn)
  area.appendChild(row)
}

// ---------- 4. 找面数 ----------
async function playFaces(ctx, level) {
  const n = level <= 2 ? 3 + ((Math.random() * 3) | 0) : 6 + ((Math.random() * 4) | 0)
  const target = genStack(n)
  const answer = exposedFaces(target)
  ctx.setPrompt(`这堆积木一共有 <em>多少</em> 个面露在外面？（贴在一起的面不算哦）`)
  const { area, holder } = makeHolder(ctx.stage)
  const sc = createScene(holder)
  sc.setCells(target)

  const paintBtn = el('button', 'btn ghost small', '🎨 给露出的面上色')
  paintBtn.style.display = 'none'
  paintBtn.onclick = () => { sfx.flip(); sc.setMode('expose') }
  area.appendChild(paintBtn)

  const pad = numPad(ans => {
    if (ans == null) return
    if (ctx.report(ans === answer)) sc.dispose()
    else pad.reset()
  })
  area.appendChild(pad.holder)

  const oldHint = ctx.hint.bind(ctx)
  ctx.hint = html => {
    oldHint(html)
    paintBtn.style.display = ''
  }
}

// ---------- 岛定义 ----------
export default {
  id: 'blocks',
  icon: '🧊',
  name: '积木岛',
  color: '#4f8ef7',
  grades: '2-5 年级',
  blurb: '3D 观察物体：数方块 · 三视图 · 搭积木 · 找面数',
  levelCount: 8,
  hintFor(level) {
    if (level <= 2) return '数方块有小窍门：<b>分层数</b>！先数最下面一层有几块，再数第二层、第三层……最后加起来。被挡住的可不是空气，下面有方块，上面才可能搭得住。用「剥开看看」滑块一层层检查。'
    if (level <= 4) return '看三视图先找准方向：<b>前面</b>是从你正前方看过去的轮廓，<b>上面</b>是俯视图（ footprint ），<b>左面</b>是从积木左边看。可以用「飞到…看一眼」飞到那个方向确认，再飞回来选答案。'
    if (level <= 6) return '搭积木先看<b>上面</b>：它告诉你哪些位置要放方块、各占几格；再看<b>前面</b>：它告诉你每一列要搭多高。一层一层往上搭就不会错。'
    return '数露在外面的面：<b>一块单独的方块有 6 个面</b>；每和一个邻居贴在一起，就少 1 个面。用「给露出的面上色」，数一数红色面有几个吧。'
  },
  play(ctx, level) {
    if (level <= 2) return playCount(ctx, level)
    if (level <= 4) return playView(ctx, level - 2)
    if (level <= 6) return playBuild(ctx, level - 4)
    return playFaces(ctx, level - 6)
  },
}
