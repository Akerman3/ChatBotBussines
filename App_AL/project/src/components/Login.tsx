// src/components/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../styles/Auth.css";

import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { acquireDeviceLock } from "../lib/deviceLock";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await FirebaseAuthentication.getCurrentUser().catch(() => { });
        await FirebaseAuthentication.getIdToken({ forceRefresh: false }).catch(() => { });
      } catch {
        // no-op
      }
    })();
  }, []);

  // ✅ CORRECCIÓN: Usar la misma llave que DeviceLockNoticeOnHome.tsx espera
  const DEVICE_LOCK_FLAG = "alcalc.deviceLockNotice.v1";

  const markDeviceLockNotice = () => {
    try {
      localStorage.setItem(DEVICE_LOCK_FLAG, JSON.stringify({ message: "" }));
    } catch { }
  };
  const clearDeviceLockNotice = () => {
    try { localStorage.removeItem(DEVICE_LOCK_FLAG); } catch { }
  };

  const goBySubscription = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists() && (snap.data() as any).subscriptionStatus === "active") {
        navigate("/main");
      } else {
        navigate("/subscription");
      }
    } catch (e) {
      console.warn("[Login] Firestore check failed:", e);
      navigate("/subscription");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      try {
        await acquireDeviceLock(user.uid);
        clearDeviceLockNotice();
      } catch (err: any) {
        if (String(err?.message) === "LOCK_TAKEN") {
          markDeviceLockNotice();
          navigate("/home?dl=1", { replace: true });
          return;
        }
        console.error("[Login] acquireDeviceLock error:", err);
      }

      await goBySubscription(user.uid);
    } catch (err: any) {
      // ✅ SEGURIDAD: No loguear errores detallados en producción
      if (import.meta.env.DEV) {
        console.error("[Login] Email error:", err);
      }
      const code = err?.code || "";

      // ✅ SEGURIDAD: Mensajes genéricos para evitar enumeración de usuarios
      // No revelamos si el email existe o no
      if (code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/invalid-email") {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else if (code === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
      } else {
        setError("Error al iniciar sesión. Inténtalo de nuevo.");
      }

      // ✅ SEGURIDAD: Pequeño delay para dificultar ataques de fuerza bruta
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  const handleResetPassword = async () => {
    setError("");
    try {
      if (!email) {
        alert("Escribe tu correo electrónico arriba para enviar el enlace de restablecimiento.");
        return;
      }
      await sendPasswordResetEmail(auth, email.trim());
      alert("Te enviamos un correo para restablecer tu contraseña.");
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("[Login] reset password error:", err);
      }
      alert("No pudimos enviar el correo de restablecimiento. Verifica el correo e inténtalo de nuevo.");
    }
  };

  const handleGoogleLogin = async () => {
    if (loadingGoogle) return;
    setError("");
    setLoadingGoogle(true);
    try {
      const res = await FirebaseAuthentication.signInWithGoogle();
      const idToken =
        (res as any)?.credential?.idToken || (res as any)?.credential?.idToken;
      if (!idToken) {
        setError("No se recibió idToken de Google. Revisa SHA-1 y configuración.");
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(auth, credential);

      const userRef = doc(db, "users", user.uid);
      const exists = await getDoc(userRef);
      if (!exists.exists()) {
        await setDoc(userRef, {
          email: user.email,
          subscriptionStatus: "inactive",
          subscriptionType: null,
          startDate: null,
          expiryDate: null,
        });
      }

      try {
        await acquireDeviceLock(user.uid);
        clearDeviceLockNotice();
      } catch (err: any) {
        if (String(err?.message) === "LOCK_TAKEN") {
          markDeviceLockNotice();
          navigate("/home?dl=1", { replace: true });
          return;
        }
        console.error("[Login] acquireDeviceLock error:", err);
      }

      await goBySubscription(user.uid);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("[Login] Google error:", err);
      }
      setError("Error al iniciar sesión con Google");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1 className="login-title">AL</h1>
        <div className="login-title-underline"></div>
        <h2 className="login-subtitle">CALCULADORA</h2>
      </div>

      <div className="login-card">
        <p className="login-description">Vincula tu cuenta</p>
        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="btn-login">Ingresar</button>
        </form>

        <div
          onClick={handleResetPassword}
          role="button"
          tabIndex={0}
          className="forgot-password"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleResetPassword(); }}
        >
          ¿Olvidaste la contraseña? Haz clic aquí.
        </div>

        <div className="divider">
          — O inicia sesión con Google (Recomendado) —
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          aria-busy={loadingGoogle ? "true" : "false"}
        >
          <span className="btn-google__iconbox">
            <img src="/assets/icons/icono-google.png" alt="" className="btn-google__icon" aria-hidden="true" />
          </span>
          <span className="btn-google__text">
            {loadingGoogle ? "Abriendo Google…" : "Continuar con Google"}
          </span>
        </button>

        <p className="login-footer">
          ¿No tienes cuenta?{" "}
          <span className="link" onClick={() => navigate("/signup")}>
            Crear cuenta
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;