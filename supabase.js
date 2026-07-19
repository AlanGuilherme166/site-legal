// Aguardar até que a biblioteca do Supabase esteja carregada
function inicializarSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.error('Biblioteca do Supabase ainda não foi carregada.');
    return;
  }

  const supabaseUrl = "https://jxvbdjhyyieoevfvukaf.supabase.co";
  const supabaseKey = "sb_publishable_t0Q-v4FsiteTuHV4otS6UA_Zy1dbSAm";

  // Criar cliente Supabase APENAS UMA VEZ, globalmente
  window.supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
  );
  
  console.log('✓ Cliente Supabase inicializado com sucesso');
}

// Se o document já foi carregado, inicializar imediatamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
  inicializarSupabase();
}