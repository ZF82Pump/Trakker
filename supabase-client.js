// supabase-client.js
// Shared Supabase client across the whole Trakker site.
// Include after supabase-js and after supabase-config.js on every page.

(function () {
  if (window.sb) return;

  window.sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "trakker-auth"
      }
    }
  );

  window.getAuthedUser = async function () {
    const { data: { session } } = await window.sb.auth.getSession();
    return session?.user || null;
  };

  window.requireAuth = async function (redirectTo = "signin.html") {
    const u = await window.getAuthedUser();
    if (u) return u;
    window.location.href = redirectTo;
    return null;
  };
})();
