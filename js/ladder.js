/* MG_Ladder — Ladder mode stub to verify button works */
(function(){
  'use strict';
  const api = window.MG_Ladder || (window.MG_Ladder={});
  api.start = function(){
    const root = document.getElementById('ladder') || document.body;
    root.innerHTML = `
      <h2>السُّلَّم 🪜</h2>
      <div style="height:220px;border-radius:12px;background:#ecfeff;display:flex;align-items:center;justify-content:center;margin:12px 0">
        <div style="text-align:center">
          <div style="font-size:38px">🪜</div>
          <div>تم تشغيل وضع السُّلَّم التجريبي — سنضيف التفاعل بعد التأكد أن الأزرار تعمل.</div>
        </div>
      </div>
      <button type="button" onclick="location.reload()">رجوع</button>
    `;
  };
})();