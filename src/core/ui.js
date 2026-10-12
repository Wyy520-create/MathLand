// 关卡外壳 + 公共组件：所有岛共用一套「出题→作答→反馈→星级」流程
import { sfx } from './sound.js'
import { confetti } from './fx.js'
import * as store from './store.js'

export function el(tag, cls, text) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text != null) e.textContent = text
  return e
}

const PRAISE = ['太棒了！', '真厉害！', '完全正确！', '你真聪明！', '答对啦！', '好眼力！']
const pick = arr => arr[(Math.random() * arr.length) | 0]

// ---------- 数字键盘 ----------
export function numPad(onEnter, { allowEmpty = false } = {}) {
  const holder = el('div', 'play-area')
  const disp = el('div', 'answer-display', '?')
  const pad = el('div', 'numpad')
  let buf = ''
  const render = () => (disp.textContent = buf || '?')
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清空', '0', '✓']) {
    const b = el('button', k === '✓' ? 'enter' : k === '清空' ? 'clear' : '', k)
    b.addEventListener('click', () => {
      sfx.pop()
      if (k === '清空') buf = ''
      else if (k === '✓') {
        if (!buf && !allowEmpty) return
        onEnter(buf === '' ? null : Number(buf))
        return
      } else if (buf.length < 5) buf += k
      render()
    })
    pad.appendChild(b)
  }
  holder.append(disp, pad)
  return { holder, reset: () => { buf = ''; render() } }
}

// ---------- 通用选择题 ----------
// options: [string | HTMLElement]，answer: 索引；返回 Promise<boolean>
export function askChoice(stage, options, answer) {
  return new Promise(resolve => {
    const box = el('div', 'choices')
    stage.appendChild(box)
    options.forEach((opt, i) => {
      const b = el('button', 'choice-btn')
      if (opt instanceof HTMLElement) b.appendChild(opt)
      else b.textContent = opt
      b.addEventListener('click', () => {
        box.querySelectorAll('button').forEach(x => (x.disabled = true))
        if (i === answer) {
          b.classList.add('right')
          sfx.right()
          resolve(true)
        } else {
          b.classList.add('wrong')
          sfx.wrong()
          setTimeout(() => resolve(false), 650)
        }
      })
      box.appendChild(b)
    })
  })
}

// ---------- 星级结算弹窗 ----------
function passDialog(def, level, stars, onNext) {
  const ov = el('div', 'overlay')
  const dlg = el('div', 'dialog')
  const title = stars === 3 ? '完美通关！' : stars === 2 ? '过关啦！' : '完成啦！'
  const starsHtml = [1, 2, 3].map(i => `<span class="${i <= stars ? '' : 'dim'}">⭐</span>`).join('')
  dlg.innerHTML = `<h2>${title}</h2><div class="big-stars">${starsHtml}</div>
    <p>第 ${level} 关 ${stars === 3 ? '一次就答对，太厉害了' : '继续加油，下次争取 3 颗星'}！</p>`
  const row = el('div', 'row')
  const back = el('button', 'btn ghost small', '🗺 返回地图')
  back.onclick = () => { ov.remove(); location.hash = '' }
  row.appendChild(back)
  if (level < def.levelCount) {
    const next = el('button', 'btn green', '下一关 ▶')
    next.onclick = () => { ov.remove(); onNext() }
    row.appendChild(next)
  } else {
    const all = el('button', 'btn orange', '🏆 全部通关！')
    all.onclick = () => { ov.remove(); location.hash = '' }
    row.appendChild(all)
  }
  dlg.appendChild(row)
  ov.appendChild(dlg)
  document.body.appendChild(ov)
  if (stars >= 2) { confetti(); sfx.win() }
}

// ---------- 岛外壳 ----------
// def: { id, name, icon, color, levelCount, play(ctx, level) }
export function runIsland(def, level) {
  const app = document.getElementById('app')
  app.innerHTML = ''
  let mistakes = 0
  let hintUsed = false
  let answered = false

  // 顶栏
  const bar = el('div', 'topbar')
  const home = el('button', 'home', '🏠')
  home.onclick = () => (location.hash = '')
  const isFree = level === 0 // 自由模式（如积木岛沙盘）：不显示关卡序号与进度点
  const name = el('span', 'island-name', `${def.icon} ${def.name}${isFree ? '' : ` · 第${level}关`}`)
  const pips = el('div', 'level-pips')
  if (!isFree) for (let i = 1; i <= def.levelCount; i++) {
    const p = el('i')
    if (i < level) p.className = 'done'
    if (i === level) p.className = 'now'
    pips.appendChild(p)
  }
  const hintBtn = el('button', 'btn ghost small hint-btn', '💡 提示')
  bar.append(home, name, el('span', 'spacer'), pips, el('span', 'spacer'), hintBtn)

  const wrap = el('div', 'wrap')
  const stage = el('div', 'stage')
  const prompt = el('div', 'prompt')
  const hintBox = el('div', 'hint-box')
  const fb = el('div', 'feedback')
  stage.append(prompt, hintBox, fb)
  wrap.appendChild(stage)
  app.append(bar, wrap)

  const ctx = {
    level,
    stage,
    prompt,
    setPrompt(html) { prompt.innerHTML = html },
    ok(msg) { fb.className = 'feedback ok'; fb.textContent = msg || pick(PRAISE) },
    no(msg) {
      fb.className = 'feedback no'
      fb.textContent = msg || '再想一想～'
    },
    info(msg) { fb.className = 'feedback info'; fb.innerHTML = msg },
    clearFb() { fb.className = 'feedback'; fb.textContent = '' },
    hint(html) { hintUsed = true; hintBox.innerHTML = html; sfx.flip() },
    // 岛报告一次作答结果，框架负责星级；stars 可覆盖（口算岛这类一关多题的）
    report(correct, { silent = false, stars = null } = {}) {
      if (correct) {
        answered = true
        store.record(def.id, true)
        if (!silent) ctx.ok()
        const finalStars = stars != null
          ? stars
          : mistakes === 0 ? (hintUsed ? 2 : 3) : mistakes === 1 ? 2 : 1
        store.setStars(def.id, level, finalStars)
        setTimeout(() => passDialog(def, level, finalStars, () => runIsland(def, level + 1)), 900)
        return true
      }
      mistakes += 1
      store.record(def.id, false)
      if (!silent) ctx.no(mistakes >= 2 ? '别急，点右上角「💡 提示」看看小帮手怎么说' : '再想一想～')
      return false
    },
  }

  hintBtn.onclick = () => {
    const html = def.hintFor ? def.hintFor(level) : '仔细观察题目，一步一步来，你一定可以的！'
    ctx.hint(html)
  }

  Promise.resolve(def.play(ctx, level)).catch(err => {
    console.error(err)
    ctx.info('这一关开小差了，返回地图重新进来试试～')
  })
}
