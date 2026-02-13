// src/components/Signup.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "../styles/Auth.css";

import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { acquireDeviceLock } from "../lib/deviceLock";

// ✅ Llave para el modal de aviso de device lock (debe coincidir con DeviceLockNoticeOnHome.tsx)
const DEVICE_LOCK_FLAG = "alcalc.deviceLockNotice.v1";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigate = useNavigate();

  // ✅ Helper para marcar que hay un device lock activo
  const markDeviceLockNotice = () => {
    try {
      localStorage.setItem(DEVICE_LOCK_FLAG, JSON.stringify({ message: "" }));
    } catch { }
  };

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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // ✅ SEGURIDAD: Validación de contraseña más robusta
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("La contraseña debe incluir al menos una mayúscula");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("La contraseña debe incluir al menos un número");
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", user.uid), {
        email,
        subscriptionStatus: "inactive",
        subscriptionType: null,
        startDate: null,
        expiryDate: null,
      });

      // ✅ SEGURIDAD: No guardar email en localStorage (información sensible)
      // try { localStorage.setItem("alcalc.lastEmail", String(email || user.email || "")); } catch {}

      try {
        await acquireDeviceLock(user.uid);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("LOCK_TAKEN")) {
          markDeviceLockNotice(); // ✅ Marcar para que aparezca el modal
          setError("Esta cuenta ya está activa en otro dispositivo.");
          navigate("/home?lock=taken", { replace: true });
          return;
        }
        console.error("[Signup] acquireDeviceLock error:", err);
      }

      navigate("/subscription");
    } catch (err: any) {
      // ✅ SEGURIDAD: No loguear errores detallados en producción
      if (import.meta.env.DEV) {
        console.error("[Signup] Email error:", err);
      }

      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (code === "auth/weak-password") {
        setError("La contraseña es muy débil. Usa al menos 8 caracteres.");
      } else if (code === "auth/invalid-email") {
        setError("El correo electrónico no es válido.");
      } else {
        setError("Error al registrarse. Inténtalo de nuevo.");
      }
    }
  };

  const handleGoogleSignup = async () => {
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

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        subscriptionStatus: "inactive",
        subscriptionType: null,
        startDate: null,
        expiryDate: null,
      });

      // ✅ SEGURIDAD: No guardar email en localStorage
      // try { localStorage.setItem("alcalc.lastEmail", String(user.email || "")); } catch {}

      try {
        await acquireDeviceLock(user.uid);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("LOCK_TAKEN")) {
          markDeviceLockNotice(); // ✅ Marcar para que aparezca el modal
          setError("Esta cuenta ya está activa en otro dispositivo.");
          navigate("/home?lock=taken", { replace: true });
          return;
        }
        console.error("[Signup] acquireDeviceLock error:", err);
      }

      navigate("/subscription");
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("[Signup] Google error:", err);
      }
      setError("Error con el registro con Google");
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
        <p className="login-description">Crea tu cuenta para empezar a trabajar</p>
        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleEmailSignup}>
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
            placeholder="Contraseña (8+ caracteres, mayúscula y número)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Verificar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="login-input"
            required
          />

          <button type="submit" className="btn-login">Crear cuenta</button>
        </form>

        <div className="divider">
          — O inicia sesión con Google (Recomendado) —
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignup}
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
          ¿Ya tienes cuenta?{" "}
          <span className="link" onClick={() => navigate("/login")}>
            Iniciar sesión
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;