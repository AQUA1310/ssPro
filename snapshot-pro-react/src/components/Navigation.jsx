import React from 'react';

export default function Navigation({ activeView, setActiveView }) {
  const tabs = [
    { id: 'workspace', label: '🛠️ Workspace' },
    { id: 'history', label: '📜 View History' }
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveView(tab.id)}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: activeView === tab.id ? '#228be6' : '#dee2e6',
            color: activeView === tab.id ? 'white' : '#333',
            transition: 'all 0.2s ease'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}