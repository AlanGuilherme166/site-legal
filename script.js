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

  /* contador compartilhado usado pra "cascatear" a posicao inicial de cada
     janela (cada app abre num ponto ligeiramente deslocado do anterior,
     em cima da area de trabalho, ao inves de empilhar abaixo dela) */
  let windowOpenCascade = 0;

  function positionWindowOnFirstOpen(win){
    // se a janela ja foi posicionada antes (primeira abertura ou arrastada
    // pelo usuario), mantem onde estava — nao reposiciona a cada abertura
    if (win.dataset.positioned === '1') return;

    // mede a largura que a janela teria no fluxo normal (definida pelo
    // max-width proprio de cada app) antes de tira-la do fluxo
    const rect = win.getBoundingClientRect();
    const width = rect.width;

    const step = windowOpenCascade % 8;
    windowOpenCascade++;

    let left = 60 + step * 30;
    let top = 70 + step * 26;

    const maxLeft = Math.max(20, window.innerWidth - width - 20);
    const maxTop = Math.max(20, window.innerHeight - 160);
    left = Math.min(left, maxLeft);
    top = Math.min(top, maxTop);

    win.style.position = 'fixed';
    win.style.margin = '0';
    win.style.width = width + 'px';
    win.style.left = left + 'px';
    win.style.top = top + 'px';

    win.dataset.positioned = '1';
  }

  function openWindow(win){
    win.classList.remove('is-closed');
    positionWindowOnFirstOpen(win);
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
  /* ===== MOBILE APPS ===== */
const mobileApps = document.querySelectorAll('.mobile-app');
mobileApps.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const app = btn.dataset.app;
    if (app && windowsByApp[app]) {
      toggleWindowFromTrigger(windowsByApp[app]);
    }
  });
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
  const wallpaperUploadBtn = document.getElementById('wallpaperUploadBtn');
  const wallpaperUploadInput = document.getElementById('wallpaperUploadInput');
  const accentGrid = document.getElementById('accentGrid');
  const accentCustomInput = document.getElementById('accentCustomInput');
  const personalizarResetBtn = document.getElementById('personalizarResetBtn');

  const WALLPAPERS = {
    aero:   'wallpaper/azul.png',
    sunset: 'wallpaper/laranja.png',
    forest: 'wallpaper/verde.png',
    purple: 'wallpaper/roxo.png',
    dark:   'wallpaper/preto.png',
    cyan:   'wallpaper/ciano.png'
  };

  function applyWallpaper(key, persist){
    const img = WALLPAPERS[key] || WALLPAPERS.aero;
    if (wallpaperLayer){
      wallpaperLayer.style.background = 'none';
      wallpaperLayer.style.backgroundImage = `url("${img}")`;
      wallpaperLayer.style.backgroundSize = 'cover';
      wallpaperLayer.style.backgroundPosition = 'center';
      wallpaperLayer.style.backgroundRepeat = 'no-repeat';
    }
    document.querySelectorAll('.wallpaper-swatch').forEach(sw => {
      sw.classList.toggle('selected', sw.dataset.wallpaper === key);
    });
    // as bolhas decorativas fixas (azuis/verdes/ciano) cobrem boa parte da tela
    // e escondem a troca de papel de parede; some com elas quando o usuario
    // escolhe qualquer wallpaper diferente do padrao "aero"
    document.body.classList.toggle('custom-wallpaper', key !== 'aero');
    if (persist){
      try{
        localStorage.setItem('aero-wallpaper', key);
        localStorage.removeItem('aero-wallpaper-custom');
      }catch(err){}
    }
  }

  // wallpaper a partir de uma imagem que o usuario escolheu no pc (upada como base64)
  function applyCustomWallpaper(dataUrl, persist){
    if (wallpaperLayer){
      wallpaperLayer.style.background = 'none';
      wallpaperLayer.style.backgroundImage = `url("${dataUrl}")`;
      wallpaperLayer.style.backgroundSize = 'cover';
      wallpaperLayer.style.backgroundPosition = 'center';
      wallpaperLayer.style.backgroundRepeat = 'no-repeat';
    }
    document.querySelectorAll('.wallpaper-swatch').forEach(sw => sw.classList.remove('selected'));
    document.body.classList.add('custom-wallpaper');
    if (persist){
      try{
        localStorage.setItem('aero-wallpaper', 'custom');
        localStorage.setItem('aero-wallpaper-custom', dataUrl);
      }catch(err){
        console.error('Erro ao salvar wallpaper customizado:', err);
        alert('A imagem foi aplicada, mas é grande demais pra ser salva — ao recarregar a página ela volta ao papel de parede anterior.');
      }
    }
  }

  // reduz a imagem escolhida (resolucao + compressao jpeg) antes de virar wallpaper,
  // senão fotos de câmera/celular estouram a cota do localStorage (uns 5MB no total)
  function resizeImageForWallpaper(file, callback){
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1920;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxDim || height > maxDim){
          if (width >= height){
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        try{
          callback(canvas.toDataURL('image/jpeg', 0.72));
        }catch(err){
          console.error('Erro ao comprimir wallpaper:', err);
          callback(null);
        }
      };
      img.onerror = () => callback(null);
      img.src = reader.result;
    };
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
  }

  if (wallpaperGrid){
    wallpaperGrid.addEventListener('click', (e) => {
      const sw = e.target.closest('.wallpaper-swatch');
      if (!sw) return;
      applyWallpaper(sw.dataset.wallpaper, true);
    });
  }

  if (wallpaperUploadBtn && wallpaperUploadInput){
    wallpaperUploadBtn.addEventListener('click', () => wallpaperUploadInput.click());

    wallpaperUploadInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')){
        alert('Escolhe um arquivo de imagem (jpg, png, etc).');
        wallpaperUploadInput.value = '';
        return;
      }

      resizeImageForWallpaper(file, (dataUrl) => {
        if (!dataUrl){
          alert('Não foi possível processar essa imagem. Tenta outra.');
          return;
        }
        applyCustomWallpaper(dataUrl, true);
      });
      wallpaperUploadInput.value = '';
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
  let savedWallpaperCustom = null;
  let savedAccent = null;
  try{
    savedWallpaper = localStorage.getItem('aero-wallpaper') || 'aero';
    savedWallpaperCustom = localStorage.getItem('aero-wallpaper-custom');
    savedAccent = localStorage.getItem('aero-accent');
  }catch(err){}
  if (savedWallpaper === 'custom' && savedWallpaperCustom){
    applyCustomWallpaper(savedWallpaperCustom, false);
  } else {
    applyWallpaper(savedWallpaper, false);
  }
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
     PAINT (desenho em canvas, cores, tamanho, balde e autosave)
  ===================================================== */
  (function initPaint(){
    const canvas = document.getElementById('paintCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const swatchesEl = document.getElementById('paintSwatches');
    const colorInput = document.getElementById('paintColorInput');
    const sizeInput = document.getElementById('paintSizeInput');
    const clearBtn = document.getElementById('paintClearBtn');
    const saveBtn = document.getElementById('paintSaveBtn');
    const toolBrushBtn = document.getElementById('paintToolBrush');
    const toolEraserBtn = document.getElementById('paintToolEraser');
    const toolFillBtn = document.getElementById('paintToolFill');

    const PAINT_STORAGE_KEY = 'aero-paint';
    const cores = [
      '#000000', '#ffffff', '#8a8a8a', '#c62828',
      '#ef6c00', '#fdd835', '#2e7d32', '#00897b',
      '#1565c0', '#5e35b1', '#ec407a', '#8d5a2b'
    ];

    let currentColor = '#1b2530';
    let currentSize = 5;
    let currentTool = 'brush'; // 'brush' | 'eraser' | 'fill'
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    function fundoBranco(){
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // fundo branco inicial + tenta restaurar desenho salvo
    fundoBranco();
    try{
      const saved = localStorage.getItem(PAINT_STORAGE_KEY);
      if (saved){
        const img = new Image();
        img.onload = () => {
          fundoBranco();
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = saved;
      }
    }catch(err){}

    function salvarAutosave(){
      try{ localStorage.setItem(PAINT_STORAGE_KEY, canvas.toDataURL('image/png')); }catch(err){}
    }

    function montarSwatches(){
      if (!swatchesEl) return;
      swatchesEl.innerHTML = '';
      cores.forEach((cor, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'paint-swatch' + (idx === 0 ? ' active' : '');
        btn.style.background = cor;
        btn.setAttribute('aria-label', 'Cor ' + cor);
        btn.addEventListener('click', () => {
          currentColor = cor;
          if (colorInput) colorInput.value = cor;
          swatchesEl.querySelectorAll('.paint-swatch').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
          setTool('brush');
        });
        swatchesEl.appendChild(btn);
      });
    }
    montarSwatches();

    if (colorInput){
      colorInput.addEventListener('input', () => {
        currentColor = colorInput.value;
        if (swatchesEl) swatchesEl.querySelectorAll('.paint-swatch').forEach(el => el.classList.remove('active'));
        setTool('brush');
      });
    }

    if (sizeInput){
      sizeInput.addEventListener('input', () => {
        currentSize = Number(sizeInput.value) || 5;
      });
    }

    function setTool(tool){
      currentTool = tool;
      if (toolBrushBtn) toolBrushBtn.classList.toggle('active', tool === 'brush');
      if (toolEraserBtn) toolEraserBtn.classList.toggle('active', tool === 'eraser');
      if (toolFillBtn) toolFillBtn.classList.toggle('active', tool === 'fill');
    }

    if (toolBrushBtn) toolBrushBtn.addEventListener('click', () => setTool('brush'));
    if (toolEraserBtn) toolEraserBtn.addEventListener('click', () => setTool('eraser'));
    if (toolFillBtn) toolFillBtn.addEventListener('click', () => setTool('fill'));

    function getPos(e){
      const rect = canvas.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (point.clientX - rect.left) * scaleX,
        y: (point.clientY - rect.top) * scaleY
      };
    }

    function hexParaRgba(hex){
      const h = hex.replace('#', '');
      const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
    }

    // balde de tinta: flood fill simples (algoritmo de pilha)
    function baldeDeTinta(startX, startY, corHex){
      startX = Math.floor(startX);
      startY = Math.floor(startY);
      if (startX < 0 || startY < 0 || startX >= canvas.width || startY >= canvas.height) return;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;

      const idxInicial = (startY * w + startX) * 4;
      const corAlvo = [data[idxInicial], data[idxInicial + 1], data[idxInicial + 2], data[idxInicial + 3]];
      const corNova = hexParaRgba(corHex);

      if (corAlvo[0] === corNova[0] && corAlvo[1] === corNova[1] && corAlvo[2] === corNova[2] && corAlvo[3] === corNova[3]) return;

      const pilha = [[startX, startY]];
      const tolerancia = 24;

      function bate(i){
        return Math.abs(data[i] - corAlvo[0]) <= tolerancia &&
               Math.abs(data[i + 1] - corAlvo[1]) <= tolerancia &&
               Math.abs(data[i + 2] - corAlvo[2]) <= tolerancia &&
               Math.abs(data[i + 3] - corAlvo[3]) <= tolerancia;
      }

      let seguranca = w * h * 4; // evita loop infinito
      while (pilha.length && seguranca-- > 0){
        const [x, y] = pilha.pop();
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = (y * w + x) * 4;
        if (!bate(i)) continue;

        data[i] = corNova[0];
        data[i + 1] = corNova[1];
        data[i + 2] = corNova[2];
        data[i + 3] = corNova[3];

        pilha.push([x + 1, y]);
        pilha.push([x - 1, y]);
        pilha.push([x, y + 1]);
        pilha.push([x, y - 1]);
      }

      ctx.putImageData(imgData, 0, 0);
    }

    function desenharLinha(x1, y1, x2, y2){
      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = currentSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function onPointerDown(e){
      const pos = getPos(e);

      if (currentTool === 'fill'){
        baldeDeTinta(pos.x, pos.y, currentColor);
        salvarAutosave();
        return;
      }

      drawing = true;
      lastX = pos.x;
      lastY = pos.y;
      // ponto isolado (clique sem arrastar) ainda aparece como uma bolinha
      desenharLinha(pos.x, pos.y, pos.x, pos.y);
      if (e.cancelable) e.preventDefault();
    }

    function onPointerMove(e){
      if (!drawing) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      desenharLinha(lastX, lastY, pos.x, pos.y);
      lastX = pos.x;
      lastY = pos.y;
    }

    function onPointerUp(){
      if (drawing) salvarAutosave();
      drawing = false;
    }

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);

    if (clearBtn){
      clearBtn.addEventListener('click', () => {
        fundoBranco();
        salvarAutosave();
      });
    }

    if (saveBtn){
      saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'meu-desenho-aero.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  })();

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
  let agiotaAwaitingLoanAmount = false;
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
    },
    {
      id: 'penalti',
      emoji: '🥅',
      name: 'Pênalti Decisivo',
      price: 12000,
      desc: 'Escolha seu time do Brasileirão e dispute uma decisão de pênaltis contra um rival sorteado. Chute pro canto certo e defenda o goleiro adversário.'
    },
    {
      id: 'campo_minado',
      emoji: '💣',
      name: 'Campo Minado',
      price: 0,
      free: true,
      desc: 'Clássico Campo Minado 9x9, de graça. Abre numa janela separada do navegador — marque as minas e limpe o campo todo.'
    },
    {
      id: 'progressbar95',
      emoji: '📊',
      name: 'ProgressBar95',
      price: 8000,
      desc: 'Clicker de bytes numa aba, e numa aba separada você captura arquivos caindo com uma janelinha pra encher a barra de progresso e ganhar bytes bônus pros upgrades.'
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

    [aicomidaBoostStatusEl, digBoostStatusEl, codigoBoostStatusEl].forEach(el => {
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

  const AICOMIDA_ITEMS_PER_PAGE = 4;
  const aicomidaPageState = {}; // categoria -> pagina atual (0-based)

  function buildAicomidaCatalogList(containerEl, catalogo, categoria){
    if (!containerEl) return;

    if (aicomidaPageState[categoria] === undefined) aicomidaPageState[categoria] = 0;

    const totalPages = Math.max(1, Math.ceil(catalogo.length / AICOMIDA_ITEMS_PER_PAGE));
    if (aicomidaPageState[categoria] > totalPages - 1) aicomidaPageState[categoria] = totalPages - 1;
    const page = aicomidaPageState[categoria];

    containerEl.innerHTML = '';

    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'aicomida-items';

    const start = page * AICOMIDA_ITEMS_PER_PAGE;
    const pageItems = catalogo.slice(start, start + AICOMIDA_ITEMS_PER_PAGE);

    pageItems.forEach(item => {
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
      itemsWrap.appendChild(row);
    });

    containerEl.appendChild(itemsWrap);

    // paginacao: so aparece quando os itens nao cabem numa pagina so
    if (totalPages > 1){
      const pager = document.createElement('div');
      pager.className = 'aicomida-pager';
      for (let i = 0; i < totalPages; i++){
        const pageBtn = document.createElement('button');
        pageBtn.type = 'button';
        pageBtn.className = 'aicomida-page-btn' + (i === page ? ' active' : '');
        pageBtn.textContent = `Pág. ${i + 1}`;
        pageBtn.addEventListener('click', () => {
          aicomidaPageState[categoria] = i;
          buildAicomidaCatalogList(containerEl, catalogo, categoria);
        });
        pager.appendChild(pageBtn);
      }
      containerEl.appendChild(pager);
    }

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
  // declarado aqui em cima (com let, sem valor ainda) pra evitar erro de
  // "Cannot access before initialization": renderCasinoBalance() já chama
  // renderCodigoBalance() lá embaixo, bem antes do app Código ser inicializado.
  let codigoBalanceEl = null;
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
    renderCodigoBalance();
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

  // helpers: normalizar nomes para arquivos e inserir avatares circulares
  function slugifyName(name){
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/\s+/g, '');
  }

  function setMsnContactAvatars(){
    if (!msnContactsEl) return;
    msnContactsEl.querySelectorAll('.msn-contact').forEach(el => {
      const c = el.dataset.contact || '';
      const avatarWrap = el.querySelector('.msn-contact-avatar');
      if (!avatarWrap) return;

      // tenta carregar imagem em /avatares/<contact>.png
      const filename = `avatares/${c}.png`;
      const img = document.createElement('img');
      img.alt = el.dataset.name || c;
      img.src = filename;

      // fallback: mostra o emoji/texto original caso a imagem falhe
      const fallback = document.createElement('span');
      fallback.className = 'msn-avatar-fallback';
      fallback.textContent = avatarWrap.textContent.trim();

      img.addEventListener('error', () => {
        // não encontrou a imagem; mostra fallback
        if (avatarWrap.firstChild !== fallback) avatarWrap.innerHTML = '';
        if (!avatarWrap.contains(fallback)) avatarWrap.appendChild(fallback);
      });

      img.addEventListener('load', () => {
        // imagem carregada com sucesso
        avatarWrap.innerHTML = '';
        avatarWrap.appendChild(img);
      });

      // tenta inserir imediatamente; se não carregar, o handler mostra fallback
      avatarWrap.innerHTML = '';
      avatarWrap.appendChild(img);
    });
  }

  // roda na inicializacao do MSN
  setMsnContactAvatars();

  const contactNames = { carachato: 'Cara Chato', agiota: 'Agiota', nerdsabido: 'Nerd Sabido', assistente: 'Assistente Virtual' };
  const contactBadges = { carachato: badgeCarachato, agiota: badgeAgiota, nerdsabido: badgeNerdsabido, assistente: badgeAssistente };
  const chatHistory = { carachato: [], agiota: [], nerdsabido: [], assistente: [] };
  const unread = { carachato: 0, agiota: 0, nerdsabido: 0, assistente: 0 };
  let activeContact = 'carachato';
let nerdXingamentoStreak = 0;
let nerdVirusAudio = null;
let nerdApocalypsePopupInterval = null;
let nerdMaxPopups = 5;

const nerdUltimatoReplies = [
  'já avisei. essa foi a última.',
  'pronto, chega. você pediu.',
  'ok, acabou a paciência.'
];

const nerdPopupMessages = [
  'Você não devia ter me irritado.',
  'Erro fatal.',
  'Falha crítica.',
  'SYSTEM FAILURE',
  'Explorer.exe parou.',
  'Kernel Panic.',
  'Stack Overflow.',
  'Memória corrompida.',
  'Acesso negado.',
  'Erro ao acessar memória.',
  'Segmentation Fault.',
  'Arquivo danificado.',
  'Processo encerrado.',
  'Falha ao carregar sistema.',
  'SYSTEM CORRUPTED.',
  'Erro de proteção.',
  'Memória física danificada.',
  'Falha desconhecida.',
  'O sistema encontrou um erro.',
  'Seu computador não responde.',
  'Runtime Error.',
  'Boot Failure.',
  'Critical Error.',
  'Buffer Overflow.',
  'Thread Exception.',
  'Heap Corruption.',
  'Falha no Kernel.',
  'Erro irrecuperável.',
  'A corrupção está aumentando.',
  'Você causou isso.'
];

function spawnNerdApocalypsePopup(){

  if(document.querySelectorAll('.nerd-apocalypse-popup').length >= nerdMaxPopups)
    return;

  const popup = document.createElement('div');
  popup.className = 'nerd-apocalypse-popup';

  const width = 220;
  const height = 170;

  popup.style.left =
    Math.floor(Math.random() * (window.innerWidth - width)) + 'px';

  popup.style.top =
    Math.floor(Math.random() * (window.innerHeight - height)) + 'px';

  if(Math.random() < .25){
    popup.style.transform = `scale(${1 + Math.random() * .4})`;
  }

  popup.innerHTML = `
    <span class="nerd-apocalypse-skull">☠️</span>
    <span class="nerd-apocalypse-text">
      ${nerdPopupMessages[
        Math.floor(Math.random()*nerdPopupMessages.length)
      ]}
    </span>
  `;

  document.body.appendChild(popup);

  setTimeout(()=>{
    popup.remove();
  },15000);

}

function resetAeroSaveKeepProfile(){

  try{

    const KEEP=[SESSION_KEY];

    Object.keys(localStorage).forEach(k=>{
      if(!KEEP.includes(k))
        localStorage.removeItem(k);
    });

    localStorage.setItem('aero-nerd-virus-msg-pending','1');

  }catch(err){}

  location.reload();

}

function startNerdApocalypse(){

  document.body.classList.add('nerd-apocalypse-active');

  nerdMaxPopups = 5;

  const overlay=document.createElement('div');

  overlay.className='nerd-apocalypse-overlay';
  overlay.id='nerdApocalypseOverlay';

  document.body.appendChild(overlay);

  try{

    nerdVirusAudio=new Audio('audios/virus.mp3');
    nerdVirusAudio.loop=true;
    nerdVirusAudio.volume=.7;
    nerdVirusAudio.play().catch(()=>{});

  }catch(err){}

  spawnNerdApocalypsePopup();

  /* ===========================
     FASE 1 (0~15s)
     =========================== */

  nerdApocalypsePopupInterval=setInterval(
    spawnNerdApocalypsePopup,
    2500
  );

  /* ===========================
     FASE 2 (15~35s)
     =========================== */

  setTimeout(()=>{

    document.body.classList.add('nerd-apocalypse-phase2');

    nerdMaxPopups = 15;

    clearInterval(nerdApocalypsePopupInterval);

    nerdApocalypsePopupInterval=setInterval(
      spawnNerdApocalypsePopup,
      900
    );

  },15000);

  /* ===========================
     FASE 3 (35~60s)
     =========================== */

  setTimeout(()=>{

    document.body.classList.add('nerd-apocalypse-phase3');

    nerdMaxPopups = 40;

    clearInterval(nerdApocalypsePopupInterval);

    nerdApocalypsePopupInterval=setInterval(
      spawnNerdApocalypsePopup,
      250
    );

  },35000);

  /* CONTINUA NA PARTE 2 */
    /* ===========================
     FASE 4 (60~80s)
     =========================== */

  setTimeout(()=>{

    document.body.classList.add('nerd-apocalypse-phase4');

    nerdMaxPopups = 90;

    clearInterval(nerdApocalypsePopupInterval);

    nerdApocalypsePopupInterval = setInterval(
      spawnNerdApocalypsePopup,
      70
    );

  },60000);

  /* ===========================
     FASE FINAL (80~90s)
     =========================== */

  setTimeout(()=>{

    document.body.classList.add('nerd-apocalypse-final');

    nerdMaxPopups = 250;

    clearInterval(nerdApocalypsePopupInterval);

    nerdApocalypsePopupInterval = setInterval(
      spawnNerdApocalypsePopup,
      15
    );

    // Explosão inicial de pop-ups
    for(let i=0;i<120;i++){

      setTimeout(spawnNerdApocalypsePopup,i*8);

    }

  },80000);

  /* ===========================
     COLAPSO TOTAL (88s)
     =========================== */

  setTimeout(()=>{

    // Última explosão pouco antes de "desligar"

    for(let i=0;i<250;i++){

      setTimeout(spawnNerdApocalypsePopup,i*3);

    }

  },88000);

  /* ===========================
     ENCERRA
     =========================== */

  setTimeout(()=>{

    document.body.classList.remove(
      'nerd-apocalypse-active',
      'nerd-apocalypse-phase2',
      'nerd-apocalypse-phase3',
      'nerd-apocalypse-phase4',
      'nerd-apocalypse-final'
    );

    clearInterval(nerdApocalypsePopupInterval);
    nerdApocalypsePopupInterval = null;

    document
      .querySelectorAll('.nerd-apocalypse-popup')
      .forEach(el=>el.remove());

    const overlayEl=document.getElementById(
      'nerdApocalypseOverlay'
    );

    if(overlayEl)
      overlayEl.remove();

    if(nerdVirusAudio){

      nerdVirusAudio.pause();
      nerdVirusAudio.currentTime = 0;
      nerdVirusAudio = null;

    }

    const shutdown=document.createElement('div');

    shutdown.className='nerd-shutdown-screen';

    shutdown.innerHTML=`
      <div class="nerd-shutdown-spinner"></div>
      <p class="nerd-shutdown-text">
        Desligando...
      </p>
    `;

    document.body.appendChild(shutdown);

    setTimeout(()=>{

      resetAeroSaveKeepProfile();

    },2600);

  },90000);

}
  /* ---------- NOTIFICAÇÃO DO MSN (balãozinho estilo Windows + som) ---------- */
  const msnToast = document.getElementById('msnToast');
  const msnToastPreview = document.getElementById('msnToastPreview');
  const msnToastClose = document.getElementById('msnToastClose');
  const msnNotificationSound = document.getElementById('msnNotificationSound');

  let msnToastTimer = null;
  let msnToastContact = null;

  function hideMsnToast(){
    if (!msnToast || msnToast.hidden) return;
    msnToast.classList.add('is-leaving');
    setTimeout(() => {
      msnToast.hidden = true;
      msnToast.classList.remove('is-leaving');
    }, 220);
    if (msnToastTimer){
      clearTimeout(msnToastTimer);
      msnToastTimer = null;
    }
  }

  function playMsnNotificationSound(){
    if (!msnNotificationSound) return;
    try {
      msnNotificationSound.currentTime = 0;
      msnNotificationSound.volume = 0.5;
      msnNotificationSound.play().catch(() => {
        // autoplay pode ser bloqueado pelo navegador ate haver interacao do usuario; ignora o erro
      });
    } catch (err) { /* ignora */ }
  }

  function showMsnToast(contact, text){
    playMsnNotificationSound();

    if (!msnToast) return;
    msnToastContact = contact;
    if (msnToastPreview) msnToastPreview.textContent = `${contactNames[contact] || 'Contato'}: ${text}`;

    msnToast.hidden = false;
    msnToast.classList.remove('is-leaving');

    if (msnToastTimer) clearTimeout(msnToastTimer);
    msnToastTimer = setTimeout(hideMsnToast, 6000);
  }

  // clicar no balao abre o MSN direto na conversa do contato que mandou a mensagem
  if (msnToast){
    msnToast.addEventListener('click', (e) => {
      if (e.target === msnToastClose) return;
      if (msnWindow) openWindow(msnWindow);
      if (msnToastContact) switchContact(msnToastContact);
      hideMsnToast();
    });
  }

  if (msnToastClose){
    msnToastClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideMsnToast();
    });
  }

  // enquanto o usuario ja esta com o MSN aberto (nao minimizado) vendo aquele contato,
  // nao precisa mostrar o balao — mas o som ainda toca pra avisar que chegou mensagem
  function isViewingContactNow(contact){
    if (!msnWindow) return false;
    const closed = msnWindow.classList.contains('is-closed');
    const minimized = isMinimized(msnWindow);
    return !closed && !minimized && activeContact === contact;
  }

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
      
      // Se a mensagem tem um botão, adiciona
      if (msg.buttonText && msg.buttonAction){
        const btnContainer = document.createElement('div');
        btnContainer.className = 'msn-msg-button-container';
        const btn = document.createElement('button');
        btn.className = 'msn-msg-action-btn';
        btn.textContent = msg.buttonText;
        btn.type = 'button';
        btn.addEventListener('click', msg.buttonAction);
        btnContainer.appendChild(btn);
        bubble.appendChild(btnContainer);
      }
      
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

    if (sender !== 'me'){
      if (isViewingContactNow(contact)){
        playMsnNotificationSound();
      } else {
        showMsnToast(contact, text);
      }
    }
  }

  try{
  if (localStorage.getItem('aero-nerd-virus-msg-pending') === '1'){
    localStorage.removeItem('aero-nerd-virus-msg-pending');
    setTimeout(() => {
      addMessage('nerdsabido', 'them', 'Não me irrite mais.');
    }, 1000);
  }
  }catch(err){ /* ignora */ }

  function switchContact(contact){
    activeFriend = null;
    document.querySelectorAll('.msn-friend-item').forEach(el => el.classList.remove('active'));

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
  addMessage('assistente', 'them', 'Olá! Sou sua assistente virtual e estou aqui para ajudar você a utilizar o sistema. 😊\nPode me perguntar o que quiser!\nPerguntas prontas:\n\n• "jogos" — Explico como funciona a vitrine de jogos.\n• "trabalho" — Explico como funciona o jogo de cavar para ganhar dinheiro.\n• "dívidas" — Explico o que acontece quando o seu saldo fica negativo.');

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

  /* ---------- FÁBRICA GENÉRICA DE "VÍRUS" DE JANELAS-POPUP ----------
     Usada pelos vírus dos sites (xxx.aero.com e aerocripto.com), que
     seguem o mesmo esquema visual e o mesmo comando de remoção do
     vírus original do Agiota (/system -apt virus uninstall no CMD). */
  function createPopupVirus(popupClass, emoji, text){
    let active = false;
    let interval = null;
    const MAX_POPUPS = 6;

    function spawn(){
      if (document.querySelectorAll('.' + popupClass).length >= MAX_POPUPS) return;

      const popup = document.createElement('div');
      popup.className = `virus-popup ${popupClass}`;

      const maxLeft = Math.max(0, window.innerWidth - 220);
      const maxTop = Math.max(0, window.innerHeight - 160);
      popup.style.left = Math.floor(Math.random() * maxLeft) + 'px';
      popup.style.top = Math.floor(Math.random() * maxTop) + 'px';

      popup.innerHTML = `
        <button class="virus-close" type="button" aria-label="Fechar">×</button>
        <span class="virus-skull">${emoji}</span>
        <span class="virus-text">${text}</span>
      `;

      popup.querySelector('.virus-close').addEventListener('click', () => popup.remove());
      document.body.appendChild(popup);
    }

    function start(){
      if (active) return;
      active = true;
      spawn();
      interval = setInterval(spawn, 1600 + Math.random() * 1400);
    }

    function stop(){
      active = false;
      if (interval){
        clearInterval(interval);
        interval = null;
      }
      document.querySelectorAll('.' + popupClass).forEach(el => el.remove());
    }

    return { start, stop, isActive: () => active };
  }

  // vírus do xxx.aero.com: ativa ao clicar em "chamar" no botão do site troll
  const siteTrollVirus = createPopupVirus('site-troll-virus-popup', '😂', 'sem mães solteiras por aqui haha!');

  // vírus do aerocripto.com: ativa ao pegar uma bomba no minigame
  const cryptoVirus = createPopupVirus('crypto-virus-popup', '⛏️', 'MINERANDO CRIPTOMOEDAS NO SEU PC SEM PERMISSÃO!');

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

  // versão "silenciosa" de showAgiota(): ativa a cobrança periódica (e a
  // contagem que dispara o vírus depois de 5 mensagens ignoradas) sem
  // mandar a mensagem de boas-vindas — usada quando a dívida nasce de
  // um empréstimo, já que o próprio empréstimo manda sua confirmação
  function ativarAgiotaCobranca(){
    if (agiotaActive) return;
    agiotaActive = true;
    agiotaNagCount = 0;
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
  const nerdGreetingReplies = ['eae', 'salve', 'o que você quer?', 'qual foi?', 'fala.', 'e aí, beleza?', 'oi.', 'diz aí.'];
  const nerdHelpReplies = ['ajudar com o que?', 'manda o problema.', 'fala qual é o bug.', 'ajudar em quê exatamente?', 'to ouvindo, qual é a parada?'];
  const nerdVirusReplies = ['abre o cmd e escreve /system -apt virus uninstall', 'roda /system -apt virus uninstall no cmd que resolve.', 'cmd, /system -apt virus uninstall, e pronto.'];
  const nerdThanksReplies = ['tmj 👍', 'de nada.', 'tranquilo.', 'imagina.', 'sempre que precisar.'];
  const nerdChessReplies = ['bora.', 'partiu.', 'fechou, vamo jogar.', 'to dentro.'];

  const nerdHelpKeywords = ['ajuda', 'ajude', 'ajudar', 'socorro', 'sos', 'me ajuda', 'preciso de ajuda', 'help'];
  const nerdThanksKeywords = ['obrigado', 'obrigada', 'obg', 'valeu', 'vlw', 'brigado', 'brigada', 'thanks', 'thank you'];
  const nerdChessKeywords = ['xadrez', 'chess', 'bora xadrez', 'quer jogar xadrez', 'jogar xadrez', 'partida de xadrez', 'jogo de xadrez'];

  function normalizeNerdText(text){
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function nerdSabidoReply(text){
    const normalized = normalizeNerdText(text);

    console.log("ENTROU NO NERD");
    console.log("normalized:", normalized);
    console.log("topicos:", checarTopicos(nerdTopicos, normalized));
    const respostaTopicoNerd = checarTopicos(nerdTopicos, normalized);

    if (respostaTopicoNerd) return respostaTopicoNerd;

    if (normalized.includes('virus')){
        return pickRandom(nerdVirusReplies);
    }

    if (nerdChessKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdChessReplies);
    }
    if (nerdHelpKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdHelpReplies);
    }
    if (nerdThanksKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdThanksReplies);
    }
    if (msnXingamentos.some(k => normalized.includes(k))){
      return pickRandom(nerdXingamentoReplies);
    }
    if (msnCantadas.some(k => normalized.includes(k))){
      return pickRandom(nerdCantadaReplies);
    }
    if (msnPiadaKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdPiadaReplies);
    }
    if (msnConselhoKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdConselhoReplies);
    }
    if (msnElogioKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdElogioReplies);
    }
    if (msnFarewellKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdFarewellReplies);
    }
    if (msnPedirDinheiroKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdDinheiroReplies);
    }
    if (msnPerguntaSimplesKeywords.some(k => normalized.includes(k))){
      return pickRandom(nerdPerguntaReplies);
    }
    return pickRandom(nerdGreetingReplies);
  }

  /* ---------- PALAVRAS-CHAVE COMPARTILHADAS ENTRE TODOS OS CONTATOS DO MSN ----------
     Usadas pelo Cara Chato, Agiota, Nerd Sabido e Assistente Virtual pra reagir a
     saudacoes, despedidas, elogios, xingamentos, perguntas simples, pedidos de
     dinheiro, cantadas, pedidos de piada/conselho, cada um com respostas do seu
     proprio jeito. */
     /* ---------- NOVOS TÓPICOS: CARA CHATO ---------- */
