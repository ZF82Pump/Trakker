// auth-ui.js
// Minimal auth modal (email+password) using Supabase Auth.
// Requires: supabase-config.js + supabase-js v2 CDN loaded before this file.

window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

window.AuthUI = {
  async getSession(){
    const { data: { session } } = await window.sb.auth.getSession();
    return session || null;
  },

  async signUp({ email, password, username }){
    // store username as user metadata
    const { data, error } = await window.sb.auth.signUp({
      email,
      password,
      options: { data: { username: username || null } }
    }); // :contentReference[oaicite:4]{index=4}
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }){
    const { data, error } = await window.sb.auth.signInWithPassword({ email, password }); // :contentReference[oaicite:5]{index=5}
    if (error) throw error;
    return data;
  },

  async signOut(){
    const { error } = await window.sb.auth.signOut();
    if (error) throw error;
  }
};
