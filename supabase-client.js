// supabase-client.js
// Single shared Supabase client used across all pages.
// IMPORTANT: include after supabase-js and after supabase-config.js.

(function () {
  if (window.sb) return;

  // Use ONE storage key across pages so sessions persist consistently.
  const STORAGE_KEY = "trakker-auth";

  window.sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: STORAGE_KEY
      }
    }
  );

  window.requireAuth = async function requireAuth(redirectTo = "signin.html") {
    // Wait for auth to hydrate (important on page refresh)
    const { data: { session } } = await window.sb.auth.getSession();
    if (session?.user) return session.user;

    // Give it a short moment in case the session is still being restored
    await new Promise(r => setTimeout(r, 50));
    const { data: { session: session2 } } = await window.sb.auth.getSession();
    if (session2?.user) return session2.user;

    window.location.href = redirectTo;
    return null;
  };

  window.getAuthedUser = async function getAuthedUser() {
    const { data: { session } } = await window.sb.auth.getSession();
    return session?.user || null;
  };
})();
