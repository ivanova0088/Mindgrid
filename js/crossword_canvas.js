/* =========================================================================
   MindGrid • Crossword (Canvas-style, swipe-to-select)
   File: js/crossword_canvas.js
   -------------------------------------------------------------------------
   الميزات:
   - اختيار الكلمة بالسحب/اللمس أو النقر (اللمسة الأولى تُظهر التلميح، الثانية تفتح الكتابة)
   - اتجاه أفقي RTL (يمين ➜ يسار) وعمودي (فوق ➜ تحت)
   - انتقال تلقائي للحرف التالي
   - التحقق عند اكتمال الكلمة: إن صحّت تُلوَّن أخضر وتنتقل تلقائياً للتلميح التالي؛
     وإن خَطِئت يهتز الحقل وتُمسَح المُدخلات
   - ألوان متناسبة مع واجهة البداية (مع حقن CSS خفيف عند غياب الأنماط)
   - يتحمّل مصدرين للمحتوى:
       1) MG.getDailyCrossword({level}) إن وُجدت في library.js (سنضيفها لاحقاً)
       2) Fallback: content/crossword/packs/starter.json
   ======================================================================== */

(function () {
  const MG = (window.MG = window.MG || {});
  const $$ = (sel, root = document) => root.querySelector(sel);
  const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Style injection (آمن لو لم تكن الأنماط موجودة) ===================
  const STYLE_ID = "mg-cw-canvas-style";
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = `
    :root{
      --mg-grad-1:#5D3FD3; /* بنفسجي */
      --mg-grad-2:#1e88e5; /* أزرق */
      --mg-ink:#0B1220;
      --mg-ink-soft:#59637a;
      --mg-card:#ffffff;
      --mg-sel:#006d77;
      --mg-ok:#2e7d32;
      --mg-bad:#c62828;
      --mg-cell:#ffffff;
      --mg-block:#0f2235;
      --mg-cell-border: rgba(0,0,0,.08);
      --mg-cell-size: 42px;
      --mg-gap: 6px;
      --mg-radius: 10px;
      --mg-shadow: 0 6px 18px rgba(0,0,0,.10);
    }
    .mg-cw-screen{
      min-height:100vh;
      background: linear-gradient(160deg,var(--mg-grad-1),var(--mg-grad-2));
      color:#fff;
      display:flex; flex-direction:column;
    }
    .mg-cw-bar{
      display:flex; align-items:center; gap:12px;
      padding:14px 16px;
      font-weight:700; font-size:18px;
    }
    .mg-cw-back{
      appearance:none; border:0; outline:0; cursor:pointer;
      background: rgba(255,255,255,.12);
      color:#fff; padding:8px 14px; border-radius:10px;
      font-weight:600;
    }
    .mg-cw-body{ flex:1; padding:14px; display:flex; flex-direction:column; gap:14px;}
    .mg-cw-board{
      background: rgba(255,255,255,.10);
      border-radius: 16px;
      padding: 12px;
      box-shadow: var(--mg-shadow);
    }
    .mg-cw-grid{
      display:grid;
      gap: var(--mg-gap);
      justify-content:center;
      touch-action: none;
      user-select: none;
    }
    .mg-cw-cell{
      width: var(--mg-cell-size); height: var(--mg-cell-size);
      border-radius: 10px;
      display:flex; align-items:center; justify-content:center;
      font-weight:800; font-size:20px;
      background: var(--mg-cell);
      color: var(--mg-ink);
      border:1px solid var(--mg-cell-border);
      box-shadow: 0 1px 0 rgba(0,0,0,.06) inset;
    }
    .mg-cw-cell.block{ background: var(--mg-block); border-color: transparent;}
    .mg-cw-cell.sel{ outline:3px solid rgba(0, 109, 119, .6);}
    .mg-cw-cell.cur{ box-shadow: 0 0 0 3px rgba(255,255,255,.9) inset;}
    .mg-cw-cell.ok{ background: #e7f6ec; color: var(--mg-ok);}
    .mg-cw-cell.bad{ animation: mg-buzz .24s linear 0s 1;}
    @keyframes mg-buzz{
      0%{ transform: translateX(0)}
      25%{ transform: translateX(-4px)}
      50%{ transform: translateX(3px)}
      75%{ transform: translateX(-2px)}
      100%{ transform: translateX(0)}
    }
    .mg-cw-card{
      background: var(--mg-card);
      color: var(--mg-ink);
      border-radius: 16px;
      box-shadow: var(--mg-shadow);
      padding:14px;
    }
    .mg-cw-clue-title{
      font-weight:800; font-size:16px; color:var(--mg-ink);
      display:flex; align-items:center; justify-content:space-between;
    }
    .mg-cw-clue-sub{ font-size:13px; color:var(--mg-ink-soft); margin-top:6px;}
    .mg-cw-actions{ display:flex; gap:8px; margin-top:10px;}
    .mg-cw-btn{
      appearance:none; border:0; outline:0; cursor:pointer;
      padding:10px 12px; border-radius:10px; font-weight:700;
      background:#e9eef8; color:#0B1220;
    }
    .mg-hidden-input{
      position: fixed; left:-9999px; top:-9999px; opacity:0;
      pointer-events:none;
    }
    @media (max-width:380px){
      :root{ --mg-cell-size: 38px; --mg-gap: 5px;}
    }
    `;
    document.head.appendChild(st);
  }

  // ===== Utilities =========================================================
  const isArabic = (ch) => /[\u0600-\u06FF]/.test(ch);
  const toChar = (val) => (val || "").trim().slice(0, 1);

  // Create element helper
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };

  // ===== Open Screen =======================================================
  MG.openCrosswordCanvas = async function openCrosswordCanvas(opts = {}) {
    const level = (opts.level || "easy").toLowerCase();

    // Prepare mount
    const mount = el("div", "mg-cw-screen");
    const bar = el("div", "mg-cw-bar");
    const back = el("button", "mg-cw-back", "رجوع");
    const title = el("div", null, "الكلمات المتقاطعة");
    bar.append(back, title);

    const body = el("div", "mg-cw-body");
    const board = el("div", "mg-cw-board");
    const gridWrap = el("div", "mg-cw-grid");
    const card = el("div", "mg-cw-card");
    const clueTitle = el("div", "mg-cw-clue-title");
    const clueSub = el("div", "mg-cw-clue-sub");
    const actions = el("div", "mg-cw-actions");
    card.append(clueTitle, clueSub, actions);

    body.append(board, card);
    board.appendChild(gridWrap);
    mount.append(bar, body);

    // Replace screen
    const root = document.getElementById("app") || document.body;
    root.innerHTML = "";
    root.appendChild(mount);

    // Back behavior
    back.onclick = () => {
      if (MG.goHome) MG.goHome();
      else location.reload();
    };

    // Hidden input
    const hidden = el("input", "mg-hidden-input");
    hidden.autocomplete = "off";
    hidden.spellcheck = false;
    hidden.inputMode = "text";
    document.body.appendChild(hidden);

    // Load puzzle
    let puzzle;
    try {
      if (typeof MG.getDailyCrossword === "function") {
        puzzle = await MG.getDailyCrossword({ level });
      }
    } catch (e) {
      console.warn("MG.getDailyCrossword failed, will fallback.", e);
    }
    if (!puzzle) {
      try {
        const res = await fetch("content/crossword/packs/starter.json", { cache: "no-store" });
        const pack = await res.json();
        // Try to pick first puzzle matching level
        if (pack && Array.isArray(pack.puzzles)) {
          puzzle =
            pack.puzzles.find((p) => (p.level || "easy").toLowerCase() === level) ||
            pack.puzzles[0];
        } else {
          puzzle = pack; // maybe already a single puzzle
        }
      } catch (e) {
        console.warn("Fallback starter.json failed, using embedded sample.", e);
      }
    }
    if (!puzzle) {
      // Embedded tiny sample (5x5) Arabic RTL + clues
      puzzle = {
        id: "sample-rtl",
        title: "تجريب",
        width: 5,
        height: 5,
        blocks: [
          [0, 0, 1, 0, 0],
          [0, 1, 0, 0, 0],
          [0, 0, 0, 1, 0],
          [0, 0, 1, 0, 0],
          [1, 0, 0, 0, 0],
        ],
        entries: [
          { r: 0, c: 4, dir: "across", clue: "لون البحر", answer: "أزرق" }, // RTL across
          { r: 0, c: 0, dir: "down", clue: "عكس الليل", answer: "نهار" },
          { r: 2, c: 4, dir: "down", clue: "ماء متجمّد", answer: "ثلج" },
        ],
      };
    }

    // Normalize puzzle
    const W = puzzle.width || (puzzle.grid && puzzle.grid[0] && puzzle.grid[0].length) || 9;
    const H = puzzle.height || (puzzle.grid && puzzle.grid.length) || 9;

    // Build cells matrix
    const matrix = [];
    for (let r = 0; r < H; r++) {
      const row = [];
      for (let c = 0; c < W; c++) {
        let block = false;
        if (puzzle.blocks && puzzle.blocks[r]) block = !!puzzle.blocks[r][c];
        if (puzzle.grid && puzzle.grid[r]) block = (puzzle.grid[r][c] + "").trim() === "#";
        row.push({
          r,
          c,
          block,
          ch: "", // correct letter (optional if entries provide answers)
          u: "", // user letter
          el: null,
          ok: false,
        });
      }
      matrix.push(row);
    }

    // Map entries (if not provided, auto-detect from blocks)
    let entries = [];
    if (Array.isArray(puzzle.entries) && puzzle.entries.length) {
      entries = puzzle.entries.map((e) => normalizeEntry(e));
    } else {
      // Auto-detect across RTL + down
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (matrix[r][c].block) continue;
          // across RTL: start if (c==W-1 or right is block) and left is not block
          const rightBlocked = c === W - 1 || matrix[r][c + 1].block;
          const leftFree = c > 0 && !matrix[r][c - 1].block;
          if (rightBlocked && leftFree) {
            const run = getAcrossRunRTL(r, c);
            if (run.length > 1)
              entries.push({ r, c, dir: "across", cells: run, clue: "—", answer: "" });
          }
          // down: start if (r==0 or up is block) and down is not block
          const upBlocked = r === 0 || matrix[r - 1][c].block;
          const downFree = r < H - 1 && !matrix[r + 1][c].block;
          if (upBlocked && downFree) {
            const run = getDownRun(r, c);
            if (run.length > 1)
              entries.push({ r, c, dir: "down", cells: run, clue: "—", answer: "" });
          }
        }
      }
    }

    // If entries from puzzle came without 'cells', compute them:
    entries.forEach((e) => {
      if (!e.cells || !e.cells.length) {
        e.cells = e.dir === "down" ? getDownRun(e.r, e.c) : getAcrossRunRTL(e.r, e.c);
      }
      e.len = e.cells.length;
    });

    // Fill grid characters if answers exist
    entries.forEach((e) => {
      if (!e.answer) return;
      const letters = [...e.answer.replace(/\s+/g, "")];
      if (letters.length !== e.cells.length) return;
      e.cells.forEach((cell, i) => {
        const { r, c } = cell;
        matrix[r][c].ch = letters[i];
      });
    });

    // Render grid
    gridWrap.style.setProperty("--cols", W);
    gridWrap.style.gridTemplateColumns = `repeat(${W}, var(--mg-cell-size))`;
    gridWrap.innerHTML = "";
    matrix.forEach((row) =>
      row.forEach((cell) => {
        const d = el("div", "mg-cw-cell");
        if (cell.block) d.classList.add("block");
        d.dataset.r = cell.r;
        d.dataset.c = cell.c;
        gridWrap.appendChild(d);
        cell.el = d;
      })
    );

    // Selection state
    let currentEntry = null; // {cells:[], dir, r,c, clue, answer}
    let curIndex = 0; // index within entry
    let armed = false; // first tap shows clue; second opens input
    let solving = false;

    function getAcrossRunRTL(r, fromC) {
      // expand left while not block; also include the current cell and cells to the right if contiguous
      let left = fromC;
      while (left >= 0 && !matrix[r][left].block) left--;
      left++;
      let right = fromC;
      while (right < W && !matrix[r][right].block) right++;
      right--;
      // Order RTL: from right -> left
      const arr = [];
      for (let c = right; c >= left; c--) arr.push({ r, c });
      return arr;
    }
    function getDownRun(fromR, c) {
      let top = fromR;
      while (top >= 0 && !matrix[top][c].block) top--;
      top++;
      let bottom = fromR;
      while (bottom < H && !matrix[bottom][c].block) bottom++;
      bottom--;
      const arr = [];
      for (let r = top; r <= bottom; r++) arr.push({ r, c });
      return arr;
    }
    function entryAtCell(r, c) {
      // Prefer longer run from this cell
      const a = getAcrossRunRTL(r, c);
      const d = getDownRun(r, c);
      const ad = a.length >= d.length ? "across" : "down";
      const run = ad === "across" ? a : d;
      // Try match an existing entry (to pick clue/answer)
      let found =
        entries.find((e) => e.dir === ad && e.cells.length === run.length && e.cells[0].r === run[0].r && e.cells[0].c === run[0].c) ||
        { dir: ad, cells: run, r: run[0].r, c: run[0].c, clue: "—", answer: "" };
      found.len = found.cells.length;
      return found;
    }

    function highlight(entry, idx = 0) {
      // clear
      matrix.forEach((row) =>
        row.forEach((cell) => {
          cell.el.classList.remove("sel", "cur");
        })
      );
      entry.cells.forEach(({ r, c }, k) => {
        matrix[r][c].el.classList.add("sel");
        if (k === idx) matrix[r][c].el.classList.add("cur");
      });
    }

    function showClue(entry) {
      const dirLabel = entry.dir === "down" ? "عمودي" : "أفقي";
      const lenLabel = `• ${entry.len} حروف`;
      clueTitle.textContent = entry.clue || "—";
      const wrap = el("div");
      wrap.append(el("span", null, dirLabel), el("span", null, "  —  "), el("span", null, lenLabel));
      clueTitle.innerHTML = "";
      clueTitle.append(el("span", null, entry.clue || "—"), el("span", null, ""), el("span"));
      clueTitle.firstChild.style.flex = "1";
      clueSub.textContent = `${dirLabel} • ${entry.len} حروف`;
      // Actions (مستقبلاً: كشف حرف/كلمة بالعملات)
      actions.innerHTML = "";
    }

    function setCursor(entry, idx) {
      currentEntry = entry;
      curIndex = idx;
      highlight(entry, idx);
      showClue(entry);
    }

    function focusInput(yes) {
      if (yes) {
        hidden.value = "";
        hidden.focus({ preventScroll: true });
      } else {
        hidden.blur();
      }
    }

    function nextIndex(entry, from) {
      for (let i = from + 1; i < entry.len; i++) {
        const { r, c } = entry.cells[i];
        const cell = matrix[r][c];
        if (!cell.block) return i;
      }
      return -1;
    }

    function entryString(entry, useUser = true) {
      return entry.cells
        .map(({ r, c }) => (useUser ? matrix[r][c].u : matrix[r][c].ch) || "")
        .join("")
        .replace(/\s+/g, "");
    }

    function clearUser(entry) {
      entry.cells.forEach(({ r, c }) => {
        matrix[r][c].u = "";
        matrix[r][c].el.textContent = "";
        matrix[r][c].el.classList.remove("bad");
      });
    }

    function markOK(entry) {
      entry.cells.forEach(({ r, c }) => {
        matrix[r][c].ok = true;
        matrix[r][c].el.classList.add("ok");
      });
    }

    function firstUnsolved() {
      for (const e of entries) {
        const done = e.cells.every(({ r, c }) => matrix[r][c].ok);
        if (!done) return e;
      }
      return null;
    }

    function checkEntry(entry) {
      if (!entry.answer) {
        // If no official answer in pack, accept anything non-empty as "correct" for demo
        const str = entryString(entry, true);
        if (str.length === entry.len) {
          markOK(entry);
          return true;
        }
        return false;
      }
      const A = normalizeAnswer(entry.answer);
      const U = normalizeAnswer(entryString(entry, true));
      if (U.length < entry.len) return false;
      if (A === U) {
        markOK(entry);
        return true;
      }
      // wrong
      entry.cells.forEach(({ r, c }) => matrix[r][c].el.classList.add("bad"));
      setTimeout(() => {
        entry.cells.forEach(({ r, c }) => matrix[r][c].el.classList.remove("bad"));
        clearUser(entry);
        setCursor(entry, 0);
      }, 180);
      return false;
    }

    function normalizeAnswer(str) {
      return (str || "")
        .replace(/\s+/g, "")
        .replace(/[^\u0600-\u06FFa-zA-Z]/g, "")
        .trim();
    }

    // Input handling
    hidden.addEventListener("input", (e) => {
      const val = toChar(e.target.value);
      e.target.value = "";
      if (!currentEntry || val === "") return;

      // Only accept one visible char (Arabic or Latin)
      const ch = val;
      const { r, c } = currentEntry.cells[curIndex];
      const cell = matrix[r][c];
      if (cell.block || cell.ok) return;

      cell.u = ch;
      cell.el.textContent = ch;

      // Advance
      const ni = nextIndex(currentEntry, curIndex);
      if (ni >= 0) {
        setCursor(currentEntry, ni);
      } else {
        // end of word -> check
        if (checkEntry(currentEntry)) {
          // move to next unsolved
          const nxt = firstUnsolved();
          if (nxt) {
            setCursor(nxt, 0);
            armed = false; // show clue first
            focusInput(false);
          } else {
            clueTitle.textContent = "أحسنت! اكتملت الشبكة 🎉";
            clueSub.textContent = "";
            focusInput(false);
          }
        } else {
          // wrong handled inside checkEntry
          focusInput(false);
        }
      }
    });

    // Tap/Swipe selection
    let startXY = null;
    function onPointerDown(ev) {
      const pt = pointerCell(ev);
      if (!pt) return;
      startXY = pt;
      ev.preventDefault();
    }
    function onPointerUp(ev) {
      const pt = pointerCell(ev);
      if (!pt) return;
      if (!startXY) startXY = pt;

      const { r, c } = pt;
      // choose direction by swipe
      const dx = (ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX) - (startXY.rawX || 0);
      const dy = (ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY) - (startXY.rawY || 0);
      const absX = Math.abs(dx), absY = Math.abs(dy);
      let entry = entryAtCell(r, c);
      if (absX > 20 || absY > 20) {
        if (absY > absX) entry = { ...entry, dir: "down", cells: getDownRun(r, c), r: getDownRun(r, c)[0].r, c: getDownRun(r, c)[0].c };
        else entry = { ...entry, dir: "across", cells: getAcrossRunRTL(r, c), r: getAcrossRunRTL(r, c)[0].r, c: getAcrossRunRTL(r, c)[0].c };
        entry.len = entry.cells.length;
      }
      setCursor(entry, 0);

      if (!armed) {
        // اللمسة الأولى: فقط إظهار التلميح
        armed = true;
        focusInput(false);
      } else {
        // اللمسة الثانية: افتح الإدخال
        focusInput(true);
      }
      startXY = null;
    }
    function pointerCell(ev) {
      const t = ev.touches ? ev.touches[0] : ev.changedTouches ? ev.changedTouches[0] : ev;
      const target = document.elementFromPoint(t.clientX, t.clientY);
      if (!target) return null;
      const cell = target.closest(".mg-cw-cell");
      if (!cell || cell.classList.contains("block")) return null;
      const r = +cell.dataset.r, c = +cell.dataset.c;
      return { r, c, rawX: t.clientX, rawY: t.clientY };
    }

    gridWrap.addEventListener("touchstart", onPointerDown, { passive: false });
    gridWrap.addEventListener("touchend", onPointerUp, { passive: false });
    gridWrap.addEventListener("mousedown", (e) => {
      onPointerDown(e);
      const up = (ev) => {
        onPointerUp(ev);
        window.removeEventListener("mouseup", up, true);
      };
      window.addEventListener("mouseup", up, true);
    });

    // Start with first unsolved
    const first = firstUnsolved() || entries[0];
    if (first) setCursor(first, 0);
    armed = false; // أول لمس يظهر التلميح

    // ===== Helpers for entries coming from packs ===========================
    function normalizeEntry(e) {
      const out = {
        r: Number(e.r ?? e.row ?? 0),
        c: Number(e.c ?? e.col ?? 0),
        dir: (e.dir || e.direction || "across").toLowerCase(),
        clue: e.clue || e.hint || "—",
        answer: (e.answer || e.solution || "").toString(),
        cells: Array.isArray(e.cells) ? e.cells.map((p) => ({ r: p.r ?? p[0], c: p.c ?? p[1] })) : null,
      };
      return out;
    }
  };
})();
