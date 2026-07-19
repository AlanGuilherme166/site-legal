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

    const handle = win.querySelector('.window-resize-handle');
    if (handle) handle.style.display = minimized ? 'none' : '';

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

  /* ---------- REDIMENSIONAR JANELAS (alca no canto inferior direito) ---------- */
  function makeResizable(win){
    const handle = document.createElement('span');
    handle.className = 'window-resize-handle';
    handle.setAttribute('aria-hidden', 'true');
    win.appendChild(handle);

    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    function getPoint(e){
      return e.touches ? e.touches[0] : e;
    }

    function onResizeStart(e){
      if (isMinimized(win)) return;

      const point = getPoint(e);
      const rect = win.getBoundingClientRect();

      // se a janela ainda nao foi arrastada, ela esta no fluxo normal:
      // fixa a posicao atual antes de comecar a redimensionar, igual ao arrastar
      if (win.style.position !== 'fixed'){
        win.style.position = 'fixed';
        win.style.left = rect.left + 'px';
        win.style.top = rect.top + 'px';
        win.style.margin = '0';
      }

      // remove o max-width de apps especificos (cassino, navegador etc.) pra permitir crescer
      win.style.maxWidth = 'none';

      resizing = true;
      startX = point.clientX;
      startY = point.clientY;
      startWidth = rect.width;
      startHeight = rect.height;

      win.classList.add('is-resizing');
      bringToFront(win);

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('touchmove', onResizeMove, { passive: false });
      document.addEventListener('mouseup', onResizeEnd);
      document.addEventListener('touchend', onResizeEnd);

      e.preventDefault();
      e.stopPropagation();
    }

    function onResizeMove(e){
      if (!resizing) return;
      if (e.cancelable) e.preventDefault();

      const point = getPoint(e);
      const rect = win.getBoundingClientRect();

      const minWidth = 280;
      const minHeight = 160;
      const maxWidth = window.innerWidth - rect.left - 12;
      const maxHeight = window.innerHeight - rect.top - 12;

      let newWidth = startWidth + (point.clientX - startX);
      let newHeight = startHeight + (point.clientY - startY);

      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

      win.style.width = newWidth + 'px';
      win.style.height = newHeight + 'px';
    }

    function onResizeEnd(){
      resizing = false;
      win.classList.remove('is-resizing');
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('touchmove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
      document.removeEventListener('touchend', onResizeEnd);
    }

    handle.addEventListener('mousedown', onResizeStart);
    handle.addEventListener('touchstart', onResizeStart, { passive: false });
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
    makeResizable(win);
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

  /* =====================================================
     INVENTÁRIO (compartilhado entre aicomida e vitrine,
     persistido em localStorage, separado por categoria)
  ===================================================== */
  const AERO_INVENTORY_KEY = 'aero-inventario';

  const INVENTORY_CATEGORIES = [
    { id: 'comida',  label: '🍔 Comida',  empty: 'Nenhuma comida no inventário ainda. Compre no aicomida.' },
    { id: 'defesas', label: '💉 Defesas', empty: 'Nenhum estimulante no inventário ainda. Compre no aicomida (aba Stim).' },
    { id: 'jogos',   label: '🎮 Jogos',   empty: 'Nenhum jogo na biblioteca ainda. Compre na Vitrine.' }
  ];

  const FOOD_CATALOG = [
    { id: 'pizza',   emoji: '🍕', name: 'Pizza Marguerita',     price: 650, heal: 15 },
    { id: 'burger',  emoji: '🍔', name: 'Hambúrguer Artesanal', price: 550, heal: 12 },
    { id: 'sushi',   emoji: '🍣', name: 'Combinado de Sushi',   price: 900, heal: 20 },
    { id: 'massa',   emoji: '🍝', name: 'Macarrão à Carbonara', price: 700, heal: 16 },
    { id: 'acai',    emoji: '🍧', name: 'Açaí na Tigela',       price: 500, heal: 10 },
    { id: 'coxinha', emoji: '🧉', name: 'Coxinha (unidade)',    price: 500, heal: 8  },
    { id: 'salada',  emoji: '🥗', name: 'Salada Caesar',        price: 600, heal: 14 },
    { id: 'refri',   emoji: '🥤', name: 'Refrigerante Lata',    price: 500, heal: 5  }
  ];

  const STIM_CATALOG = [
    { id: 'stim_leve',    emoji: '💉', name: 'Stim Leve',      price: 1200, heal: 35  },
    { id: 'stim_turbo',   emoji: '💊', name: 'Stim Turbo',     price: 2500, heal: 70  },
    { id: 'stim_max',     emoji: '🧪', name: 'Stim Máximo',    price: 4000, heal: 100 },
    { id: 'pocao_sorte',    emoji: '🍀', name: 'Poção da Sorte',    price: 6000,  moneyMult: 1.5 },
    { id: 'pocao_milagre',  emoji: '🌟', name: 'Poção Milagrosa',   price: 15000, moneyMult: 2.0 },
    { id: 'pocao_dobro',    emoji: '✨', name: 'Poção do Dobro',    price: 4000,  boostMult: 2,  boostMinutes: 5  },
    { id: 'pocao_quadrupla', emoji: '💠', name: 'Poção Quádrupla',  price: 8000,  boostMult: 4,  boostMinutes: 5  },
    { id: 'pocao_decupla',  emoji: '🔥', name: 'Poção 10x',         price: 12000, boostMult: 10, boostMinutes: 10 }
  ];

  const GAME_CATALOG = [
    {
      id: 'fuga_policia',
      emoji: '🚓',
      name: 'Fuga da Polícia',
      price: 15000,
      desc: 'Turno a turno: fuja de 2 guardas e prenda eles contra a parede pra abrir caminho até a porta.'
    },
    {
      id: 'xadrez',
      emoji: '♟️',
      name: 'Xadrez',
      price: 20000,
      desc: 'Duelo de tabuleiro pra dois jogadores no mesmo PC. Capture o rei do adversário pra vencer.'
    }
  ];

  function findCatalogItem(categoria, itemId){
    const catalogo = categoria === 'comida' ? FOOD_CATALOG : (categoria === 'defesas' ? STIM_CATALOG : GAME_CATALOG);
    return catalogo.find(i => i.id === itemId);
  }

  let inventory = { comida: {}, defesas: {}, jogos: {} };

  function loadInventory(){
    try{
      const saved = localStorage.getItem(AERO_INVENTORY_KEY);
      if (saved){
        const parsed = JSON.parse(saved);
        inventory = {
          comida:  (parsed && parsed.comida)  || {},
          defesas: (parsed && parsed.defesas) || {},
          jogos:   (parsed && parsed.jogos)   || {}
        };
      }
    }catch(err){
      inventory = { comida: {}, defesas: {}, jogos: {} };
    }
  }

  function saveInventory(){
    try{ localStorage.setItem(AERO_INVENTORY_KEY, JSON.stringify(inventory)); }catch(err){}
  }

  function addToInventory(categoria, itemId, qtd){
    if (!inventory[categoria]) inventory[categoria] = {};
    inventory[categoria][itemId] = (inventory[categoria][itemId] || 0) + qtd;
    saveInventory();
    renderInventory();
  }

  function removeFromInventory(categoria, itemId, qtd){
    if (!inventory[categoria] || !inventory[categoria][itemId]) return;
    inventory[categoria][itemId] -= qtd;
    if (inventory[categoria][itemId] <= 0) delete inventory[categoria][itemId];
    saveInventory();
    renderInventory();
  }

  const inventarioCategoriesEl = document.getElementById('inventarioCategories');

  function renderInventory(){
    if (!inventarioCategoriesEl) return;
    inventarioCategoriesEl.innerHTML = '';

    INVENTORY_CATEGORIES.forEach(cat => {
      const wrap = document.createElement('div');
      wrap.className = 'inventario-category';

      const title = document.createElement('p');
      title.className = 'inventario-category-title';
      title.textContent = cat.label;
      wrap.appendChild(title);

      const ids = Object.keys(inventory[cat.id] || {}).filter(id => inventory[cat.id][id] > 0);

      if (ids.length === 0){
        const empty = document.createElement('p');
        empty.className = 'inventario-category-empty';
        empty.textContent = cat.empty;
        wrap.appendChild(empty);
      } else {
        const list = document.createElement('div');
        list.className = 'inventario-list';

        ids.forEach(itemId => {
          const item = findCatalogItem(cat.id, itemId);
          if (!item) return;
          const qtd = inventory[cat.id][itemId];

          let actionLabel = 'Usar';
          if (cat.id === 'comida') actionLabel = 'Comer';
          if (cat.id === 'jogos') actionLabel = 'Jogar';

          const qtyText = cat.id === 'jogos'
            ? 'Adquirido ✅'
            : (item.boostMult
              ? `Quantidade: ${qtd} · multiplica por ${item.boostMult}x o dinheiro ganho durante ${item.boostMinutes} min`
              : (item.moneyMult
                ? `Quantidade: ${qtd} · multiplica o saldo por ${item.moneyMult}x`
                : `Quantidade: ${qtd} · cura ${item.heal} de energia`));

          const row = document.createElement('div');
          row.className = 'inventario-item';
          row.innerHTML = `
            <span class="inventario-item-emoji">${item.emoji}</span>
            <span class="inventario-item-info">
              <span class="inventario-item-name">${item.name}</span>
              <span class="inventario-item-qty">${qtyText}</span>
            </span>
            <button class="inventario-use-btn" type="button" data-cat="${cat.id}" data-item="${itemId}">${actionLabel}</button>
          `;
          list.appendChild(row);
        });

        wrap.appendChild(list);
      }

      inventarioCategoriesEl.appendChild(wrap);
    });

    inventarioCategoriesEl.querySelectorAll('.inventario-use-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        const itemId = btn.getAttribute('data-item');
        if (cat === 'jogos'){
          playGameFromInventory(itemId);
        } else {
          useConsumable(cat, itemId);
        }
      });
    });
  }

  // useConsumable() mexe em digEnergy/renderDigEnergy/saveDigEnergy/digResultEl,
  // que sao declarados mais abaixo (bloco do Trabalho) — funciona pois essa
  // funcao so roda quando o usuario clica em "Comer/Usar", muito depois do
  // carregamento inicial do script (sem problema de TDZ).
  /* ---------- BOOST TEMPORARIO DE DINHEIRO (poções da aba Stim) ---------- */
  const MONEY_BOOST_KEY = 'aero-money-boost';
  let moneyBoostMult = 1;
  let moneyBoostEndsAt = 0;

  function loadMoneyBoost(){
    try{
      const saved = JSON.parse(localStorage.getItem(MONEY_BOOST_KEY));
      if (saved && saved.endsAt > Date.now()){
        moneyBoostMult = saved.mult;
        moneyBoostEndsAt = saved.endsAt;
      }
    }catch(err){ /* ignora */ }
  }

  function saveMoneyBoost(){
    try{ localStorage.setItem(MONEY_BOOST_KEY, JSON.stringify({ mult: moneyBoostMult, endsAt: moneyBoostEndsAt })); }catch(err){}
  }

  function getMoneyBoostMult(){
    if (moneyBoostEndsAt > Date.now()) return moneyBoostMult;
    return 1;
  }

  function applyEarnBoost(valor){
    return Math.round(valor * getMoneyBoostMult());
  }

  function activateMoneyBoost(mult, minutes){
    moneyBoostMult = mult;
    moneyBoostEndsAt = Date.now() + minutes * 60 * 1000;
    saveMoneyBoost();
    renderMoneyBoostStatus();
  }

  function renderMoneyBoostStatus(){
    const active = moneyBoostEndsAt > Date.now();
    const restanteMs = moneyBoostEndsAt - Date.now();
    const texto = active
      ? `⚡ Boost ativo: ${moneyBoostMult}x no dinheiro ganho (${Math.floor(restanteMs / 60000)}:${String(Math.floor((restanteMs % 60000) / 1000)).padStart(2, '0')} restantes)`
      : '';

    [aicomidaBoostStatusEl, digBoostStatusEl].forEach(el => {
      if (!el) return;
      el.textContent = texto;
      el.hidden = !active;
    });
  }

  loadMoneyBoost();
  setInterval(renderMoneyBoostStatus, 1000);

  function useConsumable(categoria, itemId){
    const item = findCatalogItem(categoria, itemId);
    if (!item) return;
    if (!inventory[categoria] || !inventory[categoria][itemId]) return;

    if (item.boostMult){
      activateMoneyBoost(item.boostMult, item.boostMinutes);
      removeFromInventory(categoria, itemId, 1);
      if (digResultEl) digResultEl.textContent = `Você usou ${item.name}! Agora todo dinheiro que ganhar é multiplicado por ${item.boostMult}x durante ${item.boostMinutes} minutos.`;
      return;
    }

    if (item.moneyMult){
      const saldoAntes = casinoBalance;
      casinoBalance = Math.round(casinoBalance * item.moneyMult);
      saveCasinoBalance();
      renderCasinoBalance();
      renderDigBalance();

      removeFromInventory(categoria, itemId, 1);

      if (digResultEl) digResultEl.textContent = `Você usou ${item.name} e seu saldo saltou de R$ ${saldoAntes} pra R$ ${casinoBalance}!`;
      return;
    }

    digEnergy = Math.min(DIG_MAX_ENERGY, digEnergy + item.heal);
    saveDigEnergy();
    renderDigEnergy();
    renderDigBalance();

    removeFromInventory(categoria, itemId, 1);

    if (digResultEl) digResultEl.textContent = `Você usou ${item.name} e recuperou ${item.heal} de energia!`;
  }

  // playGameFromInventory() mexe no app Vitrine, declarado mais abaixo —
  // mesmo raciocinio: so roda em resposta a clique do usuario.
  function playGameFromInventory(itemId){
    openWindow(windowsByApp['vitrine']);
    vitrineSwitchTab('biblioteca');
    launchGame(itemId);
  }

  loadInventory();
  if (inventarioCategoriesEl) renderInventory();

  /* =====================================================
     APP: AICOMIDA — LOJA DE COMIDA E STIM (saldo
     compartilhado via casinoBalance, itens vao pro
     Inventário em vez de serem consumidos na hora)
  ===================================================== */
  const aicomidaBalanceEl = document.getElementById('aicomidaBalance');
  const aicomidaBoostStatusEl = document.getElementById('aicomidaBoostStatus');
  const aicomidaFoodListEl = document.getElementById('aicomidaFoodList');
  const aicomidaStimListEl = document.getElementById('aicomidaStimList');
  const aicomidaFeedbackEl = document.getElementById('aicomidaFeedback');

  const aicomidaTabs = document.querySelectorAll('.aicomida-tab');
  const aicomidaPanels = document.querySelectorAll('.aicomida-panel');

  aicomidaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      aicomidaTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      aicomidaPanels.forEach(p => { p.hidden = p.dataset.panel !== target; });
    });
  });

  function renderAicomidaBalance(){
    if (!aicomidaBalanceEl) return;
    aicomidaBalanceEl.textContent = `R$ ${casinoBalance}`;
    aicomidaBalanceEl.classList.toggle('negative', casinoBalance < 0);
  }

  let aicomidaFeedbackTimeout = null;
  function showAicomidaFeedback(text, isError){
    if (!aicomidaFeedbackEl) return;
    aicomidaFeedbackEl.textContent = text;
    aicomidaFeedbackEl.classList.toggle('error', !!isError);
    aicomidaFeedbackEl.hidden = false;
    if (aicomidaFeedbackTimeout) clearTimeout(aicomidaFeedbackTimeout);
    aicomidaFeedbackTimeout = setTimeout(() => { aicomidaFeedbackEl.hidden = true; }, 2200);
  }

  function comprarAicomida(categoria, itemId){
    const item = findCatalogItem(categoria, itemId);
    if (!item) return;

    if (casinoBalance < item.price){
      showAicomidaFeedback('Saldo insuficiente pra essa compra.', true);
      return;
    }

    casinoBalance -= item.price;
    saveCasinoBalance();
    renderCasinoBalance();

    addToInventory(categoria, itemId, 1);
    showAicomidaFeedback(`${item.emoji} ${item.name} comprado! Foi pro seu Inventário.`, false);
  }

  function buildAicomidaCatalogList(containerEl, catalogo, categoria){
    if (!containerEl) return;
    containerEl.innerHTML = '';

    catalogo.forEach(item => {
      const row = document.createElement('div');
      row.className = 'aicomida-item';
      const efeitoHtml = item.boostMult
        ? `<span class="aicomida-item-heal">multiplica por ${item.boostMult}x o dinheiro ganho durante ${item.boostMinutes} min</span>`
        : (item.moneyMult
          ? `<span class="aicomida-item-heal">multiplica o saldo por ${item.moneyMult}x</span>`
          : `<span class="aicomida-item-heal">+${item.heal} de energia</span>`);
      row.innerHTML = `
        <span class="aicomida-item-emoji">${item.emoji}</span>
        <span class="aicomida-item-info">
          <span class="aicomida-item-name">${item.name}</span>
          <span class="aicomida-item-price">R$ ${item.price}</span>
          ${efeitoHtml}
        </span>
        <button class="aicomida-buy-btn" type="button" data-cat="${categoria}" data-item="${item.id}">Comprar</button>
      `;
      containerEl.appendChild(row);
    });

    containerEl.querySelectorAll('.aicomida-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const categoriaBtn = btn.getAttribute('data-cat');
        const itemId = btn.getAttribute('data-item');
        comprarAicomida(categoriaBtn, itemId);
      });
    });
  }

  if (aicomidaFoodListEl || aicomidaStimListEl){
    buildAicomidaCatalogList(aicomidaFoodListEl, FOOD_CATALOG, 'comida');
    buildAicomidaCatalogList(aicomidaStimListEl, STIM_CATALOG, 'defesas');
  }

  /* ---------- APP TRABALHO / ESCAVAÇÃO (tambem hoisted aqui em cima:
     renderDigBalance() e chamada la embaixo, dentro de updateCasinoNegativeWatch,
     que roda toda vez que o saldo do cassino muda) ---------- */
  const digBalanceEl = document.getElementById('digBalance');
  const digBoostStatusEl = document.getElementById('digBoostStatus');
  const digEnergyFillEl = document.getElementById('digEnergyFill');
  const digEnergyValueEl = document.getElementById('digEnergyValue');
  const digHoleEl = document.getElementById('digHole');
  const digShovelEl = document.getElementById('digShovel');
  const digFindPopupEl = document.getElementById('digFindPopup');
  const digResultEl = document.getElementById('digResult');
  const digBtn = document.getElementById('digBtn');
  const digHistoryEl = document.getElementById('digHistory');

  const DIG_ENERGY_KEY = 'aero-trabalho-energia';
  const DIG_ENERGY_TS_KEY = 'aero-trabalho-energia-ts';
  const DIG_MAX_ENERGY = 100;
  const DIG_ENERGY_COST = 20;
  const DIG_ENERGY_REGEN_MS = 4500; // recupera 1 de energia a cada 4.5s (bem mais devagar — use comida/stim pra acelerar)

  const DIG_FINDS = [
    { label: 'Pedrinha',          emoji: '🪨', weight: 40,  min: 100,  max: 250 },
    { label: 'Pedra boa',         emoji: '🪨', weight: 25,  min: 250,  max: 500 },
    { label: 'Prata',             emoji: '🥈', weight: 15,  min: 500,  max: 1000 },
    { label: 'Ouro',              emoji: '🥇', weight: 10,  min: 1000, max: 2500 },
    { label: 'Ouro grande',       emoji: '💰', weight: 6,   min: 2500, max: 4500 },
    { label: 'Diamante',          emoji: '💎', weight: 3,   min: 4500, max: 7000 },
    { label: 'Diamante gigante',  emoji: '💎', weight: 0.8, min: 7000, max: 9500 },
    { label: 'Diamante lendário', emoji: '👑', weight: 0.2, min: 9500, max: 10000 }
  ];
  const DIG_TOTAL_WEIGHT = DIG_FINDS.reduce((soma, f) => soma + f.weight, 0);

  let digEnergy = DIG_MAX_ENERGY;
  let digging = false;

  function loadDigEnergy(){
    try{
      const savedEnergy = localStorage.getItem(DIG_ENERGY_KEY);
      const savedTs = localStorage.getItem(DIG_ENERGY_TS_KEY);
      let energy = savedEnergy !== null ? parseFloat(savedEnergy) : DIG_MAX_ENERGY;
      if (Number.isNaN(energy)) energy = DIG_MAX_ENERGY;

      if (savedTs){
        const elapsedMs = Date.now() - parseInt(savedTs, 10);
        if (elapsedMs > 0){
          energy = Math.min(DIG_MAX_ENERGY, energy + (elapsedMs / DIG_ENERGY_REGEN_MS));
        }
      }
      digEnergy = energy;
    }catch(err){
      digEnergy = DIG_MAX_ENERGY;
    }
  }

  function saveDigEnergy(){
    try{
      localStorage.setItem(DIG_ENERGY_KEY, String(digEnergy));
      localStorage.setItem(DIG_ENERGY_TS_KEY, String(Date.now()));
    }catch(err){}
  }

  function renderDigBalance(){
    if (!digBalanceEl) return;
    digBalanceEl.textContent = `R$ ${casinoBalance}`;
    digBalanceEl.classList.toggle('negative', casinoBalance < 0);
  }

  function renderDigEnergy(){
    const pct = Math.max(0, Math.min(100, (digEnergy / DIG_MAX_ENERGY) * 100));
    if (digEnergyFillEl) digEnergyFillEl.style.width = `${pct}%`;
    if (digEnergyValueEl) digEnergyValueEl.textContent = Math.floor(digEnergy);
    if (digBtn) digBtn.disabled = digging || digEnergy < DIG_ENERGY_COST;
  }

  function pickDigFind(){
    let r = Math.random() * DIG_TOTAL_WEIGHT;
    for (const find of DIG_FINDS){
      if (r < find.weight) return find;
      r -= find.weight;
    }
    return DIG_FINDS[0];
  }

  function addDigHistory(find, valor){
    if (!digHistoryEl) return;
    const item = document.createElement('span');
    item.className = 'dig-history-item';
    item.textContent = `${find.emoji} R$ ${valor}`;
    digHistoryEl.insertBefore(item, digHistoryEl.firstChild);
    while (digHistoryEl.children.length > 6){
      digHistoryEl.removeChild(digHistoryEl.lastChild);
    }
  }

  if (digBtn){
    loadDigEnergy();
    renderDigEnergy();
    renderDigBalance();

    digBtn.addEventListener('click', () => {
      if (digging || digEnergy < DIG_ENERGY_COST) return;

      digging = true;
      digEnergy -= DIG_ENERGY_COST;
      renderDigEnergy();
      saveDigEnergy();

      if (digResultEl) digResultEl.textContent = 'Cavando...';
      if (digHoleEl) digHoleEl.classList.add('digging');
      if (digShovelEl) digShovelEl.classList.add('digging');
      if (digFindPopupEl) digFindPopupEl.hidden = true;

      setTimeout(() => {
        const find = pickDigFind();
        const valorBase = Math.floor(Math.random() * (find.max - find.min + 1)) + find.min;
        const valor = applyEarnBoost(valorBase);

        casinoBalance += valor;
        renderCasinoBalance();
        saveCasinoBalance();
        renderDigBalance();

        if (digResultEl){
          digResultEl.textContent = getMoneyBoostMult() > 1
            ? `${find.emoji} Você achou: ${find.label}! Ganhou R$ ${valor} (boost ${getMoneyBoostMult()}x aplicado).`
            : `${find.emoji} Você achou: ${find.label}! Ganhou R$ ${valor}.`;
        }
        addDigHistory(find, valor);

        if (digHoleEl){
          digHoleEl.classList.remove('digging');
          digHoleEl.classList.add('found');
          setTimeout(() => digHoleEl.classList.remove('found'), 400);
        }
        if (digShovelEl) digShovelEl.classList.remove('digging');

        if (digFindPopupEl){
          digFindPopupEl.textContent = find.emoji;
          digFindPopupEl.hidden = false;
          void digFindPopupEl.offsetWidth; // reinicia a animação
          setTimeout(() => { digFindPopupEl.hidden = true; }, 950);
        }

        digging = false;
        renderDigEnergy();
      }, 1100);
    });

    setInterval(() => {
      if (digEnergy < DIG_MAX_ENERGY){
        digEnergy = Math.min(DIG_MAX_ENERGY, digEnergy + (1000 / DIG_ENERGY_REGEN_MS));
        renderDigEnergy();
        saveDigEnergy();
      }
    }, 1000);
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
    renderAicomidaBalance();
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
          const ganho = applyEarnBoost(amount * multiplicador);
          casinoBalance += ganho;
          casinoResultEl.textContent = getMoneyBoostMult() > 1
            ? `Saiu ${numeroSorteado} (${cor}). Você ganhou R$ ${ganho} (boost ${getMoneyBoostMult()}x aplicado)!`
            : `Saiu ${numeroSorteado} (${cor}). Você ganhou R$ ${ganho}!`;
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
          const ganho = applyEarnBoost(amount * mult);
          casinoBalance += ganho;
          slotsResultEl.textContent = getMoneyBoostMult() > 1
            ? `${result.join(' ')} — combinação! Você ganhou R$ ${ganho} (${mult}x · boost ${getMoneyBoostMult()}x)!`
            : `${result.join(' ')} — combinação! Você ganhou R$ ${ganho} (${mult}x)!`;
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
  const badgeNerdsabido = document.getElementById('badgeNerdsabido');
  const badgeAssistente = document.getElementById('badgeAssistente');

  const contactNames = { carachato: 'Cara Chato', agiota: 'Agiota', nerdsabido: 'Nerd Sabido', assistente: 'Assistente Virtual' };
  const contactBadges = { carachato: badgeCarachato, agiota: badgeAgiota, nerdsabido: badgeNerdsabido, assistente: badgeAssistente };
  const chatHistory = { carachato: [], agiota: [], nerdsabido: [], assistente: [] };
  const unread = { carachato: 0, agiota: 0, nerdsabido: 0, assistente: 0 };
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
    const badgeEl = contactBadges[contact];
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

  // mensagem inicial da Assistente Virtual (uma única vez, quando o site começa)
  addMessage('assistente', 'them', 'Sou sua assistente virtual, vou ajuda-lo a utilizar o sistema, me pergunte o que quiser!! Perguntas prontas: "jogos" (te explico sobre a vitrine de jogos), "trabalho" (te explico sobre o jogo de cavar pra ganhar dinheiro) e "dívidas" (te explico o que rola quando seu saldo fica negativo).');

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
    renderDigBalance();
  }

  setInterval(() => {
    if (negativeSince !== null && !agiotaActive && (Date.now() - negativeSince) >= 30000){
      showAgiota();
    }
  }, 1000);

  /* ---------- NERD SABIDO: responde por palavras-chave ---------- */
  const nerdGreetingReplies = ['eae', 'salve', 'o que você quer?', 'qual foi?'];
  const nerdHelpReply = 'ajudar com o que?';
  const nerdVirusReply = 'abre o cmd e escreve /system -apt virus uninstall';
  const nerdThanksReply = 'tmj 👍';

  const nerdHelpKeywords = ['ajuda', 'ajude', 'ajudar', 'socorro', 'sos', 'me ajuda', 'preciso de ajuda', 'help'];
  const nerdThanksKeywords = ['obrigado', 'obrigada', 'obg', 'valeu', 'vlw', 'brigado', 'brigada', 'thanks', 'thank you'];

  function normalizeNerdText(text){
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function nerdSabidoReply(text){
    const normalized = normalizeNerdText(text);

    if (normalized.includes('virus')){
      return nerdVirusReply;
    }
    if (nerdHelpKeywords.some(k => normalized.includes(k))){
      return nerdHelpReply;
    }
    if (nerdThanksKeywords.some(k => normalized.includes(k))){
      return nerdThanksReply;
    }
    return pickRandom(nerdGreetingReplies);
  }

  /* ---------- ASSISTENTE VIRTUAL: responde por palavras-chave ---------- */
  const assistenteGreetingKeywords = ['oi', 'ola', 'eae', 'opa', 'salve', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'oii', 'ooi'];
  const assistenteJogosKeywords = ['jogos', 'jogo', 'vitrine', 'biblioteca'];
  const assistenteTrabalhoKeywords = ['trabalho', 'trampo', 'cavar', 'escavacao', 'pa', 'emprego', 'servico'];
  const assistenteDividasKeywords = ['divida', 'dividas', 'negativo', 'agiota', 'devendo', 'debito'];

  const assistenteXingamentos = [
    'idiota', 'burro', 'burra', 'imbecil', 'estupido', 'estupida', 'merda', 'porra', 'caralho',
    'fdp', 'desgraca', 'vagabunda', 'vadia', 'puta', 'arrombado', 'otario', 'otaria', 'vsf',
    'bosta', 'lixo', 'inutil', 'retardado', 'retardada'
  ];

  const assistenteCantadas = [
    'te amo', 'apaixonado por voce', 'apaixonada por voce', 'namorar', 'namora comigo', 'ficar comigo',
    'sair comigo', 'ficarmos juntos', 'ser meu namorado', 'ser minha namorada', 'quer namorar',
    'voce e gostosa', 'voce e gata', 'voce e linda', 'voce e linda', 'da seu whats', 'seu instagram',
    'voce e solteira', 'casar comigo', 'me da um beijo', 'um bj', 'voce e gostosa'
  ];

  const assistenteTristeReplies = [
    '😢 Poxa, não precisava ser grosso(a) comigo, eu só tô tentando ajudar...',
    'Isso me deixou triste. Eu só quero te ajudar a usar o sistema, viu?',
    '😞 Fiquei chateada com isso. Se quiser, é só me perguntar sobre jogos, trabalho ou dívidas.'
  ];

  const assistenteCantadaReplies = [
    'você é esquisito, procure uma mulher de verdade 😅',
    'calma aí, hein? Sou só um programa. Procure uma mulher de verdade.',
    'isso foi estranho... vai procurar uma mulher de verdade pra namorar 😬'
  ];

  const assistenteJogosReply = 'A Vitrine (ícone 🎮) é a lojinha de jogos: lá você compra jogos com o seu saldo do Nubonk e depois joga direto na aba Biblioteca. Cada jogo comprado fica guardado no seu Inventário, então você não perde o que já pagou.';
  const assistenteTrabalhoReply = 'Na Escavação (ícone da pá 🪏) você cava buracos pra ganhar dinheiro, que cai direto no seu saldo do Nubonk. Cada cavada gasta energia — às vezes você acha só pedra, às vezes ouro, e raramente um diamante gigante! A energia recupera sozinha bem devagar, ou você come algo ou usa um stim no Inventário pra acelerar.';
  const assistenteDividasReply = 'Se o seu saldo no Nubonk ficar negativo por muito tempo, um agiota aparece aqui no MSN cobrando a dívida. Se você ignorar as cobranças dele por tempo demais, as coisas ficam feias. O melhor é quitar a dívida assim que o seu saldo cobrir o valor, lá na aba Nubonk.';

  const assistenteGenericReplies = [
    'Não entendi muito bem, mas posso te explicar sobre "jogos", "trabalho" ou "dívidas". É só perguntar!',
    'Pode me perguntar sobre "jogos", "trabalho" ou "dívidas" que eu te explico certinho 🙂',
    'Hmm, tenta perguntar sobre "jogos", "trabalho" ou "dívidas" pra eu te ajudar melhor!'
  ];

  function assistenteReply(text){
    const normalized = normalizeNerdText(text);

    if (assistenteXingamentos.some(k => normalized.includes(k))){
      return pickRandom(assistenteTristeReplies);
    }
    if (assistenteCantadas.some(k => normalized.includes(k))){
      return pickRandom(assistenteCantadaReplies);
    }
    if (assistenteJogosKeywords.some(k => normalized.includes(k))){
      return assistenteJogosReply;
    }
    if (assistenteTrabalhoKeywords.some(k => normalized.includes(k))){
      return assistenteTrabalhoReply;
    }
    if (assistenteDividasKeywords.some(k => normalized.includes(k))){
      return assistenteDividasReply;
    }
    if (assistenteGreetingKeywords.some(k => normalized.includes(k))){
      return 'Oi! 😄 Pode me perguntar sobre "jogos", "trabalho" ou "dívidas" que eu te explico como usar o sistema.';
    }
    return pickRandom(assistenteGenericReplies);
  }

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
    } else if (activeContact === 'nerdsabido'){
      setTimeout(() => {
        addMessage('nerdsabido', 'them', nerdSabidoReply(text));
      }, 500 + Math.random() * 700);
    } else if (activeContact === 'assistente'){
      setTimeout(() => {
        addMessage('assistente', 'them', assistenteReply(text));
      }, 500 + Math.random() * 700);
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

  /* =====================================================
     APP: VITRINE — LOJA + BIBLIOTECA (estilo Steam) E
     O JOGO "FUGA DA POLÍCIA" (turnos em grade 6x6)
  ===================================================== */
  const vitrineLojaGridEl = document.getElementById('vitrineLojaGrid');
  const vitrineBibliotecaGridEl = document.getElementById('vitrineBibliotecaGrid');
  const vitrineBibliotecaEmptyEl = document.getElementById('vitrineBibliotecaEmpty');
  const vitrineFeedbackEl = document.getElementById('vitrineFeedback');

  const vitrineTabs = document.querySelectorAll('.vitrine-tab');
  const vitrinePanels = document.querySelectorAll('.vitrine-panel');

  function vitrineSwitchTab(target){
    vitrineTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    vitrinePanels.forEach(p => { p.hidden = p.dataset.panel !== target; });
  }

  vitrineTabs.forEach(tab => {
    tab.addEventListener('click', () => vitrineSwitchTab(tab.dataset.tab));
  });

  let vitrineFeedbackTimeout = null;
  function showVitrineFeedback(text, isError){
    if (!vitrineFeedbackEl) return;
    vitrineFeedbackEl.textContent = text;
    vitrineFeedbackEl.classList.toggle('error', !!isError);
    vitrineFeedbackEl.hidden = false;
    if (vitrineFeedbackTimeout) clearTimeout(vitrineFeedbackTimeout);
    vitrineFeedbackTimeout = setTimeout(() => { vitrineFeedbackEl.hidden = true; }, 2400);
  }

  function renderVitrineLoja(){
    if (!vitrineLojaGridEl) return;
    vitrineLojaGridEl.innerHTML = '';

    GAME_CATALOG.forEach(game => {
      const owned = !!(inventory.jogos && inventory.jogos[game.id] > 0);
      const card = document.createElement('div');
      card.className = 'vitrine-card';
      card.innerHTML = `
        <span class="vitrine-card-cover">${game.emoji}</span>
        <span class="vitrine-card-info">
          <span class="vitrine-card-name">${game.name}</span>
          <span class="vitrine-card-desc">${game.desc}</span>
          <span class="vitrine-card-price">R$ ${game.price.toLocaleString('pt-BR')}</span>
        </span>
        <button class="vitrine-card-btn${owned ? ' owned' : ''}" type="button" data-game="${game.id}"${owned ? ' disabled' : ''}>${owned ? '✅ Adquirido' : 'Comprar'}</button>
      `;
      vitrineLojaGridEl.appendChild(card);
    });

    vitrineLojaGridEl.querySelectorAll('.vitrine-card-btn').forEach(btn => {
      btn.addEventListener('click', () => comprarJogo(btn.getAttribute('data-game')));
    });
  }

  function renderVitrineBiblioteca(){
    if (!vitrineBibliotecaGridEl) return;
    vitrineBibliotecaGridEl.innerHTML = '';

    const ownedIds = Object.keys(inventory.jogos || {}).filter(id => inventory.jogos[id] > 0);
    if (vitrineBibliotecaEmptyEl) vitrineBibliotecaEmptyEl.hidden = ownedIds.length > 0;

    ownedIds.forEach(gameId => {
      const game = GAME_CATALOG.find(g => g.id === gameId);
      if (!game) return;
      const card = document.createElement('div');
      card.className = 'vitrine-card';
      card.innerHTML = `
        <span class="vitrine-card-cover">${game.emoji}</span>
        <span class="vitrine-card-info">
          <span class="vitrine-card-name">${game.name}</span>
          <span class="vitrine-card-desc">${game.desc}</span>
        </span>
        <button class="vitrine-card-btn" type="button" data-game="${game.id}">▶ Jogar</button>
      `;
      vitrineBibliotecaGridEl.appendChild(card);
    });

    vitrineBibliotecaGridEl.querySelectorAll('.vitrine-card-btn').forEach(btn => {
      btn.addEventListener('click', () => launchGame(btn.getAttribute('data-game')));
    });
  }

  function comprarJogo(gameId){
    const game = GAME_CATALOG.find(g => g.id === gameId);
    if (!game) return;
    if (inventory.jogos && inventory.jogos[gameId] > 0) return;

    if (casinoBalance < game.price){
      showVitrineFeedback('Saldo insuficiente pra comprar esse jogo.', true);
      return;
    }

    casinoBalance -= game.price;
    saveCasinoBalance();
    renderCasinoBalance();

    addToInventory('jogos', gameId, 1);
    showVitrineFeedback(`${game.emoji} ${game.name} comprado! Já tá na sua Biblioteca.`, false);
    renderVitrineLoja();
    renderVitrineBiblioteca();
  }

  function launchGame(gameId){
    const windowId = gameId === 'fuga_policia' ? 'jogo-fuga-policia' : (gameId === 'xadrez' ? 'jogo-xadrez' : null);
    if (!windowId) return;
    const win = windowsByApp[windowId];
    if (!win) return;

    if (gameId === 'fuga_policia') escapeResetGame();
    if (gameId === 'xadrez') chessResetGame();

    openWindow(win);
  }

  if (vitrineLojaGridEl || vitrineBibliotecaGridEl){
    renderVitrineLoja();
    renderVitrineBiblioteca();
  }

  /* ---------- JOGO: FUGA DA POLÍCIA (grade 6x6, turnos, 2 guardas) ----------
     Regra de "prender contra a parede": a cada turno, cada guarda tenta
     se mover pra célula vizinha que mais aproxima dele de você. Se ele
     nao tiver NENHUMA célula livre pra ir (bloqueado pelas bordas da
     grade, por você ou pelo outro guarda), ele fica preso (🔒) e para
     de perseguir — abrindo caminho até a porta 🚪. */
  const ESCAPE_GRID_SIZE = 6;
  const escapeGridEl = document.getElementById('escapeGrid');
  const escapeStatusEl = document.getElementById('escapeStatus');
  const escapeCtrlBtns = document.querySelectorAll('.escape-ctrl-btn');
  const escapeResetBtn = document.getElementById('escapeResetBtn');

  let escapeState = null;

  function escapeInBounds(r, c){
    return r >= 0 && r < ESCAPE_GRID_SIZE && c >= 0 && c < ESCAPE_GRID_SIZE;
  }

  function escapeCellBlocked(r, c, excludeGuard){
    return escapeState.guards.some(g => g !== excludeGuard && g.r === r && g.c === c);
  }

  function escapeResetGame(){
    escapeState = {
      player: { r: 5, c: 2 },
      guards: [
        { r: 0, c: 0, trapped: false },
        { r: 0, c: 5, trapped: false }
      ],
      exit: { r: 0, c: 2 },
      over: false,
      won: false,
      turns: 0
    };
    escapeRender();
  }

  function escapeRender(){
    if (!escapeGridEl || !escapeState) return;
    escapeGridEl.innerHTML = '';

    for (let r = 0; r < ESCAPE_GRID_SIZE; r++){
      for (let c = 0; c < ESCAPE_GRID_SIZE; c++){
        const cell = document.createElement('div');
        cell.className = 'escape-cell';

        const guardHere = escapeState.guards.find(g => g.r === r && g.c === c);
        const isPlayer = escapeState.player.r === r && escapeState.player.c === c;
        const isExit = escapeState.exit.r === r && escapeState.exit.c === c;

        if (isPlayer){
          cell.classList.add('escape-player');
          cell.textContent = '🏃';
        } else if (guardHere){
          cell.classList.add(guardHere.trapped ? 'escape-guard-trapped' : 'escape-guard');
          cell.textContent = guardHere.trapped ? '🔒' : '👮';
        } else if (isExit){
          cell.classList.add('escape-exit');
          cell.textContent = '🚪';
        }

        escapeGridEl.appendChild(cell);
      }
    }

    if (escapeStatusEl){
      if (escapeState.won){
        escapeStatusEl.textContent = 'Você escapou! 🎉 A polícia ficou pra trás.';
        escapeStatusEl.className = 'escape-status win';
      } else if (escapeState.over){
        escapeStatusEl.textContent = 'Você foi pego! 🚨 Aperte "Recomeçar" pra tentar de novo.';
        escapeStatusEl.className = 'escape-status lose';
      } else {
        const presos = escapeState.guards.filter(g => g.trapped).length;
        escapeStatusEl.textContent = presos > 0
          ? `${presos} guarda(s) preso(s) na parede! Corre pra porta 🚪. (Turno ${escapeState.turns})`
          : `Fuja dos guardas e chegue até a porta 🚪. (Turno ${escapeState.turns})`;
        escapeStatusEl.className = 'escape-status';
      }
    }

    escapeCtrlBtns.forEach(btn => { btn.disabled = escapeState.over; });
  }

  function escapeMove(dir){
    if (!escapeState || escapeState.over) return;

    let dr = 0, dc = 0;
    if (dir === 'up') dr = -1;
    else if (dir === 'down') dr = 1;
    else if (dir === 'left') dc = -1;
    else if (dir === 'right') dc = 1;

    if (dir !== 'wait'){
      const targetR = escapeState.player.r + dr;
      const targetC = escapeState.player.c + dc;

      if (!escapeInBounds(targetR, targetC)){
        if (escapeStatusEl) escapeStatusEl.textContent = 'Não dá pra passar da parede ali!';
        return;
      }
      if (escapeCellBlocked(targetR, targetC, null)){
        if (escapeStatusEl) escapeStatusEl.textContent = 'Tem um guarda no caminho!';
        return;
      }
      escapeState.player = { r: targetR, c: targetC };
    }

    // Chegou na porta -> venceu
    if (escapeState.player.r === escapeState.exit.r && escapeState.player.c === escapeState.exit.c){
      escapeState.won = true;
      escapeState.over = true;
      escapeRender();
      return;
    }

    // Turno dos guardas: cada um anda 1 célula em direção a você
    escapeState.guards.forEach(guard => {
      if (guard.trapped) return;

      const candidatos = [
        { r: guard.r - 1, c: guard.c },
        { r: guard.r + 1, c: guard.c },
        { r: guard.r, c: guard.c - 1 },
        { r: guard.r, c: guard.c + 1 }
      ].filter(pos => escapeInBounds(pos.r, pos.c) && !escapeCellBlocked(pos.r, pos.c, guard));

      if (candidatos.length === 0){
        guard.trapped = true; // preso na parede — sem pra onde ir
        return;
      }

      let melhores = [];
      let melhorDist = Infinity;
      candidatos.forEach(pos => {
        const dist = Math.abs(pos.r - escapeState.player.r) + Math.abs(pos.c - escapeState.player.c);
        if (dist < melhorDist){
          melhorDist = dist;
          melhores = [pos];
        } else if (dist === melhorDist){
          melhores.push(pos);
        }
      });

      const escolhido = melhores[Math.floor(Math.random() * melhores.length)];
      guard.r = escolhido.r;
      guard.c = escolhido.c;
    });

    const pego = escapeState.guards.some(g => !g.trapped && g.r === escapeState.player.r && g.c === escapeState.player.c);
    if (pego){
      escapeState.over = true;
      escapeState.won = false;
    } else {
      escapeState.turns += 1;
    }

    escapeRender();
  }

  escapeCtrlBtns.forEach(btn => {
    btn.addEventListener('click', () => escapeMove(btn.getAttribute('data-dir')));
  });

  if (escapeResetBtn) escapeResetBtn.addEventListener('click', escapeResetGame);

  /* ---------- JOGO: XADREZ (2 jogadores locais, regras simplificadas —
     sem cheque/xeque-mate oficial: vence quem capturar o rei adversário) ---------- */
  const chessBoardEl = document.getElementById('chessBoard');
  const chessStatusEl = document.getElementById('chessStatus');
  const chessResetBtn = document.getElementById('chessResetBtn');

  const CHESS_SYMBOLS = {
    w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
    b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
  };

  const CHESS_DIRS = {
    bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    rook:   [[-1, 0], [1, 0], [0, -1], [0, 1]],
    queen:  [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
  };

  const CHESS_KNIGHT_STEPS = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const CHESS_KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  let chessBoard = null;
  let chessTurn = 'w';
  let chessSelected = null;
  let chessLegal = [];
  let chessGameOver = false;
  let chessWinner = null;

  function chessInBounds(r, c){
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function chessInitialBoard(){
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    const board = [];
    board[0] = back.map(t => ({ type: t, color: 'b' }));
    board[1] = Array.from({ length: 8 }, () => ({ type: 'p', color: 'b' }));
    board[2] = Array(8).fill(null);
    board[3] = Array(8).fill(null);
    board[4] = Array(8).fill(null);
    board[5] = Array(8).fill(null);
    board[6] = Array.from({ length: 8 }, () => ({ type: 'p', color: 'w' }));
    board[7] = back.map(t => ({ type: t, color: 'w' }));
    return board;
  }

  function chessSlideMoves(board, row, col, color, dirs){
    const moves = [];
    dirs.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (chessInBounds(r, c)){
        const target = board[r][c];
        if (!target){
          moves.push({ row: r, col: c });
        } else {
          if (target.color !== color) moves.push({ row: r, col: c });
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  }

  function chessStepMoves(board, row, col, color, steps){
    const moves = [];
    steps.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (!chessInBounds(r, c)) return;
      const target = board[r][c];
      if (!target || target.color !== color) moves.push({ row: r, col: c });
    });
    return moves;
  }

  function chessPawnMoves(board, row, col, color){
    const moves = [];
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    const oneRow = row + dir;
    if (chessInBounds(oneRow, col) && !board[oneRow][col]){
      moves.push({ row: oneRow, col });
      const twoRow = row + dir * 2;
      if (row === startRow && !board[twoRow][col]){
        moves.push({ row: twoRow, col });
      }
    }

    [-1, 1].forEach(dc => {
      const nr = row + dir;
      const nc = col + dc;
      if (chessInBounds(nr, nc) && board[nr][nc] && board[nr][nc].color !== color){
        moves.push({ row: nr, col: nc });
      }
    });

    return moves;
  }

  function chessLegalMoves(board, row, col){
    const piece = board[row][col];
    if (!piece) return [];
    switch (piece.type){
      case 'p': return chessPawnMoves(board, row, col, piece.color);
      case 'n': return chessStepMoves(board, row, col, piece.color, CHESS_KNIGHT_STEPS);
      case 'b': return chessSlideMoves(board, row, col, piece.color, CHESS_DIRS.bishop);
      case 'r': return chessSlideMoves(board, row, col, piece.color, CHESS_DIRS.rook);
      case 'q': return chessSlideMoves(board, row, col, piece.color, CHESS_DIRS.queen);
      case 'k': return chessStepMoves(board, row, col, piece.color, CHESS_KING_STEPS);
      default: return [];
    }
  }

  function chessRender(){
    if (!chessBoardEl || !chessBoard) return;
    chessBoardEl.innerHTML = '';

    for (let r = 0; r < 8; r++){
      for (let c = 0; c < 8; c++){
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `chess-cell ${(r + c) % 2 === 0 ? 'chess-cell-light' : 'chess-cell-dark'}`;
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);

        const piece = chessBoard[r][c];
        if (piece) cell.textContent = CHESS_SYMBOLS[piece.color][piece.type];

        if (chessSelected && chessSelected.row === r && chessSelected.col === c){
          cell.classList.add('chess-cell-selected');
        }
        if (chessLegal.some(m => m.row === r && m.col === c)){
          cell.classList.add('chess-cell-legal');
        }

        chessBoardEl.appendChild(cell);
      }
    }

    if (chessStatusEl){
      if (chessGameOver){
        chessStatusEl.textContent = chessWinner === 'w'
          ? 'As brancas venceram! Rei preto capturado. ♔'
          : 'As pretas venceram! Rei branco capturado. ♚';
        chessStatusEl.classList.add('win');
      } else {
        chessStatusEl.textContent = chessTurn === 'w' ? 'Vez das brancas ♙' : 'Vez das pretas ♟';
        chessStatusEl.classList.remove('win');
      }
    }
  }

  function chessMakeMove(fromRow, fromCol, toRow, toCol){
    const piece = chessBoard[fromRow][fromCol];
    const captured = chessBoard[toRow][toCol];

    if (captured && captured.type === 'k'){
      chessGameOver = true;
      chessWinner = piece.color;
    }

    chessBoard[toRow][toCol] = piece;
    chessBoard[fromRow][fromCol] = null;

    // promocao simples: peao que chega na ultima linha vira rainha
    if (piece.type === 'p' && (toRow === 0 || toRow === 7)){
      piece.type = 'q';
    }

    if (!chessGameOver){
      chessTurn = chessTurn === 'w' ? 'b' : 'w';
    }
  }

  function chessHandleCellClick(row, col){
    if (chessGameOver || !chessBoard) return;
    const piece = chessBoard[row][col];

    if (chessSelected){
      const isLegal = chessLegal.some(m => m.row === row && m.col === col);
      if (isLegal){
        chessMakeMove(chessSelected.row, chessSelected.col, row, col);
        chessSelected = null;
        chessLegal = [];
        chessRender();
        return;
      }
    }

    if (piece && piece.color === chessTurn){
      chessSelected = { row, col };
      chessLegal = chessLegalMoves(chessBoard, row, col);
    } else {
      chessSelected = null;
      chessLegal = [];
    }

    chessRender();
  }

  function chessResetGame(){
    chessBoard = chessInitialBoard();
    chessTurn = 'w';
    chessSelected = null;
    chessLegal = [];
    chessGameOver = false;
    chessWinner = null;
    chessRender();
  }

  if (chessBoardEl){
    chessBoardEl.addEventListener('click', (e) => {
      const cell = e.target.closest('.chess-cell');
      if (!cell) return;
      chessHandleCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
    });

    chessResetGame();
  }

  if (chessResetBtn) chessResetBtn.addEventListener('click', chessResetGame);

  /* =====================================================
     APP: PROMPT DE COMANDO (CMD) — comando secreto pra
     "hackear" e desligar o virus de popups do agiota
  ===================================================== */
  const cmdOutputEl = document.getElementById('cmdOutput');
  const cmdInputForm = document.getElementById('cmdInputForm');
  const cmdInputEl = document.getElementById('cmdInput');

  const VIRUS_UNINSTALL_COMMAND = '/system -apt virus uninstall';

  const agiotaHackedLines = [
    'Achou mesmo que ia se livrar de mim assim, seu moleque de terminal de meia tigela?!',
    'Pode ter apagado meu vírus, mas a dívida continua e agora eu tô com MUITO mais raiva!',
    'Muito engraçadinho hackeando meu sistema, hein? Isso não paga o que você me deve, sabia?!',
    'Se acha esperto mexendo no CMD, mas eu volto, pode escrever!',
    'Tá de sacanagem comigo? Achei que era chique, mas é só um moleque de prompt de comando!'
  ];

  function cmdAddLine(text, className){
    if (!cmdOutputEl) return;
    const p = document.createElement('p');
    p.className = 'cmd-line' + (className ? ' ' + className : '');
    p.textContent = text;
    cmdOutputEl.appendChild(p);
    cmdOutputEl.scrollTop = cmdOutputEl.scrollHeight;
  }

  /* ---------- JANELA POPUP DE "HACKEAMENTO" ---------- */
  const HACK_CODE_CHARS = '0123456789ABCDEFabcdef';

  function hackRandomHex(len){
    let out = '';
    for (let i = 0; i < len; i++){
      out += HACK_CODE_CHARS[Math.floor(Math.random() * HACK_CODE_CHARS.length)];
    }
    return out;
  }

  function hackRandomCodeLine(){
    const templates = [
      () => `0x${hackRandomHex(8)}  MOV  AX, 0x${hackRandomHex(4)}`,
      () => `[proc] kill -9 virus_${hackRandomHex(4)}.exe`,
      () => `scanning sector 0x${hackRandomHex(6)}... OK`,
      () => `patch memory 0x${hackRandomHex(8)} -> 0x${hackRandomHex(8)}`,
      () => `checksum ${hackRandomHex(16)}`,
      () => `removing payload ${hackRandomHex(4)}-${hackRandomHex(4)}-${hackRandomHex(4)}`
    ];
    return pickRandom(templates)();
  }

  function spawnHackPopup(onFinished){
    const popup = document.createElement('div');
    popup.className = 'hack-popup';
    popup.innerHTML = `
      <div class="hack-popup-titlebar">
        <span>sistema.exe</span>
        <button class="hack-popup-close" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="hack-popup-body" id="hackPopupBody"></div>
    `;
    document.body.appendChild(popup);

    const closeBtn = popup.querySelector('.hack-popup-close');
    const bodyEl = popup.querySelector('#hackPopupBody');

    closeBtn.addEventListener('click', () => popup.remove());

    let linesAdded = 0;
    const totalLines = 26;

    const codeInterval = setInterval(() => {
      const line = document.createElement('p');
      line.className = 'hack-popup-code-line';
      line.textContent = hackRandomCodeLine();
      bodyEl.appendChild(line);
      bodyEl.scrollTop = bodyEl.scrollHeight;

      linesAdded++;
      if (linesAdded >= totalLines){
        clearInterval(codeInterval);

        setTimeout(() => {
          bodyEl.innerHTML = `
            <div class="hack-popup-result">
              <span class="hack-popup-result-title">Vírus removido!</span>
              <span class="hack-popup-result-sub">Pode fechar esta janela.</span>
            </div>
          `;
          if (onFinished) onFinished();
        }, 400);
      }
    }, 90);
  }

  function cmdExecuteVirusUninstall(){
    cmdAddLine('Iniciando verificação do sistema...', 'cmd-line-info');
    cmdAddLine('Escaneando processos maliciosos...', 'cmd-line-info');

    spawnHackPopup(() => {
      cmdAddLine('VÍRUS REMOVIDO', 'cmd-line-success');

      if (virusActive || agiotaDebt > 0){
        stopVirus();
        cmdAddLine('Janelas de "ME PAGUE" encerradas com sucesso.', 'cmd-line-success');

        if (agiotaDebt > 0){
          if (msnAgiotaContact) msnAgiotaContact.hidden = false;
          addMessage('agiota', 'them', pickRandom(agiotaHackedLines));
          cmdAddLine('O Agiota parece ter percebido... confira o MSN.', 'cmd-line-error');
        }
      } else {
        cmdAddLine('Nenhum vírus ativo foi encontrado no momento.', 'cmd-line-info');
      }
    });
  }

  function cmdHandleCommand(raw){
    const trimmed = raw.trim();
    cmdAddLine(`C:\\Users\\você>${trimmed}`, 'cmd-line-echo');

    if (!trimmed) return;

    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

    if (normalized === VIRUS_UNINSTALL_COMMAND){
      cmdExecuteVirusUninstall();
      return;
    }

    cmdAddLine(`'${trimmed}' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes.`, 'cmd-line-error');
  }

  if (cmdOutputEl){
    cmdAddLine('Microsoft Windows [Versão 6.1.7601]', 'cmd-line-info');
    cmdAddLine('Copyright (c) Microsoft Corporation. Todos os direitos reservados.', 'cmd-line-info');
    cmdAddLine('');
  }

  if (cmdInputForm && cmdInputEl){
    cmdInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = cmdInputEl.value;
      cmdInputEl.value = '';
      cmdHandleCommand(value);
    });
  }

  /* ---------- NAVEGADOR (GUGLE) ---------- */
  // O player de vídeo do YouTube foi removido: o navegador agora só mostra
  // a página inicial do Gugle (sem funcionalidade real de busca/navegação).
  const browserBackBtn = document.getElementById('browserBackBtn');
  const browserForwardBtn = document.getElementById('browserForwardBtn');
  const browserReloadBtn = document.getElementById('browserReloadBtn');
  const browserHomeBtn = document.getElementById('browserHomeBtn');
  const browserAddressForm = document.getElementById('browserAddressForm');
  const browserAddressInput = document.getElementById('browserAddressInput');
  const gugleSearchForm = document.getElementById('gugleSearchForm');
  const gugleSearchInput = document.getElementById('gugleSearchInput');

  if (browserBackBtn) browserBackBtn.disabled = true;
  if (browserForwardBtn) browserForwardBtn.disabled = true;

  if (browserAddressForm){
    browserAddressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      browserAddressInput.value = '';
    });
  }

  if (gugleSearchForm && gugleSearchInput){
    gugleSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      gugleSearchInput.value = '';
    });
  }

});