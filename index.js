// Calculatrice : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Calculatrice</span><span class=\"hint\">Tape au clavier ou clique · Entrée : calculer · Échap : effacer</span></div>\n      <div class=\"calcMain\">\n        <div class=\"calcBody\"><div class=\"calcTop\"><span class=\"calcBrand\">NEO-CALC 9000</span><div class=\"calcSolar\"><i></i><i></i><i></i><i></i></div></div><div class=\"calcScreen\"><span id=\"calcMode\" class=\"badge\"></span><input id=\"calcIn\" spellcheck=\"false\" autocomplete=\"off\" placeholder=\"0\"><div id=\"calcOut\"></div></div><div id=\"calcKeys\"></div></div>\n        <div class=\"sysCard px calcSide\"><div class=\"chHead\"><span class=\"label\">Historique</span><button class=\"x\" id=\"calcClearHist\" style=\"margin-left:auto;font-size:8px\">EFFACER</button></div><div id=\"calcHist\"></div></div>\n      </div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.shGrid td.num{text-align:right}
.chHead{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.calcMain{display:grid;grid-template-columns:minmax(0,440px) minmax(220px,300px);gap:34px;align-items:start;justify-content:center;padding:6px 0 18px}
/* le boîtier : bords en escalier, relief de plastique */
.calcBody{position:relative;padding:18px 20px 22px;background:#3a2c78;clip-path:polygon(0 12px,4px 12px,4px 8px,8px 8px,8px 4px,12px 4px,12px 0,calc(100% - 12px) 0,calc(100% - 12px) 4px,calc(100% - 8px) 4px,calc(100% - 8px) 8px,calc(100% - 4px) 8px,calc(100% - 4px) 12px,100% 12px,100% calc(100% - 12px),calc(100% - 4px) calc(100% - 12px),calc(100% - 4px) calc(100% - 8px),calc(100% - 8px) calc(100% - 8px),calc(100% - 8px) calc(100% - 4px),calc(100% - 12px) calc(100% - 4px),calc(100% - 12px) 100%,12px 100%,12px calc(100% - 4px),8px calc(100% - 4px),8px calc(100% - 8px),4px calc(100% - 8px),4px calc(100% - 12px),0 calc(100% - 12px));
  box-shadow:inset 0 6px 0 #6b55c0,inset 6px 0 0 #5a45a8,inset 0 -8px 0 #221852,inset -6px 0 0 #2a1f5e}
.calcTop{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.calcBrand{font:11px var(--title);letter-spacing:2px;color:#d9ccff;text-shadow:0 2px 0 #130a20}
.calcSolar{display:flex;gap:3px;padding:4px;background:#130a20}
.calcSolar i{display:block;width:22px;height:14px;background:linear-gradient(180deg,#3a1f6e,#24134a);box-shadow:inset 0 0 0 1px #5b3bb0}
/* l'écran LCD : chiffres fantômes derrière, trame de pixels par-dessus */
.calcScreen{position:relative;padding:12px 14px 10px;background:#b9e3a3;box-shadow:inset 0 0 0 4px #130a20,inset 0 6px 0 4px #7aa56a;overflow:hidden;margin-bottom:16px}
.calcScreen::before{content:'88888888888';position:absolute;right:14px;top:26px;font:30px var(--title);color:rgba(20,40,20,.09);letter-spacing:0;pointer-events:none}
.calcScreen::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 2px,transparent 2px 4px),repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 2px,transparent 2px 4px)}
#calcMode{position:absolute;top:8px;left:12px;font:10px var(--title);color:#1d3a1a;background:none;box-shadow:none;padding:0}
#calcIn{all:unset;display:block;width:100%;box-sizing:border-box;text-align:right;font:30px var(--title);color:#16301a;padding-top:20px;position:relative}
#calcIn::placeholder{color:rgba(22,48,26,.35)}
#calcOut{text-align:right;font:18px var(--title);color:#3b6a3a;min-height:26px;margin-top:6px;position:relative}
#calcKeys{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px 8px;margin-top:6px}
#calcKeys .calcKey{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;height:46px;cursor:var(--cp,pointer);font:13px var(--title);color:#fff;background:#4a3a96;overflow:hidden;white-space:nowrap;
  box-shadow:inset 0 3px 0 rgba(255,255,255,.28),inset 0 -4px 0 rgba(0,0,0,.38),0 4px 0 #130a20,4px 4px 0 #130a20,-4px 4px 0 #130a20;text-shadow:0 2px 0 rgba(0,0,0,.4)}
#calcKeys .calcKey:hover{filter:brightness(1.15)}
#calcKeys .calcKey:active{transform:translateY(4px);box-shadow:inset 0 3px 0 rgba(0,0,0,.25),0 0 0 #130a20}
#calcKeys .calcKey.wide{grid-column:span 2}
#calcKeys .calcKey.num{background:#7a66d6;font-size:19px}
#calcKeys .calcKey.op{background:#c0399f}
#calcKeys .calcKey.del{background:#c04a4a}
#calcKeys .calcKey.main{background:#e0a31e;color:#2a1a00;text-shadow:none}
/* le ticket : l'historique comme une bande de papier */
.calcSide{background:#f2ecff!important;color:#201638;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,calc(100% - 16px) calc(100% - 8px),calc(100% - 24px) 100%,calc(100% - 32px) calc(100% - 8px),calc(100% - 40px) 100%,calc(100% - 48px) calc(100% - 8px),calc(100% - 56px) 100%,calc(100% - 64px) calc(100% - 8px),calc(100% - 72px) 100%,calc(100% - 80px) calc(100% - 8px),calc(100% - 88px) 100%,calc(100% - 96px) calc(100% - 8px),calc(100% - 104px) 100%,calc(100% - 112px) calc(100% - 8px),calc(100% - 120px) 100%,calc(100% - 128px) calc(100% - 8px),calc(100% - 136px) 100%,calc(100% - 144px) calc(100% - 8px),calc(100% - 152px) 100%,calc(100% - 160px) calc(100% - 8px),calc(100% - 168px) 100%,calc(100% - 176px) calc(100% - 8px),calc(100% - 184px) 100%,calc(100% - 192px) calc(100% - 8px),calc(100% - 200px) 100%,calc(100% - 208px) calc(100% - 8px),calc(100% - 216px) 100%,calc(100% - 224px) calc(100% - 8px),calc(100% - 232px) 100%,calc(100% - 240px) calc(100% - 8px),calc(100% - 248px) 100%,calc(100% - 256px) calc(100% - 8px),calc(100% - 264px) 100%,calc(100% - 272px) calc(100% - 8px),calc(100% - 280px) 100%,calc(100% - 288px) calc(100% - 8px),calc(100% - 296px) 100%,0 calc(100% - 8px));padding-bottom:22px!important}
.calcSide .label{color:#201638!important}
.calcRow{all:unset;cursor:var(--cp,pointer);display:flex;flex-direction:column;align-items:flex-end;padding:8px 6px;border-bottom:2px dashed rgba(32,22,56,.25)}
.calcRow:hover{background:rgba(32,22,56,.08)}
.calcRow span{display:block;font:12px var(--title);color:#5b4d85;word-break:break-all;line-height:1.4}
.calcRow b{display:block;line-height:1.4}
.calcRow b{font:16px var(--title);color:#201638}
#calcHist{max-height:480px;overflow-y:auto}
#calcHist .hint{color:#5b4d85}
@media(max-width:820px){.calcMain{grid-template-columns:minmax(0,1fr)}}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "calcApp" ? view : view.querySelector('#' + id);  // les identifiants de ta vue, sans toucher à ceux du reste de NeoDex
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const __ls = (await doc('local')) || {}; let __lsT = null, __lsNew = false;
  for (const k of ["neoCalc"]) if (__ls[k] === undefined) { const v = legacy.local ? await legacy.local(k) : null; if (v != null) { __ls[k] = v; __lsNew = true; } }  // première ouverture : tu retrouves ce que tu avais
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
    const b = el('button', 'btn px calcKey' + (/^\d$|^,$/.test(label) ? ' num' : '') + (v === 'equals' ? ' main' : '') + (/^[÷×−+]$/.test(label) ? ' op' : '') + (v === 'clear' || v === 'back' ? ' del' : '') + (wide ? ' wide' : ''), label);
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
