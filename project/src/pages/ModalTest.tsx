import React, { useState } from 'react';

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

const ModalTest: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button style={{ padding: '10px 24px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600 }} onClick={() => setOpen(true)}>
        Open Modal
      </button>
      {open && (
        <div style={modalStyle} onClick={() => setOpen(false)}>
          <div style={panelStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>Basic Modal</h2>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Type here..."
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#f3f4f6' }}>Cancel</button>
              <button onClick={() => { alert('Submitted: ' + value); setOpen(false); }} style={{ padding: '8px 16px', borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none' }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalTest; 