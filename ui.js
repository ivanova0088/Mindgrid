/* MindGrid – UI bootstrap (uiGlow2) */
(() => {
  const $ = sel => document.querySelector(sel);

  const state = {
    countries: []
  };

  // ==== Theme toggle ====
  const THEME_KEY = 'mg_theme';
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  $('#themeToggle')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem(THEME_KEY, cur);
  });

  // ==== Countries ====
  const fallbackCountries = [
    "الإمارات","السعودية","قطر","الكويت","عمان","البحرين",
    "مصر","الأردن","المغرب","العراق","الجزائر","تونس","لبنان","سوريا","فلسطين","اليمن","السودان","ليبيا","موريتانيا","جيبوتي","الصومال"
  ];

  async function loadCountries(){
    try{
      const res = await fetch('countries.json', {cache:'no-store'});
      if(!res.ok) throw new Error('no countries.json');
      const data = await res.json();
      const list = data?.countries?.map(c => (c.ar || c.name || c)) || [];
      state.countries = (list.length ? list : fallbackCountries);
    }catch(e){
      state.countries = fallbackCountries;
    }
    fillCountrySelect();
  }

  function fillCountrySelect(){
    const sel = $('#country');
    if(!sel) return;
    // clear except first placeholder
    sel.querySelectorAll('option:not([disabled])').forEach(o=>o.remove());
    state.countries.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
    // restore last used
    const last = localStorage.getItem('mg_country') || '';
    if(last){
      sel.value = last;
    }
  }

  // ==== Start form ====
  $('#startForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const country = $('#country').value || '';
    const diff = (document.querySelector('input[name="diff"]:checked')?.value) || 'medium';

    if(!name || name.length < 2){
      alert('رجاءً اكتب اسمًا صالحًا من حرفين فأكثر.');
      return;
    }
    // save
    localStorage.setItem('mg_name', name);
    if(country) localStorage.setItem('mg_country', country);
    localStorage.setItem('mg_difficulty', diff);

    // hand off to app if available
    const payload = {name, country, difficulty: diff};
    if(window.MG && typeof MG.start === 'function'){
      MG.start(payload);
    }else if(window.MG && typeof MG.go === 'function'){
      MG.go('main', payload);
    }else{
      alert('تم حفظ الإعدادات. اربط MG.start(payload) للانتقال إلى اللعبة.');
    }
  });

  // manual refresh (cache bust helper)
  $('#refreshBtn')?.addEventListener('click', () => {
    const u = new URL(location.href);
    u.searchParams.set('cb', String(Date.now()));
    location.replace(u.toString());
  });

  // Prefill name if exists
  const lastName = localStorage.getItem('mg_name');
  if(lastName){ $('#name').value = lastName; }

  loadCountries();
})();
