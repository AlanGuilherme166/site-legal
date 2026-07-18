/* =====================================================
   AERO VISTA/7 — INTERACOES
   Menu iniciar, troca de tema (Aero <-> Branco),
   controles de janela estilo Vista, taskbar estilo Win7.
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

  /* ---------- BOTOES DA TASKBAR <-> JANELAS REAIS ---------- */
  // Cada botao da taskbar (data-app) aponta para o id da janela correspondente
  // no HTML (ex: data-app="janela1" -> <div id="janela1">). Clicar minimiza
  // ou restaura a janela de verdade, igual clicar no "_" da propria janela.
  const taskbarButtons = document.querySelectorAll('.taskbar-btn');
  const windowsByApp = {};

  taskbarButtons.forEach(btn => {
    const win = document.getElementById(btn.dataset.app);
    if (win) windowsByApp[btn.dataset.app] = win;
  });

  function setWindowMinimized(win, minimized){
    const body = win.querySelector('.window-body');
    if (body) body.style.display = minimized ? 'none' : '';

    // acha o botao da taskbar que representa essa janela e sincroniza o estado
    const btn = document.querySelector(`.taskbar-btn[data-app="${win.id}"]`);
    if (btn) btn.classList.toggle('active', !minimized);
  }

  taskbarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const win = windowsByApp[btn.dataset.app];
      if (!win || win.classList.contains('is-closed')) return; // janela fechada, taskbar nao reage

      const body = win.querySelector('.window-body');
      const isMinimized = body && body.style.display === 'none';
      setWindowMinimized(win, !isMinimized);
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

  /* ---------- CONTROLES DE JANELA ESTILO VISTA (minimizar / maximizar / fechar) ---------- */
  document.querySelectorAll('.window').forEach(win => {
    const closeBtn = win.querySelector('.vista-close');
    const minBtn = win.querySelector('.vista-min');
    const maxBtn = win.querySelector('.vista-max');
    const body = win.querySelector('.window-body');

    if (closeBtn){
      closeBtn.addEventListener('click', () => {
        win.classList.add('is-closed');
        // sem janela, o botao da taskbar fica inativo e deixa de responder a clique
        const taskbarBtn = document.querySelector(`.taskbar-btn[data-app="${win.id}"]`);
        if (taskbarBtn){
          taskbarBtn.classList.remove('active');
          taskbarBtn.style.opacity = '0.4';
          taskbarBtn.style.pointerEvents = 'none';
        }
      });
    }

    if (minBtn && body){
      minBtn.addEventListener('click', () => {
        const hidden = body.style.display === 'none';
        setWindowMinimized(win, !hidden);
      });
    }

    if (maxBtn){
      maxBtn.addEventListener('click', () => {
        win.classList.toggle('is-maxed');
      });
    }
  });

  /* ---------- TROCA DE TEMA: AERO (colorido) <-> BRANCO ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const body = document.body;

  function applyTheme(isWhite){
    body.classList.toggle('theme-white', isWhite);
    if (themeToggleIcon){
      themeToggleIcon.textContent = isWhite ? '⚪' : '🎨';
    }
    if (themeToggle){
      themeToggle.setAttribute(
        'aria-label',
        isWhite ? 'Alternar para tema Aero' : 'Alternar para tema branco'
      );
    }
    try{
      localStorage.setItem('aero-theme', isWhite ? 'white' : 'aero');
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
  applyTheme(savedTheme === 'white');

  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      applyTheme(!body.classList.contains('theme-white'));
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

});