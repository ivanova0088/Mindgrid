/* MG_Orbit — نمط الحلقات المتداخلة (Orbit Mode)
   - SVG viewBox 0..100
   - أقواس على حلقات + أشعة (spokes)
   - إدخال تلقائي، انتقال تلقائي، تلوين أخضر للصحيح، مسح تلقائي للخطأ بطول كامل
*/
(function(){
  'use strict';
  const $ = (s,c=document)=>c.querySelector(s);
  const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);
  const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
  const norm = s => (s||'').toString().trim().replace(/\s+/g,'').toLowerCase();

  // حزمة ديمو في حال عدم وجود محتوى
  const DEMO = {
    title: "حزمة تجريبية (Orbit)",
    spokes: [0, 60, 120, 180, 240, 300],
    rings: [
      { r: 28, words: [
        { id:"w1", clue:"بحر عربي معروف", answer:"عُمان", start: 330, sweep: 48, dir: 1 },
        { id:"w2", clue:"عاصمة عربية",    answer:"عمّان", start: 150, sweep: 54, dir:-1 }
      ]},
      { r: 40, words: [
        { id:"w3", clue:"أداة كتابة",      answer:"قلم",   start:  40, sweep: 36, dir: 1 },
        { id:"w4", clue:"ضد ليل",          answer:"نهار",  start: 220, sweep: 56, dir:-1 }
      ]},
      { r: 52, words: [
        { id:"w5", clue:"مدينة مغربية زرقاء", answer:"شفشاون", start: 300, sweep: 80, dir: 1 }
      ]}
    ]
  };

  function polarToXY(cx, cy, r, deg){
    const th = (deg-90) * Math.PI/180; // اجعل الصفر للأعلى
    return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) };
  }

  function arcPath(cx, cy, r, a0, a1){
    // يرسم قوسًا بين زاويتين بالدرجات
    const p0 = polarToXY(cx,cy,r,a0);
    const p1 = polarToXY(cx,cy,r,a1);
    const large = Math.abs(a1-a0) > 180 ? 1 : 0;
    const sweep = (a1>a0) ? 1 : 0;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`;
  }

  function drawRings(svg, rings){
    rings.forEach(r => {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx','50'); c.setAttribute('cy','50'); c.setAttribute('r', r.r);
      c.setAttribute('fill','none'); c.setAttribute('stroke','#e2e8f0');
      c.setAttribute('stroke-width','0.8'); c.setAttribute('vector-effect','non-scaling-stroke');
      svg.appendChild(c);
    });
  }

  function drawSpokes(svg, spokes){
    spokes.forEach(a => {
      const p0 = polarToXY(50,50, 18, a);
      const p1 = polarToXY(50,50, 56, a);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`);
      path.setAttribute('stroke','#cbd5e1'); path.setAttribute('stroke-width','0.7');
      path.setAttribute('vector-effect','non-scaling-stroke'); path.setAttribute('fill','none');
      path.setAttribute('class','orbit-spoke');
      svg.appendChild(path);
    });
  }

  function placeInput(wrap, x, y, idx){
    const el = document.createElement('input');
    el.type='text'; el.maxLength=1; el.autocapitalize='off'; el.autocorrect='off'; el.spellcheck=false;
    el.className='st-input';
    // تموضع بالنسبة المئوية
    el.style.left = `calc(${x}% - 18px)`;
    el.style.top  = `calc(${y}% - 18px)`;
    el.style.width='36px'; el.style.height='36px';
    el.dataset.index = idx;
    wrap.appendChild(el);
    return el;
  }

  function buildWordCells(word){
    // قسّم القوس على عدد حروف الإجابة
    const n = word.answer.length;
    const step = (word.sweep / Math.max(1, n-1)) * (word.dir>=0?1:-1);
    const pts=[];
    for(let i=0;i<n;i++){
      const a = word.start + step * i;
      const p = polarToXY(50,50, word._r, a);
      pts.push({ x: p.x, y: p.y, a });
    }
    return pts;
  }

  function drawArc(svg, r, a0, a1, color){
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', arcPath(50,50,r,a0,a1));
    path.setAttribute('stroke', color||'#94a3b8');
    path.setAttribute('stroke-width','1.4');
    path.setAttribute('vector-effect','non-scaling-stroke');
    path.setAttribute('fill','none');
    path.setAttribute('class','orbit-arc');
    svg.appendChild(path);
  }

  function start(opts){
    const { packPath, ui, toast } = opts;
    const { svg, inputs, clueMeta, clueText, clueList, btnLetter, btnWord } = ui;

    svg.innerHTML=''; inputs.innerHTML=''; clueMeta.textContent='—'; clueText.textContent='—'; clueList.innerHTML='';
    svg.setAttribute('viewBox','0 0 100 100'); svg.setAttribute('preserveAspectRatio','xMidYMid meet');

    const S = { pack:null, words:[], inputMap:{}, active:null };

    function setActive(w){
      S.active = w;
      clueMeta.textContent = `التلميح الجاري • ${w.answer.length} حروف`;
      clueText.textContent = w.clue;
      inputs.querySelectorAll('.st-input').forEach(e=> e.classList.remove('active'));
      (S.inputMap[w.id]||[]).forEach(e=> e.classList.add('active'));
    }
    function focusFirstEmpty(w){
      const arr = S.inputMap[w.id]||[];
      const t = arr.find(e=>!e.disabled && !e.value) || arr.find(e=>!e.disabled) || arr[arr.length-1];
      if (t){ t.focus(); t.select(); }
    }
    function checkSolved(w){
      const arr = S.inputMap[w.id]||[];
      const letters = arr.map(e=>e.value).join('');
      if (letters.length < w.answer.length) return false;
      if (norm(letters) === norm(w.answer)){
        arr.forEach(e=>{ e.classList.add('correct'); e.disabled=true; });
        const idx = S.words.findIndex(x=>x.id===w.id);
        const next = S.words.slice(idx+1).find(x => !(S.inputMap[x.id]||[]).every(e=>e.disabled));
        if (next){ setTimeout(()=>{ setActive(next); focusFirstEmpty(next); }, 220); }
        else { toast && toast('أحسنت! اكتملت الحلقات ✅'); }
        return true;
      }else{
        // خطأ بطول كامل → إفراغ
        if (letters.length === w.answer.length){
          arr.forEach(e=> e.value='');
          toast && toast('ليست صحيحة — حاول مجددًا');
        }
        return false;
      }
    }

    function render(pack){
      S.pack = pack;
      // خلفية: حلقات + أشعة
      drawRings(svg, pack.rings);
      if (Array.isArray(pack.spokes)) drawSpokes(svg, pack.spokes);

      // كلمات + حقول + أقواس
      pack.rings.forEach(rg => {
        (rg.words||[]).forEach(w => {
          w._r = rg.r;
          const a1 = w.start + (w.dir>=0? w.sweep : -w.sweep);
          drawArc(svg, rg.r, w.start, a1, '#94a3b8');
          const pts = buildWordCells(w);
          const arr = [];
          pts.forEach((p,i)=>{
            const el = placeInput(inputs, p.x, p.y, i);
            on(el,'focus',()=>{ if (S.active?.id!==w.id){ setActive(w); } });
            on(el,'input', e=>{
              const v = e.target.value || '';
              e.target.value = v.slice(-1); // حرف واحد
              // انتقال تلقائي
              const next = arr[i+1];
              if (e.target.value && next && !next.disabled){ next.focus(); next.select(); }
              checkSolved(w);
            });
            arr.push(el);
          });
          S.inputMap[w.id] = arr;
          S.words.push(w);
          // زر تلميح كـ chip
          const chip = document.createElement('button');
          chip.type='button'; chip.className='story-chip'; chip.textContent = w.clue;
          on(chip,'click',()=>{ setActive(w); focusFirstEmpty(w); });
          clueList.appendChild(chip);
        });
      });

      // تفعيل أزرار المساعدة
      on(btnLetter,'click',()=>{
        const w=S.active; if(!w) return;
        const arr=S.inputMap[w.id]||[];
        const t = arr.find(e=>!e.value && !e.disabled);
        if (t){ const idx = parseInt(t.dataset.index||'0',10); t.value = (w.answer[idx]||''); t.dispatchEvent(new Event('input')); }
      });
      on(btnWord,'click',()=>{
        const w=S.active; if(!w) return;
        const arr=S.inputMap[w.id]||[];
        arr.forEach((e,i)=>{ e.value = w.answer[i]||''; });
        checkSolved(w);
      });

      // أول كلمة
      if (S.words[0]){ setActive(S.words[0]); }
    }

    // تحميل الحزمة
    fetch(packPath).then(r=>{
      if (!r.ok) throw new Error('404');
      return r.json();
    }).then(render).catch(()=>{
      render(DEMO);
      toast && toast('تم تشغيل نمط الحلقات بنموذج تجريبي — ارفع حزمة المحتوى لاحقاً.');
    });
  }

  window.MG_Orbit = { start };
})();