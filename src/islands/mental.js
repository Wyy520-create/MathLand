// 口算岛：一关 10 题闪电战，难度随年级爬坡
import { el, numPad } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)

// 生成一道题的 {text, answer}
function gen(level) {
  let a, b
  switch (level) {
    case 1: // 10 以内加减
      if (Math.random() < .5) { a = ri(0, 10); b = ri(0, 10 - a); return { text: `${a} + ${b} = ?`, answer: a + b } }
      a = ri(0, 10); b = ri(0, a); return { text: `${a} − ${b} = ?`, answer: a - b }
    case 2: // 20 以内进退位
      if (Math.random() < .5) { a = ri(5, 15); b = ri(5, 20 - a); return { text: `${a} + ${b} = ?`, answer: a + b } }
      a = ri(11, 20); b = ri(2, a - 2 > 9 ? 9 : a - 2); return { text: `${a} − ${b} = ?`, answer: a - b }
    case 3: { // 表内乘除
      a = ri(2, 9); b = ri(2, 9)
      if (Math.random() < .5) return { text: `${a} × ${b} = ?`, answer: a * b }
      return { text: `${a * b} ÷ ${b} = ?`, answer: a }
    }
    case 4: // 两位数加减
      a = ri(23, 99); b = ri(11, a - 1)
      if (Math.random() < .5) return { text: `${a} + ${b} = ?`, answer: a + b }
      return { text: `${a} − ${b} = ?`, answer: a - b }
    case 5: // 多位数乘除一位
      a = ri(12, 99); b = ri(2, 9)
      if (Math.random() < .5) return { text: `${a} × ${b} = ?`, answer: a * b }
      const q = ri(11, 99); const d = ri(2, 9)
      return { text: `${q * d} ÷ ${d} = ?`, answer: q }
    case 6: { // 两步混合（先乘除后加减）
      a = ri(2, 9); b = ri(2, 9); const c = ri(2, 20)
      if (Math.random() < .5) return { text: `${a} × ${b} + ${c} = ?`, answer: a * b + c }
      return { text: `${a} × ${b} − ${c} = ?`, answer: a * b - c }
    }
    case 7: { // 分数与小数初步
      if (Math.random() < .5) {
        const d = [2, 3, 4, 5, 6, 8][ri(0, 5)]
        let n1 = ri(1, d - 1), n2 = ri(1, d - n1)
        if (Math.random() < .5) return { text: `${n1}/${d} + ${n2}/${d} = ?/${d}`, answer: n1 + n2 }
        if (n1 < n2) [n1, n2] = [n2, n1]
        return { text: `${n1}/${d} − ${n2}/${d} = ?/${d}`, answer: n1 - n2 }
      }
      a = ri(1, 9); b = ri(1, 9)
      const x = a + b / 10, y = ri(1, 9) / 10
      if (Math.random() < .5) return { text: `${x.toFixed(1)} + ${y.toFixed(1)} = ?`, answer: Math.round((x + y) * 10) / 10, dec: true }
      return { text: `${(x + y).toFixed(1)} − ${y.toFixed(1)} = ?`, answer: x, dec: true }
    }
    default: // L8 综合挑战
      return gen(ri(3, 7))
  }
}

export default {
  id: 'mental',
  icon: '⚡',
  name: '口算岛',
  color: '#f5a623',
  grades: '1-6 年级',
  blurb: '加减乘除闪电战：10 题冲关，越算越快',
  levelCount: 8,
  hintFor(level) {
    return [
      '', '加法可以接着数：8 + 3，就从 8 往后数 3 个数。减法可以倒着数。',
      '进位加法用「凑十法」：9 + 7 = 9 + 1 + 6 = 16。退位减法用「破十法」：13 − 5 = 10 − 5 + 3 = 8。',
      '乘法想口诀，除法想「几乘它等于它」：42 ÷ 7 就想 7 几四十二。',
      '两位数加减，先算十位再算个位，个位满十向十位进 1，不够减向十位借 1。',
      '乘除混合别慌：先算乘除，后算加减。竖式演算纸上画一画。',
      '分数加减看分母：分母相同，分子直接加减。小数加减，小数点对齐再算。',
      '最后一关什么都有！稳住，一道一道来。',
    ][Math.min(level, 8)]
  },
  async play(ctx, level) {
    const TOTAL = 10
    let mistakes = 0
    let done = 0

    ctx.setPrompt(`闪电口算：共 <em>${TOTAL}</em> 题，加油！`)
    const area = el('div', 'play-area')
    ctx.stage.appendChild(area)

    const qEl = el('div', 'prompt')
    qEl.style.fontSize = 'clamp(30px, 6vw, 44px)'
    const pips = el('div', 'level-pips')
    area.append(qEl, pips)

    const pad = numPad(ans => {
      if (ans == null || !cur) return
      if (cur.dec) ans = Math.round(ans * 10) / 10
      if (ans === cur.answer) {
        sfx.right(); ctx.ok()
        done++
        cur = null
        setTimeout(next, 450)
      } else {
        mistakes++
        sfx.wrong()
        ctx.no(`正确答案：${cur.text.replace('?', cur.answer)}，继续冲！`)
        done++
        cur = null
        setTimeout(next, 1400)
      }
      pad.reset()
    })
    area.appendChild(pad.holder)

    let cur = null
    function next() {
      renderPips()
      if (done >= TOTAL) {
        const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
        ctx.report(true, { stars, silent: true })
        ctx.ok(mistakes === 0 ? '10 题全对，口算小达人！' : `完成！错了 ${mistakes} 题，再练一次会更棒`)
        return
      }
      cur = gen(level)
      qEl.textContent = cur.text
      ctx.clearFb()
    }
    function renderPips() {
      pips.innerHTML = ''
      for (let i = 0; i < TOTAL; i++) {
        const p = el('i')
        if (i < done) p.className = 'done'
        pips.appendChild(p)
      }
    }
    next()
  },
}
