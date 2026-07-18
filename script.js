/* =====================================================
   AERO VISTA/7 — INTERACOES
   Menu iniciar, troca de tema (claro <-> escuro),
   janelas arrastaveis com abrir/fechar/minimizar,
   taskbar estilo Win7.
===================================================== */

document.addEventListener('DOMContentLoaded', () => {

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

  /* ---------- BOTOES DA TASKBAR <-> JANELAS REAIS ---------- */
  // Cada botao da taskbar (data-app) aponta para o id da janela correspondente
  // no HTML (ex: data-app="inicio" -> <section id="inicio">). Clicar:
  // - se a janela estiver fechada -> reabre ela
  // - se estiver aberta -> minimiza/restaura, igual clicar no "_" da propria janela
  const taskbarButtons = document.querySelectorAll('.taskbar-btn');
  const windowsByApp = {};

  taskbarButtons.forEach(btn => {
    const win = document.getElementById(btn.dataset.app);
    if (win) windowsByApp[btn.dataset.app] = win;
  });

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

  function openWindow(win){
    win.classList.remove('is-closed');
    setWindowMinimized(win, false);
    bringToFront(win);
  }

  function closeWindow(win){
    win.classList.add('is-closed');
    const btn = getTaskbarBtn(win);
    if (btn) btn.classList.remove('active');
  }

  taskbarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const win = windowsByApp[btn.dataset.app];
      if (!win) return;

      if (win.classList.contains('is-closed')){
        openWindow(win);
        return;
      }

      setWindowMinimized(win, !isMinimized(win));
      if (!isMinimized(win)) bringToFront(win);
    });
  });

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

    // um clique dentro da busca nao deve fechar o menu (o listener global so fecha fora do menu)
  }

  startAppTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const win = windowsByApp[tile.dataset.app];
      if (win){
        if (win.classList.contains('is-closed') || isMinimized(win)){
          openWindow(win);
        } else {
          bringToFront(win);
        }
      }

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

  /* ---------- ARRASTAR JANELAS (estilo sistema operacional de verdade) ---------- */
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
      // nao inicia arrasto se o clique foi em um dos botoes (minimizar/maximizar/fechar)
      if (e.target.closest('.vista-btn')) return;

      const point = getPoint(e);
      const rect = win.getBoundingClientRect();

      dragging = true;
      offsetX = point.clientX - rect.left;
      offsetY = point.clientY - rect.top;

      // passa a janela para posicionamento livre (fixed), mantendo o lugar atual na tela
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

      // limites pra nao deixar a janela sumir de vez da tela
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

    // clicar em qualquer parte da janela traz ela pra frente das outras
    win.addEventListener('mousedown', () => bringToFront(win));
  }

  /* ---------- CONTROLES DE JANELA ESTILO VISTA (minimizar / maximizar / fechar) ---------- */
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

  /* ---------- TROCA DE TEMA: CLARO (janelas azuis) <-> ESCURO (janelas roxas) ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const body = document.body;
  const htmlEl = document.documentElement;

  function applyTheme(isDark){
    body.classList.toggle('theme-dark', isDark);
    htmlEl.classList.toggle('theme-dark', isDark);

    if (themeToggleIcon){
      // sol = tema claro ativo | lua = tema escuro ativo
      themeToggleIcon.textContent = isDark ? '🌙' : '☀️';
    }
    if (themeToggle){
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'
      );
      themeToggle.setAttribute(
        'title',
        isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'
      );
    }
    try{
      localStorage.setItem('aero-theme', isDark ? 'dark' : 'light');
    }catch(err){
      /* localStorage indisponível: segue sem persistir a preferência */
    }
  }

  let savedTheme = null;
  try{
    savedTheme = localStorage.getItem('aero-theme');
  }catch(err){
    savedTheme = null;
  }
  applyTheme(savedTheme === 'dark');

  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      applyTheme(!body.classList.contains('theme-dark'));
    });
  }

  /* ---------- MOSTRAR AREA DE TRABALHO (estilo Windows 7) ---------- */
  const showDesktopBtn = document.getElementById('showDesktopBtn');
  const allWindows = document.querySelectorAll('.window');
  let desktopPeek = false;

  if (showDesktopBtn){
    showDesktopBtn.addEventListener('click', () => {
      desktopPeek = !desktopPeek;
      allWindows.forEach(win => {
        if (win.classList.contains('is-closed')) return; // já fechada, ignora
        win.style.opacity = desktopPeek ? '0' : '';
        win.style.transition = 'opacity 0.15s ease';
      });
    });
  }

  /* ---------- APP: CASSINO (ROLETA COM DINHEIRO FALSO) ---------- */
  // Saldo guardado localmente no navegador. Pensado pra, no futuro, alimentar
  // um ranking de usuarios (ainda nao implementado - por enquanto e so local).
  const CASINO_STORAGE_KEY = 'aero-cassino-saldo';
  const CASINO_START_BALANCE = 1000;
  const CASINO_RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const casinoBalanceEl = document.getElementById('casinoBalance');
  const casinoResultEl = document.getElementById('casinoResult');
  const casinoAmountInput = document.getElementById('casinoAmount');
  const casinoSpinBtn = document.getElementById('casinoSpinBtn');
  const casinoWheelEl = document.getElementById('casinoWheel');
  const casinoResetBtn = document.getElementById('casinoResetBtn');
  const casinoBetButtons = document.querySelectorAll('.casino-bet-btn');

  if (casinoBalanceEl && casinoSpinBtn){

    let casinoBalance = CASINO_START_BALANCE;
    let casinoSelectedBet = null;
    let casinoSpinning = false;

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
      try{
        localStorage.setItem(CASINO_STORAGE_KEY, String(casinoBalance));
      }catch(err){
        /* localStorage indisponível: segue sem persistir o saldo */
      }
    }

    function renderCasinoBalance(){
      casinoBalanceEl.textContent = `R$ ${casinoBalance}`;
    }

    function casinoNumberColor(n){
      if (n === 0) return 'verde';
      return CASINO_RED_NUMBERS.has(n) ? 'vermelho' : 'preto';
    }

    loadCasinoBalance();
    renderCasinoBalance();

    casinoBetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (casinoSpinning) return;
        casinoSelectedBet = btn.dataset.bet;
        casinoBetButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

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
      if (amount > casinoBalance){
        casinoResultEl.textContent = 'Saldo insuficiente pra essa aposta.';
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
        const numeroSorteado = Math.floor(Math.random() * 37); // 0 a 36
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

    if (casinoResetBtn){
      casinoResetBtn.addEventListener('click', () => {
        if (casinoSpinning) return;
        casinoBalance = CASINO_START_BALANCE;
        renderCasinoBalance();
        saveCasinoBalance();
        casinoResultEl.textContent = 'Saldo reiniciado.';
      });
    }
  }

});