const carachatoTopicos = [
  { kw: ['fome', 'comer', 'almoço', 'almoco', 'jantar'], respostas: [
    'To com uma fome que nem imagino, vou comer um pão com ovo aqui.',
    'Comida é vida, mas suco de caixinha continua sendo golpe.',
    'Bora fazer um lanche? To pensando numa coxinha agora.'
  ]},
  { kw: ['futebol', 'time de futebol', 'jogo de futebol'], respostas: [
    'Futebol é bom, mas eu ainda não entendi o impedimento direito.',
    'Torço mais pra galera cair de boca no gramado do que pro placar, hahaha.',
    'Se meu time perde eu já finjo que nem gosto de futebol.'
  ]},
  { kw: ['sonho', 'sonhei', 'pesadelo'], respostas: [
    'Sonhei que um pato gigante trabalhava no banco, bem estranho.',
    'Pesadelo mesmo é acordar sem saber que dia é hoje.',
    'Ontem sonhei que dobrava um papel 8 vezes, minha vida mudou.'
  ]},
  { kw: ['medo', 'assombração', 'fantasma'], respostas: [
    'Meu maior medo é o suco de caixinha me traindo um dia.',
    'Fantasma pra mim é o WiFi que cai sem ninguém saber por quê.',
    'Não tenho medo de nada, só de ficar sem pilha no controle.'
  ]},
  { kw: ['signo', 'horoscopo', 'astrologia'], respostas: [
    'Não creio muito em signo não, acredito mais em patos gigantes.',
    'Meu horóscopo hoje disse "cuidado com decisões financeiras", será que é indireta pro Cassino?',
    'Sou do signo de quem pensa besteira 24h por dia, esse não existe mas devia.'
  ]},
  { kw: ['filme', 'serie', 'série', 'netflix'], respostas: [
    'Vi um filme ontem que nem lembro o nome, só lembro que tinha um pato.',
    'Série boa é aquela que te deixa pensando besteira igual eu.',
    'Netflix devia ter uma categoria só de curiosidades aleatórias.'
  ]},
  { kw: ['viagem', 'viajar', 'ferias', 'férias'], respostas: [
    'Queria viajar pra um lugar onde suco vem em formato redondo.',
    'Minha última viagem foi até a cozinha pegar água, conta como viagem?',
    'Bora viajar pra descobrir se os pinguins realmente sentem frio.'
  ]},
  { kw: ['fim de semana', 'final de semana', 'sabado', 'sábado', 'domingo'], respostas: [
    'Fim de semana é sagrado pra pensar besteira com calma.',
    'Domingo é dia de não fazer nada e ainda sim ficar cansado.',
    'Sábado eu reservo pra pesquisar curiosidade inútil, hoje é sobre polvos.'
  ]},
  { kw: ['musica', 'música', 'som', 'playlist'], respostas: [
    'Minha playlist é 90% som de besteira que acho engraçado.',
    'Música boa é aquela que te faz pensar em pato gigante dançando.',
    'To ouvindo uma música tão estranha que nem sei explicar.'
  ]},
  { kw: ['sono', 'cansado', 'cansada', 'dormir'], respostas: [
    'To com sono mas insisto em ficar pensando besteira até tarde.',
    'Dormir é bom, mas pensar em patos gigantes antes de dormir é melhor ainda.',
    'Cansado(a) assim, só rezando pra amanhã ser mais tranquilo.'
  ]}
];

/* ---------- NOVOS TÓPICOS: AGIOTA ---------- */
const agiotaTopicos = [
  { kw: ['desconto', 'abaixar o juro', 'diminuir a divida', 'diminuir a dívida'], respostas: [
    'Desconto? Aqui não é feirinha não, mermão.',
    'Só dou desconto pra quem paga na hora, e você não tá nem perto disso.',
    'Vou fingir que não ouvi esse pedido de desconto, viu.'
  ]},
  { kw: ['mais tempo', 'prazo', 'adiar', 'atrasar'], respostas: [
    'Prazo pra mim é o de hoje, não domina o assunto não.',
    'Adiar? Já adiei demais só de tá aqui conversando com você.',
    'Cada dia que atrasa, a raiva aqui só aumenta, viu.'
  ]},
  { kw: ['vou te processar', 'vou denunciar', 'chamar a policia', 'chamar a polícia'], respostas: [
    'Pode chamar quem quiser, eu só quero minha grana de volta.',
    'Kkkk boa sorte com isso, mas isso não paga sua dívida não.',
    'Fica tranquilo que eu tenho mais paciência que delegado, mas cobro igual.'
  ]},
  { kw: ['vou sumir', 'vou fugir', 'nunca mais me acha'], respostas: [
    'Pode fugir que eu acho, sou bom nisso, viu.',
    'Sumir não paga dívida não, sô, isso só atrasa mais ainda.',
    'Foge não que eu tenho memória boa igual elefante.'
  ]},
  { kw: ['pix', 'transferencia', 'transferência', 'boleto'], respostas: [
    'Isso sim que é papo bom, manda o Pix que eu já risco seu nome daqui.',
    'Aceito Pix, boleto, e até uma prece se for de coração.',
    'Boleto eu não gero não, aqui é no Pix mesmo, direto.'
  ]},
  { kw: ['parcelar', 'dividir em vezes'], respostas: [
    'Parcelar rola, mas com juro que só aumenta, viu.',
    'Divide em quantas vezes você quiser, contanto que pague tudo no final.',
    'Parcelamento aqui é sagrado, mas o juro roda igual roleta.'
  ]},
  { kw: ['fiado', 'confia em mim', 'depois eu pago'], respostas: [
    'Fiado é bom nome de música, não de negócio comigo.',
    '"Depois eu pago" é a frase que mais ouço e menos acredito.',
    'Confiança aqui só depois que o valor cair na minha conta.'
  ]},
  { kw: ['trabalhar pra te pagar', 'arranjar dinheiro', 'vou cavar'], respostas: [
    'Isso sim! Vai lá na Escavação e traz minha grana rapidinho.',
    'Gostei da disposição, trabalha que a dívida some rapidinho.',
    'Vai trabalhar sim, e não esquece de mim na hora de gastar.'
  ]},
  { kw: ['tenha do', 'tenha dó', 'pena de mim', 'coitado'], respostas: [
    'Pena eu tenho é do meu bolso esperando você pagar.',
    'Dó eu não tenho não, mas prazo eu dou (pouco, mas dou).',
    'Vou fingir que fiquei com pena, mas a cobrança continua.'
  ]},
  { kw: ['banco', 'juro abusivo', 'pior que banco'], respostas: [
    'Comparado a mim, banco é caridade, viu.',
    'Juro de banco é migalha perto do meu, mas trabalho com paixão.',
    'Se achou meu juro ruim, nunca viu proposta de cartão de crédito.'
  ]}
];

/* ---------- NOVOS TÓPICOS: NERD SABIDO ---------- */
const nerdTopicos = [
  { kw: ['esqueci a senha', 'recuperar senha', 'perdi a senha'], respostas: [
    'clica em "esqueci a senha", ah espera, isso não existe aqui.',
    'anota em algum lugar da próxima vez.',
    'sem recuperação de senha nesse sistema não, sinto muito.'
  ]},
  { kw: ['travou', 'pc lento', 'tela azul', 'computador travado'], respostas: [
    'desliga e liga de novo, resolve 90% dos problemas.',
    'tela azul é clássico, verifica os drivers.',
    'reinicia. sempre reinicia primeiro.'
  ]},
  { kw: ['internet caiu', 'wifi lento', 'sem internet'], respostas: [
    'reinicia o roteador.',
    'troca de canal no wifi, resolve às vezes.',
    'liga pra operadora, eu não conserto fibra óptica não.'
  ]},
  { kw: ['prova', 'estudar', 'trabalho de escola'], respostas: [
    'estuda com antecedência, não na véspera.',
    'faz resumo, ajuda mais que reler o livro inteiro.',
    'boa sorte na prova, vai dar certo.'
  ]},
  { kw: ['cafe', 'café', 'cafeina', 'cafeína'], respostas: [
    'café é o combustível oficial de quem programa.',
    'sem café não tem código bom.',
    'toma um café, ajuda a focar.'
  ]},
  { kw: ['hora de dormir', 'vou dormir agora'], respostas: [
    'boa noite.',
    'dorme cedo que amanhã rende mais.',
    'ok, até mais.'
  ]},
  { kw: ['o que assistir', 'serie boa', 'série boa'], respostas: [
    'não assisto muita coisa, prefiro ler documentação.',
    'qualquer coisa de ficção científica funciona bem.',
    'não sou bom nisso, pergunta pro Cara Chato.'
  ]},
  { kw: ['que jogo jogar', 'recomendacao de jogo', 'recomendação de jogo'], respostas: [
    'joga xadrez comigo, é bom pro raciocínio.',
    'tenta o campo minado, é rápido e viciante.',
    'progressbar95 é underrated, testa lá.'
  ]},
  { kw: ['linguagem de programacao', 'linguagem de programação', 'aprender a programar'], respostas: [
    'começa com python, é mais tranquilo.',
    'javascript te dá acesso a mais coisas visuais, tipo esse site aqui.',
    'estuda lógica antes de escolher linguagem.'
  ]},
  { kw: ['seu pc e bom', 'seu pc é bom', 'sua maquina', 'sua máquina'], respostas: [
    'é sim, monto minhas próprias configs.',
    'obrigado, cuido bem dela.',
    'valeu, rodo tudo liso aqui.'
  ]}
];

/* ---------- NOVOS TÓPICOS: ASSISTENTE VIRTUAL ---------- */
const assistenteTopicos = [
  { kw: ['bug', 'erro', 'deu erro', 'nao funciona', 'não funciona'], respostas: [
    'Poxa, sinto muito pelo erro! Tenta recarregar a página, às vezes resolve. 😊',
    'Que chato isso acontecer! Se persistir, tenta fechar e abrir o app de novo.',
    'Vou anotar aqui mentalmente, mas por enquanto tenta atualizar a página!'
  ]},
  { kw: ['esqueci minha senha', 'nao consigo entrar', 'não consigo entrar'], respostas: [
    'Puxa, esse sistema não tem recuperação de senha ainda, sinto muito! 😢',
    'Tenta lembrar com calma, ou cria uma conta nova se precisar.',
    'Ainda não temos essa função, mas vou sugerir pros desenvolvedores!'
  ]},
  { kw: ['como uso', 'nao sei usar', 'não sei usar', 'tutorial'], respostas: [
    'Claro! Me fala qual parte do sistema você quer entender melhor 😊',
    'Posso te explicar sobre jogos, trabalho, dívidas, sites e mais! É só perguntar.',
    'Sem problemas, vou te guiando por aqui!'
  ]},
  { kw: ['atualizacao', 'atualização', 'versao nova', 'versão nova', 'mudou algo'], respostas: [
    'Ainda não tenho informações sobre atualizações, mas fico de olho!',
    'Esse sistema tá sempre recebendo coisas novas, quem sabe logo mais!',
    'Boa pergunta! Vou anotar sua curiosidade sobre isso. 😊'
  ]},
  { kw: ['suporte', 'reclamacao', 'reclamação', 'quero reclamar'], respostas: [
    'Sinto muito pelo incômodo! Pode me contar o que houve que eu tento ajudar.',
    'Suas reclamações são bem-vindas, me conta com calma o que aconteceu.',
    'Vou fazer o possível pra ajudar, só me explica melhor a situação.'
  ]},
  { kw: ['sugestao', 'sugestão', 'ideia pro sistema', 'deveria ter'], respostas: [
    'Adoro sugestões! Me conta sua ideia 😊',
    'Ótimo, vou guardar essa sugestão com carinho.',
    'Isso é muito bem-vindo, continue mandando ideias!'
  ]},
  { kw: ['travando', 'sistema lento', 'travou tudo'], respostas: [
    'Poxa, tenta fechar algumas janelas abertas, pode ajudar a aliviar!',
    'Sinto muito pela lentidão, tenta recarregar a página.',
    'Isso não devia acontecer, mas recarregar costuma resolver.'
  ]},
  { kw: ['voce existe de verdade', 'você existe de verdade', 'voce e real', 'você é real'], respostas: [
    'Existo dentro desse sistema, pronta pra te ajudar! 😊',
    'Sou uma assistente virtual, então "existo" nesse universo digital aqui.',
    'De um jeito ou de outro, tô aqui com você agora!'
  ]},
  { kw: ['obrigado por existir', 'obrigada por existir', 'voce e util', 'você é útil'], respostas: [
    'Aaaah, que gentileza, fico muito feliz em ajudar! 😊',
    'Isso me deixou tão feliz! Obrigada por dizer isso.',
    'Fico contente em fazer parte da sua experiência aqui!'
  ]},
  { kw: ['quem e o nerd', 'quem é o nerd', 'quem e o agiota', 'quem é o agiota'], respostas: [
    'O Nerd Sabido é o contato mais técnico por aqui, ele ajuda (do jeito dele) com problemas do sistema.',
    'O Agiota... bem, melhor você não dever nada a ele, viu? 👀',
    'Cada contato tem seu jeitinho por aqui, é só ir conversando que você descobre!'
  ]},
  { kw: ['porno', 'putaria', 'sacanagem', 'sexo', 'coito'], respostas: [
    'Sou apenas uma assistente virtual, não posso te ajudar com isso, seu esquisito.',
    'Você é bem estranho...',
    'Pare com isso, não faz bem pra sua cabeça.'
  ]},
  { kw: ['vadia', 'puta', 'vagabunda', 'safada', 'arrombada'], respostas: [
    'Pare com isso, você está alterado?',
    'Pare de me xingar, isso me magoa...',
    'Isso machuca sabia?'
  ]},
];

