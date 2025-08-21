/* MG_Orbit — Orbit Mode engine (simplified) */
(function(){
  'use strict';
  const $ = (s,c=document)=>c.querySelector(s);
  const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);
  const norm = s => (s||'').toString().trim().replace(/\s+/g,'').toLowerCase();
  const api = window.MG_Orbit || (window.MG_Orbit={});
  api.start = api.start || function(opts){
    const root = document.getElementById('orbit') || document.body;
    root.innerHTML = [
      '<h2>الحلقات المتداخلة ⭕️</h2>',
      '<div style=\"height:240px;border-radius:12px;background:#eef2ff;display:flex;align-items:center;justify-content:center;margin:12px 0\">',
      '<div style=\"text-align:center\">',
      '<div style=\"font-size:40px\">⭕️</div>',
      '<div>وضع Orbit التجريبي يعمل — ارفع حزمة المحتوى لاحقًا</div>',
      '</div></div>',
      '<button id=\"_orb_demo\" class=\"btn\">جرب إدخالاً تجريبياً</button>'
    ].join('');
    const btn = document.getElementById('_orb_demo');
    on(btn,'click',()=> alert('سيُضاف الرسم والتفاعلية في الخطوة القادمة — الملف محمّل بنجاح ✅'));
  };
})();