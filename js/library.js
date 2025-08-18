/* MindGrid library — Orbit + Ladder bootstrap (mgOL_step1) */
(function(){
  'use strict';

  const $ = (s,c=document)=>c.querySelector(s);
  const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);

  // ------- Simple state & helpers
  const S = { screen:'home', history:[] };
  function show(id){
    document.querySelectorAll('.screen').forEach(el=> el.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el){ el.classList.remove('hidden'); S.screen=id; }
  }
  function back(){
    if (S.history.length){ const prev=S.history.pop(); show(prev); }
    else show('home');
  }
  function go(id){
    if (S.screen!==id){ S.history.push(S.screen); show(id); }
  }
  function toast(msg){
    let t = $('#mg-toast'); if (!t){
      t = document.createElement('div'); t.id='mg-toast';
      t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:10px;opacity:.95;z-index:9999;max-width:90%;font-size:14px;';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.display='block';
    clearTimeout(t._h); t._h=setTimeout(()=> t.style.display='none', 1800);
  }

  // ------- Home builder (two cards)
  function buildHome(){
    const root = $('#home'); if (!root) return;
    root.innerHTML = `
      <div class="section">
        <h2 class="title">اختر النمط</h2>
        <div class="cards">
          <div class="card">
            <div class="card-ico">⭕️</div>
            <div class="card-h">الحلقات المتداخلة</div>
            <div class="card-p">أقواس دائرية تتقاطع مع أشعّة — تجربة مختلفة ومريحة للعين.</div>
            <button id="btnOrbit" class="btn">ابدأ</button>
          </div>
          <div class="card">
            <div class="card-ico">🪜</div>
            <div class="card-h">السُلَّم</div>
            <div class="card-p">أعمدة كلمات تربطها درجات، تنقّل سريع على الموبايل.</div>
            <button id="btnLadder" class="btn alt">ابدأ</button>
          </div>
        </div>
      </div>
    `;
    on($('#btnOrbit'),'click',()=>{
      if (window.MG_Orbit?.start){
        go('orbit');
        window.MG_Orbit.start({
          packPath: 'content/orbit/packs/starter.json',
          ui: orbitUI(),
          toast
        });
      }else{
        toast('سيتم تفعيل نمط الحلقات بعد رفع ملف js/orbit.js.');
      }
    });
    on($('#btnLadder'),'click',()=>{
      if (window.MG_Ladder?.start){
        go('ladder');
        window.MG_Ladder.start({
          packPath: 'content/ladder/packs/starter.json',
          ui: ladderUI(),
          toast
        });
      }else{
        toast('سيتم تفعيل نمط السلم بعد رفع ملف js/ladder.js.');
      }
    });
  }

  // ------- Build Orbit screen shell
  function orbitUI(){
    const el = $('#orbit'); el.innerHTML = `
      <div class="hdr"><button class="bk" id="bkOrbit">رجوع</button><h2>الحلقات المتداخلة</h2></div>
      <div class="orbit-wrap">
        <svg id="orbitSVG" class="orbit-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"></svg>
        <div id="orbitInputs" class="orbit-inputs"></div>
      </div>
      <div class="clueBox">
        <div id="orbitMeta" class="muted">—</div>
        <div id="orbitText" class="clue">—</div>
        <div id="orbitList" class="chips"></div>
        <div class="actions">
          <button id="orbitHint1" class="btn ghost">كشف حرف</button>
          <button id="orbitHintW" class="btn">كشف الإجابة</button>
        </div>
      </div>
    `;
    on($('#bkOrbit'),'click',()=> back());
    return {
      svg: $('#orbitSVG'),
      inputs: $('#orbitInputs'),
      clueMeta: $('#orbitMeta'),
      clueText: $('#orbitText'),
      clueList: $('#orbitList'),
      btnLetter: $('#orbitHint1'),
      btnWord: $('#orbitHintW')
    };
  }

  // ------- Build Ladder screen shell
  function ladderUI(){
    const el = $('#ladder'); el.innerHTML = `
      <div class="hdr"><button class="bk" id="bkLadder">رجوع</button><h2>السُلَّم</h2></div>
      <div id="ladderGrid" class="ladder-grid"></div>
      <div class="clueBox">
        <div id="ladderHUD" class="muted">—</div>
        <div id="ladderClues" class="chips"></div>
        <div class="actions">
          <button id="ladderHint1" class="btn ghost">كشف حرف</button>
          <button id="ladderHintW" class="btn">كشف الإجابة</button>
        </div>
      </div>
    `;
    on($('#bkLadder'),'click',()=> back());
    return {
      hud: $('#ladderHUD'),
      grid: $('#ladderGrid'),
      clues: $('#ladderClues'),
      btnLetter: $('#ladderHint1'),
      btnWord: $('#ladderHintW')
    };
  }

  // ------- Minimal styles if not present
  function injectStyles(){
    if ($('#mgOLStyles')) return;
    const css = document.createElement('style');
    css.id='mgOLStyles';
    css.textContent = `
      .hidden{display:none}
      .screen{padding:16px 12px; max-width:900px;margin:0 auto;}
      .title{margin:10px 6px 16px; font-size:22px}
      .cards{display:grid;grid-template-columns:1fr;gap:14px}
      @media(min-width:720px){.cards{grid-template-columns:1fr 1fr}}
      .card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px 14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.03)}
      .card-ico{font-size:26px}
      .card-h{font-weight:700;margin-top:6px;margin-bottom:4px}
      .card-p{color:#6b7280;font-size:14px;margin-bottom:10px}
      .btn{padding:10px 14px;border-radius:10px;border:0;background:#0ea5e9;color:#fff;font-weight:700}
      .btn.alt{background:#10b981}
      .btn.ghost{background:#eef2ff;color:#1e293b}
      .hdr{display:flex;align-items:center;gap:8px;margin-bottom:10px}
      .bk{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:8px 10px}
      .muted{color:#6b7280;margin:6px 0}
      .chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
      .story-chip{padding:8px 10px;border-radius:10px;border:1px solid #e5e7eb;background:#fff}
      .actions{display:flex;gap:10px;margin-top:8px}
      /* ORBIT */
      .orbit-wrap{position:relative;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;aspect-ratio:1/1}
      .orbit-svg{width:100%;height:auto;display:block}
      .orbit-inputs{position:absolute;inset:0}
      .st-input{position:absolute;text-align:center;border:1px solid #cbd5e1;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06)}
      .st-input.active{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.25)}
      .st-input.correct{background:#ecfdf5;border-color:#10b981}
      .metro-line{opacity:.7}
      /* LADDER */
      .ladder-grid{display:grid;grid-auto-flow:column;gap:10px;min-height:260px;padding:10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;overflow:auto}
      .ladder-col{display:grid;grid-auto-rows:40px;gap:6px;align-content:start}
      .ladder-cell{display:flex;align-items:center;justify-content:center;border:1px solid #cbd5e1;border-radius:8px;background:#fff;min-width:40px}
      .ladder-cell.active{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.25) inset}
      .ladder-cell.correct{background:#ecfdf5;border-color:#10b981}
      .rung{height:6px;background:#cbd5e1;border-radius:4px;margin:6px 0}
    `;
    document.head.appendChild(css);
  }

  // ------- Boot
  function ensureScreens(){
    // create basic skeleton if missing
    if (!$('#home')){
      const root = document.createElement('main'); root.id='app';
      root.innerHTML = `
        <section id="home" class="screen"></section>
        <section id="orbit" class="screen hidden"></section>
        <section id="ladder" class="screen hidden"></section>
      `;
      document.body.appendChild(root);
    }else{
      // make sure other screens exist
      if (!$('#orbit')){
        const s=document.createElement('section'); s.id='orbit'; s.className='screen hidden'; $('#home').after(s);
      }
      if (!$('#ladder')){
        const s=document.createElement('section'); s.id='ladder'; s.className='screen hidden'; $('#orbit').after(s);
      }
    }
  }

  function init(){
    injectStyles();
    ensureScreens();
    buildHome();
    show('home');
  }

  document.addEventListener('DOMContentLoaded', init);
  window.MG = { show, back, go, toast };
})();