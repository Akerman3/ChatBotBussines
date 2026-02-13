// src/components/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { App } from "@capacitor/app";
import KickNoticeOnHome from "./KickNoticeOnHome";
import DeviceLockNoticeOnHome from "./DeviceLockNoticeOnHome";

const Home: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [appBuild, setAppBuild] = useState<string | number>("");
  const navigate = useNavigate();

  useEffect(() => {
    App.getInfo()
      .then((info) => {
        setAppVersion(info.version);
        setAppBuild(info.build ?? "");
      })
      .catch(() => {
        setAppVersion("");
        setAppBuild("");
      });
  }, []);

  const handleCloseMenu = () => setMenuOpen(false);

  return (
    <div className="home-container" onClick={handleCloseMenu}>
      {/* Badge AL (arriba derecha) – PNG */}
      <img
        className="al-badge-img"
        src="/assets/home.png"
        alt="AL"
        draggable={false}
      />

      {/* Botón menú (hamburguesa) */}
      <div
        className="menu-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(true);
        }}
        aria-label="abrir menú"
      >
        <div className="bar" />
        <div className="bar" />
        <div className="bar" />
      </div>

      {/* Logo central */}
      <div className="logo-text">AL</div>
      <div className="title-underline" />
      <div className="subtitle">CALCULADORA</div>

      {/* Bloque CTA sobre el cruce de la "X" */}
      <div className="cta-wrap">
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Iniciar
        </button>

        {/* CTA en una sola línea */}
        <p className="cta-text">
          ¿Aún no tienes una cuenta?
          <span
            className="link"
            onClick={() => navigate("/signup")}
            role="button"
            aria-label="Crear cuenta"
          >
            &nbsp;Crear cuenta
          </span>
        </p>
      </div>

      {/* Versión inferior izquierda */}
      {(appVersion || appBuild) && (
        <p className="version-text version-left">
          Versión {appVersion || "—"} (code: {appBuild || "—"})
        </p>
      )}

      {/* Menú lateral (sin cambios funcionales) */}
      {menuOpen && (
        <div
          className="side-menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "20px",
          }}
        >
          <div>
            <div className="visit-title">Visítanos en:</div>
            <a
              href="https://www.tiktok.com/@josueftm?_t=ZS-90WoSvoBuIZ&_r=1"
              target="_blank"
              rel="noreferrer"
              className="menu-item"
            >
              <img src="/assets/icons/tiktok.png" alt="TikTok" className="icon" />
              josueftm
            </a>
            <a
              href="https://www.youtube.com/@ftherreriayaluminio"
              target="_blank"
              rel="noreferrer"
              className="menu-item"
            >
              <img src="/assets/icons/youtube.png" alt="YouTube" className="icon" />
              FT HERRERÍA Y ALUMINIO
            </a>
            <a
              href="https://wa.me/522721917499"
              target="_blank"
              rel="noreferrer"
              className="menu-item"
            >
              <img src="/assets/icons/whatsapp.png" alt="WhatsApp" className="icon" />
              WhatsApp
            </a>
          </div>

          <div>
            <div className="visit-title" style={{ marginTop: "20px" }}>
              Soporte:
            </div>
            <a
              href="mailto:aloficialsoport@gmail.com?subject=Eliminación de cuenta&body=QUIERO ELIMINAR MI CUENTA: example@gmail.com"
              target="_blank"
              rel="noreferrer"
              className="menu-item"
            >
              <img src="/assets/icons/email.png" alt="Email" className="icon" />
              Eliminar cuenta
            </a>
          </div>
        </div>
      )}

      {/* Avisos existentes */}
      <KickNoticeOnHome />
      <DeviceLockNoticeOnHome />
    </div>
  );
};

export default Home;