import React from 'react';
import { useScreenshot } from '../context/ScreenshotContext';

export default function Toolbar({ onCapture, onClear }) {
  const { activeTool, setActiveTool } = useScreenshot();

  const tools = [
    { id: 'rect', label: '⏹️ Crop Box' },
    { id: 'blur', label: '🌫️ Blur' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '15px' }}>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={onCapture} // 🌟 CRITICAL: Wired to parent handleCapture
          style={{ flex: 1, padding: '10px', backgroundColor: '#228be6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📸 Capture Tab
        </button>
        <button 
          onClick={onClear} // 🌟 CRITICAL: Wired to parent handleClear
          style={{ padding: '10px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          🗑️ Clear
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '5px 0' }} />

      {/* Editing Canvas Tools */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              backgroundColor: activeTool === tool.id ? '#e3fafc' : '#f1f3f5',
              color: activeTool === tool.id ? '#0c8599' : '#495057',
              border: activeTool === tool.id ? '1px solid #1098ad' : '1px solid #dee2e6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTool === tool.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
}