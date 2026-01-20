// auth-ui.js
// Minimal email+password auth UI for Supabase Auth (no magic links).
// Requires: supabase-config.js + supabase-js v2 loaded first.

(function () {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error("AuthUI: Missing supabase-js or supabase-config.js");
    return;
  }

  const sb = window.sb || window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  window.sb = sb;

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Inject minimal CSS once
  function ensureStyles() {
    if (document.getElementById("authui-styles")) return;
    const style = document.createElement("style");
    style.id = "authui-styles";
    style.textContent = `
      .authui-wrap{
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 50;
        pointer-events: auto;
      }
      .authui-btn{
        appearance:none;
        border:none;
        border-radius: 14px;
        padding: 10px 12px;
        font-size: 13px;
        cursor:pointer;
        color: rgba(245,245,245,0.92);
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.16);
        backdrop-filter: blur(10px);
        box-shadow: 0 14px 30px rgba(0,0,0,0.25);
        font-weight: 300;
      }
      .authui-backdrop{
        position: fixed;
        inset: 0;
        z-index: 60;
        background: rgba(0,0,0,0.55);
        display:flex;
        align-items:center;
        justify-content:center;
        padding: 18px;
        pointer-events:auto;
      }
      .authui-modal{
        width: min(420px, 100%);
        border-radius: 18px;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.16);
        backdrop-filter: blur(14px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.45);
        overflow:hidden;
        color: rgba(245,245,245,0.92);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      .authui-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.12);
      }
      .authui-title{
        font-size: 14px;
        font-weight: 300;
        letter-spacing: 0.04em;
      }
      .authui-x{
        appearance:none;
        border:none;
        background: transparent;
        color: rgba(245,245,245,0.70);
        font-size: 22px;
        cursor:pointer;
      }
      .authui-body{
        padding: 14px;
        display:flex;
        flex-direction:column;
        gap: 10px;
      }
      .authui-field{
        display:flex;
        flex-direction:column;
        gap: 6px;
      }
      .authui-field label{
        font-size: 12px;
        font-weight: 300;
        color: rgba(245,245,245,0.75);
      }
      .authui-field input{
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(0,0,0,0.22);
        padding: 10px 12px;
        font-size: 13px;
        color: rgba(245,245,245,0.92);
        outline:none;
        box-sizing:border-box;
      }
      .authui-status{
        min-height: 16px;
        font-size: 12px;
        font-weight: 300;
        color: rgba(245,245,245,0.70);
      }
      .authui-status.error{ color: rgba(255,120,120,0.92); }
      .authui-primary{
        appearance:none;
        border:none;
        border-radius: 14px;
        padding: 12px 14px;
        font-size: 13px;
        cursor:pointer;
        color: rgba(245,245,245,0.92);
        background: rgba(255,255,255,0.14);
        border: 1px solid rgba(255,255,255,0.16);
      }
      .authui-link{
        appearance:none;
        border:none;
        background: transparent;
        color: rgba(245,245,245,0.70);
        font-size: 12px;
        font-weight: 300;
        cursor:pointer;
        padding: 6px 0 0;
        text-align:left;
      }
    `;
    document.head.appendChild(style);
  }

  function buildUI() {
    ensureStyles();

    // Button
    const wrap = document.createElement("div");
    wrap.className = "authui-wrap";

    const btn = document.createElement("button");
    btn.className = "authui-btn";
    btn.textContent = "Sign in";
    wrap.appendChild(btn);

    // Modal
    const backdrop = document.createElement("div");
    backdrop.className = "authui-backdrop";
    backdrop.style.display = "none";

    const modal = document.createElement("div");
    modal.className = "authui-modal";

    modal.innerHTML = `
      <div class="authui-head">
        <div class="authui-title" id="authuiModeTitle">Sign in</div>
        <button class="authui-x" id="authuiClose" title="Close">×</button>
      </div>
      <div class="authui-body">
        <div class="authui-field" id="authuiUsernameField" style="display:none;">
          <label>Username</label>
          <input id="authuiUsername" type="text" placeholder="e.g., Ethan" />
        </div>

        <div class="authui-field">
          <label>Email</label>
          <input id="authuiEmail" type="email" placeholder="you@email.com" />
        </div>

        <div class="authui-field">
          <label>Password</label>
          <input id="authuiPassword" type="password" placeholder="••••••••" />
        </div>

        <div class="authui-status" id="authuiStatus"></div>

        <button class="authui-primary" id="authuiSubmit">Continue</button>
        <button class="authui-link" id="authuiToggle" type="button">Create an account</button>
      </div>
    `;
    backdrop.appendChild(modal);

    document.body.appendChild(wrap);
    document.body.appendChild(backdrop);

    // Wire
    const closeBtn = modal.querySelector("#authuiClose");
    const toggleBtn = modal.querySelector("#authuiToggle");
    const submitBtn = modal.querySelector("#authuiSubmit");
    const statusEl = modal.querySelector("#authuiStatus");
    const modeTitle = modal.querySelector("#authuiModeTitle");
    const usernameField = modal.querySelector("#authuiUsernameField");
    const usernameEl = modal.querySelector("#authuiUsername");
    const emailEl = modal.querySelector("#authuiEmail");
    const passEl = modal.querySelector("#authuiPassword");

    let mode = "signin"; // signin | signup

    function setStatus(msg, isError) {
      statusEl.textContent = msg || "";
      statusEl.classList.toggle("error", !!isError);
    }

    function setMode(next) {
      mode = next;
      const isSignup = mode === "signup";
      modeTitle.textContent = isSignup ? "Create account" : "Sign in";
      toggleBtn.textContent = isSignup ? "I already have an account" : "Create an account";
      usernameField.style.display = isSignup ? "flex" : "none";
      submitBtn.textContent = isSignup ? "Create" : "Continue";
      setStatus("");
    }

    function open() { backdrop.style.display = "flex"; setStatus(""); }
    function close() { backdrop.style.display = "none"; setStatus(""); }

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    toggleBtn.addEventListener("click", () => setMode(mode === "signin" ? "signup" : "signin"));

    async function refreshButton() {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        btn.textContent = "Sign out";
        const email = session.user?.email || "";
        btn.title = email;
      } else {
        btn.textContent = "Sign in";
        btn.title = "";
      }
    }

    btn.addEventListener("click", async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        await sb.auth.signOut();
        await refreshButton();
        return;
      }
      setMode("signin");
      open();
    });

    submitBtn.addEventListener("click", async () => {
      const email = emailEl.value.trim();
      const password = passEl.value;
      const username = usernameEl.value.trim();

      if (!email) return setStatus("Email is required.", true);
      if (!password || password.length < 6) return setStatus("Password must be at least 6 characters.", true);

      try {
        setStatus("Working…", false);
        if (mode === "signup") {
          const { error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { username: username || null } }
          });
          if (error) throw error;
        } else {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
        close();
        await refreshButton();
      } catch (err) {
        setStatus(err?.message || "Auth failed.", true);
      }
    });

    sb.auth.onAuthStateChange(() => refreshButton());
    refreshButton();

    return {
      open,
      close,
      setMode,
      async requireAuth() {
        const { data: { session } } = await sb.auth.getSession();
        if (session) return session;
        setMode("signin");
        open();
        setStatus("Please sign in to continue.", false);

        // Wait for sign-in
        return await new Promise((resolve) => {
          const sub = sb.auth.onAuthStateChange((_event, session2) => {
            if (session2) {
              sub.data.subscription.unsubscribe();
              close();
              resolve(session2);
            }
          });
        });
      },
      async getSession() {
        const { data: { session } } = await sb.auth.getSession();
        return session || null;
      }
    };
  }

  // Create singleton
  let instance = null;

  window.AuthUI = {
    init() {
      if (instance) return instance;
      instance = buildUI();
      return instance;
    }
  };
})();
