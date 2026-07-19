const supabaseUrl = "MINHA_URL_SUPABASE"
const supabaseKey = "MINHA_ANON_PUBLIC_KEY"

const supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
)