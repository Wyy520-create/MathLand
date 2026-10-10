// 趣题岛：鸡兔同笼（假设法/抬腿法）。第 1 关动画演示，之后做变式练习
import { el, numPad } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)
const pick = arr => arr[(Math.random() * arr.length) | 0]

// ---------- 演示模式：抬腿法分步动画 ----------
function playDemo(ctx) {
  const heads = ri(6, 9)
  const rabbits = ri(2, heads - 1)
  const chickens = heads - rabbits
  const legs = chickens * 2 + rabbits * 4

  ctx.setPrompt(`笼子里有鸡和兔共 <em>${heads}</em> 只，<em>${legs}</em> 条腿。鸡和兔各有几只？`)
  const area = el('div', 'play-area')
  ctx.stage.appendChild(area)

  // 动物舞台
  const stageBox = el('div', '')
  stageBox.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:560px;min-height:110px;background:#f2f7ff;border-radius:16px;padding:16px'
  area.appendChild(stageBox)

  const animals = []
  for (let i = 0; i < chickens; i++) animals.push({ e: '🐔', legs: 2, up: 0 })
  for (let i = 0; i < rabbits; i++) animals.push({ e: '🐰', legs: 4, up: 0 })
  animals.sort(() => Math.random() - .5)

  const counter = el('div', 'prompt')
  counter.style.fontSize = '20px'
  area.appendChild(counter)

  const explain = el('div', 'feedback info')
  explain.style.minHeight = '64px'
  area.appendChild(explain)

  const btn = el('button', 'btn orange big', '第 1 步：全体抬 1 条腿 🦵')
  area.appendChild(btn)

  let step = 0
  function paintAnimals() {
    stageBox.innerHTML = ''
    for (const a of animals) {
      const d = el('div', '', '')
      const lift = a.up === 1 ? 'rotate(-14deg)' : a.up >= 2 ? 'rotate(-30deg) translateY(-6px)' : ''
      d.innerHTML = `<div style="font-size:40px;transform:${lift};transition:transform .3s">${a.e}</div>
        <div style="text-align:center;font-weight:800;color:#6b7a99">${a.legs - a.up} 腿${a.up ? '（抬着 ' + a.up + ' 条）' : ''}</div>`
      stageBox.appendChild(d)
    }
    const down = animals.reduce((s, a) => s + a.legs - a.up, 0)
    counter.innerHTML = `地上还剩 <em>${down}</em> 条腿（原来 ${legs} 条）`
  }
  paintAnimals()
  explain.innerHTML = '有 🐔 和 🐰 两种动物。它们听口令一起抬腿，秘密马上出现！'

  btn.onclick = () => {
    sfx.flip()
    step++
    if (step === 1) {
      animals.forEach(a => (a.up = 1))
      paintAnimals()
      explain.innerHTML = `<b>${heads} 只动物各抬 1 条腿</b>：腿少了 ${heads} 条，还剩 ${legs - heads} 条。鸡还剩 1 条腿站着，兔还剩 3 条。`
      btn.textContent = '第 2 步：再抬 1 条腿 🦵🦵'
    } else if (step === 2) {
      animals.forEach(a => (a.up = Math.min(2, a.legs)))
      paintAnimals()
      explain.innerHTML = `<b>再抬 1 条腿</b>：又少 ${heads} 条，还剩 <b>${legs - heads * 2} 条</b>。这时鸡已经坐地上了（0 条腿站着），还站着的腿<b>全是兔子的</b>，每只兔站 2 条。`
      btn.textContent = '第 3 步：算算兔有几只 🐰'
    } else if (step === 3) {
      paintAnimals()
      explain.innerHTML = `还站着的 ${legs - heads * 2} 条腿 ÷ 每只兔 2 条 = <b>${rabbits} 只兔</b>！鸡就是 ${heads} − ${rabbits} = <b>${chickens} 只</b>。`
      btn.textContent = '我学会啦！✓'
      btn.className = 'btn green big'
    } else {
      ctx.ok('这就是有名的「抬腿法」（假设法）！')
      setTimeout(() => ctx.report(true), 700)
    }
  }
}

// ---------- 练习模式 ----------
function genProblem(level) {
  if (level <= 4) {
    const heads = ri(5, 14)
    const rabbits = ri(1, heads - 1)
    const legs = (heads - rabbits) * 2 + rabbits * 4
    return {
      text: `笼子里鸡和兔共 <em>${heads}</em> 个头、<em>${legs}</em> 条腿，<span class="hl">兔有几只</span>？`,
      answer: rabbits, unit: '只兔',
      hint: `假设全是鸡：${heads} 只鸡有 ${heads * 2} 条腿，比实际少 ${legs - heads * 2} 条。每把 1 只鸡换成兔多 2 条腿，所以兔 = ${legs - heads * 2} ÷ 2。`,
    }
  }
  // 得分题：答对 +a 分，答错/不答 -b 分
  const total = ri(8, 15)
  const right = ri(3, total - 2)
  const a = pick([5, 4, 10]), b = pick([2, 3, 1])
  const score = right * a - (total - right) * b
  return {
    text: `竞赛共 <em>${total}</em> 题，答对一题得 ${a} 分，答错一题扣 ${b} 分。小明得了 <em>${score}</em> 分，他<span class="hl">答对了几题</span>？`,
    answer: right, unit: '题',
    hint: `假设全答对：应得 ${total * a} 分，比实际多 ${total * a - score} 分。每错 1 题少得 ${a + b} 分，答错 = ${total * a - score} ÷ ${a + b}，答对 = ${total} − 答错。`,
  }
}

export default {
  id: 'chicken',
  icon: '🐔',
  name: '趣题岛',
  color: '#e2703a',
  grades: '4-6 年级',
  blurb: '鸡兔同笼：1500 岁名题的抬腿法秘诀',
  levelCount: 8,
  hintFor(level) {
    if (level === 1) return '跟着动画一步一步来，看「全体抬腿」藏着什么秘密。'
    return '用<b>假设法</b>：先假设全是鸡（或全答对），算出和实际的差，每换 1 只多 2 条腿（每错 1 题少得固定分数），用差 ÷ 2 就得到另一种的数量。'
  },
  play(ctx, level) {
    if (level === 1) return playDemo(ctx)
    const p = genProblem(level)
    ctx.setPrompt(p.text)
    const area = el('div', 'play-area')
    ctx.stage.appendChild(area)

    const pad = numPad(ans => {
      if (ans == null) return
      if (ctx.report(ans === p.answer)) return
      pad.reset()
      ctx.info(p.hint)
    })
    area.appendChild(pad.holder)

    const oldHint = ctx.hint.bind(ctx)
    ctx.hint = html => { oldHint(p.hint) }
  },
}
