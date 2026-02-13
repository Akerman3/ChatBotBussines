// src/components/InfoModal.tsx
import React, { CSSProperties, MouseEvent } from 'react';

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,               // más alto que tu otro modal
  pointerEvents: 'auto',
};

const cardStyle: CSSProperties = {
  width: 'min(92vw, 520px)',
  background: '#1f1f1f',      // similar a dark modal
  color: '#fff',
  borderRadius: 16,           // cuatro bordes redondos
  boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
  padding: '20px 20px 16px',
};

const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: '0 0 8px 0',
};

const bodyStyle: CSSProperties = {
  lineHeight: 1.45,
  fontSize: 15,
  margin: 0,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 16,
};

const okBtnStyle: CSSProperties = {
  appearance: 'none',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer',
  background: '#2b7de9',      // azul estilo “OK”
  color: '#fff',
};

export default function InfoModal({ open, onClose }: InfoModalProps) {
  if (!open) return null;

  const handleOk = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // evita que el clic llegue al fondo
    onClose();
  };

  // bloquea cierre por clic en el fondo; capturamos pero no propagamos
  const blockBackground = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" onClick={blockBackground}>
      <div style={cardStyle} onClick={blockBackground}>
        <h2 style={titleStyle}>¿Por qué solicitamos esta función?</h2>
        <p style={bodyStyle}>
          Esta función nos ayuda a gestionar tus suscripciones y a ofrecerte una experiencia
          totalmente <strong>sin conexión</strong>. AL Calculadora respeta tu configuración y no
          hace un uso indebido de ella. Puedes activar o desactivar esta opción cuando lo
          consideres conveniente.
        </p>
        <div style={footerStyle}>
          <button type="button" style={okBtnStyle} onClick={handleOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
