// 购物岛：人民币元角分。合计、找零、凑钱、换算四类题轮换
import { el, askChoice, numPad } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)
const pick = arr => arr[(Math.random() * arr.length) | 0]

// 商品价格（角为单位，展示为元角）
const GOODS = [
  { e: '🍎', name: '苹果', p: 250 }, { e: '🍌', name: '香蕉', p: 300 },
  { e: '🥛', name: '牛奶', p: 450 }, { e: '🍞', name: '面包', p: 500 },
  { e: '🍬', name: '糖果', p: 100 }, { e: '🍪', name: '饼干', p: 650 },
  { e: '🧃', name: '果汁', p: 350 }, { e: '🍫', name: '巧克力', p: 700 },
  { e: '📚', name: '笔记本', p: 550 }, { e: '✏️', name: '铅笔', p: 150 },
]
const yuan = p => p % 100 === 0 ? `${p / 100} 元` : `${(p / 100).toFixed(0)} 元 ${p % 100} 角`
  .replace(' 0 角', '')

const MONEY = [
  { v: 100, label: '1 元', cls: 'note' }, { v: 500, label: '5 元', cls: 'note' },
  { v: 1000, label: '10 元', cls: 'note' }, { v: 50, label: '5 角', cls: 'coin' },
  { v: 10, label: '1 角', cls: 'coin' },
]

function shelf(items) {
  const row = el('div', 'row')
  for (const g of items) {
    const c = el('div', '', '')
    c.style.cssText = 'display:flex;flex-direction:column;align-items:center;background:#f2f7ff;border-radius:16px;padding:12px 16px;min-width:86px'
    c.innerHTML = `<span style="font-size:38px">${g.e}</span><b>${g.name}</b><span style="color:#e2703a;font-weight:800">${yuan(g.p)}</span>`
    row.appendChild(c)
  }
  return row
}

export default {
  id: 'shop',
  icon: '🛒',
  name: '购物岛',
  color: '#34c98e',
  grades: '1-3 年级',
  blurb: '小商店学人民币：算价钱、找零钱、凑钱付款',
  levelCount: 8,
  hintFor() {
    return '记住换算：<b>1 元 = 10 角</b>。算总价钱先把「元」加起来、再把「角」加起来，角满 10 就向元进 1。找零钱想「花了的 + 找回的 = 付出去的」。'
  },
  async play(ctx, level) {
    const kinds = level <= 2 ? ['add'] : level <= 4 ? ['add', 'change'] : level <= 6 ? ['change', 'unit'] : ['add', 'change', 'unit', 'cash']
    const kind = pick(kinds)

    // ---- 合计 ----
    if (kind === 'add') {
      const useJiao = level >= 5
      let pool = GOODS.filter(g => useJiao || g.p % 100 === 0)
      const a = pick(pool); let b = pick(pool)
      if (a === b) b = pool[(pool.indexOf(a) + 1) % pool.length]
      const sum = a.p + b.p
      ctx.setPrompt(`小明买了 <span class="hl">${a.name}</span> 和 <span class="hl">${b.name}</span>，一共要付多少钱？`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      area.appendChild(shelf([a, b]))
      const wrongs = new Set([yuan(sum + 100), yuan(Math.max(100, sum - 100)), yuan(sum + 10)])
      wrongs.delete(yuan(sum))
      const options = [yuan(sum), ...[...wrongs].slice(0, 3)]
      const list = options.sort(() => Math.random() - .5)
      const ok = await askChoice(area, list, list.indexOf(yuan(sum)))
      ctx.report(ok)
      return
    }

    // ---- 找零 ----
    if (kind === 'change') {
      let pool = GOODS.filter(g => level >= 5 || g.p % 100 === 0)
      const g = pick(pool)
      const pay = g.p <= 500 ? 500 : g.p <= 1000 ? 1000 : 2000
      const change = pay - g.p
      ctx.setPrompt(`买 <span class="hl">${g.name}</span> 要 ${yuan(g.p)}，小明付了 <em>${pay / 100} 元</em>，应找回多少钱？`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      area.appendChild(shelf([g]))
      const wrongs = new Set([yuan(change + 100), yuan(Math.max(10, change - 100)), yuan(change + 150)])
      wrongs.delete(yuan(change))
      const options = [yuan(change), ...[...wrongs].slice(0, 3)]
      const list = options.sort(() => Math.random() - .5)
      const ok = await askChoice(area, list, list.indexOf(yuan(change)))
      ctx.report(ok)
      return
    }

    // ---- 换算 ----
    if (kind === 'unit') {
      const big = pick([1, 2, 3, 4, 5, 6])
      const toJiao = Math.random() < .6
      const q = toJiao ? `${big} 元 = ? 角` : `${big * 10} 角 = ? 元`
      const ans = toJiao ? big * 10 : big
      ctx.setPrompt(`想一想：<em>${q}</em>`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      const wrongs = [ans + 10, Math.max(1, ans - 10), ans + 1].filter(x => x !== ans)
      const list = [ans, ...wrongs.slice(0, 3)].sort(() => Math.random() - .5)
      const ok = await askChoice(area, list.map(String), list.indexOf(ans))
      ctx.report(ok)
      return
    }

    // ---- 凑钱付款 ----
    const g = pick(GOODS.filter(x => x.p >= 200 && x.p <= 1200))
    ctx.setPrompt(`买 <span class="hl">${g.name}</span> 要 ${yuan(g.p)}，请用下面的钱<b>正好</b>凑出来，点一下选中、再点一下放回`)
    const area = el('div', 'play-area')
    ctx.stage.appendChild(area)
    area.appendChild(shelf([g]))

    let sum = 0
    const show = el('div', 'answer-display', '0 元 0 角')
    const wallet = el('div', 'row')
    const counts = el('div', '', '')
    counts.style.color = '#6b7a99'
    const render = () => {
      show.textContent = yuan(sum) || '0 元'
      const need = g.p - sum
      counts.textContent = need === 0 ? '正好！可以付款啦' : need > 0 ? `还差 ${yuan(need)}` : `多放了 ${yuan(sum - g.p)}`
    }
    for (const m of MONEY) {
      const w = el('button', 'money-item', '')
      const chip = el('span', m.cls, m.label)
      w.appendChild(chip)
      w.onclick = () => {
        if (w.classList.contains('picked')) { w.classList.remove('picked'); sum -= m.v }
        else { w.classList.add('picked'); sum += m.v; sfx.pop() }
        render()
      }
      wallet.appendChild(w)
    }
    area.append(show, wallet, counts)

    const btn = el('button', 'btn green', '付款 ✓')
    btn.onclick = () => {
      if (sum === g.p) ctx.report(true)
      else { ctx.report(false); counts.textContent = sum > g.p ? '多放了，再拿回来一些' : '还不够，再放一些钱' }
    }
    area.appendChild(btn)
    render()
  },
}
