/* MG_Mini — محرك المصغّرات السريعة (نسخة أولية) */
(function(){
  'use strict';

  const $ = (s,c=document)=>c.querySelector(s);
  const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);
  const norm = s => (s||'').toString().trim().replace(/\s+/g,'').toLowerCase();

  const DEMO_MINI = {
    title:"حِزمة تجريبية",
    size:5,
    grid:[
      "ا # # # ن",
      " # م # د #",
      " # ي # ر #",
      " # ة # ب #",
      "ق # # # ء"
    ],
    words:[
      {id:'a1', dir:'across', row:1, col:1, answer:'ان', clue:'حرف شرط (2)'},
      {id:'a2', dir:'across', row:5, col:1, answer:'قء', clue:'ليس لها معنى (2) — تجريبية'},
      {id:'d1', dir:'down', row:1, col:5, answer:'نذربء', clue:'تجريبية للأسفل (5)'},
    ]
  };

  function start(opts){
    const { packPath, ui } = opts;
    const { hud, grid, clues, btnLetter, btnWord, toast } = ui;

    // state
    const S = {
      pack:null,
      size:5,
      cells:[],     // 2D array of elements
      mapWords:[],  // list of word objects with cell references
      active:null,
      firstClickTarget:null,
    };

    function renderPack(p){
      S.pack = p;
      S.size = p.size || 5;
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = `repeat(${S.size}, 1fr)`;
      S.cells = [];

      // build cells
      for (let r=0;r<S.size;r++){
        const row = [];
        for (let c=0;c<S.size;c++){
          const ch = (p.grid[r]||'').split(/\s+/)[c] || '#';
          const el = document.createElement('div');
          el.className = 'mini-cell';
          el.tabIndex = 0;
          el.dataset.r = r; el.dataset.c = c;
          if (ch==="#" ){ el.classList.add('block'); el.textContent=''; el.tabIndex=-1; }
          else { el.textContent = ''; }
          grid.appendChild(el);
          row.push(el);
        }
        S.cells.push(row);
      }

      // words mapping
      S.mapWords = p.words.map(w => {
        const cells = [];
        if (w.dir==='across'){
          for (let i=0;i<w.answer.length;i++){
            const el = S.cells[w.row-1]?.[w.col-1+i]; if (el) cells.push(el);
          }
        }else{
          for (let i=0;i<w.answer.length;i++){
            const el = S.cells[w.row-1+i]?.[w.col-1]; if (el) cells.push(el);
          }
        }
        return { ...w, cells };
      });

      // clues listing
      clues.innerHTML='';
      S.mapWords.forEach(w=>{
        const b=document.createElement('button');
        b.type='button'; b.className='story-chip'; b.textContent = w.clue;
        on(b,'click',()=> selectWord(w, true));
        clues.appendChild(b);
      });

      hud.textContent = p.title || 'جلسة تجريبية';
      // bind grid clicks
      grid.addEventListener('click', e=>{
        const cell = e.target.closest('.mini-cell'); if(!cell || cell.classList.contains('block')) return;
        const r=parseInt(cell.dataset.r,10), c=parseInt(cell.dataset.c,10);
        const w = S.mapWords.find(w=> w.cells.includes(cell));
        if (!w) return;
        if (!S.active || S.active.id!==w.id){
          // first click: مجرد عرض التلميح وتحديد الكلمة
          selectWord(w, false);
          S.firstClickTarget = cell;
        }else{
          // second click على نفس الخانة: التركيز (فتح الكيبورد)
          focusFirstEmpty(w);
        }
      });

      // hint buttons
      on(btnLetter,'click',()=>{
        const w=S.active; if(!w) return;
        const t=w.cells.find(el=>!el.textContent); if(!t) return;
        const idx=w.cells.indexOf(t);
        t.textContent = w.answer[idx];
        afterInput(w, t);
      });
      on(btnWord,'click',()=>{
        const w=S.active; if(!w) return;
        w.cells.forEach((el,i)=> el.textContent = w.answer[i]||'');
        afterInput(w, w.cells[w.cells.length-1]);
      });
    }

    function selectWord(w, fromClue){
      S.active = w;
      clues.previousElementSibling?.remove(); // لا شيء
      // إبراز
      S.cells.flat().forEach(el=> el.classList.remove('active'));
      w.cells.forEach(el=> el.classList.add('active'));
      // عرض التلميح أعلى الشبكة
      hud.innerHTML = `<b>التلميح الجاري</b> — ${w.dir==='across'?'أفقي':'عمودي'} • (${w.answer.length})`;
      const info = document.createElement('div'); info.className='muted'; info.textContent = w.clue;
      hud.appendChild(info);
      if (fromClue){ focusFirstEmpty(w); }
    }

    function focusFirstEmpty(w){
      const t = w.cells.find(el=> !el.textContent) || w.cells[w.cells.length-1];
      if (t){ t.focus(); }
    }

    function afterInput(w, cell){
      // انتقال تلقائي: إلى الخلية التالية داخل نفس الكلمة
      const idx = w.cells.indexOf(cell);
      const next = w.cells[idx+1];
      // تحقق
      const letters = w.cells.map(el=> el.textContent).join('');
      if (letters.length === w.answer.length){
        if (norm(letters) === norm(w.answer)){
          w.cells.forEach(el=> el.classList.add('correct'));
          // التالي
          const remain = S.mapWords.find(x=> x.id!==w.id && x.cells.some(el=>!el.textContent));
          if (remain){
            setTimeout(()=> selectWord(remain,false), 160);
          }else{
            toast && toast('انتهت المصغّرات! ✅');
          }
        }else{
          // خاطئة: إفراغ
          w.cells.forEach(el=> el.textContent='');
          toast && toast('إجابة غير صحيحة — جرّب من جديد');
          focusFirstEmpty(w);
        }
      }else if (next){
        next.focus();
      }
    }

    // keyboard handling (contenteditable-like via prompt on mobile not reliable; نستخدم keydown)
    grid.addEventListener('keydown', e=>{
      const cell = e.target.closest('.mini-cell'); if(!cell || cell.classList.contains('block')) return;
      const w = S.active; if(!w) return;
      if (e.key.length===1 && !e.ctrlKey && !e.metaKey){
        e.preventDefault();
        cell.textContent = e.key;
        afterInput(w, cell);
      }else if (e.key==='Backspace'){
        e.preventDefault();
        cell.textContent='';
      }
    });

    // Load pack
    fetch(packPath).then(r=>{
      if (!r.ok) throw new Error('pack404');
      return r.json();
    }).then(renderPack).catch(()=>{
      renderPack(DEMO_MINI);
      toast && toast('حزمة المصغّرات غير موجودة بعد — تشغيل نموذج تجريبي.');
    });
  }

  window.MG_Mini = { start };
})();