import React from 'react';
import { useScreenshot } from '../context/ScreenshotContext';

export default function Toolbar({ onCapture, onClear }) {
  const { activeTool, setActiveTool } = useScreenshot();

  const toolset = [
    { id: 'pen', label: '✏️ Pen' },
    { id: 'rect', label: '⬜ Rectangle' },
    { id: 'arrow', label: '➡️ Arrow' },
    { id: 'highlight', label: '🖍️ Highlight' },
    { id: 'blur', label: '💧 Blur' }
  ];

  return (
    <div style={{
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'center', // Fixed: Added quotes here
      gap: '6px',
      flexWrap: 'wrap',
      background: '#ffffff',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <button 
        onClick={onCapture}
        style={{ 
          backgroundColor: '#2b8a3e', 
          color: 'white', 
          border: 'none', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          fontWeight: 'bold', 
          cursor: 'pointer' 
        }}
      >
        📸 Capture Tab
      </button>

      <div style={{ width: '100%', height: '1px', background: '#e9ecef', margin: '4px 0' }}></div>

      {toolset.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: '500',
            border: '1px solid #dee2e6',
            backgroundColor: activeTool === tool.id ? '#228be6' : '#f1f3f5',
            color: activeTool === tool.id ? 'white' : '#495057'
          }}
        >
          {tool.label}
        </button>
      ))}

      <div style={{ width: '100%', height: '1px', background: '#e9ecef', margin: '4px 0' }}></div>

      <button 
        onClick={onClear}
        style={{ 
          backgroundColor: '#fa5252', 
          color: 'white', 
          border: 'none', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          fontWeight: 'bold', 
          cursor: 'pointer' 
        }}
      >
        ❌ Clear Canvas
      </button>
    </div>
  );
}