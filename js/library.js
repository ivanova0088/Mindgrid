/* js/library.js — bootstrap for MG namespace */
(function () {
  const W = window;

  // أنشئ نطاق MG مرة واحدة على المستوى العالمي
  if (!W.MG) W.MG = {};
  const MG = W.MG;

  // أدوات بسيطة (قد نستخدمها لاحقاً)
  MG.$  = (sel, root = document) => root.querySelector(sel);
  MG.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  MG.ce = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  MG.emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  // فقط للتتبع
  MG.version = 'mgcw_step1';
  MG.ready = true;

  // دالة إقلاع للكلمات المتقاطعة بنسخة الـCanvas (مكانها هنا كي يتعرّف عليها index)
  // لاحقاً سنستبدلها بالتنفيذ الفعلي داخل crossword_canvas.js
  if (typeof W.startCrosswordCanvas !== 'function') {
    W.startCrosswordCanvas = function (opts = {}) {
      // نطلق حدث إقلاع — الملفات الأخرى ممكن تلتقطه وتتابع
      MG.emit('crossword:boot', opts);
      return true;
    };
  }
})();
