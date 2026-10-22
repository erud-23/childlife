let authClient = null;
let authUser = null;
let authResendTimer = null;

const authEl = id => document.getElementById(id);

function setAuthStatus(message, kind = "") {
  const el = authEl("authStatus");
  if (!el) return;
  el.textContent = message;
  el.className = "auth-status" + (kind ? " " + kind : "");
}

function initEmailAuth() {
  const cfg = window.CHILD_LIFE_AUTH_CONFIG || {};
  const sendBtn = authEl("sendCodeBtn");
  const verifyBtn = authEl("verifyCodeBtn");
  if (!window.supabase || !window.supabase.createClient || !cfg.url || !cfg.anonKey) {
    if (sendBtn) sendBtn.disabled = true;
    if (verifyBtn) verifyBtn.disabled = true;
    setAuthStatus("Email sign-in is not configured yet. Check auth-config.js and AUTH_SETUP.md.", "error");
    return;
  }
  try {
    authClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    authClient.auth.getSession().then(({ data, error }) => {
      if (error) setAuthStatus("Could not check your current sign-in. Refresh and try again.", "error");
      authUser = data && data.session ? data.session.user : null;
      renderAuthState();
    }).catch(() => setAuthStatus("Could not check your current sign-in. Refresh and try again.", "error"));
    authClient.auth.onAuthStateChange((_event, session) => {
      authUser = session ? session.user : null;
      renderAuthState();
    });
    setAuthStatus("Enter your email to receive a one-time six-digit code.");
  } catch (e) {
    authClient = null;
    if (sendBtn) sendBtn.disabled = true;
    if (verifyBtn) verifyBtn.disabled = true;
    setAuthStatus("Sign-in could not initialize. Check the Supabase settings.", "error");
  }
}

function renderAuthState() {
  if (!authClient) return;
  const signedIn = !!authUser;
  authEl("authForms").classList.toggle("hidden", signedIn);
  authEl("authSignedIn").classList.toggle("hidden", !signedIn);
  authEl("authUserEmail").textContent = authUser && authUser.email ? authUser.email : "";
  if (signedIn) setAuthStatus("You're signed in. You can continue to the study dashboard.", "success");
}

async function sendLoginCode() {
  if (!authClient) {
    setAuthStatus("Email sign-in is not configured yet. Please check the site settings.", "error");
    return;
  }
  const emailInput = authEl("authEmail");
  const email = emailInput.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setAuthStatus("Enter a valid email address first.", "error");
    emailInput.focus();
    return;
  }
  const sendBtn = authEl("sendCodeBtn");
  const verifyBtn = authEl("verifyCodeBtn");
  sendBtn.disabled = true;
  setAuthStatus("Sending your verification code…");
  try {
    const { error } = await authClient.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    authEl("codeStep").classList.remove("hidden");
    authEl("authCode").focus();
    verifyBtn.disabled = false;
    setAuthStatus("If this address can receive sign-in email, a code is on its way. Check your inbox and spam folder.", "success");
    let remaining = 60;
    sendBtn.textContent = "Resend in 60s";
    clearInterval(authResendTimer);
    authResendTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(authResendTimer);
        sendBtn.disabled = false;
        sendBtn.textContent = "Resend code";
      } else {
        sendBtn.textContent = "Resend in " + remaining + "s";
      }
    }, 1000);
  } catch (e) {
    sendBtn.disabled = false;
    sendBtn.textContent = "Email me a sign-in code";
    setAuthStatus("Could not send a code. Wait a moment and try again. If this continues, check the email provider and Supabase rate limits.", "error");
  }
}

async function verifyLoginCode() {
  if (!authClient) {
    setAuthStatus("Email sign-in is not configured yet. Please check the site settings.", "error");
    return;
  }
  const email = authEl("authEmail").value.trim().toLowerCase();
  const token = authEl("authCode").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setAuthStatus("Enter the same email address that received the code.", "error");
    authEl("authEmail").focus();
    return;
  }
  if (!/^\d{6}$/.test(token)) {
    setAuthStatus("Enter the six-digit code from your email.", "error");
    authEl("authCode").focus();
    return;
  }
  const verifyBtn = authEl("verifyCodeBtn");
  verifyBtn.disabled = true;
  setAuthStatus("Verifying your code…");
  try {
    const { data, error } = await authClient.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data || !data.session) throw error || new Error("Verification did not create a session");
    authUser = data.user || data.session.user;
    authEl("authCode").value = "";
    renderAuthState();
    setAuthStatus("You're signed in successfully. Your study progress is still stored locally in this browser.", "success");
    clearInterval(authResendTimer);
  } catch (e) {
    setAuthStatus("That code could not be verified. Check it carefully or request a new code if it has expired.", "error");
  } finally {
    if (!authUser) verifyBtn.disabled = false;
  }
}

async function signOutUser() {
  if (!authClient) return;
  const { error } = await authClient.auth.signOut();
  if (error) {
    setAuthStatus("Could not sign out. Please try again.", "error");
    return;
  }
  authUser = null;
  renderAuthState();
  authEl("codeStep").classList.add("hidden");
  authEl("authEmail").value = "";
  authEl("authCode").value = "";
  setAuthStatus("You have signed out.");
}

const authForm = authEl("authForm");
if (authForm) {
  authForm.addEventListener("submit", event => {
    event.preventDefault();
    sendLoginCode();
  });
}
initEmailAuth();
