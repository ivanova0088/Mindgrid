/* MG_Metro — محرك نمط المترو (نسخة أولية) */
(function(){
  'use strict';

  const $ = (s, c=document)=>c.querySelector(s);
  const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);
  const norm = s => (s||'').toString().trim().replace(/\s+/g,'').toLowerCase();

  const DEMO = {
    title: "خريطة تجريبية",
    clueGroups:[
      {id:'L1', name:'الخط الأزرق', color:'#06b6d4', words:[
        { id:'w1', clue:'قريب من الأرض ليلاً', answer:'قمر', cells:[{x:10,y:20},{x:18,y:26},{x:26,y:32}] },
        { id:'w2', clue:'عكس البرد', answer:'حر', cells:[{x:40,y:35},{x:48,y:38}] },
      ]},
      {id:'L2', name:'الخط الأخضر', color:'#16a34a', words:[
        { id:'w3', clue:'مدينة مغربية زرقاء', answer:'شفشاون', cells:[{x:65,y:50},{x:72,y:52},{x:79,y:54},{x:86,y:56}] },
      ]}
    ]
  };

  function drawLine(svg, pts, color){
    const d = pts.map((p,i)=> (i?'L':'M') + (p.x*10) + ' ' + (p.y*8)).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '8');
    path.setAttribute('fill','none');
    path.setAttribute('class','metro-line');
    svg.appendChild(path);
  }

  function placeInput(wrap, cell, idx){
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = 1;
    el.autocapitalize = 'off';
    el.autocorrect = 'off';
    el.spellcheck = false;
    el.className = 'st-input';
    // تحويل النسبة إلى موضع
    const left = (cell.x*10) + '%';
    const top  = (cell.y*8) + '%';
    el.style.left = `calc(${left} - 18px)`;
    el.style.top  = `calc(${top} - 18px)`;
    el.style.width = '36px'; el.style.height='36px';
    el.dataset.index = idx;
    wrap.appendChild(el);
    return el;
  }

  function start(opts){
    const { packPath, ui } = opts;
    const { svg, inputs, clueMeta, clueText, clueList, btnLetter, btnWord, toast } = ui;

    // reset UI
    svg.innerHTML = ''; inputs.innerHTML=''; clueMeta.textContent='—'; clueText.textContent='—'; clueList.innerHTML='';

    // helper state
    const S = {
      pack:null,
      words:[],       // flat list of words with refs
      active:null,    // active word object
      inputEls:[],    // refs to inputs per word (array of arrays)
      clickGuard:false,
    };

    function setActive(word){
      S.active = word;
      clueMeta.textContent = `التلميح الجاري • ${word.answer.length} حروف`;
      clueText.textContent = word.clue;
      // تمييز الحقول
      inputs.querySelectorAll('.st-input').forEach(e=> e.classList.remove('active'));
      (S.inputEls[word.id]||[]).forEach(e=> e.classList.add('active'));
    }

    function focusFirstEmpty(word){
      const arr = S.inputEls[word.id]||[];
      const target = arr.find(e => !e.value) || arr[arr.length-1];
      if (target){ target.focus(); target.select(); }
    }

    function checkSolved(word){
      const letters = (S.inputEls[word.id]||[]).map(e=> e.value).join('');
      if (!letters || letters.length < word.answer.length) return false;
      if (norm(letters) === norm(word.answer)){
        (S.inputEls[word.id]||[]).forEach(e=> { e.classList.add('correct'); e.disabled = true; });
        // التالي
        const idx = S.words.findIndex(w=> w.id===word.id);
        const next = S.words.slice(idx+1).find(w => !(S.inputEls[w.id]||[]).every(e=>e.disabled));
        if (next){
          setTimeout(()=>{ setActive(next); focusFirstEmpty(next); }, 220);
        }else{
          toast && toast('رائع! اكتملت الخريطة ✅');
        }
        return true;
      }else if (letters.length === word.answer.length){
        // خاطئة: إفراغ
        (S.inputEls[word.id]||[]).forEach(e=> e.value='');
        toast && toast('ليست صحيحة — حاول مجددًا');
        focusFirstEmpty(word);
      }
      return false;
    }

    function renderPack(pack){
      S.pack = pack;
      // خطوط تقريبية بناءً على نقاط الكلمات
      pack.clueGroups.forEach(g => {
        let allPts = [];
        g.words.forEach(w => { allPts = allPts.concat(w.cells); });
        if (allPts.length>1) drawLine(svg, allPts, g.color);
      });

      // إنشاء الحقول لكل كلمة
      pack.clueGroups.forEach(g => {
        g.words.forEach(w => {
          const arr = [];
          w.cells.forEach((c, i) => {
            const el = placeInput(inputs, c, i);
            on(el,'focus',()=>{ if (S.active?.id!==w.id){ setActive(w);} });
            on(el,'input', e=>{
              const v = e.target.value; if (v && v.length>1) e.target.value = v.slice(-1);
              // انتقال تلقائي
              const idx = parseInt(e.target.dataset.index,10)||0;
              const next = arr[idx+1]; if (e.target.value && next && !next.disabled) next.focus();
              checkSolved(w);
            });
            arr.push(el);
          });
          S.inputEls[w.id] = arr;
          S.words.push(w);

          // chips
          const chip = document.createElement('button');
          chip.type='button'; chip.className='story-chip'; chip.textContent = w.clue;
          on(chip,'click',()=>{ setActive(w); if (S.clickGuard){ focusFirstEmpty(w);} S.clickGuard=!S.clickGuard; });
          clueList.appendChild(chip);
        });
      });

      // اختر أول كلمة
      if (S.words[0]) { setActive(S.words[0]); }
      // أزرار كشف (لاحقًا سنربط بالـ coins)
      on(btnLetter,'click',()=>{
        const w=S.active; if(!w) return;
        const arr=S.inputEls[w.id]||[];
        const t=arr.find(e=>!e.value&&!e.disabled); if(t){ t.value = w.answer[arr.indexOf(t)] || ''; t.dispatchEvent(new Event('input')); }
      });
      on(btnWord,'click',()=>{
        const w=S.active; if(!w) return;
        (S.inputEls[w.id]||[]).forEach((e,i)=>{ e.value=w.answer[i]||''; });
        checkSolved(w);
      });
    }

    // Load pack
    fetch(packPath).then(r=>{
      if (!r.ok) throw new Error('pack404');
      return r.json();
    }).then(renderPack).catch(()=>{
      // fallback demo
      renderPack(DEMO);
      toast && toast('حزمة المترو غير موجودة بعد — تشغيل نموذج تجريبي.');
    });
  }

  window.MG_Metro = { start };
})();