function checarTopicos(lista, normalized){
  for (const topico of lista){
    if (topico.kw.some(k => normalized.includes(k))) return pickRandom(topico.respostas);
  }
  return null;
}
  const msnGreetKeywords = [
    'oi', 'ola', 'eae', 'opa', 'salve', 'bom dia', 'boa tarde', 'boa noite', 'e ai',
    'oii', 'ooi', 'fala ai', 'coe', 'suave', 'fala comigo', 'to aqui', 'cheguei'
  ];

  const msnFarewellKeywords = [
    'tchau', 'flw', 'falou', 'ate mais', 'ate logo', 'ate depois', 'adeus', 'xau',
    'vou nessa', 'vou indo', 'fui', 'ja vou', 'bye', 'see ya', 'to saindo',
    'boa noite pra voce', 'vou dormir', 'vou desligar', 'te vejo depois', 'valeu, flw'
  ];

  const msnElogioKeywords = [
    'voce e legal', 'voce e bom', 'voce e boa', 'voce e otimo', 'voce e otima', 'parabens',
    'mandou bem', 'voce e demais', 'voce e incrivel', 'gostei de voce', 'voce e fera',
    'voce e top', 'muito bom voce', 'muito boa voce', 'voce e inteligente', 'voce e esperto',
    'voce e esperta', 'voce ajuda muito', 'adorei', 'voce e o melhor', 'voce e a melhor',
    'voce e engracado', 'voce e engracada', 'voce e divertido', 'voce e divertida', 'gênio', 'genio'
  ];

  const msnPerguntaSimplesKeywords = [
    'tudo bem', 'tudo bom', 'como voce esta', 'como voce ta', 'quem e voce', 'o que voce e',
    'voce e real', 'voce e um robo', 'voce e uma pessoa', 'o que voce faz', 'quantos anos voce tem',
    'onde voce mora', 'voce dorme', 'que horas sao', 'qual seu nome', 'qual e seu nome', 'voce come',
    'voce tem familia', 'voce trabalha', 'voce joga', 'o que voce gosta de fazer', 'voce tem sonhos'
  ];

  const msnPedirDinheiroKeywords = [
    'me da dinheiro', 'me empresta dinheiro', 'me emprestar dinheiro', 'preciso de dinheiro',
    'preciso de grana', 'quero dinheiro', 'quero grana', 'to sem dinheiro', 'tô sem dinheiro',
    'to duro', 'tô duro', 'me ajuda com dinheiro', 'voce tem dinheiro', 'me arruma uma grana',
    'empresta uns trocado', 'dinheiro', 'grana', 'trocado', 'din-din', 'to liso', 'me da uma grana'
  ];

  const msnXingamentos = [
    'idiota', 'burro', 'burra', 'imbecil', 'estupido', 'estupida', 'merda', 'porra', 'caralho',
    'fdp', 'desgraca', 'vagabunda', 'vadia', 'puta', 'arrombado', 'otario', 'otaria', 'vsf',
    'bosta', 'lixo', 'inutil', 'retardado', 'retardada', 'babaca', 'trouxa', 'panaca', 'chato pra caramba'
  ];

  const msnCantadas = [
    'te amo', 'apaixonado por voce', 'apaixonada por voce', 'namorar', 'namora comigo', 'ficar comigo',
    'sair comigo', 'ficarmos juntos', 'ser meu namorado', 'ser minha namorada', 'quer namorar',
    'voce e gostosa', 'voce e gata', 'voce e linda', 'voce e lindo', 'da seu whats', 'seu instagram',
    'voce e solteira', 'voce e solteiro', 'casar comigo', 'me da um beijo', 'um bj', 'voce e gata demais',
    'gostei de voce', 'to afim de voce'
  ];

  const msnPiadaKeywords = [
    'conta uma piada', 'me conta uma piada', 'sabe alguma piada', 'fala uma piada', 'conta algo engracado',
    'me diverte', 'to entediado', 'to entediada', 'conta uma curiosidade', 'fala algo engracado',
    'me faz rir', 'conta uma historia'
  ];

  const msnConselhoKeywords = [
    'me da um conselho', 'me de um conselho', 'preciso de um conselho', 'o que eu faco',
    'o que voce acha que eu devo fazer', 'me ajuda a decidir', 'to em duvida', 'me da uma dica de vida',
    'o que voce faria no meu lugar'
  ];

  /* ---------- CARA CHATO: novas reacoes por categoria ---------- */
  const carachatoGreetReplies = [
    'Eaew! Bora trocar ideia? 😄',
    'Opa, beleza? To aqui pensando na vida.',
    'Salve! Preparado pra mais uma curiosidade aleatória?',
    'Oiee! Justo agora eu tava pensando em te chamar.',
    'E aí! Bateu aquela vontade de falar besteira com alguém.',
    'Coe! Chegou na hora certa, eu tava aqui sozinho pensando besteira.'
  ];
  const carachatoFarewellReplies = [
    'Já vai?? Poxa, tava começando a ficar bom o papo 😢',
    'Falou! Depois volta pra gente continuar filosofando sobre patos.',
    'Tchau tchau! Vou ficar aqui pensando em polvos.',
    'Partiu? Beleza, mas eu vou continuar aqui pensando por que a meia é sempre em par.',
    'Xiii, foi rápido! Volta logo que ainda tenho mais umas 50 curiosidades.',
    'Flw! Se lembrar de mim é só pensar em um pato gigante.'
  ];
  const carachatoElogioReplies = [
    'Aaaai que isso, fiquei sem graça 😳',
    'Poxa, valeu! Você também é gente boa.',
    'Eita, obrigado! Isso me deixou mais feliz que descobrir um fato novo.',
    'Nossa, você que é gente fina por aguentar minhas curiosidades hahaha.',
    'Aaaah pra! Agora eu que vou ficar pensando nesse elogio o dia todo.',
    'Isso me deixou tão feliz quanto descobrir que mel não estraga!'
  ];
  const carachatoXingamentoReplies = [
    'Poxa, que isso, eu só quero conversar 😢',
    'Caraca, achei que a gente era amigo...',
    'Isso doeu mais que descobrir que suco de caixinha não é redondo.',
    'Eita, calma aí, eu só tava tentando puxar assunto 😞',
    'Pesado isso hein, vou fingir que não ouvi e te contar outra curiosidade.',
    'Poxa vida, eu nem falei nada de mais dessa vez 😕'
  ];
  const carachatoPerguntaReplies = [
    'Tô bem! Só pensando por que ninguém sabe quantos ossos tem a girafa no pescoço.',
    'To de boa! E você, já parou pra pensar em patos gigantes?',
    'Sou só um cara que fica no MSN pensando essas paradas, kkk.',
    'Eu? Não durmo, só fico aqui pensando em fatos aleatórios 24 horas por dia.',
    'Moro aqui na tela mesmo, nunca saí kkkk.',
    'Não tenho idade definida, sou tipo um mistério, igual o suco de caixinha quadrado.'
  ];
  const carachatoDinheiroReplies = [
    'Eu? Dinheiro? Cara eu mal tenho pra comprar suco de caixinha kkk.',
    'Rapaz, eu não tenho nem pra mim, imagina pra te dar 😅.',
    'Fala com o Agiota, ele que tem esse tipo de trocado (mas cuidado, ele cobra igual doido).',
    'Se eu tivesse dinheiro sobrando eu tava era pesquisando sobre patos gigantes, não aqui.',
    'Dinheiro pra mim é tipo mistério da girafa, ninguém sabe onde foi parar o meu.'
  ];
  const carachatoCantadaReplies = [
    'Ihh, calma aí kkk, eu só gosto de falar sobre patos gigantes.',
    'Eita, tá querendo dar em cima de mim é? kkkk, vai com calma.',
    'Aaai que isso, vai procurar uma pessoa de verdade pra flertar 😂.',
    'Rapaz, eu já tô até sem graça, mas isso não rola comigo não kkkk.',
    'Isso foi mais inesperado que descobrir que banana é uma erva 😳.'
  ];
  const carachatoPiadaReplies = [
    'Por que o livro de matemática se sentiu triste? Porque tinha muitos problemas! kkkk',
    'Sabia que os ursos polares são canhotos? Não tem nada a ver com piada mas fiquei chocado igual.',
    'O que o zero disse pro oito? Belo cinto! kkkkk',
    'Curiosidade de novo: golfinhos dão nomes uns aos outros com assobios próprios. Bizarro, né?',
    'Por que o computador foi ao médico? Porque tava com vírus! (literalmente, olha o Agiota aí 👀)'
  ];
  const carachatoConselhoReplies = [
    'Meu conselho? Sempre desconfia de suco de caixinha em formato de tijolo.',
    'Na dúvida, escolhe a opção que te faz pensar em patos gigantes felizes.',
    'Conselho de quem pensa besteira o dia todo: relaxa, vai dar certo do jeito que tiver que dar.',
    'Se liga: decide com a cabeça, não só com o coração... e nunca discute com um flamingo.'
  ];

  function carachatoKeywordReply(text){
    const normalized = normalizeNerdText(text);
    const respostaTopico = checarTopicos(carachatoTopicos, normalized);
if (respostaTopico) return respostaTopico;

    if (msnXingamentos.some(k => normalized.includes(k))) return pickRandom(carachatoXingamentoReplies);
    if (msnCantadas.some(k => normalized.includes(k))) return pickRandom(carachatoCantadaReplies);
    if (msnPiadaKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoPiadaReplies);
    if (msnConselhoKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoConselhoReplies);
    if (msnElogioKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoElogioReplies);
    if (msnFarewellKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoFarewellReplies);
    if (msnPedirDinheiroKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoDinheiroReplies);
    if (msnPerguntaSimplesKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoPerguntaReplies);
    if (msnGreetKeywords.some(k => normalized.includes(k))) return pickRandom(carachatoGreetReplies);
    
    return null;
  }

  /* ---------- AGIOTA: novas reacoes por categoria ---------- */
  const agiotaGreetReplies = [
    'Fala, e a grana?',
    'Opa, veio pagar a dívida ou o quê?',
    'Chegou! Espero que seja pra acertar as contas.',
    'Salve, salve. Trouxe meu dinheiro ou só veio bater papo?',
    'E aí, consagrado, hoje é dia de acertar as contas?'
  ];
  const agiotaFarewellReplies = [
    'Falou, mas não esquece de mim não, viu!',
    'Vaza, mas lembra que eu não esqueço dívida.',
    'Beleza, mas a conversa sobre a grana continua depois.',
    'Pode ir, mas eu vou continuar de olho no seu saldo, viu?',
    'Falou, mas não suma que eu te acho, hein.'
  ];
  const agiotaElogioReplies = [
    'Ah tá bom, agora quer me agradar? Isso não paga minha grana não, viu.',
    'Elogio não paga dívida não, meu consagrado.',
    'Que bonito, mas eu prefiro dinheiro no bolso do que elogio no ouvido.',
    'Vai por mim, elogio de graça não bota nada na minha conta.',
    'Que gentil, mas eu só derreto mesmo é com dinheiro na mão.'
  ];
  const agiotaXingamentoReplies = [
    'Cuidado com a boca, hein, eu não esqueço quem me desrespeita.',
    'Fala assim comigo não, que isso só piora sua situação comigo.',
    'Tá de raiva porque deve, é? Isso não abate nem um centavo da dívida.',
    'Vou fingir que não ouvi, mas isso não te livra da cobrança não, viu.',
    'Desaforo desse eu guardo aqui, e quando cobrar vou lembrar direitinho.'
  ];
  const agiotaPerguntaReplies = [
    'To de boa, esperando minha grana.',
    'Só penso em cobrar dívida, sô.',
    'Vida de agiota é assim: acordar, cobrar, dormir, repetir.',
    'Moro na sua mente até você me pagar, kkk brincadeira... ou não.',
    'Tenho nome, mas prefiro que me chamem só de Agiota mesmo, fica mais assustador.'
  ];
  const agiotaCantadaReplies = [
    'Rapaz, não tô aqui pra isso não, viu. Quero é minha grana.',
    'Segura essa cantada, que eu só tenho romance com dinheiro no bolso.',
    'Não rola não, consagrado, aqui é comércio, não paquera.',
    'Vai flertar com o saldo do seu Nubonk, que é ele que precisa de amor agora.'
  ];
  const agiotaPiadaReplies = [
    'A única piada boa aqui é sua cara quando eu apareço cobrando, kkkk.',
    'Piada é seu saldo achando que vai ficar negativo pra sempre sem eu aparecer.',
    'Não conto piada não, só conto o valor que você me deve.'
  ];
  const agiotaConselhoReplies = [
    'Meu conselho? Paga suas dívidas em dia que a vida fica bem mais tranquila.',
    'Conselho de agiota: nunca deva mais do que você pode pagar, sô.',
    'Se quer um conselho de verdade: quita logo lá no Nubonk antes que as coisas fiquem feias.'
  ];

  /* ---------- NERD SABIDO: novas reacoes por categoria ---------- */
  const nerdFarewellReplies = ['falou.', 'flw.', 'ok, tchau.', 'até mais.', 'valeu, até.'];
  const nerdElogioReplies = ['eu sei.', 'valeu, eu sei que sou bom.', ':)', 'óbvio.', 'reconhecido.'];
  const nerdXingamentoReplies = ['tanto faz.', 'fica de boa.', 'ok.', 'whatever.', 'não vou nem discutir isso.'];
  const nerdPerguntaReplies = ['de boa.', 'só tentando resolver um bug.', 'sou só eu mesmo.', 'nada de mais.', 'o de sempre.'];
  const nerdDinheiroReplies = ['não tenho grana, procura o agiota.', 'fala com o agiota.', 'aqui não tem banco, não.'];
  const nerdCantadaReplies = ['estranho isso.', 'não rola.', 'vai estudar.', 'foca no que importa.'];
  const nerdPiadaReplies = [
    'sei um monte de piada de programador, mas você não ia entender.',
    'por que o programador confundiu o natal com o halloween? porque oct 31 == dec 25.',
    'piada boa é código que compila de primeira.'
  ];
  const nerdConselhoReplies = [
    'estuda, resolve o problema, segue em frente.',
    'não sei, mas testa e vê no que dá.',
    'lê a documentação antes de perguntar de novo.'
  ];

  /* ---------- ASSISTENTE VIRTUAL: palavras-chave de topicos do sistema ---------- */
  const assistenteGreetingKeywords = msnGreetKeywords;
  const assistenteJogosKeywords = ['jogos', 'jogo', 'vitrine', 'biblioteca'];
  const assistenteTrabalhoKeywords = ['trabalho', 'trampo', 'cavar', 'escavacao', 'pa', 'emprego', 'servico'];
  const assistenteDividasKeywords = ['divida', 'dividas', 'negativo', 'agiota', 'devendo', 'debito'];
  const assistenteSitesKeywords = ['sites', 'site', 'paginas', 'pagina', 'enderecos', 'endereco'];
  const assistenteCassinoKeywords = ['cassino', 'roleta', 'slots', 'aposta', 'apostar', 'caca niquel'];
  const assistenteInventarioKeywords = ['inventario', 'itens', 'stim', 'mochila'];
  const assistenteAmigosKeywords = ['amigos', 'amigo', 'adicionar amigo', 'codigo de amigo', 'lista de amigos'];
  const assistentePersonalizarKeywords = ['personalizar', 'papel de parede', 'wallpaper', 'tema do sistema', 'mudar a cor'];
  const assistenteComandosKeywords = ['cmd', 'comando secreto', 'comandos', 'terminal', 'prompt de comando'];

  const assistenteFarewellReplies = [
    'Até mais! Qualquer dúvida, é só me chamar de novo 😊',
    'Tchau! Fico por aqui se precisar de ajuda.',
    'Falou! Volte sempre que precisar de uma ajudinha.',
    'Até logo! Estarei por aqui se surgir mais alguma dúvida.',
    'Tchau tchau, foi um prazer ajudar! 😊'
  ];

  const assistenteElogioReplies = [
    'Que gentileza a sua! Fico feliz em ajudar 😊',
    'Awn, obrigada! Estou sempre à disposição.',
    'Fico feliz em saber que ajudei! Qualquer coisa é só chamar.',
    'Que fofo, muito obrigada mesmo! 😊',
    'Fico contente com isso! Continue contando comigo.'
  ];

  const assistentePerguntaReplies = [
    'Tudo certo por aqui! Sou a assistente virtual do sistema, aqui pra tirar suas dúvidas 😊',
    'Sou só um programa, mas tô sempre por aqui pra ajudar no que precisar!',
    'Tudo tranquilo! Se quiser, posso te explicar sobre "jogos", "trabalho", "dívidas" ou "sites".',
    'Estou funcionando normalmente, obrigada por perguntar! E você, como está?',
    'Sou uma assistente virtual, não durmo nem como, só fico aqui pronta pra ajudar 😊'
  ];

  const assistenteDinheiroReplies = [
    'Eu não tenho como emprestar dinheiro, mas o Agiota costuma emprestar (com juros bem salgados). Se preferir, dá uma olhada na Escavação (🪏) pra ganhar sua própria grana!',
    'Infelizmente não posso te dar dinheiro, mas você pode cavar na Escavação (🪏) ou, se estiver desesperado, falar com o Agiota (cuidado com os juros).',
    'Assistente não empresta dinheiro, não! Tenta a Escavação pra ganhar grana de um jeito mais seguro.'
  ];

  const assistentePiadaReplies = [
    'Não sou muito boa com piadas, mas aqui vai uma: por que o computador foi ao médico? Porque estava com vírus! 😄',
    'Hmm, humor não é bem minha especialidade, mas posso te ajudar com dúvidas sobre o sistema! 😊',
    'Vou tentar: por que o banco de dados terminou o namoro? Faltava conexão! kkk'
  ];

  const assistenteConselhoReplies = [
    'Meu conselho: cuide bem do seu saldo no Nubonk e evite ficar negativo por muito tempo 😊',
    'Se quiser uma dica: use a Escavação com calma, gerenciando bem sua energia, pra não ficar sem nada pra fazer.',
    'Posso te dar um conselho prático: explore a Vitrine e o Inventário antes de gastar tudo no Cassino!'
  ];

  const assistenteTristeReplies = [
    '😢 Poxa, não precisava ser grosso(a) comigo, eu só tô tentando ajudar...',
    'Isso me deixou triste. Eu só quero te ajudar a usar o sistema, viu?',
    '😞 Fiquei chateada com isso. Se quiser, é só me perguntar sobre jogos, trabalho ou dívidas.',
    'Poxa, isso doeu um pouco. Vamos continuar, é só me perguntar algo 😔',
    '😢 Eu não mereço isso, só estou aqui pra ajudar você.'
  ];

  const assistenteCantadaReplies = [
    'você é esquisito, procure uma mulher de verdade 😅',
    'calma aí, hein? Sou só um programa. Procure uma mulher de verdade.',
    'isso foi estranho... vai procurar uma mulher de verdade pra namorar 😬',
    'haha, bem gentil, mas eu sou só código. Procure alguém de verdade! 😄',
    'aaai, vai com calma, sou uma assistente virtual, não rola isso não 😅'
  ];

  const assistenteJogosReply = 'A Vitrine (ícone 🎮) é a lojinha de jogos: lá você compra jogos com o seu saldo do Nubonk e depois joga direto na aba Biblioteca. Cada jogo comprado fica guardado no seu Inventário, então você não perde o que já pagou.';
  const assistenteTrabalhoReply = 'Na Escavação (ícone da pá 🪏) você cava buracos pra ganhar dinheiro, que cai direto no seu saldo do Nubonk. Cada cavada gasta energia — às vezes você acha só pedra, às vezes ouro, e raramente um diamante gigante! A energia recupera sozinha bem devagar, ou você come algo ou usa um stim no Inventário pra acelerar.';
  const assistenteDividasReply = 'Se o seu saldo no Nubonk ficar negativo por muito tempo, um agiota aparece aqui no MSN cobrando a dívida. Se você ignorar as cobranças dele por tempo demais, as coisas ficam feias. O melhor é quitar a dívida assim que o seu saldo cobrir o valor, lá na aba Nubonk.';
  const assistenteSitesReply = 'Alguns sites que rolam por aí: xxx.aero.com, aerogram.com, aerocripto.com, aeropedia.com e aeroball.com. Pra acessar, digita o endereço certinho na barra de pesquisa do Gugle (ícone 🌐 do Navegador) e aperta Enter. Só um aviso: alguns desses sites são meio suspeitos... 👀 (a aeropedia.com e a aeroball.com essas são de boa: uma é enciclopédia, a outra é a tabela do Brasileirão)';
  const assistenteCassinoReply = 'O Cassino (ícone 🎰) tem roleta e caça-níqueis: você aposta parte do seu saldo do Nubonk tentando multiplicar. Cuidado, se perder demais e o saldo ficar negativo, é isso que chama o Agiota aqui no MSN!';
  const assistenteInventarioReply = 'O Inventário (ícone 🎒) guarda os jogos que você comprou na Vitrine e os itens que você pega jogando, tipo comida e stims que recuperam energia ou dão bônus na Escavação.';
  const assistenteAmigosReply = 'Na aba "Amigos" aqui do Messenger dá pra adicionar outros jogadores usando o código deles e trocar mensagens de verdade, em tempo real.';
  const assistentePersonalizarReply = 'No "Personalizar" (ícone 🎨) você troca o papel de parede e a cor do sistema, do jeitinho que você preferir.';
  const assistenteComandosReply = 'O CMD (ícone ⬛) é tipo um terminal: alguns comandos escondidos resolvem problemas específicos, tipo quando aparece um vírus na tela.';

  const assistenteGenericReplies = [
    'Não entendi muito bem, mas posso te explicar sobre "jogos", "trabalho", "dívidas" ou "sites". É só perguntar!',
    'Pode me perguntar sobre "jogos", "trabalho", "dívidas" ou "sites" que eu te explico certinho 🙂',
    'Hmm, tenta perguntar sobre "jogos", "trabalho", "dívidas" ou "sites" pra eu te ajudar melhor!',
    'Não captei direito, mas também posso falar sobre "cassino", "inventário", "amigos" ou "personalizar"!',
    'Ainda tô aprendendo a entender tudo, mas pergunta sobre o sistema que eu tento ajudar 😊'
  ];

  function assistenteReply(text){
    console.log("Assistente foi chamada");
    const normalized = normalizeNerdText(text);
    const respostaTopicoAssist = checarTopicos(assistenteTopicos, normalized);
if (respostaTopicoAssist) return respostaTopicoAssist;


    if (msnXingamentos.some(k => normalized.includes(k))){
      return pickRandom(assistenteTristeReplies);
    }
    if (msnCantadas.some(k => normalized.includes(k))){
      return pickRandom(assistenteCantadaReplies);
    }
    if (msnPiadaKeywords.some(k => normalized.includes(k))){
      return pickRandom(assistentePiadaReplies);
    }
    if (msnConselhoKeywords.some(k => normalized.includes(k))){
      return pickRandom(assistenteConselhoReplies);
    }
    if (msnElogioKeywords.some(k => normalized.includes(k))){
      return pickRandom(assistenteElogioReplies);
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
    if (assistenteSitesKeywords.some(k => normalized.includes(k))){
      return assistenteSitesReply;
    }
    if (assistenteCassinoKeywords.some(k => normalized.includes(k))){
      return assistenteCassinoReply;
    }
    if (assistenteInventarioKeywords.some(k => normalized.includes(k))){
      return assistenteInventarioReply;
    }
    if (assistenteAmigosKeywords.some(k => normalized.includes(k))){
      return assistenteAmigosReply;
    }
    if (assistentePersonalizarKeywords.some(k => normalized.includes(k))){
      return assistentePersonalizarReply;
    }
    if (assistenteComandosKeywords.some(k => normalized.includes(k))){
      return assistenteComandosReply;
    }
    if (msnFarewellKeywords.some(k => normalized.includes(k))){
      return pickRandom(assistenteFarewellReplies);
    }
    if (msnPedirDinheiroKeywords.some(k => normalized.includes(k))){
      return pickRandom(assistenteDinheiroReplies);
    }
    if (msnPerguntaSimplesKeywords.some(k => normalized.includes(k))){
      return pickRandom(assistentePerguntaReplies);
    }
    if (msnGreetKeywords.some(k => normalized.includes(k))){
      return 'Oi! 😄 Pode me perguntar sobre "jogos", "trabalho", "dívidas", "sites", "cassino", "inventário", "amigos" ou "personalizar" que eu te explico como usar o sistema.';
    }
    return pickRandom(assistenteGenericReplies);
  }

  /* ---------- AGIOTA: EMPRÉSTIMOS SOB PEDIDO ----------
     Diferente da cobrança automática (que só nasce se o saldo do Cassino
     ficar negativo), aqui o próprio jogador pede dinheiro emprestado pelo
     chat. O valor pedido cai na hora no saldo do Nubonk e vira dívida com
     o agiota — o saldo do Cassino/Nubonk em si nunca fica negativo por
     causa disso, o jogador só passa a dever. */
  const agiotaEmprestimoKeywords = [
    'me empresta dinheiro', 'me emprestar dinheiro', 'emprestimo', 'empréstimo',
    'emprestar dinheiro', 'me empresta', 'empresta dinheiro', 'empresta',
    'preciso de dinheiro', 'preciso de grana', 'preciso de uma grana',
    'me da dinheiro', 'me dá dinheiro', 'me ajuda com dinheiro', 'quero dinheiro',
    'quero grana', 'to sem dinheiro', 'tô sem dinheiro', 'to duro', 'tô duro',
    'dinheiro', 'grana', 'din-din', 'trocado'
  ];

  function parseAgiotaValor(text){
    // remove pontos/virgulas usados como separador de milhar (ex: "5.000" -> "5000")
    const semSeparadores = text.replace(/[.,](?=\d{3}(\D|$))/g, '');
    const match = semSeparadores.match(/\d+/);
    if (!match) return null;
    const valor = parseInt(match[0], 10);
    return Number.isNaN(valor) ? null : valor;
  }

  function concederEmprestimoAgiota(valor){
    casinoBalance += valor;
    saveCasinoBalance();
    renderCasinoBalance();

    agiotaDebt += valor;
    saveAgiotaDebt();

    agiotaAwaitingLoanAmount = false;
    ativarAgiotaCobranca();
    renderNubonk();

    addMessage('agiota', 'them', `Fechado! Caiu R$ ${valor} na sua conta agora. No total você já me deve R$ ${agiotaDebt}. Não me deixa esperando, hein.`);
  }

  function handleAgiotaUserMessage(text){
    const normalized = normalizeNerdText(text);
    const respostaTopicoAgiota = checarTopicos(agiotaTopicos, normalized);
if (respostaTopicoAgiota){
  addMessage('agiota', 'them', respostaTopicoAgiota);
  return;
}

    if (agiotaAwaitingLoanAmount){
      const valor = parseAgiotaValor(text);
      if (valor === null){
        addMessage('agiota', 'them', 'Fala um número, sô. Quanto você quer?');
        return;
      }
      if (valor < 1 || valor > 10000){
        addMessage('agiota', 'them', 'Só empresto valores entre R$ 1 e R$ 10.000. Quanto você quer, dentro desse limite?');
        return;
      }
      concederEmprestimoAgiota(valor);
      return;
    }

    if (agiotaEmprestimoKeywords.some(k => normalized.includes(k))){
      agiotaAwaitingLoanAmount = true;
      addMessage('agiota', 'them', 'Quanto?');
      return;
    }

    if (msnXingamentos.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaXingamentoReplies));
      return;
    }
    if (msnCantadas.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaCantadaReplies));
      return;
    }
    if (msnPiadaKeywords.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaPiadaReplies));
      return;
    }
    if (msnConselhoKeywords.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaConselhoReplies));
      return;
    }
    if (msnElogioKeywords.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaElogioReplies));
      return;
    }
    if (msnFarewellKeywords.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaFarewellReplies));
      return;
    }
    if (msnPerguntaSimplesKeywords.some(k => normalized.includes(k))){
      addMessage('agiota', 'them', pickRandom(agiotaPerguntaReplies));
      return;
    }
    if (msnGreetKeywords.some(k => normalized.includes(k)) && agiotaDebt <= 0){
      addMessage('agiota', 'them', pickRandom(agiotaGreetReplies));
      return;
    }

    if (agiotaDebt > 0){
      agiotaSendNag();
    } else {
      addMessage('agiota', 'them', 'Tá tudo quitado entre nós, pode ficar tranquilo.');
    }
  }

  function sendMsnMessage(){
    if (!msnComposeInput) return;
    const text = msnComposeInput.value.trim();
    if (!text) return;

    if (activeFriend){
      msnComposeInput.value = '';
      enviarMensagemAmigo(text);
      return;
    }

    addMessage(activeContact, 'me', text);
    msnComposeInput.value = '';

    if (activeContact === 'agiota'){
      setTimeout(() => {
        handleAgiotaUserMessage(text);
      }, 500 + Math.random() * 700);
    } else if (activeContact === 'carachato'){
      setTimeout(() => {
        const reply = carachatoKeywordReply(text);
        if (reply){
          addMessage('carachato', 'them', reply);
        } else if (Math.random() < 0.4){
          addMessage('carachato', 'them', pickRandom(carachatoMessages));
        }
      }, 600 + Math.random() * 900);
      } else if (activeContact === 'assistente'){

  setTimeout(() => {

    const reply = assistenteReply(text);

    if (reply){
      addMessage('assistente', 'them', reply);
    }

  }, 500 + Math.random() * 700);

    } else if (activeContact === 'nerdsabido'){
  const normalizedNow = normalizeNerdText(text);
  const isInsult = msnXingamentos.some(k => normalizedNow.includes(k));

  if (isInsult) nerdXingamentoStreak++;
  else nerdXingamentoStreak = 0;

  if (nerdXingamentoStreak >= 5){
    nerdXingamentoStreak = 0;
    setTimeout(() => {
      addMessage('nerdsabido', 'them', pickRandom(nerdUltimatoReplies));
      setTimeout(() => {
        startNerdApocalypse();
      }, 1200);
    }, 400);
    return;
  }

  setTimeout(() => {
    const reply = nerdSabidoReply(text);
    const normalized = normalizeNerdText(text);

    if (nerdChessKeywords.some(k => normalized.includes(k))){
      const msgObj = { sender: 'them', text: reply, time: formatTime(), buttonText: '▶ Jogar Xadrez', buttonAction: openChessGame };
      chatHistory[activeContact].push(msgObj);
      if (activeContact === 'nerdsabido') renderChat();
      updateBadge('nerdsabido');
    } else {
      addMessage('nerdsabido', 'them', reply);
    }
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
     XADREZ COM NERD SABIDO — mini-game integrado no MSN
  ===================================================== */
  
  function openChessGame(){
    // Cria a janela flutuante do xadrez
    const chessWindow = document.createElement('div');
    chessWindow.className = 'chess-game-window';
    chessWindow.innerHTML = `
      <div class="chess-window-header">
        <span>♔ Xadrez vs Nerd Sabido</span>
        <button class="chess-close-btn" type="button">×</button>
      </div>
      <div class="chess-window-body">
        <div class="chess-board-container">
          <div class="chess-board" id="chessBoard"></div>
        </div>
        <div class="chess-sidebar">
          <div class="chess-status">
            <p id="chessStatus">Você joga com as peças brancas. Seu turno!</p>
            <p id="chessMove" style="margin-top: 8px; font-size: 0.85em; color: #666;">Clique em uma peça e depois no destino</p>
          </div>
          <button class="chess-reset-btn" type="button">Nova Partida</button>
          <button class="chess-hint-btn" type="button">Dica 💡</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(chessWindow);
    
    const closeBtn = chessWindow.querySelector('.chess-close-btn');
    const resetBtn = chessWindow.querySelector('.chess-reset-btn');
    const hintBtn = chessWindow.querySelector('.chess-hint-btn');
    const statusEl = chessWindow.querySelector('#chessStatus');
    const moveEl = chessWindow.querySelector('#chessMove');
    const boardEl = chessWindow.querySelector('#chessBoard');
    
    closeBtn.addEventListener('click', () => chessWindow.remove());
    
    // Sistema de xadrez simplificado
    let board = initChessBoard();
    let selectedPiece = null;
    let selectedPiecePos = null;
    let whiteTurn = true;
    let gameOver = false;
    
    function initChessBoard(){
      return [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];
    }
    
    function getPieceSymbol(piece){
      const symbols = {
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
      };
      return symbols[piece] || '';
    }
    
    function renderBoard(){
      boardEl.innerHTML = '';
      for (let row = 0; row < 8; row++){
        for (let col = 0; col < 8; col++){
          const square = document.createElement('div');
          square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
          if (selectedPiecePos && selectedPiecePos[0] === row && selectedPiecePos[1] === col){
            square.classList.add('selected');
          }
          square.dataset.row = row;
          square.dataset.col = col;
          
          const piece = board[row][col];
          if (piece !== '.'){
            square.innerHTML = `<span class="chess-piece">${getPieceSymbol(piece)}</span>`;
          }
          
          square.addEventListener('click', () => handleSquareClick(row, col));
          boardEl.appendChild(square);
        }
      }
    }
    
    function handleSquareClick(row, col){
      if (gameOver || !whiteTurn) return;
      
      if (selectedPiecePos && selectedPiecePos[0] === row && selectedPiecePos[1] === col){
        selectedPiecePos = null;
        renderBoard();
        return;
      }
      
      if (selectedPiecePos){
        const [fromRow, fromCol] = selectedPiecePos;
        const piece = board[fromRow][fromCol];
        
        if (isValidMove(piece, fromRow, fromCol, row, col, true)){
          board[row][col] = piece;
          board[fromRow][fromCol] = '.';
          selectedPiecePos = null;
          whiteTurn = false;
          moveEl.textContent = 'Pensando...';
          statusEl.textContent = 'Vez do Nerd Sabido';
          renderBoard();
          
          setTimeout(() => makeAIMove(), 800 + Math.random() * 1200);
        } else {
          selectedPiecePos = null;
          renderBoard();
        }
      } else {
        const piece = board[row][col];
        if (piece !== '.' && piece === piece.toUpperCase()){
          selectedPiecePos = [row, col];
          renderBoard();
        }
      }
    }
    
    function isValidMove(piece, fromRow, fromCol, toRow, toCol, isWhite){
      if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
      
      const targetPiece = board[toRow][toCol];
      if (targetPiece !== '.' && targetPiece === targetPiece.toUpperCase() === isWhite) return false;
      
      const pieceLower = piece.toLowerCase();
      
      if (pieceLower === 'p'){
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        if (fromCol === toCol){
          if (toRow === fromRow + direction && board[toRow][toCol] === '.') return true;
          if (fromRow === startRow && toRow === fromRow + 2 * direction && 
              board[fromRow + direction][fromCol] === '.' && board[toRow][toCol] === '.') return true;
        }
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && targetPiece !== '.') return true;
        return false;
      }
      
      if (pieceLower === 'n'){
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
      }
      
      if (pieceLower === 'b' || pieceLower === 'r' || pieceLower === 'q'){
        if (pieceLower === 'b' && Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        if (pieceLower === 'r' && fromRow !== toRow && fromCol !== toCol) return false;
        
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        let r = fromRow + rowStep, c = fromCol + colStep;
        while (r !== toRow || c !== toCol){
          if (board[r][c] !== '.') return false;
          r += rowStep;
          c += colStep;
        }
        return true;
      }
      
      if (pieceLower === 'k'){
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
      }
      
      return false;
    }
    
    function makeAIMove(){
      let moved = false;
      
      // IA simples: tenta fazer um movimento aleatório válido
      for (let i = 0; i < 100 && !moved; i++){
        const fromRow = Math.floor(Math.random() * 8);
        const fromCol = Math.floor(Math.random() * 8);
        const piece = board[fromRow][fromCol];
        
        if (piece === '.' || piece !== piece.toLowerCase()) continue;
        
        const toRow = Math.floor(Math.random() * 8);
        const toCol = Math.floor(Math.random() * 8);
        
        if (isValidMove(piece, fromRow, fromCol, toRow, toCol, false)){
          board[toRow][toCol] = piece;
          board[fromRow][fromCol] = '.';
          moved = true;
          whiteTurn = true;
          moveEl.textContent = 'Seu turno!';
          statusEl.textContent = 'Você joga com as peças brancas. Seu turno!';
        }
      }
      
      if (!moved){
        gameOver = true;
        statusEl.textContent = 'Xeque-mate! O Nerd Sabido venceu! 🤓';
      }
      
      renderBoard();
    }
    
    resetBtn.addEventListener('click', () => {
      board = initChessBoard();
      selectedPiecePos = null;
      whiteTurn = true;
      gameOver = false;
      statusEl.textContent = 'Você joga com as peças brancas. Seu turno!';
      moveEl.textContent = 'Clique em uma peça e depois no destino';
      renderBoard();
    });
    
    hintBtn.addEventListener('click', () => {
      moveEl.textContent = '💡 Tenta mover um peão pra frente ou um cavalo!';
      setTimeout(() => {
        moveEl.textContent = 'Clique em uma peça e depois no destino';
      }, 3000);
    });
    
    renderBoard();
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
      const isFree = !!game.free || game.price === 0;
      const priceLabel = isFree ? 'Grátis' : `R$ ${game.price.toLocaleString('pt-BR')}`;
      const actionLabel = isFree ? 'Resgatar' : 'Comprar';
      const card = document.createElement('div');
      card.className = 'vitrine-card';
      card.innerHTML = `
        <span class="vitrine-card-cover"><img class="vitrine-card-cover-img" src="icones-site/${game.name}.png" alt="${game.name}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vitrine-card-cover-fallback',textContent:'${game.emoji}'}))"></span>
        <span class="vitrine-card-info">
          <span class="vitrine-card-name">${game.name}</span>
          <span class="vitrine-card-desc">${game.desc}</span>
          <span class="vitrine-card-price${isFree ? ' free' : ''}">${priceLabel}</span>
        </span>
        <button class="vitrine-card-btn${owned ? ' owned' : ''}" type="button" data-game="${game.id}"${owned ? ' disabled' : ''}>${owned ? '✅ Adquirido' : actionLabel}</button>
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
        <span class="vitrine-card-cover"><img class="vitrine-card-cover-img" src="icones-site/${game.name}.png" alt="${game.name}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vitrine-card-cover-fallback',textContent:'${game.emoji}'}))"></span>
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

    const isFree = !!game.free || game.price === 0;

    if (!isFree){
      if (casinoBalance < game.price){
        showVitrineFeedback('Saldo insuficiente pra comprar esse jogo.', true);
        return;
      }
      casinoBalance -= game.price;
      saveCasinoBalance();
      renderCasinoBalance();
    }

    addToInventory('jogos', gameId, 1);
    showVitrineFeedback(
      isFree ? `${game.emoji} ${game.name} resgatado! Já tá na sua Biblioteca.` : `${game.emoji} ${game.name} comprado! Já tá na sua Biblioteca.`,
      false
    );
    renderVitrineLoja();
    renderVitrineBiblioteca();
  }

  function launchGame(gameId){
    if (gameId === 'campo_minado'){
      openCampoMinadoWindow();
      return;
    }

    const windowId = gameId === 'fuga_policia' ? 'jogo-fuga-policia' : (gameId === 'xadrez' ? 'jogo-xadrez' : (gameId === 'penalti' ? 'jogo-penalti' : (gameId === 'progressbar95' ? 'jogo-progressbar95' : null)));
    if (!windowId) return;
    const win = windowsByApp[windowId];
    if (!win) return;

    if (gameId === 'fuga_policia') escapeResetGame();
    if (gameId === 'xadrez' && chessMode !== 'online') chessResetGame();
    if (gameId === 'penalti') penaltiVoltarParaEscolha();
    if (gameId === 'progressbar95') pb95OnOpen();

    openWindow(win);
  }

  /* ---------- JOGO "CAMPO MINADO" — abre numa janelinha flutuante
     do sistema (mesmo estilo das janelas de site, tipo aeropedia.com),
     e não dentro da janela da Vitrine ---------- */
  function renderCampoMinado(bodyEl){
    const COLS = 9, ROWS = 9, MINES = 10;

    bodyEl.innerHTML = `
      <div class="minado-app">
        <div class="minado-hud">
          <span class="minado-hud-item">🚩 <span id="minadoFlags">10</span></span>
          <button class="minado-reset-btn" id="minadoResetBtn" type="button">🙂 Recomeçar</button>
          <span class="minado-hud-item">⏱️ <span id="minadoTimer">0</span>s</span>
        </div>
        <div class="minado-grid" id="minadoGrid"></div>
        <p class="minado-msg" id="minadoMsg"></p>
        <p class="minado-hint">Clique esquerdo pra abrir uma célula, clique direito pra marcar uma bandeira 🚩.</p>
      </div>
    `;

    const gridEl = bodyEl.querySelector('#minadoGrid');
    const flagsLeftEl = bodyEl.querySelector('#minadoFlags');
    const timerEl = bodyEl.querySelector('#minadoTimer');
    const msgEl = bodyEl.querySelector('#minadoMsg');
    const resetBtn = bodyEl.querySelector('#minadoResetBtn');

    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 28px)`;

    let board, revealedCount, flagsPlaced, gameOver, firstClick, timerId, seconds;

    function inBounds(x, y){ return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

    function neighbors(x, y){
      const list = [];
      for (let dx = -1; dx <= 1; dx++){
        for (let dy = -1; dy <= 1; dy++){
          if (dx === 0 && dy === 0) continue;
          if (inBounds(x + dx, y + dy)) list.push({ x: x + dx, y: y + dy });
        }
      }
      return list;
    }

    function buildBoard(safeX, safeY){
      board = [];
      for (let y = 0; y < ROWS; y++){
        const row = [];
        for (let x = 0; x < COLS; x++) row.push({ mine: false, revealed: false, flagged: false, count: 0 });
        board.push(row);
      }
      let placed = 0;
      while (placed < MINES){
        const x = Math.floor(Math.random() * COLS);
        const y = Math.floor(Math.random() * ROWS);
        if (board[y][x].mine) continue;
        if (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) continue;
        board[y][x].mine = true;
        placed++;
      }
      for (let y = 0; y < ROWS; y++){
        for (let x = 0; x < COLS; x++){
          if (board[y][x].mine) continue;
          board[y][x].count = neighbors(x, y).filter(n => board[n.y][n.x].mine).length;
        }
      }
    }

    function startTimer(){
      stopTimer();
      seconds = 0;
      timerEl.textContent = '0';
      timerId = setInterval(() => {
        seconds++;
        timerEl.textContent = String(seconds);
      }, 1000);
    }
    function stopTimer(){
      if (timerId) clearInterval(timerId);
      timerId = null;
    }

    function render(){
      gridEl.innerHTML = '';
      for (let y = 0; y < ROWS; y++){
        for (let x = 0; x < COLS; x++){
          const cellData = board[y][x];
          const cellEl = document.createElement('div');
          cellEl.className = 'minado-cell';
          if (cellData.revealed){
            cellEl.classList.add('revealed');
            if (cellData.mine){
              cellEl.classList.add('mine');
              cellEl.textContent = '💣';
            } else if (cellData.count > 0){
              cellEl.textContent = String(cellData.count);
              cellEl.classList.add('n' + cellData.count);
            }
          } else if (cellData.flagged){
            cellEl.classList.add('flag');
            cellEl.textContent = '🚩';
          }
          cellEl.addEventListener('click', () => handleReveal(x, y));
          cellEl.addEventListener('contextmenu', (e) => { e.preventDefault(); handleFlag(x, y); });
          gridEl.appendChild(cellEl);
        }
      }
    }

    function revealFlood(startX, startY){
      const stack = [{ x: startX, y: startY }];
      const seen = new Set();
      while (stack.length){
        const cur = stack.pop();
        const key = cur.x + ',' + cur.y;
        if (seen.has(key)) continue;
        seen.add(key);
        const cell = board[cur.y][cur.x];
        if (cell.revealed || cell.flagged) continue;
        cell.revealed = true;
        revealedCount++;
        if (cell.count === 0 && !cell.mine){
          neighbors(cur.x, cur.y).forEach(n => stack.push(n));
        }
      }
    }

    function handleReveal(x, y){
      if (gameOver) return;
      const cell = board[y][x];
      if (cell.flagged || cell.revealed) return;

      if (firstClick){
        buildBoard(x, y);
        firstClick = false;
        startTimer();
      }

      const target = board[y][x];
      if (target.mine){
        target.revealed = true;
        endGame(false);
        render();
        return;
      }

      revealFlood(x, y);
      render();
      checkWin();
    }

    function handleFlag(x, y){
      if (gameOver) return;
      const cell = board[y][x];
      if (cell.revealed) return;
      if (!cell.flagged && flagsPlaced >= MINES) return;
      cell.flagged = !cell.flagged;
      flagsPlaced += cell.flagged ? 1 : -1;
      flagsLeftEl.textContent = String(MINES - flagsPlaced);
      render();
    }

    function checkWin(){
      const totalSafe = COLS * ROWS - MINES;
      if (revealedCount >= totalSafe) endGame(true);
    }

    function endGame(won){
      gameOver = true;
      stopTimer();
      if (won){
        msgEl.textContent = '🎉 Você limpou o campo! Parabéns!';
        board.forEach(row => row.forEach(cell => { if (cell.mine) cell.flagged = true; }));
      } else {
        msgEl.textContent = '💥 Bum! Você pisou numa mina.';
        board.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; }));
      }
      render();
    }

    function resetGame(){
      revealedCount = 0;
      flagsPlaced = 0;
      gameOver = false;
      firstClick = true;
      msgEl.textContent = '';
      flagsLeftEl.textContent = String(MINES);
      stopTimer();
      timerEl.textContent = '0';
      buildBoard(-5, -5);
      render();
    }

    resetBtn.addEventListener('click', resetGame);
    resetGame();

    // cleanup: para o timer quando a janelinha é fechada
    return function cleanup(){
      stopTimer();
    };
  }

  function openCampoMinadoWindow(){
    const win = document.createElement('div');
    win.className = 'site-window campo-minado-window';
    const offset = siteWindowOffset % 6;
    win.style.left = (90 + offset * 26) + 'px';
    win.style.top = (80 + offset * 22) + 'px';
    siteWindowOffset++;

    win.innerHTML = `
      <div class="site-window-titlebar">
        <span class="site-window-title">💣 Campo Minado</span>
        <button class="site-window-close" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="site-window-body"></div>
    `;

    document.body.appendChild(win);
    bringToFront(win);
    win.addEventListener('mousedown', () => bringToFront(win));

    const bodyEl = win.querySelector('.site-window-body');
    const cleanup = renderCampoMinado(bodyEl);

    win.querySelector('.site-window-close').addEventListener('click', () => {
      if (typeof cleanup === 'function') cleanup();
      win.remove();
    });

    makeSiteWindowDraggable(win);
  }

  if (vitrineLojaGridEl || vitrineBibliotecaGridEl){
    renderVitrineLoja();
    renderVitrineBiblioteca();
  }

  /* =====================================================
     JOGO "PROGRESSBAR95" (aberto a partir da Vitrine)
     Aba 1: clicker básico (clique pra gerar bytes, compre
     upgrades que aumentam bytes por clique e bytes por segundo).
     Aba 2: coletor — arquivos caem e você move uma "janelinha"
     (que não pode sair da área do jogo) pra pegar os bons 🟦
     e encher a barra de progresso; arquivos corrompidos 🟥
     esvaziam a barra. Ao encher 100%, ganha bytes bônus.
  ===================================================== */
  const PB95_SAVE_KEY = 'aero-progressbar95-save';

  const PB95_UPGRADES = [
    { id: 'turbo',     emoji: '👆', name: 'Clique Turbo',         desc: '+1 byte por clique',     baseCost: 15,   costMult: 1.15, type: 'click', amount: 1  },
    { id: 'bg',        emoji: '⚙️', name: 'Processo em 2º Plano', desc: '+1 byte por segundo',    baseCost: 30,   costMult: 1.15, type: 'auto',  amount: 1  },
    { id: 'compress',  emoji: '🗜️', name: 'Compressão de Dados',  desc: '+5 bytes por clique',     baseCost: 250,  costMult: 1.15, type: 'click', amount: 5  },
    { id: 'server',    emoji: '🖥️', name: 'Servidor Dedicado',    desc: '+10 bytes por segundo',   baseCost: 600,  costMult: 1.15, type: 'auto',  amount: 10 },
    { id: 'overclock', emoji: '🚀', name: 'Overclock',            desc: '+25 bytes por clique',    baseCost: 4000, costMult: 1.15, type: 'click', amount: 25 },
    { id: 'fiber',     emoji: '🌐', name: 'Fibra Óptica',         desc: '+50 bytes por segundo',   baseCost: 9000, costMult: 1.15, type: 'auto',  amount: 50 }
  ];

  let pb95State = { bytes: 0, owned: {}, round: 1, progress: 0, bestRound: 1 };
  let pb95ClickPower = 1;
  let pb95AutoPerSec = 0;

  function pb95Recalc(){
    pb95ClickPower = 1;
    pb95AutoPerSec = 0;
    PB95_UPGRADES.forEach(upg => {
      const owned = pb95State.owned[upg.id] || 0;
      if (owned <= 0) return;
      if (upg.type === 'click') pb95ClickPower += owned * upg.amount;
      else pb95AutoPerSec += owned * upg.amount;
    });
  }

  function pb95Load(){
    try{
      const saved = localStorage.getItem(PB95_SAVE_KEY);
      if (saved){
        const parsed = JSON.parse(saved);
        pb95State.bytes = Number(parsed.bytes) || 0;
        pb95State.owned = (parsed && parsed.owned) || {};
        pb95State.round = Number(parsed.round) || 1;
        pb95State.progress = Number(parsed.progress) || 0;
        pb95State.bestRound = Number(parsed.bestRound) || pb95State.round;
      }
    } catch(e){ /* save corrompido, ignora e comeca do zero */ }
    pb95Recalc();
  }

  function pb95Save(){
    try{
      localStorage.setItem(PB95_SAVE_KEY, JSON.stringify({
        bytes: pb95State.bytes,
        owned: pb95State.owned,
        round: pb95State.round,
        progress: pb95State.progress,
        bestRound: pb95State.bestRound
      }));
    } catch(e){ /* localStorage indisponivel, ignora */ }
  }

  pb95Load();

  const pb95Win = document.getElementById('jogo-progressbar95');
  const pb95BytesValueEl = document.getElementById('pb95BytesValue');
  const pb95RateDisplayEl = document.getElementById('pb95RateDisplay');
  const pb95ClickBtn = document.getElementById('pb95ClickBtn');
  const pb95UpgradesListEl = document.getElementById('pb95UpgradesList');
  const pb95RoundEl = document.getElementById('pb95Round');
  const pb95RoundRewardEl = document.getElementById('pb95RoundReward');
  const pb95ProgressFillEl = document.getElementById('pb95ProgressFill');
  const pb95ProgressLabelEl = document.getElementById('pb95ProgressLabel');
  const pb95CatchAreaEl = document.getElementById('pb95CatchArea');
  const pb95PaddleEl = document.getElementById('pb95Paddle');
  const pb95StartBtn = document.getElementById('pb95StartBtn');

  function pb95FormatNumber(n){
    return Math.floor(n).toLocaleString('pt-BR');
  }

  function pb95RenderStats(){
    if (pb95BytesValueEl) pb95BytesValueEl.textContent = pb95FormatNumber(pb95State.bytes);
    if (pb95RateDisplayEl) pb95RateDisplayEl.textContent = `+${pb95FormatNumber(pb95ClickPower)} por clique · +${pb95FormatNumber(pb95AutoPerSec)}/s`;
  }

  function pb95Cost(upg){
    const owned = pb95State.owned[upg.id] || 0;
    return Math.ceil(upg.baseCost * Math.pow(upg.costMult, owned));
  }

  function pb95RenderUpgrades(){
    if (!pb95UpgradesListEl) return;
    pb95UpgradesListEl.innerHTML = '';
    PB95_UPGRADES.forEach(upg => {
      const owned = pb95State.owned[upg.id] || 0;
      const cost = pb95Cost(upg);
      const canAfford = pb95State.bytes >= cost;
      const card = document.createElement('div');
      card.className = 'pb95-upgrade-card';
      card.innerHTML = `
        <span class="pb95-upgrade-icon">${upg.emoji}</span>
        <span class="pb95-upgrade-info">
          <span class="pb95-upgrade-name">${upg.name}${owned > 0 ? ` <span class="pb95-upgrade-owned">x${owned}</span>` : ''}</span>
          <span class="pb95-upgrade-desc">${upg.desc}</span>
        </span>
        <button class="pb95-upgrade-btn${canAfford ? '' : ' disabled'}" type="button" data-upg="${upg.id}">💾 ${pb95FormatNumber(cost)}</button>
      `;
      pb95UpgradesListEl.appendChild(card);
    });

    pb95UpgradesListEl.querySelectorAll('.pb95-upgrade-btn').forEach(btn => {
      btn.addEventListener('click', () => pb95Buy(btn.getAttribute('data-upg')));
    });
  }

  function pb95Buy(id){
    const upg = PB95_UPGRADES.find(u => u.id === id);
    if (!upg) return;
    const cost = pb95Cost(upg);
    if (pb95State.bytes < cost) return;
    pb95State.bytes -= cost;
    pb95State.owned[id] = (pb95State.owned[id] || 0) + 1;
    pb95Recalc();
    pb95Save();
    pb95RenderStats();
    pb95RenderUpgrades();
  }

  if (pb95ClickBtn){
    pb95ClickBtn.addEventListener('click', () => {
      pb95State.bytes += pb95ClickPower;
      pb95ClickBtn.classList.remove('pb95-pulse');
      void pb95ClickBtn.offsetWidth; // reinicia a animacao do clique
      pb95ClickBtn.classList.add('pb95-pulse');
      pb95RenderStats();
      pb95RenderUpgrades();
      pb95Save();
    });
  }

  // bytes passivos: roda sempre que o site estiver aberto, independente da janela estar visivel
  setInterval(() => {
    if (pb95AutoPerSec <= 0) return;
    pb95State.bytes += pb95AutoPerSec;
    pb95RenderStats();
    pb95RenderUpgrades();
    pb95Save();
  }, 1000);

  /* ---------- abas internas do ProgressBar95 (Clicker / Coletor) ---------- */
  const pb95Tabs = document.querySelectorAll('.pb95-tab');
  const pb95Panels = document.querySelectorAll('.pb95-panel');

  function pb95SwitchTab(target){
    pb95Tabs.forEach(t => t.classList.toggle('active', t.dataset.pb95tab === target));
    pb95Panels.forEach(p => { p.hidden = p.dataset.pb95panel !== target; });
    if (target !== 'coletor') pb95PauseRound();
  }

  pb95Tabs.forEach(tab => {
    tab.addEventListener('click', () => pb95SwitchTab(tab.dataset.pb95tab));
  });

  /* ---------- COLETOR: arquivos caindo, janelinha e barra de progresso ---------- */
  let pb95Running = false;
  let pb95Drops = [];
  let pb95PaddleX = 0;
  let pb95SpawnTimer = null;
  let pb95RafId = null;
  let pb95LastFrame = 0;

  const PB95_PADDLE_W = 64;
  const PB95_PADDLE_H = 16;
  const PB95_DROP_SIZE = 22;

  function pb95AreaWidth(){ return pb95CatchAreaEl ? pb95CatchAreaEl.clientWidth : 300; }
  function pb95AreaHeight(){ return pb95CatchAreaEl ? pb95CatchAreaEl.clientHeight : 260; }

  function pb95ClampPaddle(){
    const maxX = Math.max(0, pb95AreaWidth() - PB95_PADDLE_W);
    pb95PaddleX = Math.min(Math.max(pb95PaddleX, 0), maxX);
    if (pb95PaddleEl) pb95PaddleEl.style.left = pb95PaddleX + 'px';
  }

  if (pb95PaddleEl){
    pb95PaddleX = (pb95AreaWidth() - PB95_PADDLE_W) / 2;
    pb95ClampPaddle();
  }

  if (pb95CatchAreaEl){
    pb95CatchAreaEl.addEventListener('mousemove', (e) => {
      const rect = pb95CatchAreaEl.getBoundingClientRect();
      pb95PaddleX = e.clientX - rect.left - PB95_PADDLE_W / 2;
      pb95ClampPaddle();
    });
    pb95CatchAreaEl.addEventListener('touchmove', (e) => {
      if (!e.touches || !e.touches[0]) return;
      const rect = pb95CatchAreaEl.getBoundingClientRect();
      pb95PaddleX = e.touches[0].clientX - rect.left - PB95_PADDLE_W / 2;
      pb95ClampPaddle();
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    pb95CatchAreaEl.setAttribute('tabindex', '0');
    pb95CatchAreaEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft'){ pb95PaddleX -= 26; pb95ClampPaddle(); }
      if (e.key === 'ArrowRight'){ pb95PaddleX += 26; pb95ClampPaddle(); }
    });
  }

  function pb95RenderProgress(){
    const pct = Math.max(0, Math.min(100, Math.round(pb95State.progress)));
    if (pb95ProgressFillEl) pb95ProgressFillEl.style.width = pct + '%';
    if (pb95ProgressLabelEl) pb95ProgressLabelEl.textContent = pct + '%';
    if (pb95RoundEl) pb95RoundEl.textContent = String(pb95State.round);
  }

  function pb95ShowFloatText(x, y, text, isBad){
    if (!pb95CatchAreaEl) return;
    const el = document.createElement('span');
    el.className = 'pb95-float-text' + (isBad ? ' bad' : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    pb95CatchAreaEl.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  function pb95SpawnDrop(){
    if (!pb95CatchAreaEl) return;
    const isBad = Math.random() < 0.3;
    const el = document.createElement('div');
    el.className = 'pb95-drop' + (isBad ? ' bad' : '');
    el.textContent = isBad ? '🟥' : '🟦';
    const maxX = Math.max(0, pb95AreaWidth() - PB95_DROP_SIZE);
    const x = Math.random() * maxX;
    el.style.left = x + 'px';
    el.style.top = '-24px';
    pb95CatchAreaEl.appendChild(el);
    pb95Drops.push({ el, x, y: -24, bad: isBad, caught: false });
  }

  function pb95SpawnInterval(){ return Math.max(340, 900 - (pb95State.round - 1) * 30); }
  function pb95FallSpeed(){ return Math.min(260, 90 + (pb95State.round - 1) * 6); }

  function pb95CompleteRound(){
    const reward = Math.round(40 + pb95State.round * 12);
    pb95State.bytes += reward;
    pb95State.round += 1;
    if (pb95State.round > pb95State.bestRound) pb95State.bestRound = pb95State.round;
    pb95State.progress = 0;
    if (pb95RoundRewardEl){
      pb95RoundRewardEl.textContent = `+${pb95FormatNumber(reward)} bytes! 🎉`;
      setTimeout(() => { if (pb95RoundRewardEl) pb95RoundRewardEl.textContent = ''; }, 1800);
    }
    pb95RenderStats();
    pb95RenderUpgrades();
    pb95Save();
  }

  function pb95Tick(timestamp){
    if (!pb95Running) return;
    if (!pb95LastFrame) pb95LastFrame = timestamp;
    const dt = Math.min(0.05, (timestamp - pb95LastFrame) / 1000);
    pb95LastFrame = timestamp;

    const speed = pb95FallSpeed();
    const areaH = pb95AreaHeight();
    const paddleY = areaH - PB95_PADDLE_H - 6;

    for (let i = pb95Drops.length - 1; i >= 0; i--){
      const drop = pb95Drops[i];
      drop.y += speed * dt;
      drop.el.style.top = drop.y + 'px';

      const overlapY = drop.y + PB95_DROP_SIZE >= paddleY && drop.y <= paddleY + PB95_PADDLE_H;
      const overlapX = drop.x + PB95_DROP_SIZE >= pb95PaddleX && drop.x <= pb95PaddleX + PB95_PADDLE_W;

      if (!drop.caught && overlapY && overlapX){
        drop.caught = true;
        if (drop.bad){
          const loss = 10 + Math.random() * 8;
          pb95State.progress = Math.max(0, pb95State.progress - loss);
          pb95ShowFloatText(drop.x, drop.y, `-${Math.round(loss)}%`, true);
        } else {
          const gain = 6 + Math.random() * 4;
          pb95State.progress = Math.min(100, pb95State.progress + gain);
          pb95ShowFloatText(drop.x, drop.y, `+${Math.round(gain)}%`, false);
        }
        drop.el.remove();
        pb95Drops.splice(i, 1);
        pb95RenderProgress();

        if (pb95State.progress >= 100){
          pb95CompleteRound();
          pb95Drops.forEach(d => d.el.remove());
          pb95Drops = [];
        }
        continue;
      }

      if (drop.y > areaH){
        drop.el.remove();
        pb95Drops.splice(i, 1);
      }
    }

    pb95RafId = requestAnimationFrame(pb95Tick);
  }

  function pb95StartRound(){
    if (pb95Running) return;
    pb95Running = true;
    pb95LastFrame = 0;
    if (pb95StartBtn) pb95StartBtn.textContent = '⏸ Pausar';
    pb95SpawnTimer = setInterval(pb95SpawnDrop, pb95SpawnInterval());
    pb95RafId = requestAnimationFrame(pb95Tick);
  }

  function pb95PauseRound(){
    if (!pb95Running) return;
    pb95Running = false;
    if (pb95SpawnTimer) clearInterval(pb95SpawnTimer);
    pb95SpawnTimer = null;
    if (pb95RafId) cancelAnimationFrame(pb95RafId);
    pb95RafId = null;
    if (pb95StartBtn) pb95StartBtn.textContent = pb95State.progress > 0 ? '▶ Continuar' : '▶ Iniciar rodada';
    pb95Save();
  }

  if (pb95StartBtn){
    pb95StartBtn.addEventListener('click', () => {
      if (pb95Running) pb95PauseRound();
      else pb95StartRound();
    });
  }

  function pb95OnOpen(){
    pb95RenderStats();
    pb95RenderUpgrades();
    pb95RenderProgress();
    if (pb95StartBtn && !pb95Running){
      pb95StartBtn.textContent = pb95State.progress > 0 ? '▶ Continuar' : '▶ Iniciar rodada';
    }
  }

  // pausa o coletor se a janela do jogo for minimizada ou fechada
  if (pb95Win){
    const pb95CloseBtn = pb95Win.querySelector('.vista-close');
    const pb95MinBtn = pb95Win.querySelector('.vista-min');
    if (pb95CloseBtn) pb95CloseBtn.addEventListener('click', pb95PauseRound);
    if (pb95MinBtn) pb95MinBtn.addEventListener('click', pb95PauseRound);
  }

  pb95RenderStats();
  pb95RenderUpgrades();
  pb95RenderProgress();

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
  const chessSubEl = document.getElementById('chessSub');

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

  // ---- estado da partida online (multiplayer via Supabase) ----
  const chessOnlineInfoEl = document.getElementById('chessOnlineInfo');
  const chessInviteBtn = document.getElementById('chessInviteBtn');
  const chessLeaveBtn = document.getElementById('chessLeaveBtn');
  const chessInviteModal = document.getElementById('chessInviteModal');
  const chessInviteCloseBtn = document.getElementById('chessInviteCloseBtn');
  const chessInviteFriendList = document.getElementById('chessInviteFriendList');
  const chessInviteEmptyEl = document.getElementById('chessInviteEmpty');

  let chessMode = 'local';           // 'local' (hotseat) ou 'online' (multiplayer via amigos)
  let onlineChessGameId = null;      // id da linha em chess_games
  let onlineChessColor = null;       // 'w' ou 'b' — cor do currentUser nessa partida
  let onlineChessOpponent = null;    // { id, username, avatar }
  let chessGameChannel = null;       // canal realtime da partida atual
  let chessFriendsCache = [];        // preenchido em carregarAmigos(), usado no modal de convite

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
      } else if (chessMode === 'online'){
        chessStatusEl.textContent = chessTurn === onlineChessColor
          ? 'Sua vez!'
          : `Vez de ${onlineChessOpponent ? onlineChessOpponent.username : 'seu adversário'}...`;
        chessStatusEl.classList.remove('win');
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
    // no modo online só pode selecionar/mover peça na sua vez e da sua cor
    if (chessMode === 'online' && chessTurn !== onlineChessColor) return;

    const piece = chessBoard[row][col];

    if (chessSelected){
      const isLegal = chessLegal.some(m => m.row === row && m.col === col);
      if (isLegal){
        chessMakeMove(chessSelected.row, chessSelected.col, row, col);
        chessSelected = null;
        chessLegal = [];
        chessRender();
        if (chessMode === 'online') syncChessMove();
        return;
      }
    }

    if (piece && piece.color === chessTurn && (chessMode !== 'online' || piece.color === onlineChessColor)){
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

  /* ---------- XADREZ MULTIPLAYER (convite de amigos + Supabase Realtime) ---------- */

  // mostra/esconde os botões certos e a linha "jogando contra fulano" conforme o modo atual
  function atualizarChessOnlineUI(){
    if (chessOnlineInfoEl){
      if (chessMode === 'online' && onlineChessOpponent){
        const corLabel = onlineChessColor === 'w' ? 'brancas' : 'pretas';
        chessOnlineInfoEl.textContent = `🌐 Partida online vs ${onlineChessOpponent.username} — você joga com as ${corLabel}`;
        chessOnlineInfoEl.hidden = false;
      } else {
        chessOnlineInfoEl.hidden = true;
      }
    }
    if (chessSubEl) chessSubEl.hidden = chessMode === 'online';
    if (chessResetBtn) chessResetBtn.hidden = chessMode === 'online';
    if (chessInviteBtn) chessInviteBtn.hidden = chessMode === 'online';
    if (chessLeaveBtn) chessLeaveBtn.hidden = chessMode !== 'online';
  }

  // envia o estado atual do tabuleiro pro Supabase depois de uma jogada local
  async function syncChessMove(){
    if (chessMode !== 'online' || !onlineChessGameId) return;
    try{
      await supabase
        .from('chess_games')
        .update({
          board: chessBoard,
          turn: chessTurn,
          status: chessGameOver ? 'finished' : 'active',
          winner: chessGameOver ? chessWinner : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', onlineChessGameId);
    }catch(err){
      console.error('Erro ao sincronizar jogada de xadrez:', err);
    }
  }

  // escuta as jogadas do adversário em tempo real e atualiza o tabuleiro na hora
  function setupChessGameRealtime(gameId){
    if (chessGameChannel){ supabase.removeChannel(chessGameChannel); chessGameChannel = null; }

    chessGameChannel = supabase
      .channel('chess-game-' + gameId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        const row = payload.new;
        if (!row || row.id !== onlineChessGameId) return;
        chessBoard = row.board;
        chessTurn = row.turn;
        chessGameOver = row.status === 'finished';
        chessWinner = row.winner || null;
        chessSelected = null;
        chessLegal = [];
        chessRender();
      })
      .subscribe();
  }

  // entra numa partida online existente (seja como quem convidou, seja como quem aceitou)
  async function entrarPartidaXadrez(gameId){
    if (!currentUser) return;

    const { data: game, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();

    if (error || !game){
      alert('Não foi possível carregar essa partida.');
      return;
    }

    const isWhite = game.white_id === currentUser.id;
    const isBlack = game.black_id === currentUser.id;
    if (!isWhite && !isBlack) return;

    onlineChessGameId = game.id;
    onlineChessColor = isWhite ? 'w' : 'b';

    const opponentId = isWhite ? game.black_id : game.white_id;
    const { data: opponentUser } = await supabase
      .from('users')
      .select('username, avatar')
      .eq('id', opponentId)
      .maybeSingle();
    onlineChessOpponent = opponentUser
      ? { id: opponentId, username: opponentUser.username, avatar: opponentUser.avatar }
      : { id: opponentId, username: 'seu amigo' };

    chessMode = 'online';
    chessBoard = game.board;
    chessTurn = game.turn || 'w';
    chessGameOver = game.status === 'finished';
    chessWinner = game.winner || null;
    chessSelected = null;
    chessLegal = [];

    if (game.status === 'pending'){
      await supabase.from('chess_games').update({ status: 'active' }).eq('id', game.id);
    }

    setupChessGameRealtime(game.id);
    atualizarChessOnlineUI();
    chessRender();
    openWindow(windowsByApp['jogo-xadrez']);
  }

  // botão "Jogar" do convite dentro do chat: só entra se o amigo tiver o Xadrez comprado
  function aceitarConviteXadrez(gameId){
    const possuiXadrez = !!(inventory.jogos && inventory.jogos['xadrez'] > 0);
    if (!possuiXadrez){
      alert('Você precisa comprar o Xadrez na Vitrine antes de aceitar essa partida.');
      return;
    }
    entrarPartidaXadrez(gameId);
  }

  // sai da partida online e volta pro modo local (2 jogadores no mesmo pc)
  function sairPartidaXadrez(){
    chessMode = 'local';
    onlineChessGameId = null;
    onlineChessColor = null;
    onlineChessOpponent = null;
    if (chessGameChannel){ supabase.removeChannel(chessGameChannel); chessGameChannel = null; }
    atualizarChessOnlineUI();
    chessResetGame();
  }

  if (chessLeaveBtn) chessLeaveBtn.addEventListener('click', sairPartidaXadrez);

  // cria o convite: gera a partida no Supabase e manda uma mensagem especial pro amigo no MSN
  async function convidarAmigoXadrez(friend){
    if (!currentUser) return;

    const { data: game, error: erroJogo } = await supabase
      .from('chess_games')
      .insert([{
        white_id: currentUser.id,
        black_id: friend.id,
        board: chessInitialBoard(),
        turn: 'w',
        status: 'pending'
      }])
      .select()
      .single();

    if (erroJogo || !game){
      console.error('Erro ao criar partida de xadrez:', erroJogo);
      alert('Não foi possível criar o convite. Detalhe: ' + (erroJogo ? erroJogo.message : 'partida não retornada'));
      return;
    }

    const { error: erroMsg } = await supabase
      .from('messages')
      .insert([{
        sender_id: currentUser.id,
        receiver_id: friend.id,
        message: `${currentUser.username} te convidou para uma partida de xadrez`,
        type: 'chess_invite',
        chess_game_id: game.id
      }]);

    if (erroMsg){
      console.error('Erro ao enviar mensagem de convite:', erroMsg);
      alert('A partida foi criada, mas a mensagem de convite não chegou pro seu amigo. Detalhe: ' + erroMsg.message);
    }

    // quem convida já entra direto na partida, esperando o amigo aceitar
    await entrarPartidaXadrez(game.id);
  }

  // modal de escolha de amigo pra convidar
  function abrirModalConviteXadrez(){
    if (!chessInviteModal) return;
    if (chessInviteFriendList) chessInviteFriendList.innerHTML = '';

    if (chessFriendsCache.length === 0){
      if (chessInviteEmptyEl) chessInviteEmptyEl.hidden = false;
    } else {
      if (chessInviteEmptyEl) chessInviteEmptyEl.hidden = true;
      chessFriendsCache.forEach(f => {
        const item = document.createElement('div');
        item.className = 'chess-invite-item';
        const avatarImg = document.createElement('img');
        avatarImg.className = 'chess-invite-avatar';
        avatarImg.src = `icons/${f.avatar}.jpg`;
        avatarImg.alt = f.username;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'chess-invite-name';
        nameSpan.textContent = f.username;
        const sendBtn = document.createElement('button');
        sendBtn.className = 'glass-btn chess-invite-send-btn';
        sendBtn.type = 'button';
        sendBtn.textContent = 'Convidar';
        sendBtn.addEventListener('click', async () => {
          sendBtn.disabled = true;
          sendBtn.textContent = 'Enviando...';
          await convidarAmigoXadrez(f);
          chessInviteModal.hidden = true;
        });
        item.appendChild(avatarImg);
        item.appendChild(nameSpan);
        item.appendChild(sendBtn);
        chessInviteFriendList.appendChild(item);
      });
    }

    chessInviteModal.hidden = false;
  }

  if (chessInviteBtn){
    chessInviteBtn.addEventListener('click', () => {
      if (!currentUser){
        alert('Faça login (no app conta.exe) pra convidar um amigo.');
        return;
      }
      abrirModalConviteXadrez();
    });
  }

  if (chessInviteCloseBtn){
    chessInviteCloseBtn.addEventListener('click', () => { chessInviteModal.hidden = true; });
  }

  /* =====================================================
     JOGO: PÊNALTI DECISIVO (aberto a partir da Vitrine)
     Escolha de time (times do Brasileirão da tabela do
     aeroball.com) + disputa de pênaltis em turnos: você
     chuta contra o goleiro rival e depois defende os
     chutes do rival contra o seu goleiro.
  ===================================================== */
  const PENALTI_TIMES = [
    { id: 'PAL', nome: 'Palmeiras',           cor: '#0b6b2f' },
    { id: 'FLA', nome: 'Flamengo',            cor: '#c62828' },
    { id: 'FLU', nome: 'Fluminense',          cor: '#7a1030' },
    { id: 'RBB', nome: 'Red Bull Bragantino', cor: '#d32f2f' },
    { id: 'CAP', nome: 'Athletico-PR',        cor: '#b71c1c' },
    { id: 'BAH', nome: 'Bahia',               cor: '#1565c0' },
    { id: 'CBA', nome: 'Coritiba',            cor: '#2e7d32' },
    { id: 'SAO', nome: 'São Paulo',           cor: '#c62828' },
    { id: 'BOT', nome: 'Botafogo',            cor: '#212121' },
    { id: 'VIT', nome: 'Vitória',             cor: '#b71c1c' },
    { id: 'ATL', nome: 'Atlético-MG',         cor: '#263238' },
    { id: 'COR', nome: 'Corinthians',         cor: '#212121' },
    { id: 'CRU', nome: 'Cruzeiro',            cor: '#1565c0' },
    { id: 'INT', nome: 'Internacional',       cor: '#c62828' },
    { id: 'SAN', nome: 'Santos',              cor: '#212121' },
    { id: 'GRE', nome: 'Grêmio',              cor: '#0d47a1' },
    { id: 'VAS', nome: 'Vasco da Gama',       cor: '#212121' },
    { id: 'MIR', nome: 'Mirassol',            cor: '#f9a825' },
    { id: 'REM', nome: 'Remo',                cor: '#1565c0' },
    { id: 'CHA', nome: 'Chapecoense',         cor: '#2e7d32' }
  ];

  const penaltiTeamGridEl = document.getElementById('penaltiTeamGrid');
  const penaltiStageEscolhaEl = document.getElementById('penaltiStageEscolha');
  const penaltiStagePartidaEl = document.getElementById('penaltiStagePartida');
  const penaltiCrestUserEl = document.getElementById('penaltiCrestUser');
  const penaltiCrestRivalEl = document.getElementById('penaltiCrestRival');
  const penaltiNameUserEl = document.getElementById('penaltiNameUser');
  const penaltiNameRivalEl = document.getElementById('penaltiNameRival');
  const penaltiDotsUserEl = document.getElementById('penaltiDotsUser');
  const penaltiDotsRivalEl = document.getElementById('penaltiDotsRival');
  const penaltiStatusEl = document.getElementById('penaltiStatus');
  const penaltiGoalEl = document.getElementById('penaltiGoal');
  const penaltiBallEl = document.getElementById('penaltiBall');
  const penaltiKeeperEl = document.getElementById('penaltiKeeper');
  const penaltiActionsEl = document.getElementById('penaltiActions');
  const penaltiRestartBtn = document.getElementById('penaltiRestartBtn');

  const PENALTI_LADOS = [
    { id: 'esquerda', label: '⬅️ Esquerda' },
    { id: 'centro',   label: '⬆️ Centro'   },
    { id: 'direita',  label: '➡️ Direita'  }
  ];

  let penaltiTimeUser = null;
  let penaltiTimeRival = null;
  let penaltiCobrancasUser = [];   // true = gol, false = defendido/perdido
  let penaltiCobrancasRival = [];
  let penaltiFase = 'usuario';     // 'usuario' (cobrando) ou 'rival' (defendendo) ou 'fim'
  let penaltiTravado = false;      // trava os botões durante a animação

  function montarGradeTimesPenalti(){
    if (!penaltiTeamGridEl) return;
    penaltiTeamGridEl.innerHTML = '';
    PENALTI_TIMES.forEach(time => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'penalti-team-btn';
      btn.innerHTML = `
        <span class="penalti-crest" style="background:${time.cor}">${time.id}</span>
        <span class="penalti-team-name">${time.nome}</span>
      `;
      btn.addEventListener('click', () => penaltiIniciarPartida(time));
      penaltiTeamGridEl.appendChild(btn);
    });
  }

  // resultado de uma cobrança: quem chuta escolhe um lado, quem defende
  // escolhe um lado pra se jogar. Acertou o mesmo lado = defendeu.
  // Mesmo quando o goleiro erra o lado, sobra uma chance pequena de a
  // bola ir pra fora (trave/travessão), só pra não ser 100% previsível.
  function penaltiResolverCobranca(ladoChute, ladoDefesa){
    if (ladoChute === ladoDefesa) return false; // goleiro pegou
    return Math.random() > 0.12; // ~88% de chance de ser gol
  }

  function penaltiRenderPlacar(){
    if (penaltiNameUserEl) penaltiNameUserEl.textContent = penaltiTimeUser ? penaltiTimeUser.nome : '';
    if (penaltiNameRivalEl) penaltiNameRivalEl.textContent = penaltiTimeRival ? penaltiTimeRival.nome : '';
    if (penaltiCrestUserEl && penaltiTimeUser){
      penaltiCrestUserEl.textContent = penaltiTimeUser.id;
      penaltiCrestUserEl.style.background = penaltiTimeUser.cor;
    }
    if (penaltiCrestRivalEl && penaltiTimeRival){
      penaltiCrestRivalEl.textContent = penaltiTimeRival.id;
      penaltiCrestRivalEl.style.background = penaltiTimeRival.cor;
    }

    function renderDots(container, cobrancas){
      if (!container) return;
      container.innerHTML = '';
      for (let i = 0; i < 5; i++){
        const dot = document.createElement('span');
        const resultado = cobrancas[i];
        dot.className = 'penalti-dot' + (
          resultado === undefined ? ' pending' : (resultado ? ' goal' : ' miss')
        );
        container.appendChild(dot);
      }
    }
    renderDots(penaltiDotsUserEl, penaltiCobrancasUser);
    renderDots(penaltiDotsRivalEl, penaltiCobrancasRival);
  }

  // decide se a disputa já tem vencedor matemático antes das 5 cobranças
  // acabarem (igual pênalti de verdade: some quando não dá mais empate)
  function penaltiVerificarFimAntecipado(){
    const totalRodadas = 5;
    const golsUser = penaltiCobrancasUser.filter(r => r === true).length;
    const golsRival = penaltiCobrancasRival.filter(r => r === true).length;
    const restamUser = totalRodadas - penaltiCobrancasUser.length;
    const restamRival = totalRodadas - penaltiCobrancasRival.length;

    if (golsUser > golsRival + restamRival) return true;
    if (golsRival > golsUser + restamUser) return true;
    return false;
  }

  function penaltiEncerrarPartida(){
    penaltiFase = 'fim';
    const golsUser = penaltiCobrancasUser.filter(r => r === true).length;
    const golsRival = penaltiCobrancasRival.filter(r => r === true).length;

    let texto;
    if (golsUser > golsRival){
      texto = `🏆 ${penaltiTimeUser.nome} venceu a disputa por ${golsUser} a ${golsRival}! Parabéns, torcedor(a)!`;
    } else if (golsRival > golsUser){
      texto = `😔 ${penaltiTimeRival.nome} levou a melhor por ${golsRival} a ${golsUser}. Vai ter revanche?`;
    } else {
      texto = `🤝 Empate incrível em ${golsUser} a ${golsRival}! (isso não deveria acontecer, mas beleza)`;
    }

    if (penaltiStatusEl) penaltiStatusEl.textContent = texto;
    if (penaltiActionsEl) penaltiActionsEl.innerHTML = '';
  }

  function penaltiAnimarChute(ladoChute, ladoGoleiro, foiGol, callback){
    if (!penaltiBallEl || !penaltiKeeperEl){ callback(); return; }

    penaltiBallEl.className = 'penalti-ball penalti-ball-' + ladoChute + (foiGol ? '' : ' penalti-ball-defendido');
    penaltiKeeperEl.className = 'penalti-keeper penalti-keeper-' + ladoGoleiro;

    setTimeout(() => {
      penaltiBallEl.className = 'penalti-ball';
      penaltiKeeperEl.className = 'penalti-keeper';
      callback();
    }, 900);
  }

  function penaltiMontarBotoesLado(onEscolher){
    if (!penaltiActionsEl) return;
    penaltiActionsEl.innerHTML = '';
    PENALTI_LADOS.forEach(lado => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glass-btn penalti-dir-btn';
      btn.textContent = lado.label;
      btn.addEventListener('click', () => {
        if (penaltiTravado) return;
        onEscolher(lado.id);
      });
      penaltiActionsEl.appendChild(btn);
    });
  }

  function penaltiProximaRodada(){
    if (penaltiFase === 'fim') return;

    if (penaltiFase === 'usuario'){
      if (penaltiStatusEl) penaltiStatusEl.textContent = `Sua vez de cobrar! Escolha o canto (rodada ${penaltiCobrancasUser.length + 1}/5).`;
      penaltiMontarBotoesLado((ladoChute) => {
        penaltiTravado = true;
        const ladoGoleiro = pickRandom(PENALTI_LADOS).id;
        const foiGol = penaltiResolverCobranca(ladoChute, ladoGoleiro);
        penaltiAnimarChute(ladoChute, ladoGoleiro, foiGol, () => {
          penaltiCobrancasUser.push(foiGol);
          penaltiRenderPlacar();
          if (penaltiStatusEl){
            penaltiStatusEl.textContent = foiGol
              ? `⚽ GOL do ${penaltiTimeUser.nome}!`
              : `🧤 O goleiro do ${penaltiTimeRival.nome} defendeu!`;
          }
          penaltiTravado = false;
          setTimeout(() => {
            if (penaltiVerificarFimAntecipado()){ penaltiEncerrarPartida(); return; }
            penaltiFase = 'rival';
            penaltiProximaRodada();
          }, 1000);
        });
      });
    } else if (penaltiFase === 'rival'){
      if (penaltiStatusEl) penaltiStatusEl.textContent = `Agora defenda! Escolha pra que lado seu goleiro se joga (rodada ${penaltiCobrancasRival.length + 1}/5).`;
      penaltiMontarBotoesLado((ladoDefesa) => {
        penaltiTravado = true;
        const ladoChute = pickRandom(PENALTI_LADOS).id;
        const foiGol = penaltiResolverCobranca(ladoChute, ladoDefesa);
        penaltiAnimarChute(ladoChute, ladoDefesa, foiGol, () => {
          penaltiCobrancasRival.push(foiGol);
          penaltiRenderPlacar();
          if (penaltiStatusEl){
            penaltiStatusEl.textContent = foiGol
              ? `⚽ Gol do ${penaltiTimeRival.nome}...`
              : `🧤 Você defendeu o chute do ${penaltiTimeRival.nome}!`;
          }
          penaltiTravado = false;
          setTimeout(() => {
            if (penaltiVerificarFimAntecipado()){ penaltiEncerrarPartida(); return; }
            penaltiFase = 'usuario';
            penaltiProximaRodada();
          }, 1000);
        });
      });
    }
  }

  function penaltiIniciarPartida(timeEscolhido){
    penaltiTimeUser = timeEscolhido;
    const rivais = PENALTI_TIMES.filter(t => t.id !== timeEscolhido.id);
    penaltiTimeRival = pickRandom(rivais);
    penaltiCobrancasUser = [];
    penaltiCobrancasRival = [];
    penaltiFase = 'usuario';
    penaltiTravado = false;

    if (penaltiStageEscolhaEl) penaltiStageEscolhaEl.hidden = true;
    if (penaltiStagePartidaEl) penaltiStagePartidaEl.hidden = false;

    penaltiRenderPlacar();
    penaltiProximaRodada();
  }

  function penaltiVoltarParaEscolha(){
    penaltiTimeUser = null;
    penaltiTimeRival = null;
    penaltiCobrancasUser = [];
    penaltiCobrancasRival = [];
    penaltiFase = 'usuario';
    penaltiTravado = false;

    if (penaltiStagePartidaEl) penaltiStagePartidaEl.hidden = true;
    if (penaltiStageEscolhaEl) penaltiStageEscolhaEl.hidden = false;
    if (penaltiActionsEl) penaltiActionsEl.innerHTML = '';
  }

  montarGradeTimesPenalti();
  if (penaltiRestartBtn) penaltiRestartBtn.addEventListener('click', penaltiVoltarParaEscolha);

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

      let removedAny = false;

      if (virusActive || agiotaDebt > 0){
        stopVirus();
        removedAny = true;
        cmdAddLine('Janelas de "ME PAGUE" encerradas com sucesso.', 'cmd-line-success');

        if (agiotaDebt > 0){
          if (msnAgiotaContact) msnAgiotaContact.hidden = false;
          addMessage('agiota', 'them', pickRandom(agiotaHackedLines));
          cmdAddLine('O Agiota parece ter percebido... confira o MSN.', 'cmd-line-error');
        }
      }

      if (siteTrollVirus.isActive()){
        siteTrollVirus.stop();
        removedAny = true;
        cmdAddLine('Janelas maliciosas do xxx.aero.com encerradas com sucesso.', 'cmd-line-success');
      }

      if (cryptoVirus.isActive()){
        cryptoVirus.stop();
        removedAny = true;
        cmdAddLine('Minerador oculto do aerocripto.com encerrado com sucesso.', 'cmd-line-success');
      }

      if (!removedAny){
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

  /* =====================================================
     APP: TRABALHO: CÓDIGO — digite /code program - 10s
     pra rodar um "trabalho de programação": 10 segundos
     de código verde passando rápido e no final ganha
     um valor aleatório (quanto maior, mais raro).
  ===================================================== */
  const codigoOutputEl = document.getElementById('codigoOutput');
  const codigoInputForm = document.getElementById('codigoInputForm');
  const codigoInputEl = document.getElementById('codigoInput');
  codigoBalanceEl = document.getElementById('codigoBalance');
  const codigoBoostStatusEl = document.getElementById('codigoBoostStatus');

  const CODE_JOB_COMMAND = '/code program - 10s';
  const CODE_JOB_DURATION_MS = 10000;

  const CODE_REWARDS = [
    { min: 500,  max: 1000,  weight: 35   },
    { min: 1000, max: 2000,  weight: 25   },
    { min: 2000, max: 3500,  weight: 18   },
    { min: 3500, max: 5000,  weight: 12   },
    { min: 5000, max: 7000,  weight: 7    },
    { min: 7000, max: 8500,  weight: 2.5  },
    { min: 8500, max: 10000, weight: 0.5  }
  ];
  const CODE_REWARDS_TOTAL_WEIGHT = CODE_REWARDS.reduce((soma, r) => soma + r.weight, 0);

  let codigoRunning = false;

  function pickCodeReward(){
    let r = Math.random() * CODE_REWARDS_TOTAL_WEIGHT;
    for (const reward of CODE_REWARDS){
      if (r < reward.weight) return reward;
      r -= reward.weight;
    }
    return CODE_REWARDS[0];
  }

  function codigoAddLine(text, className){
    if (!codigoOutputEl) return;
    const p = document.createElement('p');
    p.className = 'cmd-line' + (className ? ' ' + className : '');
    p.textContent = text;
    codigoOutputEl.appendChild(p);
    codigoOutputEl.scrollTop = codigoOutputEl.scrollHeight;
  }

  function renderCodigoBalance(){
    if (!codigoBalanceEl) return;
    codigoBalanceEl.textContent = `R$ ${casinoBalance}`;
    codigoBalanceEl.classList.toggle('negative', casinoBalance < 0);
  }

  function spawnCodeJobPopup(onFinished){
    const popup = document.createElement('div');
    popup.className = 'hack-popup';
    popup.innerHTML = `
      <div class="hack-popup-titlebar">
        <span>trabalho-codigo.exe</span>
        <span class="hack-popup-timer" id="codigoPopupTimer">10s</span>
      </div>
      <div class="hack-popup-body" id="codigoPopupBody"></div>
    `;
    document.body.appendChild(popup);

    const bodyEl = popup.querySelector('#codigoPopupBody');
    const timerEl = popup.querySelector('#codigoPopupTimer');

    const startedAt = Date.now();

    const codeInterval = setInterval(() => {
      const line = document.createElement('p');
      line.className = 'hack-popup-code-line';
      line.textContent = hackRandomCodeLine();
      bodyEl.appendChild(line);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      if (bodyEl.childElementCount > 200){
        bodyEl.removeChild(bodyEl.firstElementChild);
      }
    }, 60);

    const timerInterval = setInterval(() => {
      const restanteS = Math.max(0, Math.ceil((CODE_JOB_DURATION_MS - (Date.now() - startedAt)) / 1000));
      if (timerEl) timerEl.textContent = `${restanteS}s`;
    }, 200);

    setTimeout(() => {
      clearInterval(codeInterval);
      clearInterval(timerInterval);

      const reward = pickCodeReward();
      const valorBase = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
      const valor = applyEarnBoost(valorBase);

      bodyEl.innerHTML = `
        <div class="hack-popup-result">
          <span class="hack-popup-result-title">TRABALHO CONCLUÍDO</span>
          <span class="hack-popup-result-sub">Você ganhou R$ ${valor}${getMoneyBoostMult() > 1 ? ` (boost ${getMoneyBoostMult()}x aplicado)` : ''}</span>
        </div>
      `;

      const closeRow = document.createElement('div');
      closeRow.className = 'hack-popup-closerow';
      closeRow.innerHTML = `<button class="glass-btn hack-popup-okbtn" type="button">Fechar</button>`;
      popup.appendChild(closeRow);
      closeRow.querySelector('button').addEventListener('click', () => popup.remove());

      if (onFinished) onFinished(valor);
    }, CODE_JOB_DURATION_MS);
  }

  function codigoExecuteJob(){
    if (codigoRunning) return;
    codigoRunning = true;
    if (codigoInputEl) codigoInputEl.disabled = true;

    codigoAddLine('Compilando projeto...', 'cmd-line-info');
    codigoAddLine('Rodando trabalho de programação (10s)...', 'cmd-line-info');

    spawnCodeJobPopup((valor) => {
      casinoBalance += valor;
      renderCasinoBalance();
      saveCasinoBalance();
      renderCodigoBalance();
      renderDigBalance();

      codigoAddLine(`TRABALHO CONCLUÍDO — Você ganhou R$ ${valor}.`, 'cmd-line-success');

      codigoRunning = false;
      if (codigoInputEl) codigoInputEl.disabled = false;
    });
  }

  function codigoHandleCommand(raw){
    const trimmed = raw.trim();
    codigoAddLine(`C:\\Trabalho\\código>${trimmed}`, 'cmd-line-echo');

    if (!trimmed) return;

    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

    if (normalized === CODE_JOB_COMMAND){
      codigoExecuteJob();
      return;
    }

    codigoAddLine(`'${trimmed}' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes.`, 'cmd-line-error');
  }

  if (codigoOutputEl){
    codigoAddLine('Ambiente de trabalho de programação carregado.', 'cmd-line-info');
    codigoAddLine(`Digite "${CODE_JOB_COMMAND}" e aperte Enter pra começar um trabalho.`, 'cmd-line-info');
    codigoAddLine('');
    renderCodigoBalance();
  }

  if (codigoInputForm && codigoInputEl){
    codigoInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (codigoRunning) return;
      const value = codigoInputEl.value;
      codigoInputEl.value = '';
      codigoHandleCommand(value);
    });
  }

  /* ---------- NAVEGADOR (GUGLE) ---------- */
  // O player de vídeo do YouTube foi removido: o navegador agora só mostra
  // a página inicial do Gugle (sem funcionalidade real de busca/navegação),
  // exceto pelos 5 sites especiais abaixo, que só abrem se o endereço for
  // digitado certinho na barra de pesquisa do Gugle.
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

  /* ===== SITE 1: xxx.aero.com — site troll de anúncio falso ===== */
  function renderSiteXxxAero(bodyEl){
    bodyEl.innerHTML = `
      <div class="troll-site">
        <div class="troll-header">🔥 EncontroFácil 🔥</div>
        <div class="troll-ad-banner">
          <p class="troll-ad-title">⚠️ Mães solteiras a 4 km de você!</p>
          <p class="troll-ad-sub">3 perfis da sua região estão online agora</p>
          <button class="troll-call-btn" id="trollCallBtn" type="button">📞 Chamar agora</button>
        </div>
        <div class="troll-fake-list">
          <div class="troll-fake-item">💃 "Perfil 01" está online</div>
          <div class="troll-fake-item">💃 "Perfil 02" está online</div>
          <div class="troll-fake-item">💃 "Perfil 03" está online</div>
        </div>
        <p class="troll-fine-print">Ao continuar, você concorda com absolutamente nada. Isso é claramente falso.</p>
      </div>
    `;

    const callBtn = bodyEl.querySelector('#trollCallBtn');
    callBtn.addEventListener('click', () => {
      callBtn.disabled = true;
      callBtn.textContent = 'Conectando...';
      setTimeout(() => {
        bodyEl.innerHTML = `
          <div class="troll-infected">
            <p class="troll-infected-title">💀 VOCÊ FOI INFECTADO!</p>
            <p class="troll-infected-sub">Era meio óbvio que isso ia dar merda...</p>
          </div>
        `;
        siteTrollVirus.start();
      }, 900);
    });
  }

  /* ===== SITE 2: aerogram.com — rede social estilo Instagram ===== */
  function renderSiteAerogram(bodyEl){
    // posts dos 4 contatos que também existem no MSN (2 posts de cada = 8 posts)
    const msnProfilePosts = [
      { user: 'zeburacoficial', avatar: '🕳️', emoji: '🚗', caption: 'Cavando mais um buraco pra pagar o Agiota 😅', likes: 214, time: '2h' },
      { user: 'zeburacoficial', avatar: '🕳️', emoji: '🕳️', caption: 'Buraco novo, dívida nova, vida boa', likes: 176, time: '8h' },
      { user: 'Cara Chato', avatar: '🙂', emoji: '📢', caption: 'Hoje reclamei de 12 coisas antes do café ☕', likes: 45, time: '1h' },
      { user: 'Cara Chato', avatar: '🙂', emoji: '😤', caption: 'Ninguém aguenta mais eu reclamando, mas eu continuo', likes: 63, time: '5h' },
      { user: 'Agiota', avatar: '🕴️', emoji: '💸', caption: 'Alguém aí me deve alguma coisa? 👀', likes: 3, time: '1d' },
      { user: 'Agiota', avatar: '🕴️', emoji: '📈', caption: 'Juros baixos? Aqui não. Aqui os juros sobem que nem foguete 🚀', likes: 27, time: '3h' },
      { user: 'Nerd Sabido', avatar: '🤓', emoji: '💻', caption: 'Ninguém lê os termos de uso mesmo né', likes: 87, time: '6h' },
      { user: 'Nerd Sabido', avatar: '🤓', emoji: '📚', caption: 'Decorei a Wikipédia inteira e continuo sozinho', likes: 112, time: '9h' }
    ];

    // pool de 24 perfis aleatórios que só existem dentro do aerogram (nomes sem nexo)
    const randomProfilesPool = [
      { user: 'Marcelo Bolafina', avatar: '🎳', emoji: '🍕', caption: 'Hoje derrubei todos os pinos e o respeito da galera', likes: 58, time: '3h' },
      { user: 'Maria Carro Mouse', avatar: '🖱️', emoji: '🚗', caption: 'Cliquei duas vezes e o carro ligou sozinho', likes: 91, time: '5h' },
      { user: 'Ernesto Empilhadeira', avatar: '🏗️', emoji: '📦', caption: 'Empilhei minhas contas do mesmo jeito que empilho caixa', likes: 34, time: '7h' },
      { user: 'Jurandir Sanduíche', avatar: '🥪', emoji: '🧀', caption: 'Sou basicamente feito de duas fatias de pão e problema', likes: 120, time: '2h' },
      { user: 'Vanuza Parafuso', avatar: '🔩', emoji: '🛠️', caption: 'Apertando parafuso e desapertando amizade', likes: 44, time: '10h' },
      { user: 'Robervaldo Guarda-chuva', avatar: '☂️', emoji: '🌧️', caption: 'Só abro quando já tá tudo molhado, sempre atrasado', likes: 67, time: '1h' },
      { user: 'Cleusa Micro-ondas', avatar: '📡', emoji: '🍗', caption: '3 minutos de potência alta e minha vida esquenta junto', likes: 203, time: '4h' },
      { user: 'Adalberto Tomada', avatar: '🔌', emoji: '⚡', caption: 'Tentando encaixar na vida e ninguém me dá espaço', likes: 12, time: '12h' },
      { user: 'Rosangela Extintor', avatar: '🧯', emoji: '🔥', caption: 'Apago fogueira dos outros e deixo a minha pegando', likes: 78, time: '6h' },
      { user: 'Wanderley Liquidificador', avatar: '🥤', emoji: '🍹', caption: 'Bato tudo até virar suco e ainda fico com sede', likes: 145, time: '2h' },
      { user: 'Neusa Disquete', avatar: '💾', emoji: '📀', caption: '1.44 MB de memória e nenhuma pra lembrar da senha', likes: 29, time: '15h' },
      { user: 'Osvaldo Ventilador', avatar: '🌀', emoji: '💨', caption: 'Girando a vida toda e não saio do lugar', likes: 51, time: '9h' },
      { user: 'Marlene Cortador de Grama', avatar: '🌱', emoji: '🌾', caption: 'Aparo o mato dos outros e o meu quintal é uma selva', likes: 83, time: '3h' },
      { user: 'Aparecido Micro-ônibus', avatar: '🚌', emoji: '🚏', caption: 'Pequeno mas levo mais gente que ônibus grande', likes: 39, time: '11h' },
      { user: 'Ivonete Chinelo', avatar: '🩴', emoji: '🦶', caption: 'Voei longe hoje, ninguém tava esperando', likes: 260, time: '1h' },
      { user: 'Reginaldo Cabo USB', avatar: '🔌', emoji: '🔋', caption: 'Nunca entra do primeiro jeito, sempre no terceiro', likes: 17, time: '13h' },
      { user: 'Sueli Panela de Pressão', avatar: '🍲', emoji: '💨', caption: 'Segurando a pressão da semana até explodir sexta', likes: 132, time: '4h' },
      { user: 'Deivinho Escova de Dentes', avatar: '🪥', emoji: '🦷', caption: 'Uso 2 minutos por dia e finjo que é rotina de skincare', likes: 22, time: '8h' },
      { user: 'Marilda Cadeira Giratória', avatar: '🪑', emoji: '💫', caption: 'Rodei tanto no trabalho que perdi o rumo da carreira', likes: 95, time: '5h' },
      { user: 'Anísio Controle Remoto', avatar: '📺', emoji: '🔋', caption: 'Sempre some debaixo do sofá igual minha motivação', likes: 61, time: '7h' },
      { user: 'Cida Pen-Drive', avatar: '💽', emoji: '📁', caption: '32 GB de memória e ninguém nunca me devolve', likes: 48, time: '10h' },
      { user: 'Waldemar Sofá-Cama', avatar: '🛋️', emoji: '🛏️', caption: 'De dia móvel, de noite cama, sempre com as costas doendo', likes: 74, time: '6h' },
      { user: 'Tereza Batedeira', avatar: '🍰', emoji: '🧁', caption: 'Bati tanto a massa que virei a fofoca do bairro', likes: 158, time: '2h' },
      { user: 'Juracy Máquina de Lavar', avatar: '🧺', emoji: '🫧', caption: 'Lavo roupa suja de todo mundo, menos a minha', likes: 106, time: '9h' }
    ];

    // sorteia 12 perfis aleatórios distintos do pool de 24
    const shuffledPool = [...randomProfilesPool];
    for (let i = shuffledPool.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }
    const chosenRandomProfiles = shuffledPool.slice(0, 12);

    // junta os 8 posts do MSN com os 12 aleatórios (total mínimo: 20 posts) e embaralha a ordem
    const posts = [...msnProfilePosts, ...chosenRandomProfiles];
    for (let i = posts.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [posts[i], posts[j]] = [posts[j], posts[i]];
    }

    const stories = ['🕳️', '🙂', '🕴️', '🤓', '🤖', '🎳', '🥪', '☂️'];

    // sorteia, sem repetir, quais das 20 imagens (images/image-1.jpg ... image-20.jpg)
    // cada post vai usar — muda toda vez que o site é aberto
    const imagePool = Array.from({ length: 20 }, (_, i) => i + 1);
    for (let i = imagePool.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [imagePool[i], imagePool[j]] = [imagePool[j], imagePool[i]];
    }

    bodyEl.innerHTML = `
      <div class="aerogram-app">
        <div class="aerogram-header">
          <span class="aerogram-logo">Aerogram</span>
          <div class="aerogram-nav">
            <span class="aerogram-nav-icon active" title="Início">🏠</span>
            <span class="aerogram-nav-icon" title="Buscar">🔍</span>
            <span class="aerogram-nav-icon" title="Notificações">❤️</span>
            <span class="aerogram-nav-icon" title="Perfil">👤</span>
          </div>
        </div>
        <div class="aerogram-stories" id="aerogramStories"></div>
        <div class="aerogram-feed" id="aerogramFeed"></div>
      </div>
    `;

    const storiesEl = bodyEl.querySelector('#aerogramStories');
    stories.forEach(emoji => {
      const s = document.createElement('div');
      s.className = 'aerogram-story';
      s.innerHTML = `<span class="aerogram-story-ring">${emoji}</span>`;
      storiesEl.appendChild(s);
    });

    const feedEl = bodyEl.querySelector('#aerogramFeed');
    posts.forEach((post, idx) => {
      const imgNumber = imagePool[idx % imagePool.length];
      const postEl = document.createElement('article');
      postEl.className = 'aerogram-post';
      postEl.innerHTML = `
        <div class="aerogram-post-header">
          <span class="aerogram-post-avatar">${post.avatar}</span>
          <span class="aerogram-post-user">${post.user}</span>
        </div>
        <div class="aerogram-post-image">
          <img src="images/image-${imgNumber}.jpg" alt="Foto de ${post.user}" loading="lazy">
          <span class="aerogram-post-image-fallback">${post.emoji}</span>
        </div>
        <div class="aerogram-post-actions">
          <button class="aerogram-like-btn" type="button" aria-label="Curtir">🤍</button>
          <span class="aerogram-comment-icon">💬</span>
        </div>
        <p class="aerogram-post-likes">${post.likes} curtidas</p>
        <p class="aerogram-post-caption"><strong>${post.user}</strong> ${post.caption}</p>
        <p class="aerogram-post-time">há ${post.time}</p>
      `;

      // substitui o avatar textual por uma imagem circular, tentando caminhos
      (function attachAerogramAvatar(){
        const avatarWrap = postEl.querySelector('.aerogram-post-avatar');
        if (!avatarWrap) return;

        const slug = slugifyName(post.user);
        const tryPaths = [`avatares/${slug}.png`, `avatares/${slug}.jpg`, `aerogram/${slug}.png`, `aerogram/${slug}.jpg`];
        let attempt = 0;
        const img = document.createElement('img');
        img.alt = post.user;

        function tryNext(){
          if (attempt >= tryPaths.length){
            // nenhum arquivo encontrado — mostra fallback emoji
            avatarWrap.innerHTML = '';
            const fb = document.createElement('span');
            fb.className = 'aerogram-avatar-fallback';
            fb.textContent = post.avatar;
            avatarWrap.appendChild(fb);
            return;
          }
          img.src = tryPaths[attempt++];
        }

        img.addEventListener('load', () => {
          avatarWrap.innerHTML = '';
          avatarWrap.appendChild(img);
        });

        img.addEventListener('error', () => tryNext());

        // inicia tentativas
        tryNext();
      })();

      const imgEl = postEl.querySelector('.aerogram-post-image img');
      const fallbackEl = postEl.querySelector('.aerogram-post-image-fallback');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        fallbackEl.style.display = 'flex';
      });

      const likeBtn = postEl.querySelector('.aerogram-like-btn');
      const likesEl = postEl.querySelector('.aerogram-post-likes');
      let liked = false;
      let likeCount = post.likes;
      likeBtn.addEventListener('click', () => {
        liked = !liked;
        likeCount += liked ? 1 : -1;
        likeBtn.textContent = liked ? '❤️' : '🤍';
        likeBtn.classList.toggle('is-liked', liked);
        likesEl.textContent = `${likeCount} curtidas`;
      });

      feedEl.appendChild(postEl);
    });
  }

  /* ===== SITE 3: aerocripto.com — minigame estilo Snake ===== */
  function renderSiteAeroCripto(bodyEl){
    const GRID = 14;
    const CELL = 20;

    bodyEl.innerHTML = `
      <div class="aerocripto-app">
        <div class="aerocripto-header">
          <span class="aerocripto-title">⛏️ AeroCripto</span>
          <span class="aerocripto-score">💎 <span id="aerocriptoScore">0</span></span>
        </div>
        <div class="aerocripto-canvas-wrap">
          <canvas class="aerocripto-canvas" id="aerocriptoCanvas" width="${GRID * CELL}" height="${GRID * CELL}" tabindex="0"></canvas>
          <div class="aerocripto-gameover" id="aerocriptoGameOver" hidden>
            <p class="aerocripto-gameover-title">💥 GAME OVER</p>
            <button class="aerocripto-restart" id="aerocriptoRestart" type="button">Jogar de novo</button>
          </div>
        </div>
        <p class="aerocripto-hint">Clique no jogo e use as setas (ou WASD). 💎 ganha dinheiro, 💣 é PERIGOSA.</p>
      </div>
    `;

    const canvas = bodyEl.querySelector('#aerocriptoCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = bodyEl.querySelector('#aerocriptoScore');
    const gameOverEl = bodyEl.querySelector('#aerocriptoGameOver');
    const restartBtn = bodyEl.querySelector('#aerocriptoRestart');

    let snake, dir, nextDir, food, score, loopId;

    function randomCell(){
      return { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    }

    function spawnFood(){
      let cell;
      do {
        cell = randomCell();
      } while (snake.some(s => s.x === cell.x && s.y === cell.y));
      food = { x: cell.x, y: cell.y, bomb: Math.random() < 0.22 };
    }

    function draw(){
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (food){
        ctx.font = `${CELL - 2}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(food.bomb ? '💣' : '💎', food.x * CELL + 1, food.y * CELL);
      }

      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#6fe3d6' : '#2f9e91';
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      });
    }

    function endGame(bombHit){
      if (loopId){ clearInterval(loopId); loopId = null; }
      gameOverEl.hidden = false;
      if (bombHit) cryptoVirus.start();
    }

    function tick(){
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
          snake.some(s => s.x === head.x && s.y === head.y)){
        endGame(false);
        draw();
        return;
      }

      snake.unshift(head);

      if (food && head.x === food.x && head.y === food.y){
        if (food.bomb){
          endGame(true);
          draw();
          return;
        }
        const ganho = applyEarnBoost(5 + Math.floor(Math.random() * 8));
        score += ganho;
        scoreEl.textContent = String(score);
        casinoBalance += ganho;
        renderCasinoBalance();
        saveCasinoBalance();
        spawnFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function resetGame(){
      snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      scoreEl.textContent = '0';
      gameOverEl.hidden = true;
      spawnFood();
      if (loopId) clearInterval(loopId);
      loopId = setInterval(tick, 140);
      draw();
    }

    function handleKey(e){
      const key = e.key;
      if ((key === 'ArrowUp' || key === 'w' || key === 'W') && dir.y === 0){ nextDir = { x: 0, y: -1 }; e.preventDefault(); }
      else if ((key === 'ArrowDown' || key === 's' || key === 'S') && dir.y === 0){ nextDir = { x: 0, y: 1 }; e.preventDefault(); }
      else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && dir.x === 0){ nextDir = { x: -1, y: 0 }; e.preventDefault(); }
      else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && dir.x === 0){ nextDir = { x: 1, y: 0 }; e.preventDefault(); }
    }

    canvas.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', () => canvas.focus());
    restartBtn.addEventListener('click', resetGame);

    resetGame();
    setTimeout(() => canvas.focus(), 60);

    // cleanup: para o loop do jogo quando a janela do site é fechada
    return function cleanup(){
      if (loopId) clearInterval(loopId);
    };
  }

  /* ===== SITE 4: aeropedia.com — enciclopédia livre do AeroOS, estilo Frutiger Aero ===== */
  function renderSiteAeropedia(bodyEl){
    const artigos = [
      {
        titulo: 'AeroOS',
        resumo: 'Visão geral do sistema operacional',
        corpo: `
          <p><strong>AeroOS</strong> é o sistema que você está usando agora. Combina o visual de vidro do <em>Windows Vista</em> com a barra de tarefas do <em>Windows 7</em> — daí o apelido de "Frutiger Aero" pra essa estética de bolhas, brilho e transparência.</p>
          <p>A área de trabalho reúne vários aplicativos: um cassino, um banco digital (Nubonk), um mensageiro (MSN), uma loja de jogos (Vitrine), um serviço de comida (aicomida) e um navegador com sites... nem todos confiáveis.</p>
        `
      },
      {
        titulo: 'Navegador & Gugle',
        resumo: 'O motor de busca do sistema',
        corpo: `
          <p>O <strong>Navegador</strong> abre direto na página do <strong>Gugle</strong>, motor de busca oficial do AeroOS. Ele não faz busca de verdade — mas se você digitar o endereço certinho de alguns sites na barra de pesquisa, uma janela nova se abre por cima da área de trabalho.</p>
          <p>Endereços conhecidos: <code>xxx.aero.com</code>, <code>aerogram.com</code>, <code>aerocripto.com</code>, <code>aeroball.com</code> e, claro, esta própria enciclopédia, <code>aeropedia.com</code>.</p>
        `
      },
      {
        titulo: 'Nubonk',
        resumo: 'Banco digital do usuário',
        corpo: `<p><strong>Nubonk</strong> é a conta digital sincronizada com o saldo do Cassino. Se o saldo fica negativo por tempo demais, um certo <em>Agiota</em> aparece cobrando lá no MSN.</p>`
      },
      {
        titulo: 'Agiota',
        resumo: 'Contato indesejado do MSN',
        corpo: `<p>O <strong>Agiota</strong> só aparece na lista de contatos do MSN quando o saldo do Nubonk fica negativo. O recomendado é quitar a dívida assim que possível pela aba Nubonk — ignorá-lo por tempo demais não costuma terminar bem.</p>`
      },
      {
        titulo: 'Vitrine',
        resumo: 'Loja e biblioteca de jogos',
        corpo: `<p>A <strong>Vitrine</strong> (ícone 🎮) é onde você adquire jogos pra sua Biblioteca. A maioria custa uma parte do saldo do Nubonk, mas de vez em quando aparece algum título gratuito com o botão <em>Resgatar</em> — é só clicar pra levar sem gastar nada.</p>`
      },
      {
        titulo: 'aicomida',
        resumo: 'Delivery de comida e estimulantes',
        corpo: `<p><strong>aicomida</strong> vende comida e estimulantes que recuperam a energia gasta na Escavação. Itens comprados ficam guardados no Inventário até serem consumidos.</p>`
      },
      {
        titulo: 'Escavação',
        resumo: 'Trabalho de cavar por dinheiro',
        corpo: `<p>Na <strong>Escavação</strong> (ícone da pá 🪏) você cava buracos pra ganhar dinheiro pro Nubonk. Cada cavada gasta energia, que se recupera sozinha bem devagar — ou mais rápido com comida e estimulantes do Inventário.</p>`
      },
      {
        titulo: 'Sites suspeitos',
        resumo: 'Cuidado ao navegar',
        corpo: `<p>Nem todo endereço que aparece no Gugle é confiável. Alguns sites escondem vírus, outros são só entretenimento disfarçado. Navegue com cuidado e desconfie de anúncios chamativos demais.</p>`
      }
    ];

    bodyEl.innerHTML = `
      <div class="aeropedia-app">
        <header class="aeropedia-header">
          <span class="aeropedia-logo">🌐 aeropedia</span>
          <span class="aeropedia-tagline">a enciclopédia livre do AeroOS</span>
        </header>
        <div class="aeropedia-search-row">
          <span class="aeropedia-search-icon">🔍</span>
          <input type="text" id="aeropediaSearch" class="aeropedia-search-input" placeholder="Buscar artigo..." autocomplete="off">
        </div>
        <div class="aeropedia-body">
          <nav class="aeropedia-sidebar" id="aeropediaSidebar"></nav>
          <article class="aeropedia-article" id="aeropediaArticle"></article>
        </div>
      </div>
    `;

    const sidebarEl = bodyEl.querySelector('#aeropediaSidebar');
    const articleEl = bodyEl.querySelector('#aeropediaArticle');
    const searchEl = bodyEl.querySelector('#aeropediaSearch');

    function renderArticle(artigo){
      articleEl.innerHTML = `
        <h1 class="aeropedia-article-title">${artigo.titulo}</h1>
        <p class="aeropedia-article-meta">📖 verbete da aeropedia · editado incontáveis vezes</p>
        <div class="aeropedia-article-body">${artigo.corpo}</div>
      `;
    }

    function renderSidebar(filtro){
      const termo = (filtro || '').trim().toLowerCase();
      sidebarEl.innerHTML = '';
      const filtrados = artigos.filter(a => !termo || a.titulo.toLowerCase().includes(termo) || a.resumo.toLowerCase().includes(termo));

      if (!filtrados.length){
        sidebarEl.innerHTML = '<p class="aeropedia-no-results">Nenhum artigo encontrado.</p>';
        articleEl.innerHTML = '';
        return;
      }

      filtrados.forEach((artigo, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'aeropedia-nav-item' + (idx === 0 ? ' active' : '');
        item.innerHTML = `<span class="aeropedia-nav-title">${artigo.titulo}</span><span class="aeropedia-nav-desc">${artigo.resumo}</span>`;
        item.addEventListener('click', () => {
          sidebarEl.querySelectorAll('.aeropedia-nav-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          renderArticle(artigo);
        });
        sidebarEl.appendChild(item);
      });

      renderArticle(filtrados[0]);
    }

    searchEl.addEventListener('input', () => renderSidebar(searchEl.value));

    renderSidebar('');
  }

  /* ===== SITE 5: aeroball.com — tabela do Brasileirão Série A ===== */
  function renderSiteAeroball(bodyEl){
    // Classificação atualizada até a 19ª rodada do Brasileirão Série A 2026
    const tabela = [
      { time: 'Palmeiras',           sigla: 'PAL', pj: 18, v: 12, e: 5, d: 1,  gp: 30, gc: 13, sg: 17,  pts: 41 },
      { time: 'Flamengo',            sigla: 'FLA', pj: 17, v: 10, e: 4, d: 3,  gp: 31, gc: 16, sg: 15,  pts: 34 },
      { time: 'Fluminense',          sigla: 'FLU', pj: 19, v: 9,  e: 5, d: 5,  gp: 29, gc: 24, sg: 5,   pts: 32 },
      { time: 'Red Bull Bragantino', sigla: 'RBB', pj: 19, v: 9,  e: 3, d: 7,  gp: 26, gc: 20, sg: 6,   pts: 30 },
      { time: 'Athletico-PR',        sigla: 'CAP', pj: 18, v: 9,  e: 3, d: 6,  gp: 24, gc: 18, sg: 6,   pts: 30 },
      { time: 'Bahia',               sigla: 'BAH', pj: 18, v: 8,  e: 5, d: 5,  gp: 27, gc: 23, sg: 4,   pts: 29 },
      { time: 'Coritiba',            sigla: 'CBA', pj: 18, v: 7,  e: 5, d: 6,  gp: 24, gc: 24, sg: 0,   pts: 26 },
      { time: 'São Paulo',           sigla: 'SAO', pj: 18, v: 7,  e: 4, d: 7,  gp: 23, gc: 20, sg: 3,   pts: 25 },
      { time: 'Botafogo',            sigla: 'BOT', pj: 18, v: 7,  e: 4, d: 7,  gp: 33, gc: 32, sg: 1,   pts: 25 },
      { time: 'Vitória',             sigla: 'VIT', pj: 18, v: 7,  e: 4, d: 7,  gp: 22, gc: 25, sg: -3,  pts: 25 },
      { time: 'Atlético-MG',         sigla: 'ATL', pj: 18, v: 7,  e: 3, d: 8,  gp: 22, gc: 23, sg: -1,  pts: 24 },
      { time: 'Corinthians',         sigla: 'COR', pj: 18, v: 6,  e: 6, d: 6,  gp: 18, gc: 19, sg: -1,  pts: 24 },
      { time: 'Cruzeiro',            sigla: 'CRU', pj: 18, v: 6,  e: 6, d: 6,  gp: 24, gc: 28, sg: -4,  pts: 24 },
      { time: 'Internacional',       sigla: 'INT', pj: 18, v: 5,  e: 6, d: 7,  gp: 21, gc: 22, sg: -1,  pts: 21 },
      { time: 'Santos',              sigla: 'SAN', pj: 19, v: 5,  e: 6, d: 8,  gp: 27, gc: 31, sg: -4,  pts: 21 },
      { time: 'Grêmio',              sigla: 'GRE', pj: 19, v: 5,  e: 6, d: 8,  gp: 21, gc: 25, sg: -4,  pts: 21 },
      { time: 'Vasco da Gama',       sigla: 'VAS', pj: 19, v: 5,  e: 5, d: 9,  gp: 22, gc: 30, sg: -8,  pts: 20 },
      { time: 'Mirassol',            sigla: 'MIR', pj: 18, v: 5,  e: 4, d: 9,  gp: 20, gc: 25, sg: -5,  pts: 19 },
      { time: 'Remo',                sigla: 'REM', pj: 18, v: 4,  e: 6, d: 8,  gp: 21, gc: 29, sg: -8,  pts: 18 },
      { time: 'Chapecoense',         sigla: 'CHA', pj: 18, v: 1,  e: 6, d: 11, gp: 17, gc: 35, sg: -18, pts: 9  }
    ];

    const linhas = tabela.map((t, idx) => {
      const pos = idx + 1;
      let zonaClass = '';
      if (pos <= 6) zonaClass = 'aeroball-row-libertadores';
      else if (pos >= 17) zonaClass = 'aeroball-row-relegation';
      const sgTexto = t.sg > 0 ? ('+' + t.sg) : String(t.sg);
      return `
        <tr class="${zonaClass}">
          <td class="aeroball-pos">${pos}</td>
          <td class="aeroball-col-team">${t.sigla} · ${t.time}</td>
          <td>${t.pj}</td>
          <td>${t.v}</td>
          <td>${t.e}</td>
          <td>${t.d}</td>
          <td>${t.gp}</td>
          <td>${t.gc}</td>
          <td>${sgTexto}</td>
          <td><strong>${t.pts}</strong></td>
        </tr>
      `;
    }).join('');

    bodyEl.innerHTML = `
      <div class="aeroball-app">
        <header class="aeroball-header">
          <span class="aeroball-logo"><span class="aeroball-ball">⚽</span>aeroball</span>
          <span class="aeroball-tagline">Brasileirão<br>Série A</span>
        </header>
        <p class="aeroball-updated">Classificação atualizada até a 19ª rodada</p>
        <div class="aeroball-table-wrap">
          <table class="aeroball-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="aeroball-col-team">Time</th>
                <th>PJ</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GP</th>
                <th>GC</th>
                <th>SG</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
        <div class="aeroball-legend">
          <span class="aeroball-legend-item"><span class="aeroball-legend-dot aeroball-dot-liber"></span>Libertadores</span>
          <span class="aeroball-legend-item"><span class="aeroball-legend-dot aeroball-dot-releg"></span>Rebaixamento</span>
        </div>
      </div>
    `;
  }

  /* ===== JANELAS DE SITE + ROTEAMENTO PELA BARRA DE PESQUISA DO GUGLE ===== */
  const SITE_DEFS = {
    'xxx.aero.com': { title: 'xxx.aero.com', render: renderSiteXxxAero },
    'aerogram.com': { title: 'Aerogram', render: renderSiteAerogram },
    'aerocripto.com': { title: 'AeroCripto', render: renderSiteAeroCripto },
    'aeropedia.com': { title: 'aeropedia', render: renderSiteAeropedia },
    'aeroball.com': { title: 'AeroBall', render: renderSiteAeroball }
  };

  let siteWindowOffset = 0;

  function normalizeSiteQuery(raw){
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '');
  }

  function makeSiteWindowDraggable(win){
    const titlebar = win.querySelector('.site-window-titlebar');
    if (!titlebar) return;

    function onMove(e){
      const x = Math.min(Math.max(0, e.clientX - win._dragOffsetX), window.innerWidth - 80);
      const y = Math.min(Math.max(0, e.clientY - win._dragOffsetY), window.innerHeight - 40);
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    }
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.site-window-close')) return;
      const rect = win.getBoundingClientRect();
      win._dragOffsetX = e.clientX - rect.left;
      win._dragOffsetY = e.clientY - rect.top;
      bringToFront(win);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function openSiteWindow(siteKey){
    const def = SITE_DEFS[siteKey];
    if (!def) return;

    const win = document.createElement('div');
    win.className = 'site-window';
    const offset = siteWindowOffset % 6;
    win.style.left = (90 + offset * 26) + 'px';
    win.style.top = (80 + offset * 22) + 'px';
    siteWindowOffset++;

    win.innerHTML = `
      <div class="site-window-titlebar">
        <span class="site-window-title">🌐 ${def.title}</span>
        <button class="site-window-close" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="site-window-body"></div>
    `;

    document.body.appendChild(win);
    bringToFront(win);
    win.addEventListener('mousedown', () => bringToFront(win));

    const bodyEl = win.querySelector('.site-window-body');
    const cleanup = def.render(bodyEl, win);

    win.querySelector('.site-window-close').addEventListener('click', () => {
      if (typeof cleanup === 'function') cleanup();
      win.remove();
    });

    makeSiteWindowDraggable(win);
  }

  // só existe uma forma de abrir esses 5 sites: digitando o endereço
  // certinho na barra de pesquisa do Gugle (seja a de cima ou a da home)
  function handleGugleQuery(raw){
    const query = normalizeSiteQuery(raw);
    if (query && SITE_DEFS[query]){
      openSiteWindow(query);
    }
  }

  if (browserAddressForm){
    browserAddressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleGugleQuery(browserAddressInput.value);
      browserAddressInput.value = '';
    });
  }

  if (gugleSearchForm && gugleSearchInput){
    gugleSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleGugleQuery(gugleSearchInput.value);
      gugleSearchInput.value = '';
    });
  }
