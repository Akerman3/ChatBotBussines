// src/components/ThreeDots.tsx
import React, { useState } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

const ThreeDots: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleCloseMenu = () => setMenuOpen(false);

  return (
    <div className="home-container" onClick={handleCloseMenu}>
      {/* Icono AL */}
      <div className="al-icon">
        <img src="/assets/home.png" alt="AL" className="icon-al-img" />
      </div>

      {/* Botón de menú */}
      <div
        className="menu-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(true);
        }}
      >
        <div className="bar" />
        <div className="bar" />
        <div className="bar" />
      </div>

      {/* Logo central */}
      <div className="logo-text">AL</div>
      <div className="subtitle">calculadora</div>

      {/* Botón login */}
      <button className="btn-primary" onClick={() => navigate("/login")}>
        Log in
      </button>

      <p className="cta-text">
        ¿Aún no tienes una cuenta?{" "}
        <span className="link" onClick={() => navigate("/signup")}>
          Crear cuenta
        </span>
      </p>

      {/* Menú lateral */}
      {menuOpen && (
        <div className="side-menu" onClick={(e) => e.stopPropagation()}>
          <div className="visit-title">Visítanos en:</div>
          <a
            href="https://www.tiktok.com/@ftherreriayaluminio?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noreferrer"
            className="menu-item"
          >
            <img src="/assets/icons/tiktok.png" alt="TikTok" className="icon" />
            FT HERRERÍA Y ALUMINIO
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
      )}
    </div>
  );
};

export default ThreeDots;



