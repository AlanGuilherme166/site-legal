/* =====================================================
   FRUTIGER AERO — INTERAÇÕES
   Sidebar retrátil no hover, menu iniciar, relógio
   da taskbar e alternância de botões ativos (placeholder).
===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- SIDEBAR: abre ao passar o mouse na borda ---------- */
  const sidebar = document.getElementById('sidebar');
  const sidebarTrigger = document.getElementById('sidebarTrigger');

  function openSidebar(){
    sidebar.classList.add('open');
  }

  function closeSidebar(){
    sidebar.classList.remove('open');
  }

  sidebarTrigger.addEventListener('mouseenter', openSidebar);
  sidebar.addEventListener('mouseenter', openSidebar);
  sidebar.addEventListener('mouseleave', closeSidebar);

  // Suporte básico para toque em telas sem hover (mobile)
  sidebarTrigger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  /* ---------- NAVEGAÇÃO LATERAL: destaca botão ativo (placeholder) ---------- */
  const navButtons = document.querySelectorAll('.sidebar-nav .nav-btn');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Placeholder: aqui futuramente entra a troca real de página
      console.log('Navegar para:', btn.dataset.page);
    });
  });

  /* ---------- MENU INICIAR (taskbar) ---------- */
  const startButton = document.getElementById('startButton');
  const startMenu = document.getElementById('startMenu');

  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    startMenu.classList.toggle('open');
  });

  // Fecha o menu iniciar ao clicar fora dele
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startButton){
      startMenu.classList.remove('open');
    }
  });

  /* ---------- BOTÕES DA TASKBAR (placeholder de "janelas abertas") ---------- */
  const taskbarButtons = document.querySelectorAll('.taskbar-btn');

  taskbarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      taskbarButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      console.log('Janela focada:', btn.dataset.app);
    });
  });

  /* ---------- RELÓGIO DA TASKBAR ---------- */
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

  updateClock();
  setInterval(updateClock, 1000 * 30); // atualiza a cada 30s (suficiente p/ minutos)

});
