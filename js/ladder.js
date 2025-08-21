/* js/ladder.js  — نسخة تمهيدية تُعرّف MG.openLadder حتى يعمل الزر */

(function () {
  // أنشئ الـ namespace إن لم يكن موجودًا
  window.MG = window.MG || {};

  // أداة بسيطة لعرض شاشة داخل الصفحة
  function showScreen(innerHTML) {
    let host = document.getElementById('mg-screen');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mg-screen';
      host.style.maxWidth = '840px';
      host.style.margin = '24px auto';
      host.style.padding = '0 16px';
      document.body.appendChild(host);
    }
    host.innerHTML = innerHTML;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // زر رجوع موحّد
  function backButton() {
    return '<button class="btn" id="mg-back">رجوع</button>';
  }

  // === الدالة المطلوبة ===
  MG.openLadder = function () {
    // نسخة تجريبية: شاشة بسيطة تؤكد أن النمط يعمل
    showScreen(`
      <div class="card">
        <h2 style="margin:0 0 8px">السُّلَّم 🪜</h2>
        <p class="muted" style="margin-top:0">
          النسخة التمهيدية تعمل. سنربط حزم المحتوى لاحقًا (levels/packs) ونفعّل اللعب الفعلي.
        </p>
        ${backButton()}
      </div>
    `);

    // رجوع: نعيد تحميل الصفحة للعودة للقائمة
    const back = document.getElementById('mg-back');
    if (back) back.onclick = () => location.reload();
  };
})();
