/* =====================================================
   AERO VISTA/7 — INTERACOES
   Menu iniciar, troca de tema (claro <-> escuro),
   janelas arrastaveis com abrir/fechar/minimizar,
   taskbar estilo Win7, icones de area de trabalho,
   menu de contexto, personalizar (wallpaper + cor),
   MSN (Cara Chato + Agiota), cassino (roleta + slots),
   bloco de notas, meu computador, lixeira.
===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  function pickRandom(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ---------- MENU INICIAR ---------- */
  const startButton = document.getElementById('startButton');
  const startMenu = document.getElementById('startMenu');

  if (startButton && startMenu){
    startButton.addEventListener('click', (e) => {
      e.stopPropagation();
      startMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && e.target !== startButton){
        startMenu.classList.remove('open');
      }
    });
  }

  /* ---------- Z-INDEX COMPARTILHADO: janela clicada/arrastada vai pra frente ---------- */
  let topZ = 10;

  function bringToFront(win){
    win.style.zIndex = ++topZ;
  }

  /* ---------- REGISTRO DE TODAS AS JANELAS (por id) ---------- */
  const windowsByApp = {};
  document.querySelectorAll('.window').forEach(win => {
    windowsByApp[win.id] = win;
  });

  const taskbarAppsContainer = document.getElementById('taskbarApps');

  // Todos os apps comecam fechados ao entrar no site (abre so quando o usuario clica)
  Object.values(windowsByApp).forEach(win => closeWindow(win));

  function getTaskbarBtn(win){
    return document.querySelector(`.taskbar-btn[data-app="${win.id}"]`);
  }

  function isMinimized(win){
    const body = win.querySelector('.window-body');
    return !!body && body.style.display === 'none';
  }

  function setWindowMinimized(win, minimized){
    const body = win.querySelector('.window-body');
    if (body) body.style.display = minimized ? 'none' : '';

    const btn = getTaskbarBtn(win);
    if (btn) btn.classList.toggle('active', !minimized && !win.classList.contains('is-closed'));
  }

  function ensureTaskbarBtn(win){
    let btn = getTaskbarBtn(win);
    if (!btn && taskbarAppsContainer){
      btn = document.createElement('button');
      btn.className = 'taskbar-btn dynamic';
      btn.dataset.app = win.id;
      const icon = win.querySelector('.titlebar-icon');
      btn.textContent = icon ? icon.textContent : '🗔';
      const title = win.querySelector('.titlebar-title');
      btn.setAttribute('aria-label', title ? title.textContent.trim() : win.id);
      taskbarAppsContainer.appendChild(btn);
    }
    return btn;
  }

  function removeDynamicTaskbarBtn(win){
    const btn = getTaskbarBtn(win);
    if (btn && btn.classList.contains('dynamic')){
      btn.remove();
    }
  }

  function openWindow(win){
    win.classList.remove('is-closed');
    ensureTaskbarBtn(win);
    setWindowMinimized(win, false);
    bringToFront(win);
  }

  function closeWindow(win){
    win.classList.add('is-closed');
    const btn = getTaskbarBtn(win);
    if (btn) btn.classList.remove('active');
    removeDynamicTaskbarBtn(win);
  }

  function toggleWindowFromTrigger(win){
    if (!win) return;
    if (win.classList.contains('is-closed') || isMinimized(win)){
      openWindow(win);
    } else {
      bringToFront(win);
    }
  }

  /* ---------- CLIQUE NA TASKBAR (delegado, funciona com botoes dinamicos) ---------- */
  if (taskbarAppsContainer){
    taskbarAppsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.taskbar-btn');
      if (!btn) return;
      const win = windowsByApp[btn.dataset.app];
      if (!win) return;

      if (win.classList.contains('is-closed')){
        openWindow(win);
        return;
      }

      setWindowMinimized(win, !isMinimized(win));
      if (!isMinimized(win)) bringToFront(win);
    });
  }

  /* ---------- MENU INICIAR: BUSCA + ABRIR APP PELA GRADE ---------- */
  const startSearchInput = document.getElementById('startSearchInput');
  const startAppTiles = document.querySelectorAll('.start-app-tile');
  const startNoResults = document.getElementById('startNoResults');

  function filterStartApps(query){
    const q = query.trim().toLowerCase();
    let anyVisible = false;

    startAppTiles.forEach(tile => {
      const nameEl = tile.querySelector('.start-app-name');
      const name = nameEl ? nameEl.textContent.toLowerCase() : '';
      const matches = name.includes(q);
      tile.style.display = matches ? '' : 'none';
      if (matches) anyVisible = true;
    });

    if (startNoResults) startNoResults.hidden = anyVisible;
  }

  if (startSearchInput){
    startSearchInput.addEventListener('input', (e) => {
      filterStartApps(e.target.value);
    });
  }

  startAppTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      toggleWindowFromTrigger(windowsByApp[tile.dataset.app]);
      if (startMenu) startMenu.classList.remove('open');
      if (startSearchInput) startSearchInput.value = '';
      filterStartApps('');
    });
  });

  /* ---------- RELOGIO DA TASKBAR ---------- */
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');

  function updateClock(){
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockTime.textContent = `${hh}:${mm}`;

    const dd = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    clockDate.textContent = `${dd}/${mo}/${yyyy}`;
  }

  if (clockTime && clockDate){
    updateClock();
    setInterval(updateClock, 1000 * 30);
  }

  /* ---------- ARRASTAR JANELAS ---------- */
  function makeDraggable(win){
    const titlebar = win.querySelector('.window-titlebar');
    if (!titlebar) return;

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function getPoint(e){
      return e.touches ? e.touches[0] : e;
    }

    function onDragStart(e){
      if (e.target.closest('.vista-btn')) return;

      const point = getPoint(e);
      const rect = win.getBoundingClientRect();

      dragging = true;
      offsetX = point.clientX - rect.left;
      offsetY = point.clientY - rect.top;

      win.style.position = 'fixed';
      win.style.left = rect.left + 'px';
      win.style.top = rect.top + 'px';
      win.style.margin = '0';
      win.classList.add('is-dragging');
      bringToFront(win);

      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchend', onDragEnd);
    }

    function onDragMove(e){
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();

      const point = getPoint(e);
      let newLeft = point.clientX - offsetX;
      let newTop = point.clientY - offsetY;

      const minVisible = 60;
      const maxLeft = window.innerWidth - minVisible;
      const maxTop = window.innerHeight - 40;

      newLeft = Math.max(minVisible - win.offsetWidth, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    }

    function onDragEnd(){
      dragging = false;
      win.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchend', onDragEnd);
    }

    titlebar.addEventListener('mousedown', onDragStart);
    titlebar.addEventListener('touchstart', onDragStart, { passive: true });

    win.addEventListener('mousedown', () => bringToFront(win));
  }

  /* ---------- CONTROLES DE JANELA ESTILO VISTA ---------- */
  document.querySelectorAll('.window').forEach(win => {
    const closeBtn = win.querySelector('.vista-close');
    const minBtn = win.querySelector('.vista-min');
    const maxBtn = win.querySelector('.vista-max');

    if (closeBtn){
      closeBtn.addEventListener('click', () => closeWindow(win));
    }

    if (minBtn){
      minBtn.addEventListener('click', () => setWindowMinimized(win, !isMinimized(win)));
    }

    if (maxBtn){
      maxBtn.addEventListener('click', () => {
        win.classList.toggle('is-maxed');
        bringToFront(win);
      });
    }

    makeDraggable(win);
  });

  /* ---------- TROCA DE TEMA: CLARO <-> ESCURO ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const body = document.body;
  const htmlEl = document.documentElement;

  function applyTheme(isDark){
    body.classList.toggle('theme-dark', isDark);
    htmlEl.classList.toggle('theme-dark', isDark);

    if (themeToggleIcon){
      themeToggleIcon.textContent = isDark ? '🌙' : '☀️';
    }
    if (themeToggle){
      themeToggle.setAttribute('aria-label', isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro');
      themeToggle.setAttribute('title', isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro');
    }
    try{
      localStorage.setItem('aero-theme', isDark ? 'dark' : 'light');
    }catch(err){ /* sem persistencia */ }
  }

  let savedTheme = null;
  try{ savedTheme = localStorage.getItem('aero-theme'); }catch(err){ savedTheme = null; }
  applyTheme(savedTheme === 'dark');

  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      applyTheme(!body.classList.contains('theme-dark'));
    });
  }

  /* ---------- MOSTRAR AREA DE TRABALHO ---------- */
  const showDesktopBtn = document.getElementById('showDesktopBtn');
  const allWindows = document.querySelectorAll('.window');
  let desktopPeek = false;

  if (showDesktopBtn){
    showDesktopBtn.addEventListener('click', () => {
      desktopPeek = !desktopPeek;
      allWindows.forEach(win => {
        if (win.classList.contains('is-closed')) return;
        win.style.opacity = desktopPeek ? '0' : '';
        win.style.transition = 'opacity 0.15s ease';
      });
    });
  }

  /* =====================================================
     ICONES DA AREA DE TRABALHO
  ===================================================== */
  const desktopIcons = document.getElementById('desktopIcons');
  const desktopIconEls = document.querySelectorAll('.desktop-icon');

  desktopIconEls.forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      desktopIconEls.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    });
    icon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      toggleWindowFromTrigger(windowsByApp[icon.dataset.app]);
    });
  });

  document.addEventListener('click', () => {
    desktopIconEls.forEach(i => i.classList.remove('selected'));
  });

  function setIconsVisible(visible){
    if (!desktopIcons) return;
    desktopIcons.classList.toggle('icons-hidden', !visible);
    const check = document.getElementById('exibirIconesCheck');
    const menuItem = document.querySelector('.context-item[data-action="exibir-icones"]');
    if (menuItem) menuItem.classList.toggle('icons-off', !visible);
    try{ localStorage.setItem('aero-icons-visible', visible ? '1' : '0'); }catch(err){}
  }

  let iconsVisible = true;
  try{ iconsVisible = localStorage.getItem('aero-icons-visible') !== '0'; }catch(err){}
  setIconsVisible(iconsVisible);

  /* =====================================================
     MENU DE CONTEXTO (BOTAO DIREITO NA AREA DE TRABALHO)
  ===================================================== */
  const contextMenu = document.getElementById('desktopContextMenu');

  function openContextMenu(x, y){
    if (!contextMenu) return;
    contextMenu.classList.add('open');
    const menuWidth = 250;
    const menuHeight = 230;
    const left = Math.min(x, window.innerWidth - menuWidth - 8);
    const top = Math.min(y, window.innerHeight - menuHeight - 8);
    contextMenu.style.left = Math.max(4, left) + 'px';
    contextMenu.style.top = Math.max(4, top) + 'px';
  }

  function closeContextMenu(){
    if (contextMenu) contextMenu.classList.remove('open');
  }

  document.addEventListener('contextmenu', (e) => {
    // só abre no "papel de parede" (area de trabalho), nunca em cima de janelas/icones/taskbar
    const blocked = e.target.closest('.window, .desktop-icon, .taskbar, .start-menu, .context-menu');
    if (blocked) return;
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY);
  });

  document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) closeContextMenu();
  });

  if (contextMenu){
    contextMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-item');
      if (!item) return;
      const action = item.dataset.action;

      if (action === 'exibir-icones'){
        setIconsVisible(desktopIcons.classList.contains('icons-hidden'));
      } else if (action === 'organizar'){
        if (desktopIcons) desktopIcons.classList.toggle('icons-grid');
      } else if (action === 'atualizar'){
        updateClock();
        if (desktopIcons){
          desktopIcons.style.opacity = '0.4';
          setTimeout(() => { desktopIcons.style.opacity = ''; }, 220);
        }
      } else if (action === 'novo-bloco'){
        toggleWindowFromTrigger(windowsByApp['notepad']);
      } else if (action === 'personalizar'){
        toggleWindowFromTrigger(windowsByApp['personalizar']);
      }

      closeContextMenu();
    });
  }

  /* =====================================================
     PERSONALIZAR — WALLPAPER + COR DE DESTAQUE (ACCENT)
  ===================================================== */
  const wallpaperLayer = document.getElementById('wallpaperLayer');
  const wallpaperGrid = document.getElementById('wallpaperGrid');
  const accentGrid = document.getElementById('accentGrid');
  const accentCustomInput = document.getElementById('accentCustomInput');
  const personalizarResetBtn = document.getElementById('personalizarResetBtn');

  const WALLPAPERS = {
    aero:   'radial-gradient(circle at 20% 15%, #bfe6ff, transparent 55%), linear-gradient(135deg, #7fc7ff, #1e6fd9)',
    sunset: 'radial-gradient(circle at 20% 15%, #ffe3bf, transparent 55%), linear-gradient(135deg, #ffb37f, #d9426f)',
    forest: 'radial-gradient(circle at 20% 15%, #d9ffc9, transparent 55%), linear-gradient(135deg, #8fdc7a, #1e7d47)',
    purple: 'radial-gradient(circle at 20% 15%, #ecd9ff, transparent 55%), linear-gradient(135deg, #c98fff, #5a1e9d)',
    dark:   'radial-gradient(circle at 20% 15%, #3a3a3a, transparent 55%), linear-gradient(135deg, #2a2a2a, #08060c)',
    cyan:   'radial-gradient(circle at 20% 15%, #d9fffb, transparent 55%), linear-gradient(135deg, #6fe3d6, #0e7a6e)'
  };

  function applyWallpaper(key, persist){
    const css = WALLPAPERS[key] || WALLPAPERS.aero;
    if (wallpaperLayer) wallpaperLayer.style.background = css;
    document.querySelectorAll('.wallpaper-swatch').forEach(sw => {
      sw.classList.toggle('selected', sw.dataset.wallpaper === key);
    });
    // as bolhas decorativas fixas (azuis/verdes/ciano) cobrem boa parte da tela
    // e escondem a troca de papel de parede; some com elas quando o usuario
    // escolhe qualquer wallpaper diferente do padrao "aero"
    document.body.classList.toggle('custom-wallpaper', key !== 'aero');
    if (persist){
      try{ localStorage.setItem('aero-wallpaper', key); }catch(err){}
    }
  }

  if (wallpaperGrid){
    wallpaperGrid.addEventListener('click', (e) => {
      const sw = e.target.closest('.wallpaper-swatch');
      if (!sw) return;
      applyWallpaper(sw.dataset.wallpaper, true);
    });
  }

  // ---- utilitarios de cor pra derivar os tons a partir da cor escolhida ----
  function hexToRgb(hex){
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function mix(rgb, target, weight){
    return {
      r: Math.round(rgb.r + (target.r - rgb.r) * weight),
      g: Math.round(rgb.g + (target.g - rgb.g) * weight),
      b: Math.round(rgb.b + (target.b - rgb.b) * weight)
    };
  }

  function rgba(rgb, a){
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  function rgbToHex(rgb){
    const h = n => n.toString(16).padStart(2, '0');
    return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
  }

  function applyAccent(hex, persist){
    const rgb = hexToRgb(hex);
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };

    const lightMid = mix(rgb, white, 0.55);
    const lightTop = mix(rgb, white, 0.7);
    const darkBottom = mix(rgb, black, 0.28);

    const darkTitlebarMid = mix(rgb, black, 0.35);
    const darkTitlebarBottom = mix(rgb, black, 0.55);
    const darkTaskbarTop = mix(rgb, black, 0.15);
    const darkTaskbarBottom = mix(rgb, black, 0.68);

    // aplica no <html> (tema claro le as variaveis daqui)
    const root = document.documentElement.style;
    root.setProperty('--blue-deep', hex);
    root.setProperty('--titlebar-grad-mid', rgba(lightMid, 0.78));
    root.setProperty('--titlebar-grad-bottom', rgba(rgb, 0.55));
    root.setProperty('--taskbar-grad-top', rgba(lightTop, 0.92));
    root.setProperty('--taskbar-grad-bottom', rgba(darkBottom, 0.92));

    // aplica tambem no <body>: o tema escuro (body.theme-dark) define essas
    // mesmas variaveis diretamente no body, o que sobrescreveria a escolha do
    // usuario se a gente so setasse no <html>. Setando aqui, a cor escolhida
    // funciona nos dois temas.
    const bodyStyle = document.body.style;
    bodyStyle.setProperty('--blue-deep', hex);
    bodyStyle.setProperty('--titlebar-grad-top', rgba(mix(rgb, white, 0.25), 0.95));
    bodyStyle.setProperty('--titlebar-grad-mid', rgba(darkTitlebarMid, 0.9));
    bodyStyle.setProperty('--titlebar-grad-bottom', rgba(darkTitlebarBottom, 0.92));
    bodyStyle.setProperty('--taskbar-grad-top', rgba(darkTaskbarTop, 0.95));
    bodyStyle.setProperty('--taskbar-grad-bottom', rgba(darkTaskbarBottom, 0.97));

    document.querySelectorAll('.accent-swatch').forEach(sw => {
      sw.classList.toggle('selected', sw.dataset.accent.toLowerCase() === hex.toLowerCase());
    });
    if (accentCustomInput) accentCustomInput.value = hex;

    if (persist){
      try{ localStorage.setItem('aero-accent', hex); }catch(err){}
    }
  }

  function resetAccent(persist){
    const props = ['--blue-deep', '--titlebar-grad-top', '--titlebar-grad-mid', '--titlebar-grad-bottom', '--taskbar-grad-top', '--taskbar-grad-bottom'];
    props.forEach(prop => document.documentElement.style.removeProperty(prop));
    props.forEach(prop => document.body.style.removeProperty(prop));
    document.querySelectorAll('.accent-swatch').forEach(sw => sw.classList.remove('selected'));
    if (accentCustomInput) accentCustomInput.value = '#1e6fd9';
    if (persist){
      try{ localStorage.removeItem('aero-accent'); }catch(err){}
    }
  }

  if (accentGrid){
    accentGrid.addEventListener('click', (e) => {
      const sw = e.target.closest('.accent-swatch');
      if (!sw) return;
      applyAccent(sw.dataset.accent, true);
    });
  }

  if (accentCustomInput){
    accentCustomInput.addEventListener('input', (e) => {
      applyAccent(e.target.value, true);
    });
  }

  if (personalizarResetBtn){
    personalizarResetBtn.addEventListener('click', () => {
      resetAccent(true);
      applyWallpaper('aero', true);
    });
  }

  // aplica wallpaper/cor salvos ao carregar
  let savedWallpaper = 'aero';
  let savedAccent = null;
  try{
    savedWallpaper = localStorage.getItem('aero-wallpaper') || 'aero';
    savedAccent = localStorage.getItem('aero-accent');
  }catch(err){}
  applyWallpaper(savedWallpaper, false);
  if (savedAccent) applyAccent(savedAccent, false);

  /* =====================================================
     BLOCO DE NOTAS (autosave)
  ===================================================== */
  const notepadTextarea = document.getElementById('notepadTextarea');
  if (notepadTextarea){
    try{
      const saved = localStorage.getItem('aero-notepad');
      if (saved !== null) notepadTextarea.value = saved;
    }catch(err){}

    notepadTextarea.addEventListener('input', () => {
      try{ localStorage.setItem('aero-notepad', notepadTextarea.value); }catch(err){}
    });
  }

  /* =====================================================
     LIXEIRA (decorativa)
  ===================================================== */
  const lixeiraEsvaziarBtn = document.getElementById('lixeiraEsvaziarBtn');
  const lixeiraMsg = document.getElementById('lixeiraMsg');
  if (lixeiraEsvaziarBtn && lixeiraMsg){
    lixeiraEsvaziarBtn.addEventListener('click', () => {
      lixeiraMsg.textContent = 'A Lixeira já estava vazia, mas tudo bem, esvaziamos de novo. ✨';
      setTimeout(() => { lixeiraMsg.textContent = 'A Lixeira está vazia.'; }, 2600);
    });
  }

  /* =====================================================
     APP: CASSINO — ROLETA + SLOTS (saldo compartilhado,
     pode ficar negativo)
  ===================================================== */
  const CASINO_STORAGE_KEY = 'aero-cassino-saldo';
  const CASINO_START_BALANCE = 500;
  const CASINO_RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const casinoBalanceEl = document.getElementById('casinoBalance');
  const casinoResultEl = document.getElementById('casinoResult');
  const casinoAmountInput = document.getElementById('casinoAmount');
  const casinoSpinBtn = document.getElementById('casinoSpinBtn');
  const casinoWheelEl = document.getElementById('casinoWheel');
  const casinoResetBtn = document.getElementById('casinoResetBtn');
  const casinoBetButtons = document.querySelectorAll('.casino-bet-btn');
  const casinoNegativeWarning = document.getElementById('casinoNegativeWarning');

  const slotsResultEl = document.getElementById('slotsResult');
  const slotsAmountInput = document.getElementById('slotsAmount');
  const slotsSpinBtn = document.getElementById('slotsSpinBtn');
  const slotReels = [
    document.getElementById('slotReel0'),
    document.getElementById('slotReel1'),
    document.getElementById('slotReel2')
  ];

  const casinoTabs = document.querySelectorAll('.casino-tab');
  const casinoPanels = document.querySelectorAll('.casino-panel');

  casinoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      casinoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      casinoPanels.forEach(p => { p.hidden = p.dataset.panel !== target; });
    });
  });

  let casinoBalance = CASINO_START_BALANCE;
  let casinoSpinning = false;
  let casinoSelectedBet = null;

  /* ---------- AGIOTA / DIVIDA (declarado aqui em cima pra nao dar erro
     de "temporal dead zone": renderCasinoBalance(), logo abaixo, ja chama
     funcoes que leem essas variaveis, entao elas precisam existir antes) ---------- */
  const AGIOTA_DEBT_STORAGE_KEY = 'aero-agiota-divida';
  let agiotaActive = false;
  let negativeSince = null;
  let agiotaDebt = 0;
  let agiotaNagCount = 0;
  let virusActive = false;
  let virusInterval = null;

  function loadAgiotaDebt(){
    try{
      const saved = localStorage.getItem(AGIOTA_DEBT_STORAGE_KEY);
      const parsed = saved !== null ? parseInt(saved, 10) : 0;
      agiotaDebt = Number.isNaN(parsed) ? 0 : parsed;
    }catch(err){
      agiotaDebt = 0;
    }
  }

  function saveAgiotaDebt(){
    try{ localStorage.setItem(AGIOTA_DEBT_STORAGE_KEY, String(agiotaDebt)); }catch(err){}
  }

  loadAgiotaDebt();

  /* ---------- APP NUBONK (tambem hoisted aqui em cima pelo mesmo motivo:
     renderNubonk() e chamada logo abaixo, dentro de renderCasinoBalance) ---------- */
  const nubonkBalanceEl = document.getElementById('nubonkBalance');
  const nubonkDebtEl = document.getElementById('nubonkDebt');
  const nubonkPayBtn = document.getElementById('nubonkPayBtn');
  const nubonkMsgEl = document.getElementById('nubonkMsg');

  function renderNubonk(){
    if (nubonkBalanceEl) nubonkBalanceEl.textContent = `R$ ${casinoBalance}`;
    if (nubonkDebtEl){
      nubonkDebtEl.textContent = agiotaDebt > 0 ? `R$ ${agiotaDebt}` : 'Nenhuma';
      nubonkDebtEl.classList.toggle('negative', agiotaDebt > 0);
    }
    if (nubonkPayBtn){
      const podePagar = agiotaDebt > 0 && casinoBalance >= agiotaDebt;
      nubonkPayBtn.disabled = !podePagar;
    }
  }

  function loadCasinoBalance(){
    try{
      const saved = localStorage.getItem(CASINO_STORAGE_KEY);
      const parsed = saved !== null ? parseInt(saved, 10) : CASINO_START_BALANCE;
      casinoBalance = Number.isNaN(parsed) ? CASINO_START_BALANCE : parsed;
    }catch(err){
      casinoBalance = CASINO_START_BALANCE;
    }
  }

  function saveCasinoBalance(){
    try{ localStorage.setItem(CASINO_STORAGE_KEY, String(casinoBalance)); }catch(err){}
  }

  function renderCasinoBalance(){
    if (!casinoBalanceEl) return;
    casinoBalanceEl.textContent = `R$ ${casinoBalance}`;
    casinoBalanceEl.classList.toggle('negative', casinoBalance < 0);
    if (casinoNegativeWarning) casinoNegativeWarning.hidden = casinoBalance >= 0;
    updateCasinoNegativeWatch();
  }

  function casinoNumberColor(n){
    if (n === 0) return 'verde';
    return CASINO_RED_NUMBERS.has(n) ? 'vermelho' : 'preto';
  }

  if (casinoBalanceEl){
    loadCasinoBalance();
    renderCasinoBalance();
  }

  casinoBetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (casinoSpinning) return;
      casinoSelectedBet = btn.dataset.bet;
      casinoBetButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  if (casinoSpinBtn){
    casinoSpinBtn.addEventListener('click', () => {
      if (casinoSpinning) return;

      if (!casinoSelectedBet){
        casinoResultEl.textContent = 'Escolha uma cor antes de girar.';
        return;
      }

      const amount = parseInt(casinoAmountInput.value, 10);
      if (!amount || amount <= 0){
        casinoResultEl.textContent = 'Digite um valor de aposta válido.';
        return;
      }

      casinoSpinning = true;
      casinoSpinBtn.disabled = true;
      casinoResultEl.textContent = 'Girando...';
      if (casinoWheelEl) casinoWheelEl.classList.add('spinning');

      casinoBalance -= amount;
      renderCasinoBalance();
      saveCasinoBalance();

      setTimeout(() => {
        const numeroSorteado = Math.floor(Math.random() * 37);
        const cor = casinoNumberColor(numeroSorteado);
        const acertou = cor === casinoSelectedBet;
        const multiplicador = cor === 'verde' ? 14 : 2;

        if (acertou){
          const ganho = amount * multiplicador;
          casinoBalance += ganho;
          casinoResultEl.textContent = `Saiu ${numeroSorteado} (${cor}). Você ganhou R$ ${ganho}!`;
        } else {
          casinoResultEl.textContent = `Saiu ${numeroSorteado} (${cor}). Você perdeu R$ ${amount}.`;
        }

        renderCasinoBalance();
        saveCasinoBalance();

        if (casinoWheelEl) casinoWheelEl.classList.remove('spinning');
        casinoSpinBtn.disabled = false;
        casinoSpinning = false;
      }, 1400);
    });
  }

  if (casinoResetBtn){
    casinoResetBtn.addEventListener('click', () => {
      if (casinoSpinning) return;
      casinoBalance = CASINO_START_BALANCE;
      renderCasinoBalance();
      saveCasinoBalance();
      if (casinoResultEl) casinoResultEl.textContent = 'Saldo reiniciado.';
      if (slotsResultEl) slotsResultEl.textContent = 'Saldo reiniciado.';
    });
  }

  /* ---------- SLOTS ---------- */
  const SLOT_SYMBOLS = ['🍒','🍒','🍒','🍒','🍋','🍋','🍋','🔔','🔔','💎','7️⃣'];
  const SLOT_PAYOUTS = { '🍒': 5, '🍋': 8, '🔔': 15, '💎': 30, '7️⃣': 50 };

  function spinSlots(){
    if (casinoSpinning) return;

    const amount = parseInt(slotsAmountInput.value, 10);
    if (!amount || amount <= 0){
      slotsResultEl.textContent = 'Digite um valor de aposta válido.';
      return;
    }

    casinoSpinning = true;
    slotsSpinBtn.disabled = true;
    slotsResultEl.textContent = 'Girando...';
    slotReels.forEach(r => r && r.classList.add('spinning'));

    casinoBalance -= amount;
    renderCasinoBalance();
    saveCasinoBalance();

    let ticks = 0;
    const flicker = setInterval(() => {
      slotReels.forEach(r => { if (r) r.textContent = pickRandom(SLOT_SYMBOLS); });
      ticks++;
      if (ticks > 10){
        clearInterval(flicker);

        const result = [pickRandom(SLOT_SYMBOLS), pickRandom(SLOT_SYMBOLS), pickRandom(SLOT_SYMBOLS)];
        result.forEach((sym, i) => { if (slotReels[i]) slotReels[i].textContent = sym; });
        slotReels.forEach(r => r && r.classList.remove('spinning'));

        if (result[0] === result[1] && result[1] === result[2]){
          const mult = SLOT_PAYOUTS[result[0]] || 5;
          const ganho = amount * mult;
          casinoBalance += ganho;
          slotsResultEl.textContent = `${result.join(' ')} — combinação! Você ganhou R$ ${ganho} (${mult}x)!`;
        } else {
          slotsResultEl.textContent = `${result.join(' ')} — não foi dessa vez. Você perdeu R$ ${amount}.`;
        }

        renderCasinoBalance();
        saveCasinoBalance();
        slotsSpinBtn.disabled = false;
        casinoSpinning = false;
      }
    }, 90);
  }

  if (slotsSpinBtn){
    slotsSpinBtn.addEventListener('click', spinSlots);
  }

  /* =====================================================
     MSN — CARA CHATO + AGIOTA
  ===================================================== */
  const msnWindow = windowsByApp['msn'];
  const msnMessages = document.getElementById('msnMessages');
  const msnChatHeader = document.getElementById('msnChatHeader');
  const msnContactsEl = document.getElementById('msnContacts');
  const msnComposeForm = document.getElementById('msnComposeForm');
  const msnComposeInput = document.getElementById('msnComposeInput');
  const msnAgiotaContact = document.getElementById('msnAgiotaContact');
  const badgeCarachato = document.getElementById('badgeCarachato');
  const badgeAgiota = document.getElementById('badgeAgiota');

  const contactNames = { carachato: 'Cara Chato', agiota: 'Agiota' };
  const chatHistory = { carachato: [], agiota: [] };
  const unread = { carachato: 0, agiota: 0 };
  let activeContact = 'carachato';

  function formatTime(){
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  function renderChat(){
    if (!msnMessages) return;
    msnMessages.innerHTML = '';
    chatHistory[activeContact].forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `msn-msg ${msg.sender === 'me' ? 'msn-msg-me' : 'msn-msg-them'}`;
      const textSpan = document.createElement('span');
      textSpan.textContent = msg.text;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'msn-msg-time';
      timeSpan.textContent = msg.time;
      bubble.appendChild(textSpan);
      bubble.appendChild(timeSpan);
      msnMessages.appendChild(bubble);
    });
    msnMessages.scrollTop = msnMessages.scrollHeight;
  }

  function updateBadge(contact){
    const badgeEl = contact === 'carachato' ? badgeCarachato : badgeAgiota;
    if (!badgeEl) return;
    if (unread[contact] > 0 && activeContact !== contact){
      badgeEl.hidden = false;
      badgeEl.textContent = String(unread[contact]);
    } else {
      badgeEl.hidden = true;
    }
  }

  function addMessage(contact, sender, text){
    chatHistory[contact].push({ sender, text, time: formatTime() });
    if (sender !== 'me' && activeContact !== contact){
      unread[contact]++;
    }
    if (activeContact === contact){
      renderChat();
    }
    updateBadge(contact);
  }

  function switchContact(contact){
    activeContact = contact;
    unread[contact] = 0;
    updateBadge(contact);
    if (msnChatHeader) msnChatHeader.textContent = contactNames[contact];
    document.querySelectorAll('.msn-contact').forEach(el => {
      el.classList.toggle('active', el.dataset.contact === contact);
    });
    renderChat();
  }

  if (msnContactsEl){
    msnContactsEl.addEventListener('click', (e) => {
      const contactEl = e.target.closest('.msn-contact');
      if (!contactEl || contactEl.hidden) return;
      switchContact(contactEl.dataset.contact);
    });
  }

  // mensagem inicial do Cara Chato
  addMessage('carachato', 'them', 'Ooooi! Bora trocar uma ideia? 😄');
  renderChat();

  /* ---------- CARA CHATO: IDIOTICES ALEATORIAS DE TEMPOS EM TEMPOS ---------- */
  const carachatoMessages = [
    'Sabia que os polvos têm três corações? Isso não tem nada a ver com nada mas fiquei pensando nisso.',
    'Cara, será que dá pra dobrar um papel mais de 7 vezes? Vou tentar aqui.',
    'Acabei de descobrir que o mel nunca estraga. A humanidade tá salva.',
    'Ei, você prefere lutar contra um pato do tamanho de um cavalo ou 100 patos do tamanho normal?',
    'To com uma dúvida seríssima: por que o suco de caixinha vem em formato de tijolo?',
    'Fiz uma pesquisa e 0% das pessoas sabiam responder isso, tenta você: quantos ossos tem uma girafa no pescoço?',
    'Se eu tivesse um super poder eu queria congelar o trânsito. E o micro-ondas também, tá sempre contando errado.',
    'Verdade ou mentira: flamingo é rosa por causa da comida que ele come. Só isso já muda minha vida.',
    'Alguém aí sabe por que a gente chama de "meia" se é sempre em par?',
    'Tava aqui pensando... será que os passarinhos sabem que estão voando?',
    'Fun fact do dia: banana é tecnicamente uma erva, não uma árvore. Isso é golpe.',
    'Se o Batman fosse contratado pela Uber, ele ia ter nota 5 estrelas ou ia dar B.O.?',
    'Descobri agora que dá pra assobiar com o nariz entupido. Ciência pura.',
    'Ei, será que os pinguins sentem frio? Eles tão sempre lá parados igual bem parado mesmo.',
    'Se você fosse um tempero, qual seria? To perguntando isso pra todo mundo hoje.',
    'Cara, acabei de ver que existe um dia internacional do abraço grátis. Manda um oi virtual aí.',
    'Sabia que o coração de camarão fica na cabeça? Isso resolveu minha existência.',
    'Passou um pombo aqui na janela e me olhou torto. Acho que ele sabe de algo.'
  ];

  function scheduleCarachato(){
    const minDelay = 30 * 1000;
    const maxDelay = 150 * 1000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    setTimeout(() => {
      addMessage('carachato', 'them', pickRandom(carachatoMessages));
      scheduleCarachato();
    }, delay);
  }
  scheduleCarachato();

  /* ---------- AGIOTA: COBRANCA SE FICAR NO NEGATIVO POR 30S ---------- */
  const insultosCultos = [
    'Sua conduta financeira é digna de um estudo antropológico sobre a irresponsabilidade humana.',
    'Permita-me a franqueza: sua relação com o dinheiro beira o insulto à própria matemática.',
    'Você possui a credibilidade de um cheque sem fundo, e digo isso com o maior dos desprezos educados.',
    'Sua negligência com as próprias dívidas seria cômica, não fosse tão trágica.',
    'Há uma elegância rara na sua incompetência financeira, devo admitir.',
    'Seu senso de responsabilidade parece ter saído de férias e esquecido de avisar.',
    'É notável como o senhor consegue ostentar tamanha displicência com tanta serenidade.',
    'Sua postura perante suas obrigações financeiras seria um excelente estudo de caso sobre o que não fazer.'
  ];

  const cobrancasCariocas = [
    'Bora, parceiro, cadê minha grana que já tô suado esperando aqui, hein?',
    'Ô mermão, isso aqui não é caridade não viu, quero meu dinheiro hoje!',
    'Segura a visão que eu não solto o pé não, hein? Paga logo esse trocado!',
    'Rapaz, memo assim de boa? Cadê meu din-din, sô?',
    'Fica ligado que eu não brinco em serviço não, quero minha grana ainda hoje!',
    'Ô meu consagrado, tá achando que eu tô de palhaçada é? Vaza esse dinheiro!',
    'Depois eu que sou o vilão da história, mas quem tá devendo é você, hein!',
    'Bora resolver isso logo que eu não tenho a paciência de Jó não, viu!',
    'Tá phoda, mas paga! Não me faz aparecer aí de surpresa não.',
    'Relaxa não que essa dívida não esquece sozinha, deposita logo aí!'
  ];

  function randomAgiotaLine(){
    return `${pickRandom(insultosCultos)} ${pickRandom(cobrancasCariocas)}`;
  }

  /* ---------- VIRUS DE TELA (janelas de caveira "ME PAGUE") ---------- */
  const MAX_VIRUS_POPUPS = 6;

  function spawnVirusWindow(){
    if (document.querySelectorAll('.virus-popup').length >= MAX_VIRUS_POPUPS) return;

    const popup = document.createElement('div');
    popup.className = 'virus-popup';

    const maxLeft = Math.max(0, window.innerWidth - 220);
    const maxTop = Math.max(0, window.innerHeight - 160);
    popup.style.left = Math.floor(Math.random() * maxLeft) + 'px';
    popup.style.top = Math.floor(Math.random() * maxTop) + 'px';

    popup.innerHTML = `
      <button class="virus-close" type="button" aria-label="Fechar">×</button>
      <span class="virus-skull">💀</span>
      <span class="virus-text">ME PAGUE</span>
    `;

    popup.querySelector('.virus-close').addEventListener('click', () => popup.remove());
    document.body.appendChild(popup);
  }

  function startVirus(){
    if (virusActive) return;
    virusActive = true;
    spawnVirusWindow();
    virusInterval = setInterval(spawnVirusWindow, 1600 + Math.random() * 1400);
  }

  function stopVirus(){
    virusActive = false;
    if (virusInterval){
      clearInterval(virusInterval);
      virusInterval = null;
    }
    document.querySelectorAll('.virus-popup').forEach(el => el.remove());
  }

  /* ---------- COBRANCA DO AGIOTA ---------- */
  function agiotaSendNag(prefix){
    agiotaNagCount++;
    const line = prefix ? `${prefix} ${randomAgiotaLine()}` : randomAgiotaLine();
    addMessage('agiota', 'them', line);

    if (agiotaNagCount >= 5 && !virusActive){
      addMessage('agiota', 'them', 'Já mandei aviso demais e você me ignorou. Agora eu tomo outras providências.');
      startVirus();
    }
  }

  function scheduleAgiotaNag(){
    if (!agiotaActive) return;
    const minDelay = 20 * 1000;
    const maxDelay = 45 * 1000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    setTimeout(() => {
      if (agiotaActive && agiotaDebt > 0) agiotaSendNag();
      if (agiotaActive) scheduleAgiotaNag();
    }, delay);
  }

  function showAgiota(){
    if (agiotaActive) return;
    agiotaActive = true;
    agiotaNagCount = 1;
    if (msnAgiotaContact) msnAgiotaContact.hidden = false;
    addMessage('agiota', 'them', `Olá, seja bem-vindo à minha lista de cobrança. Você me deve R$ ${agiotaDebt}. ${randomAgiotaLine()}`);
    scheduleAgiotaNag();
  }

  // se o usuario ja tinha uma divida de uma sessao anterior (salva no
  // localStorage), o agiota ja aparece cobrando assim que o MSN carrega,
  // sem precisar esperar 30s negativo de novo
  if (agiotaDebt > 0){
    agiotaActive = true;
    agiotaNagCount = 0;
    if (msnAgiotaContact) msnAgiotaContact.hidden = false;
    addMessage('agiota', 'them', `Você ainda me deve R$ ${agiotaDebt} da última vez. ${randomAgiotaLine()}`);
    scheduleAgiotaNag();
  }

  function quitarDividaAgiota(){
    if (!(agiotaDebt > 0 && casinoBalance >= agiotaDebt)) return;

    const valorPago = agiotaDebt;
    casinoBalance -= valorPago;
    saveCasinoBalance();

    agiotaDebt = 0;
    saveAgiotaDebt();
    agiotaNagCount = 0;
    agiotaActive = false;
    negativeSince = null;
    stopVirus();

    if (msnAgiotaContact) msnAgiotaContact.hidden = true;
    if (badgeAgiota) badgeAgiota.hidden = true;
    addMessage('agiota', 'them', 'Valeu, quitado. Mas fica esperto da próxima vez, hein.');

    renderCasinoBalance();
    renderNubonk();
    if (nubonkMsgEl) nubonkMsgEl.textContent = `Dívida de R$ ${valorPago} quitada com o agiota.`;
  }

  function updateCasinoNegativeWatch(){
    if (casinoBalance < 0){
      if (negativeSince === null) negativeSince = Date.now();
      if (-casinoBalance > agiotaDebt){
        agiotaDebt = -casinoBalance;
        saveAgiotaDebt();
      }
    } else {
      negativeSince = null;
    }
    renderNubonk();
  }

  setInterval(() => {
    if (negativeSince !== null && !agiotaActive && (Date.now() - negativeSince) >= 30000){
      showAgiota();
    }
  }, 1000);

  function sendMsnMessage(){
    if (!msnComposeInput) return;
    const text = msnComposeInput.value.trim();
    if (!text) return;

    addMessage(activeContact, 'me', text);
    msnComposeInput.value = '';

    if (activeContact === 'agiota'){
      setTimeout(() => {
        if (agiotaDebt > 0){
          agiotaSendNag();
        } else {
          addMessage('agiota', 'them', 'Tá tudo quitado entre nós, pode ficar tranquilo.');
        }
      }, 500 + Math.random() * 700);
    } else if (activeContact === 'carachato' && Math.random() < 0.4){
      setTimeout(() => {
        addMessage('carachato', 'them', pickRandom(carachatoMessages));
      }, 600 + Math.random() * 900);
    }
  }

  if (nubonkPayBtn){
    nubonkPayBtn.addEventListener('click', () => {
      quitarDividaAgiota();
    });
  }

  renderNubonk();

  const msnSendBtn = msnComposeForm ? msnComposeForm.querySelector('.msn-send-btn') : null;

  // clique no botao "Enviar"
  if (msnSendBtn){
    msnSendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sendMsnMessage();
    });
  }

  // tecla Enter no campo de mensagem
  if (msnComposeInput){
    msnComposeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter'){
        e.preventDefault();
        sendMsnMessage();
      }
    });
  }

  // reforco: se por algum motivo o form for submetido (ex.: Enter em navegadores
  // que ainda tratam isso como submit), nunca deixa a pagina recarregar
  if (msnComposeForm){
    msnComposeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMsnMessage();
    });
  }

  /* =====================================================
     APP: PLAYER DE AUDIO — playlist padrao (pasta "audios/")
     + upload de arquivos locais (fica so na sessao atual)
  ===================================================== */
  const PLAYER_DEFAULT_TRACKS = [
    { name: 'Música 1', src: 'audios/musica-1.mp3' },
    { name: 'Música 2', src: 'audios/musica-2.mp3' }
  ];

  const playerAudio = document.getElementById('playerAudio');
  const playerDisc = document.getElementById('playerDisc');
  const playerTrackTitle = document.getElementById('playerTrackTitle');
  const playerPlayBtn = document.getElementById('playerPlayBtn');
  const playerPrevBtn = document.getElementById('playerPrevBtn');
  const playerNextBtn = document.getElementById('playerNextBtn');
  const playerSeek = document.getElementById('playerSeek');
  const playerCurrentTimeEl = document.getElementById('playerCurrentTime');
  const playerDurationEl = document.getElementById('playerDuration');
  const playerVolume = document.getElementById('playerVolume');
  const playerPlaylistEl = document.getElementById('playerPlaylist');
  const playerUploadInput = document.getElementById('playerUploadInput');
  const playerStatusEl = document.getElementById('playerStatus');

  let playerTracks = PLAYER_DEFAULT_TRACKS.map(t => ({ ...t }));
  let playerCurrentIndex = -1;
  let playerSeekDragging = false;

  function formatPlayerTime(seconds){
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderPlayerPlaylist(){
    if (!playerPlaylistEl) return;
    playerPlaylistEl.innerHTML = '';

    if (!playerTracks.length){
      const empty = document.createElement('p');
      empty.className = 'player-empty-msg';
      empty.textContent = 'Nenhuma música na playlist ainda.';
      playerPlaylistEl.appendChild(empty);
      return;
    }

    playerTracks.forEach((track, i) => {
      const isActive = i === playerCurrentIndex;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'player-track' + (isActive ? ' active' : '');

      const icon = document.createElement('span');
      icon.className = 'player-track-icon';
      icon.textContent = isActive && playerAudio && !playerAudio.paused ? '🔊' : '🎵';

      const name = document.createElement('span');
      name.className = 'player-track-name';
      name.textContent = track.name;

      btn.appendChild(icon);
      btn.appendChild(name);
      btn.addEventListener('click', () => playPlayerTrackAt(i));
      playerPlaylistEl.appendChild(btn);
    });
  }

  function playPlayerTrackAt(i){
    if (!playerAudio || i < 0 || i >= playerTracks.length) return;
    playerCurrentIndex = i;
    const track = playerTracks[i];

    if (playerStatusEl) playerStatusEl.textContent = '';
    playerAudio.src = track.src;
    playerAudio.play().catch(() => {
      if (playerStatusEl){
        playerStatusEl.textContent = `Não consegui tocar "${track.name}". Verifique se o arquivo está na pasta "audios".`;
      }
    });

    if (playerTrackTitle) playerTrackTitle.textContent = track.name;
    renderPlayerPlaylist();
  }

  if (playerPlayBtn){
    playerPlayBtn.addEventListener('click', () => {
      if (!playerAudio) return;
      if (playerCurrentIndex === -1){
        if (playerTracks.length) playPlayerTrackAt(0);
        return;
      }
      if (playerAudio.paused) playerAudio.play().catch(() => {});
      else playerAudio.pause();
    });
  }

  if (playerPrevBtn){
    playerPrevBtn.addEventListener('click', () => {
      if (!playerTracks.length) return;
      const prev = (playerCurrentIndex - 1 + playerTracks.length) % playerTracks.length;
      playPlayerTrackAt(prev);
    });
  }

  if (playerNextBtn){
    playerNextBtn.addEventListener('click', () => {
      if (!playerTracks.length) return;
      const next = (playerCurrentIndex + 1) % playerTracks.length;
      playPlayerTrackAt(next);
    });
  }

  if (playerAudio){
    playerAudio.volume = playerVolume ? playerVolume.value / 100 : 0.8;

    playerAudio.addEventListener('play', () => {
      if (playerPlayBtn) playerPlayBtn.textContent = '⏸';
      if (playerDisc) playerDisc.classList.add('spinning');
      renderPlayerPlaylist();
    });

    playerAudio.addEventListener('pause', () => {
      if (playerPlayBtn) playerPlayBtn.textContent = '▶';
      if (playerDisc) playerDisc.classList.remove('spinning');
      renderPlayerPlaylist();
    });

    playerAudio.addEventListener('timeupdate', () => {
      if (playerSeek && !playerSeekDragging){
        playerSeek.value = playerAudio.duration ? (playerAudio.currentTime / playerAudio.duration) * 100 : 0;
      }
      if (playerCurrentTimeEl) playerCurrentTimeEl.textContent = formatPlayerTime(playerAudio.currentTime);
    });

    playerAudio.addEventListener('loadedmetadata', () => {
      if (playerDurationEl) playerDurationEl.textContent = formatPlayerTime(playerAudio.duration);
    });

    playerAudio.addEventListener('ended', () => {
      if (playerNextBtn) playerNextBtn.click();
    });

    playerAudio.addEventListener('error', () => {
      if (playerCurrentIndex === -1) return;
      const track = playerTracks[playerCurrentIndex];
      if (playerStatusEl && track){
        playerStatusEl.textContent = `Não encontrei o arquivo de "${track.name}". Confira se ele está na pasta "audios" (ou tente enviar o arquivo pelo botão "Enviar áudio").`;
      }
      if (playerDisc) playerDisc.classList.remove('spinning');
      if (playerPlayBtn) playerPlayBtn.textContent = '▶';
    });
  }

  if (playerSeek){
    playerSeek.addEventListener('mousedown', () => { playerSeekDragging = true; });
    playerSeek.addEventListener('touchstart', () => { playerSeekDragging = true; }, { passive: true });

    playerSeek.addEventListener('change', () => {
      if (playerAudio && playerAudio.duration){
        playerAudio.currentTime = (playerSeek.value / 100) * playerAudio.duration;
      }
      playerSeekDragging = false;
    });
  }

  if (playerVolume){
    playerVolume.addEventListener('input', () => {
      if (playerAudio) playerAudio.volume = playerVolume.value / 100;
    });
  }

  if (playerUploadInput){
    playerUploadInput.addEventListener('change', () => {
      const files = Array.from(playerUploadInput.files || []);
      if (!files.length) return;

      files.forEach(file => {
        const url = URL.createObjectURL(file);
        const label = file.name.replace(/\.[^./]+$/, '');
        playerTracks.push({ name: label, src: url });
      });

      renderPlayerPlaylist();
      playerUploadInput.value = '';

      if (playerStatusEl){
        playerStatusEl.textContent = files.length === 1
          ? `"${files[0].name}" adicionado à playlist.`
          : `${files.length} áudios adicionados à playlist.`;
      }
    });
  }

  renderPlayerPlaylist();

});