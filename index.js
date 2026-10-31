// Calculatrice : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoBase sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoBase.
// Elle demande l'accès complet pour utiliser les outils d'interface de NeoBase. NeoBase ne l'ouvre que si elle est signée.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Calculatrice</span><span class=\"hint\">Tape au clavier ou clique · Entrée : calculer · Échap : effacer</span></div>\n      <div class=\"calcMain\">\n        <div class=\"sysCard px calcPad\"><div class=\"calcScreen\"><span id=\"calcMode\" class=\"badge\"></span><input id=\"calcIn\" spellcheck=\"false\" autocomplete=\"off\" placeholder=\"0\"><div id=\"calcOut\"></div></div><div id=\"calcKeys\"></div></div>\n        <div class=\"sysCard px calcSide\"><div class=\"chHead\"><span class=\"label\">Historique</span><button class=\"x\" id=\"calcClearHist\" style=\"margin-left:auto;font-size:8px\">EFFACER</button></div><div id=\"calcHist\"></div></div>\n      </div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.shGrid td.num{text-align:right}
.calcMain{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:start}
.calcScreen{position:relative;padding:14px 16px;background:var(--field);box-shadow:inset 0 0 0 3px var(--line)}
#calcMode{position:absolute;top:10px;left:12px}
#calcIn{all:unset;display:block;width:100%;text-align:right;font:26px var(--title);color:#fff;padding-top:18px}
#calcIn::placeholder{color:var(--ph)}
#calcOut{text-align:right;font:18px var(--text);color:var(--pink);min-height:26px;margin-top:6px}
#calcKeys{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:6px}
.calcKey{height:50px;font:15px var(--text);padding:0;margin:3px}
.calcKey.wide{grid-column:span 2}
.calcKey.num{--fill:var(--btnh);font-size:19px}
.calcRow{all:unset;cursor:var(--cp,pointer);display:flex;flex-direction:column;align-items:flex-end;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.06)}
.calcRow:hover{background:rgba(255,255,255,.05)}
.calcRow span{font-size:13px;color:var(--muted);word-break:break-all}
.calcRow b{font-size:17px;color:#fff}
#calcHist{max-height:520px;overflow-y:auto}
.chHead{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
`;  // le style de ce plugin (il utilise les variables du thème de NeoBase)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoBase pour s'ouvrir."; return; }
  const { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "calcApp" ? view : view.querySelector('#' + id);  // les identifiants de ta vue, sans toucher à ceux du reste de NeoBase
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const __ls = (await doc('local')) || {}; let __lsT = null, __lsNew = false;
  for (const k of ["neoCalc"]) if (__ls[k] === undefined) { const v = legacy.local ? legacy.local(k) : null; if (v != null) { __ls[k] = v; __lsNew = true; } }  // première ouverture : tu retrouves ce que tu avais
  const __lsSave = () => { clearTimeout(__lsT); __lsT = setTimeout(() => folder.write('local', __ls).catch(() => {}), 400); };
  if (__lsNew) __lsSave();
  const localStorage = new Proxy(__ls, { get: (t, k) => k === 'getItem' ? (x => t[x] ?? null) : k === 'setItem' ? ((x, v) => { t[x] = String(v); __lsSave(); }) : t[k], set: (t, k, v) => { t[k] = String(v); __lsSave(); return true; } });
  // ---- ton code d'origine ----
  let calcDeg = true, calcAns = 0, calcHist = [];
  try { calcHist = JSON.parse(localStorage.neoCalc || '[]'); } catch {}  // shortcut: history kept on this PC only, it is a convenience
  const CALC_FN = {sin: x => Math.sin(calcDeg ? x * Math.PI / 180 : x), cos: x => Math.cos(calcDeg ? x * Math.PI / 180 : x), tan: x => Math.tan(calcDeg ? x * Math.PI / 180 : x),
    asin: x => calcDeg ? Math.asin(x) * 180 / Math.PI : Math.asin(x), acos: x => calcDeg ? Math.acos(x) * 180 / Math.PI : Math.acos(x), atan: x => calcDeg ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    ln: Math.log, log: Math.log10, sqrt: Math.sqrt, '√': Math.sqrt, abs: Math.abs, exp: Math.exp, round: Math.round, floor: Math.floor, ceil: Math.ceil};
  function calcEval(src) {
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
        if (w === 'pi') return Math.PI; if (w === 'e') return Math.E; if (w === 'ans') return calcAns;
        if (CALC_FN[w]) return CALC_FN[w](eat('(') ? (v => { if (!eat(')')) fail(); return v; })(expr()) : unary());
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
        else if (peek() && /[\d(a-z√π]/i.test(peek())) v *= unary();  // implicit product: 2pi, 3(4+1)
        else return v;
      }
    }
    function expr() { let v = term(); for (;;) { if (eat('+')) v += term(); else if (eat('-')) v -= term(); else return v; } }
    if (!s) return NaN;
    const v = expr(); if (i < s.length) throw new Error('caractère inattendu : ' + s[i]);
    return v;
  }
  const calcFmt = v => !isFinite(v) ? 'Erreur' : Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-9 && v) ? v.toExponential(8).replace('.', ',') : String(+v.toPrecision(14)).replace('.', ',');
  { const keep = calcDeg; calcDeg = true;
    console.assert(calcEval('2+3*4') === 14 && calcEval('(2+3)*4') === 20 && calcEval('2^3^2') === 512 && calcEval('-2^2') === -4 && calcEval('5!') === 120 && calcEval('50%') === .5
      && Math.abs(calcEval('sin(30)') - .5) < 1e-12 && calcEval('2π') === 2 * Math.PI && calcEval('3(4+1)') === 15 && calcEval('1,5*2') === 3 && calcEval('√16') === 4, 'calcEval');
    calcDeg = keep; }
  function calcRender() {
    const src = $('calcIn').value;
    let out = '';
    try { const v = calcEval(src); out = isNaN(v) ? '' : '= ' + calcFmt(v); } catch { out = ''; }
    $('calcOut').textContent = out;
    $('calcMode').textContent = calcDeg ? 'DEG' : 'RAD';
    $('calcHist').replaceChildren(...(calcHist.length ? calcHist.map(([e, r]) => { const row = el('button', 'calcRow'); row.append(el('span', '', e), el('b', '', '= ' + r)); row.onclick = () => { $('calcIn').value = r; calcRender(); $('calcIn').focus(); }; return row; }) : [el('div', 'hint', 'Les calculs apparaissent ici. Clic sur un résultat : le réutiliser.')]));
  }
  function calcEquals() {
    const src = $('calcIn').value.trim(); if (!src) return;
    try { const v = calcEval(src); if (!isFinite(v)) throw new Error('résultat infini'); calcAns = v; const r = calcFmt(v); calcHist.unshift([src, r]); calcHist = calcHist.slice(0, 50); try { localStorage.neoCalc = JSON.stringify(calcHist); } catch {} $('calcIn').value = r; }
    catch (e) { $('calcOut').textContent = e.message; return; }
    calcRender();
  }
  // 6 keys a row; "wide" keys take two columns
  const CALC_KEYS = [['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['ln', 'ln('], ['log', 'log('], ['√', '√('],
    ['x²', '^2'], ['xʸ', '^'], ['(', '('], [')', ')'], ['π', 'π'], ['e', 'e'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷'], ['C', 'clear'], ['⌫', 'back'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['×', '×'], ['n!', '!'], ['%', '%'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['−', '−'], ['Ans', 'Ans'], ['DEG/RAD', 'mode'],
    ['0', '0', 1], [',', ','], ['+', '+'], ['=', 'equals', 1]];
  $('calcKeys').replaceChildren(...CALC_KEYS.map(([label, v, wide]) => {
    const b = el('button', 'btn px calcKey' + (/^\d$|^,$/.test(label) ? ' num' : '') + (v === 'equals' ? ' main' : '') + (wide ? ' wide' : ''), label);
    b.onclick = () => {
      const inp = $('calcIn');
      if (v === 'clear') inp.value = ''; else if (v === 'back') inp.value = inp.value.slice(0, -1); else if (v === 'equals') return calcEquals(); else if (v === 'mode') calcDeg = !calcDeg;
      else { const a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a; inp.value = inp.value.slice(0, a) + v + inp.value.slice(z); inp.selectionStart = inp.selectionEnd = a + v.length; }
      calcRender(); inp.focus();
    };
    return b;
  }));
  $('calcIn').oninput = calcRender;
  $('calcIn').onkeydown = e => { if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calcEquals(); } if (e.key === 'Escape') { $('calcIn').value = ''; calcRender(); } };
  $('calcClearHist').onclick = () => { calcHist = []; try { localStorage.neoCalc = '[]'; } catch {} calcRender(); };
  // ---- fin ----
  ctx.onOpen(() => { calcRender(); setTimeout(() => $('calcIn').focus()); });
}
