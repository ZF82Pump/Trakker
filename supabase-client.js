// supabase-client.js
// Single shared Supabase client used across all pages.
// IMPORTANT: include after supabase-js and after supabase-config.js.

(function () {
  if (window.sb) return;

  window.sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  );

  window.getAuthedUser = async function getAuthedUser() {
    const { data: { session } } = await window.sb.auth.getSession();
    return session?.user || null;
  };
})();
