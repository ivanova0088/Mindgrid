/* MindGrid library.js (mg4) — التنقل والصفحات العامة */
(() => {
  'use strict';

  // ===== Helpers =====
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const screens = {
    home: $('#scrHome'),
    pack: $('#scrPack'),
    metro: $('#scrMetro'),
    mini: $('#scrMini'),
  };

  function show(id) {
    Object.values(screens).forEach(s => s && (s.style.display = 'none'));
    screens[id].style.display = 'block';
    state.route = id;
  }

  const toastBox = $('#toast');
  let toastTimer = null;
  function toast(msg) {
    if (!toastBox) return;
    toastBox.textContent = msg;
    toastBox.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> toastBox.classList.remove('on'), 2200);
  }

  // ===== Global State =====
  const state = {
    route: 'home',
    coins: 0,
    user: { name: 'ضيف', difficulty: 'medium' },
    // pointers to engines (if loaded later)
    engines: {
      metro: null,
      mini: null,
    }
  };

  // ===== Back Button =====
  on($('#btnBack'), 'click', () => {
    // دائمًا نرجع للقائمة الرئيسية في هذه المرحلة
    show('home');
  });

  // ===== Home Rendering =====
  function renderHome() {
    const host = $('#homeSections');
    if (!host) return;

    host.innerHTML = '';

    // Section: Metro
    const secMetro = document.createElement('div');
    secMetro.className = 'section card pack-card';
    secMetro.innerHTML = `
      <h3>🚇 وضع المترو</h3>
      <div class="muted">شبكة خطوط ومحطات ملوّنة مع تلميحات ذكية. انتقل تلقائيًا بين الخانات، ومكافآت حسب الدقة.</div>
      <div class="row end" style="margin-top:10px">
        <button id="btnStartMetro" class="btn primary">ابدأ المترو</button>
      </div>
    `;
    host.appendChild(secMetro);

    // Section: Mini
    const secMini = document.createElement('div');
    secMini.className = 'section card';
    secMini.innerHTML = `
      <h3>⚡ المصغّرات السريعة</h3>
      <div class="muted">شبكات صغيرة 4×4/5×5 تُحل خلال دقيقة أو دقيقتين. نجوم حسب الوقت والأخطاء.</div>
      <div class="row end" style="margin-top:10px">
        <button id="btnStartMini" class="btn">ابدأ المصغّرات</button>
      </div>
    `;
    host.appendChild(secMini);

    // Bind
    on($('#btnStartMetro'), 'click', startMetroFlow);
    on($('#btnStartMini'), 'click', startMiniFlow);
  }

  // ===== Start Flows =====
  function startMetroFlow(){
    // سنفعل المحرك في الخطوة القادمة (js/metro.js)
    if (!window.MG_Metro) {
      toast('سيتم تفعيل وضع المترو بعد الخطوة القادمة.');
      return;
    }
    // مثال حزمة أولية
    const packPath = 'content/metro/packs/starter.json';
    show('metro');
    window.MG_Metro.start({ packPath, ui:{
      svg: $('#metroSVG'), inputs: $('#metroInputs'),
      clueMeta: $('#mClueMeta'), clueText: $('#mClueText'),
      clueList: $('#mClueList'),
      btnLetter: $('#btnRevealLetter'), btnWord: $('#btnRevealWord'),
      toast
    }});
  }

  function startMiniFlow(){
    if (!window.MG_Mini) {
      toast('سيتم تفعيل المصغّرات بعد الخطوة القادمة.');
      return;
    }
    const packPath = 'content/mini/packs/starter.json';
    show('mini');
    window.MG_Mini.start({ packPath, ui:{
      hud: $('#miniHud'), grid: $('#miniGrid'), clues: $('#miniClues'),
      btnLetter: $('#miniRevealLetter'), btnWord: $('#miniRevealWord'),
      toast
    }});
  }

  // ===== Initialize =====
  renderHome();
  show('home');

  // Expose minimal API (future use)
  window.MG = {
    state, show, toast
  };
})();
