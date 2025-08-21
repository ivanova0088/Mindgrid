/* MindGrid library – Home & navigation */
(function(){
  'use strict';
  const $ = (s,c=document)=>c.querySelector(s);
  const all = s=>Array.from(document.querySelectorAll(s));
  function show(id){
    all('.screen').forEach(el=>el.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el){ el.classList.remove('hidden'); }
  }
  function card(opts){
    const wrap = document.createElement('div');
    wrap.className = 'mg-card';
    wrap.innerHTML = `
      <div class="icon">${opts.icon||''}</div>
      <div class="body">
        <h3>${opts.title}</h3>
        <p>${opts.desc||''}</p>
        <button type="button" class="btn-start">${opts.cta||'ابدأ'}</button>
      </div>`;
    wrap.querySelector('.btn-start').addEventListener('click', opts.onClick);
    return wrap;
  }
  function buildHome(){
    const home = $('#home'); if (!home) return;
    home.innerHTML = `<h1 style="margin:8px 0 16px">اختر النمط</h1>`;
    const grid = document.createElement('div');
    grid.className='mg-grid'; home.appendChild(grid);

    // Orbit card
    grid.appendChild(card({
      icon:'<span style="font-size:28px">⭕️</span>',
      title:'الحلقات المتداخلة',
      desc:'أقواس دائرية تتقاطع مع أشعّة — تجربة مختلفة ومريحة للعين.',
      cta:'ابدأ',
      onClick: ()=>{
        show('orbit');
        if (window.MG_Orbit && typeof window.MG_Orbit.start==='function'){
          window.MG_Orbit.start({});
        } else {
          $('#orbit').innerHTML = '<p>لم يتم تحميل محرك Orbit.</p>';
        }
      }
    }));

    // Ladder card
    grid.appendChild(card({
      icon:'<span style="font-size:28px">🪜</span>',
      title:'السُّلَّم',
      desc:'أعمدة كلمات تربطها درجات — تنقّل سريع على الموبايل.',
      cta:'ابدأ',
      onClick: ()=>{
        show('ladder');
        if (window.MG_Ladder && typeof window.MG_Ladder.start==='function'){
          window.MG_Ladder.start({});
        } else {
          $('#ladder').innerHTML = '<p>لم يتم تحميل محرك السُّلَّم.</p>';
        }
      }
    }));
  }

  // Basic styles for the cards (kept minimal)
  const style = document.createElement('style');
  style.textContent = `
    .mg-grid{display:grid;gap:16px}
    .mg-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px}
    .mg-card .icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center}
    .mg-card h3{margin:0 0 6px 0}
    .mg-card p{margin:0 0 10px 0;color:#64748b}
    .mg-card .btn-start{background:#0284c7;color:#fff;border:0;border-radius:10px;padding:8px 14px;font-size:16px}
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', buildHome);
})();