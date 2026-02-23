import { useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState(""); // ✅ message for confirm email

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const data = await signUp(email, password);

        // ✅ If email confirmations are enabled, Supabase returns session = null
        if (!data?.session) {
          setInfo("✅ Account created! Please confirm your email, then come back to sign in.");
          setMode("signin");
          setPassword("");
        } else {
          // if confirmations are OFF, user is signed in immediately
          nav("/");
        }
      } else {
        await signIn(email, password);
        nav("/");
      }
    } catch (e2) {
      setErr(e2.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="page authPage">
        <div className="authCard">
          <div className="authTitle">
            {mode === "signup" ? "Create account" : "Sign in"}
          </div>

          <form onSubmit={submit} className="authForm">
            <label className="authLabel">Email</label>
            <input
              className="authInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />

            <label className="authLabel">Password</label>
            <input
              className="authInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
            />

            {info && <div className="authInfo">{info}</div>}
            {err && <div className="authError">{err}</div>}

            <button className="authBtn" disabled={busy}>
              {busy ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
            </button>
          </form>

          <div className="authSwitch">
            {mode === "signup" ? (
              <button className="authLinkBtn" onClick={() => setMode("signin")} type="button">
                Already have an account? Sign in
              </button>
            ) : (
              <button className="authLinkBtn" onClick={() => setMode("signup")} type="button">
                New here? Create an account
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