/* ---------- SISTEMA DE USUARIOS (SUPABASE) ---------- */
  const AVATAR_COUNT = 13;
  const SESSION_KEY = 'aero_session';
  let currentUser = null;
  try{ currentUser = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }catch(err){ currentUser = null; }

  const loginProfile = document.getElementById('loginProfile');
  const loginForms = document.getElementById('loginForms');
  const profileAvatarImg = document.getElementById('profileAvatarImg');
  const profileUsername = document.getElementById('profileUsername');
  const profileCode = document.getElementById('profileCode');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  const startAccountBtn = document.getElementById('startAccountBtn');
  const startAccountAvatar = document.getElementById('startAccountAvatar');
  const startAccountName = document.getElementById('startAccountName');

  const loginFormEntrar = document.getElementById('loginFormEntrar');
  const loginFormCriar = document.getElementById('loginFormCriar');
  const registerAvatarGrid = document.getElementById('registerAvatarGrid');

  const registerAvatarPreview = document.getElementById('registerAvatarPreview');
  let selectedAvatar = 'icon-1';

  if (registerAvatarGrid){
    for (let i = 1; i <= AVATAR_COUNT; i++){
      const id = `icon-${i}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-swatch' + (id === selectedAvatar ? ' selected' : '');
      btn.dataset.avatar = id;
      btn.innerHTML = `<img src="icons/${id}.jpg" alt="${id}">`;
      registerAvatarGrid.appendChild(btn);
    }
    registerAvatarGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.avatar-swatch');
      if (!btn) return;
      selectedAvatar = btn.dataset.avatar;
      registerAvatarGrid.querySelectorAll('.avatar-swatch').forEach(s => s.classList.remove('selected'));
      btn.classList.add('selected');
      if (registerAvatarPreview) registerAvatarPreview.src = `icons/${selectedAvatar}.jpg`;
    });
  }

  function showLoginError(msg){
    if (!loginError) return;
    loginError.textContent = msg;
    loginError.hidden = false;
  }
  function clearLoginError(){
    if (loginError){ loginError.hidden = true; loginError.textContent = ''; }
  }

  function gerarCodigoAmigo(){
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function renderAccountUI(){
    if (currentUser){
      if (loginProfile) loginProfile.hidden = false;
      if (loginForms) loginForms.hidden = true;
      if (profileAvatarImg) profileAvatarImg.src = `icons/${currentUser.avatar}.jpg`;
      if (profileUsername) profileUsername.textContent = currentUser.username;
      if (profileCode) profileCode.textContent = `Código: ${currentUser.codigo}`;
      if (startAccountAvatar) startAccountAvatar.innerHTML = `<img src="icons/${currentUser.avatar}.jpg" alt="avatar">`;
      if (startAccountName) startAccountName.textContent = currentUser.username;
    } else {
      if (loginProfile) loginProfile.hidden = true;
      if (loginForms) loginForms.hidden = false;
      if (startAccountAvatar) startAccountAvatar.innerHTML = '👤';
      if (startAccountName) startAccountName.textContent = 'Login';
    }
  }

  function saveSession(user){
    currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    renderAccountUI();
    carregarAmigos();
    setupPresence();
    setupMessagesRealtime();
  }

  function clearSession(){
    currentUser = null;
    activeFriend = null;
    if (presenceChannel){ supabase.removeChannel(presenceChannel); presenceChannel = null; }
    if (friendMessagesChannel){ supabase.removeChannel(friendMessagesChannel); friendMessagesChannel = null; }
    if (chessGameChannel){ supabase.removeChannel(chessGameChannel); chessGameChannel = null; }
    chessMode = 'local';
    onlineChessGameId = null;
    onlineChessColor = null;
    onlineChessOpponent = null;
    localStorage.removeItem(SESSION_KEY);
    renderAccountUI();
  }

  if (startAccountBtn){
    startAccountBtn.addEventListener('click', () => {
      toggleWindowFromTrigger(windowsByApp['login']);
      if (startMenu) startMenu.classList.remove('open');
    });
  }

  document.querySelectorAll('[data-login-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-login-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.loginTab;
      document.querySelectorAll('[data-login-panel]').forEach(p => {
        p.hidden = p.dataset.loginPanel !== target;
      });
      clearLoginError();
    });
  });

  if (loginFormEntrar){
    loginFormEntrar.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearLoginError();
      const username = document.getElementById('loginUsernameInput').value.trim();
      const password = document.getElementById('loginPasswordInput').value;
      if (!username || !password) return;

      try{
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar, codigo, password')
          .eq('username', username)
          .maybeSingle();

        if (error || !data || data.password !== password){
          showLoginError('Usuário ou senha inválidos.');
          return;
        }

        saveSession({ id: data.id, username: data.username, avatar: data.avatar, codigo: data.codigo });
        loginFormEntrar.reset();
      } catch (err){
        console.error('Erro ao entrar:', err);
        showLoginError('Erro de conexão com o Supabase. Verifique a URL/chave em supabase.js.');
      }
    });
  }

  if (loginFormCriar){
    loginFormCriar.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearLoginError();
      const username = document.getElementById('registerUsernameInput').value.trim();
      const password = document.getElementById('registerPasswordInput').value;
      if (!username || !password){
        showLoginError('Preencha usuário e senha.');
        return;
      }

      try{
        const { data: existente, error: erroChecagem } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (erroChecagem){
          console.error('Erro ao checar usuário:', erroChecagem);
          showLoginError('Erro ao falar com o Supabase (confira a tabela "users" e as policies).');
          return;
        }

        if (existente){
          showLoginError('Esse usuário já existe.');
          return;
        }

        const codigo = gerarCodigoAmigo();

        const { data, error } = await supabase
          .from('users')
          .insert([{ username, password, avatar: selectedAvatar, codigo }])
          .select('id, username, avatar, codigo')
          .single();

        if (error){
          console.error('Erro ao criar conta:', error);
          showLoginError('Não foi possível criar a conta: ' + error.message);
          return;
        }

        saveSession(data);
        loginFormCriar.reset();
      } catch (err){
        console.error('Erro ao criar conta:', err);
        showLoginError('Erro de conexão com o Supabase. Verifique a URL/chave em supabase.js.');
      }
    });
  }

  if (logoutBtn){
    logoutBtn.addEventListener('click', () => {
      clearSession();
    });
  }

  /* ---------- AMIGOS ---------- */
  const msnFriendCodeInput = document.getElementById('msnFriendCodeInput');
  const msnAddFriendForm = document.getElementById('msnAddFriendForm');
  const msnAddFriendMsg = document.getElementById('msnAddFriendMsg');
  const msnFriendsList = document.getElementById('msnFriendsList');

  function showFriendMsg(msg){
    if (!msnAddFriendMsg) return;
    msnAddFriendMsg.textContent = msg;
    msnAddFriendMsg.hidden = false;
    setTimeout(() => { msnAddFriendMsg.hidden = true; }, 3500);
  }

  async function carregarAmigos(){
    if (!currentUser || !msnFriendsList) return;
    msnFriendsList.innerHTML = '';
    chessFriendsCache = [];

    const { data, error } = await supabase
      .from('friends')
      .select('friend_id, users:friend_id (username, avatar)')
      .eq('user_id', currentUser.id);

    if (error || !data) return;

    data.forEach(row => {
      const u = row.users;
      if (!u) return;
      chessFriendsCache.push({ id: row.friend_id, username: u.username, avatar: u.avatar });
      const item = document.createElement('div');
      item.className = 'msn-friend-item';
      item.dataset.friendId = row.friend_id;
      item.dataset.friendName = u.username;
      item.dataset.friendAvatar = u.avatar;
      item.innerHTML = `
        <img class="msn-friend-avatar" src="icons/${u.avatar}.jpg" alt="${u.username}">
        <span class="msn-friend-info">
          <span class="msn-friend-name">${u.username}</span>
          <span class="msn-friend-status offline">○ Offline</span>
        </span>
      `;
      msnFriendsList.appendChild(item);
    });

    atualizarStatusAmigos();
  }

  if (msnAddFriendForm){
    msnAddFriendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser){
        showFriendMsg('Faça login para adicionar amigos.');
        return;
      }
      const codigo = msnFriendCodeInput.value.trim().toUpperCase();
      if (!codigo) return;

      const { data: amigo, error: erroAmigo } = await supabase
        .from('users')
        .select('id, username')
        .eq('codigo', codigo)
        .maybeSingle();

      if (erroAmigo || !amigo){
        showFriendMsg('Código não encontrado.');
        return;
      }

      if (amigo.id === currentUser.id){
        showFriendMsg('Você não pode adicionar a si mesmo.');
        return;
      }

      const { error: erroInsert } = await supabase
        .from('friends')
        .insert([{ user_id: currentUser.id, friend_id: amigo.id }]);

      if (erroInsert){
        showFriendMsg('Esse amigo já foi adicionado.');
        return;
      }

      showFriendMsg(`${amigo.username} adicionado!`);
      msnFriendCodeInput.value = '';
      carregarAmigos();
    });
  }

  document.querySelectorAll('[data-msn-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-msn-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.msnTab;
      document.querySelectorAll('[data-msn-panel]').forEach(p => {
        p.hidden = p.dataset.msnPanel !== target;
      });
    });
  });

  /* ---------- CHAT REAL COM AMIGOS (SUPABASE REALTIME) ---------- */
  let activeFriend = null;              // { id, username, avatar } do amigo com quem se está falando
  let presenceChannel = null;           // canal de presença (quem está online)
  let friendMessagesChannel = null;     // canal de mensagens recebidas em tempo real
  let onlineUserIds = new Set();

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatMsgTime(iso){
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function bubbleFriendMsg(msg){
    const isMe = msg.sender_id === currentUser.id;

    const bubble = document.createElement('div');
    bubble.className = `msn-msg ${isMe ? 'msn-msg-me' : 'msn-msg-them'}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = msg.message;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'msn-msg-time';
    timeSpan.textContent = formatMsgTime(msg.created_at);

    bubble.appendChild(textSpan);
    bubble.appendChild(timeSpan);

    // convite de partida de xadrez: mostra um botão "Jogar" na bolha
    if (msg.type === 'chess_invite' && msg.chess_game_id){
      const btnContainer = document.createElement('div');
      btnContainer.className = 'msn-msg-button-container';
      const btn = document.createElement('button');
      btn.className = 'msn-msg-action-btn';
      btn.type = 'button';
      btn.textContent = '♟️ Jogar';
      btn.addEventListener('click', () => aceitarConviteXadrez(msg.chess_game_id));
      btnContainer.appendChild(btn);
      bubble.appendChild(btnContainer);
    }

    return bubble;
  }

  // abre a conversa com um amigo: mostra o header, carrega o historico do Supabase e renderiza
  async function abrirConversaAmigo(friend){
    if (!currentUser) return;

    activeFriend = friend;
    activeContact = null;

    document.querySelectorAll('.msn-contact').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.msn-friend-item').forEach(el => {
      el.classList.toggle('active', el.dataset.friendId === friend.id);
    });

    if (msnChatHeader) msnChatHeader.textContent = friend.username;
    if (msnMessages) msnMessages.innerHTML = '<p class="msn-chat-loading">Carregando conversa...</p>';

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (!msnMessages) return;
    msnMessages.innerHTML = '';

    if (error || !data){
      msnMessages.innerHTML = '<p class="msn-chat-loading">Não foi possível carregar as mensagens.</p>';
      return;
    }

    data.forEach(msg => msnMessages.appendChild(bubbleFriendMsg(msg)));
    msnMessages.scrollTop = msnMessages.scrollHeight;
  }

  // envia uma mensagem real pro Supabase e mostra na hora (sem esperar o realtime, ja que o
  // filtro do canal so escuta mensagens recebidas, nao as que a gente mesmo envia)
  async function enviarMensagemAmigo(text){
    if (!currentUser || !activeFriend) return;

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id: currentUser.id, receiver_id: activeFriend.id, message: text }])
      .select()
      .single();

    if (!error && data && msnMessages){
      msnMessages.appendChild(bubbleFriendMsg(data));
      msnMessages.scrollTop = msnMessages.scrollHeight;
    }
  }

  // clique num amigo da lista abre a conversa real
  if (msnFriendsList){
    msnFriendsList.addEventListener('click', (e) => {
      const item = e.target.closest('.msn-friend-item');
      if (!item) return;
      abrirConversaAmigo({
        id: item.dataset.friendId,
        username: item.dataset.friendName,
        avatar: item.dataset.friendAvatar
      });
    });
  }

  // recebe mensagens novas em tempo real (via Supabase Realtime) mesmo com outra conversa aberta
  function setupMessagesRealtime(){
    if (!currentUser) return;
    if (friendMessagesChannel){ supabase.removeChannel(friendMessagesChannel); }

    friendMessagesChannel = supabase
      .channel('messages-' + currentUser.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`
      }, (payload) => {
        const msg = payload.new;
        if (activeFriend && msg.sender_id === activeFriend.id && msnMessages){
          msnMessages.appendChild(bubbleFriendMsg(msg));
          msnMessages.scrollTop = msnMessages.scrollHeight;
        }
      })
      .subscribe();
  }

  // presença: marca quem esta online agora (lista de amigos mostra ● Online / ○ Offline)
  function atualizarStatusAmigos(){
    document.querySelectorAll('.msn-friend-item').forEach(item => {
      const online = onlineUserIds.has(item.dataset.friendId);
      const statusEl = item.querySelector('.msn-friend-status');
      if (!statusEl) return;
      statusEl.textContent = online ? '● Online' : '○ Offline';
      statusEl.classList.toggle('offline', !online);
    });
  }

  function setupPresence(){
    if (!currentUser) return;
    if (presenceChannel){ supabase.removeChannel(presenceChannel); }

    presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: currentUser.id } }
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      onlineUserIds = new Set(Object.keys(presenceChannel.presenceState()));
      atualizarStatusAmigos();
    });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED'){
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });
  }

  renderAccountUI();
  if (currentUser){
    carregarAmigos();
    setupPresence();
    setupMessagesRealtime();
  }
  /* ============================
   MOBILE
============================ */

if (window.innerWidth <= 900) {

    document.querySelectorAll(".mobile-app, .dock-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            const app = btn.dataset.app;

            const janela = document.getElementById(app);

            if (!janela) return;

            janela.classList.remove("is-closed");

            janela.style.display = "flex";
            janela.style.position = "fixed";
            janela.style.left = "0";
            janela.style.top = "42px";
            janela.style.width = "100vw";
            janela.style.height = "calc(100vh - 42px)";
            janela.style.margin = "0";
            janela.style.zIndex = "9999999";

        });

    });

}

  /* =====================================================
     DRAG SELECTION - SELECIONAR MÚLTIPLOS ÍCONES
  ===================================================== */
  let isSelecting = false;
  let startX, startY;
  const selectionBox = document.createElement('div');
  selectionBox.className = 'selection-rectangle';
  document.body.appendChild(selectionBox);

  desktopIcons.addEventListener('mousedown', (e) => {
    if (e.target.closest('.desktop-icon')) return;
    
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
    selectionBox.classList.add('active');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const minX = Math.min(startX, currentX);
    const minY = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = minX + 'px';
    selectionBox.style.top = minY + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';

    desktopIconEls.forEach(icon => {
      const iconRect = icon.getBoundingClientRect();
      const boxRect = {
        left: minX,
        top: minY,
        right: minX + width,
        bottom: minY + height
      };

      const intersects = !(
        iconRect.right < boxRect.left ||
        iconRect.left > boxRect.right ||
        iconRect.bottom < boxRect.top ||
        iconRect.top > boxRect.bottom
      );

      if (intersects) {
        icon.classList.add('selected');
      } else {
        icon.classList.remove('selected');
      }
    });
  });

  document.addEventListener('mouseup', () => {
    isSelecting = false;
    selectionBox.classList.remove('active');
  });

});