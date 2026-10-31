// Calculatrice scientifique, plugin NeoBase autonome (permission « storage » pour l'historique, synchronisé).
export default function (ctx) {
  const el = ctx.el;
  let deg = true, ans = 0, hist = [];

  const FN = {
    sin: x => Math.sin(deg ? x * Math.PI / 180 : x), cos: x => Math.cos(deg ? x * Math.PI / 180 : x), tan: x => Math.tan(deg ? x * Math.PI / 180 : x),
    asin: x => deg ? Math.asin(x) * 180 / Math.PI : Math.asin(x), acos: x => deg ? Math.acos(x) * 180 / Math.PI : Math.acos(x), atan: x => deg ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    ln: Math.log, log: Math.log10, sqrt: Math.sqrt, '√': Math.sqrt, abs: Math.abs, exp: Math.exp, round: Math.round, floor: Math.floor, ceil: Math.ceil,
  };
  function evalExpr(src) {
    const s = src.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/π/g, 'pi');
    let i = 0;
    const peek = () => s[i], eat = c => s[i] === c ? (i++, true) : false, fail = () => { throw new Error('expression incomplète'); };
    const fact = n => { if (n < 0 || n % 1 || n > 170) throw new Error('factorielle impossible'); let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
    function primary() {
      if (eat('(')) { const v = expr(); if (!eat(')')) fail(); return v; }
      const num = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(s.slice(i)); if (num) { i += num[0].length; return parseFloat(num[0]); }
      const id = /^[a-z√]+/i.exec(s.slice(i));
      if (id) {
        const w = id[0].toLowerCase(); i += id[0].length;
        if (w === 'pi') return Math.PI; if (w === 'e') return Math.E; if (w === 'ans') return ans;
        if (FN[w]) return FN[w](eat('(') ? (v => { if (!eat(')')) fail(); return v; })(expr()) : unary());
        throw new Error('inconnu : ' + w);
      }
      fail();
    }
    function postfix() { let v = primary(); for (;;) { if (eat('!')) v = fact(v); else if (eat('%')) v /= 100; else return v; } }
    function unary() { if (eat('-')) return -unary(); if (eat('+')) return unary(); return power(); }
    function power() { const b = postfix(); return eat('^') ? b ** unary() : b; }
    function term() {
      let v = unary();
      for (;;) {
        if (eat('*')) v *= unary(); else if (eat('/')) { const d = unary(); if (d === 0) throw new Error('division par zéro'); v /= d; }
        else if (peek() && /[\d(a-z√π]/i.test(peek())) v *= unary();
        else return v;
      }
    }
    function expr() { let v = term(); for (;;) { if (eat('+')) v += term(); else if (eat('-')) v -= term(); else return v; } }
    if (!s) return NaN;
    const v = expr(); if (i < s.length) throw new Error('caractère inattendu : ' + s[i]);
    return v;
  }
  const fmt = v => !isFinite(v) ? 'Erreur' : Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-9 && v) ? v.toExponential(8).replace('.', ',') : String(+v.toPrecision(14)).replace('.', ',');

  const S = el('style');
  S.textContent = `
    .cl{display:flex;gap:16px;padding:20px;flex-wrap:wrap;align-items:flex-start}
    .cl .pad{flex:1;min-width:280px;max-width:460px}
    .cl .screen{position:relative;padding:16px;background:color-mix(in srgb,var(--bg0,#0b031c) 70%,#000);box-shadow:inset 0 0 0 3px var(--line,#2a1d52)}
    .cl .mode{position:absolute;top:8px;left:12px;font:9px var(--title,monospace);color:var(--muted,#8f7bb8)}
    .cl input{all:unset;display:block;width:100%;text-align:right;font:26px var(--title,monospace);color:#fff;padding-top:18px}
    .cl .out{text-align:right;color:var(--lilac,#d9c6ff);min-height:20px;margin-top:6px}
    .cl .keys{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:10px}
    .cl .keys button{font:13px var(--title,monospace);color:#fff;border:0;padding:12px 0;cursor:pointer;background:color-mix(in srgb,var(--line2,#3a2a6e) 75%,transparent);box-shadow:inset 0 2px 0 rgba(255,255,255,.18),inset 0 -3px 0 rgba(0,0,0,.35)}
    .cl .keys button.num{background:color-mix(in srgb,var(--violet,#8a5cf0) 55%,#000)}
    .cl .keys button.main{background:color-mix(in srgb,var(--magenta,#e01ec8) 80%,#000)}
    .cl .keys button.wide{grid-column:span 2}
    .cl .keys button:active{transform:translateY(1px)}
    .cl .side{flex:1;min-width:220px}
    .cl .hist{max-height:420px;overflow:auto;margin-top:8px}
    .cl .row{display:flex;justify-content:space-between;gap:10px;width:100%;border:0;background:none;color:var(--shell,#eee);padding:7px 8px;cursor:pointer;text-align:left;border-bottom:1px solid var(--line,#2a1d52)}
    .cl .row:hover{background:rgba(var(--pkr,255,90,217),.12)} .cl .row b{color:var(--lilac,#d9c6ff)}
    .cl .label{font:10px var(--title,monospace);color:var(--muted,#8f7bb8)} .cl .hint{color:var(--muted,#8f7bb8);font-size:13px;padding:8px}`;

  const inp = el('input'); inp.spellcheck = false; inp.placeholder = '0';
  const out = el('div', 'out'), mode = el('div', 'mode');
  const screen = el('div', 'screen'); screen.append(mode, inp, out);
  const keysBox = el('div', 'keys');
  const histBox = el('div', 'hist');
  const clearH = el('button', 'label'); clearH.textContent = 'EFFACER'; clearH.style.cssText = 'border:0;background:none;cursor:pointer;float:right';
  const side = el('div', 'side'); const sh = el('div', 'label', 'Historique'); sh.append(clearH); side.append(sh, histBox);
  const pad = el('div', 'pad'); pad.append(screen, keysBox);
  const wrap = el('div', 'cl'); wrap.append(pad, side);
  ctx.view.append(S, wrap);

  function render() {
    let o = '';
    try { const v = evalExpr(inp.value); o = isNaN(v) ? '' : '= ' + fmt(v); } catch { o = ''; }
    out.textContent = o; mode.textContent = deg ? 'DEG' : 'RAD';
    histBox.replaceChildren(...(hist.length ? hist.map(([e, r]) => { const row = el('button', 'row'); row.append(el('span', '', e), el('b', '', '= ' + r)); row.onclick = () => { inp.value = r; render(); inp.focus(); }; return row; }) : [el('div', 'hint', 'Les calculs apparaissent ici. Clic sur un résultat pour le réutiliser.')]));
  }
  function equals() {
    const src = inp.value.trim(); if (!src) return;
    try { const v = evalExpr(src); if (!isFinite(v)) throw new Error('résultat infini'); ans = v; const r = fmt(v); hist.unshift([src, r]); hist = hist.slice(0, 50); ctx.storage.set({ hist }); inp.value = r; }
    catch (e) { out.textContent = e.message; return; }
    render();
  }
  const KEYS = [['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['ln', 'ln('], ['log', 'log('], ['√', '√('],
    ['x²', '^2'], ['xʸ', '^'], ['(', '('], [')', ')'], ['π', 'π'], ['e', 'e'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷'], ['C', 'clear'], ['⌫', 'back'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['×', '×'], ['n!', '!'], ['%', '%'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['−', '−'], ['Ans', 'Ans'], ['DEG/RAD', 'mode'],
    ['0', '0', 1], [',', ','], ['+', '+'], ['=', 'equals', 1]];
  keysBox.replaceChildren(...KEYS.map(([label, v, wide]) => {
    const b = el('button', (/^\d$|^,$/.test(label) ? 'num' : '') + (v === 'equals' ? ' main' : '') + (wide ? ' wide' : ''), label);
    b.onclick = () => {
      if (v === 'clear') inp.value = ''; else if (v === 'back') inp.value = inp.value.slice(0, -1); else if (v === 'equals') return equals(); else if (v === 'mode') deg = !deg;
      else { const a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a; inp.value = inp.value.slice(0, a) + v + inp.value.slice(z); inp.selectionStart = inp.selectionEnd = a + v.length; }
      render(); inp.focus();
    };
    return b;
  }));
  inp.oninput = render;
  inp.onkeydown = e => { if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); equals(); } if (e.key === 'Escape') { inp.value = ''; render(); } };
  clearH.onclick = () => { hist = []; ctx.storage.set({ hist }); render(); };

  ctx.onOpen(async () => { const d = await ctx.storage.get(); hist = (d && d.hist) || []; render(); inp.focus(); });
}
