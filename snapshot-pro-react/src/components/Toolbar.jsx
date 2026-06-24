import React from 'react';
import { useScreenshot } from '../context/ScreenshotContext';

export default function Toolbar({ onCapture, onClear }) {
  const { activeTool, setActiveTool } = useScreenshot();

  const tools = [
    { id: 'rect', label: '⏹️ Crop Box' },
    { id: 'blur', label: '🌫️ Privacy Blur' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px', 
      backgroundColor: '#1e2030', // 🌟 Premium dark glass card background
      padding: '16px', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
    }}>
      
      {/* Core Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={onCapture}
          style={{ 
            flex: 2, 
            padding: '11px', 
            backgroundColor: '#4f46e5', // Royal vibrant accent blue
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: '600', 
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            transition: 'transform 0.1s active'
          }}
        >
          📸 Capture Active Tab
        </button>
        <button 
          onClick={onClear}
          style={{ 
            flex: 1, 
            padding: '11px', 
            backgroundColor: '#2e3047', 
            color: '#cbd5e1', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '8px', 
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear
        </button>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

      {/* Editing Tool Toggles */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {tools.map((tool) => {
          const isSelected = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              style={{
                flex: 1,
                padding: '11px',
                fontSize: '13px',
                fontWeight: isSelected ? '600' : '500',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#161824',
                color: isSelected ? '#a5b4fc' : '#94a3b8',
                border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.1)' : 'none'
              }}
            >
              {tool.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}