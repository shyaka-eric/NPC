import React from 'react';

const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 32,
  minWidth: 320,
  boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SimpleModal: React.FC<SimpleModalProps> = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        {title && <h2 style={{ margin: 0 }}>{title}</h2>}
        {children}
        {footer && <div>{footer}</div>}
      </div>
    </div>
  );
};

export default SimpleModal; 