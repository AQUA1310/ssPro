import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Toolbar from './components/Toolbar';
import DrawingCanvas from './components/DrawingCanvas'; // 🌟 Import the canvas
import { useScreenshot } from './context/ScreenshotContext';

function App() {
  const [activeView, setActiveView] = useState('workspace');
  const [captureUrl, setCaptureUrl] = useState(null); // 🌟 Added missing capture state
  const [clearTrigger, setClearTrigger] = useState(0); // 🌟 Added missing clear trigger
  const { saveToHistory } = useScreenshot();

  const handleCapture = () => {
    if (!window.chrome || !chrome.runtime) {
      alert("Extension context missing. Build and run inside Chrome!");
      return;
    }

    // Give the service worker worker 100ms to mount cleanly
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "CAPTURE_TAB" }, (response) => {
        if (chrome.runtime.lastError) {
          alert(`Chrome Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response && response.status === "success") {
          setCaptureUrl(response.dataUrl);
          saveToHistory(response.dataUrl);
        } else {
          alert("Background script failed to send back an image.");
        }
      });
    }, 100);
  };

  const handleClear = () => {
    setCaptureUrl(null);
    setClearTrigger(prev => prev + 1);
    console.log("Workspace cleared.");
  };

  return (
    <div style={{ width: '540px', padding: '15px', backgroundColor: '#f4f6f9', fontFamily: 'sans-serif' }}>
      <h2>📸 SnapShot Pro — React Edition</h2>
      
      <Navigation activeView={activeView} setActiveView={setActiveView} />

      {activeView === 'workspace' ? (
        <div>
          <Toolbar onCapture={handleCapture} onClear={handleClear} />
          <div style={{ marginTop: '15px' }}>
            {/* 🌟 Mounted the Drawing Canvas with its tracking properties */}
            <DrawingCanvas captureTrigger={captureUrl} clearTrigger={clearTrigger} />
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
          <h3>Saved History Logs</h3>
          <p>History view ready to render records.</p>
        </div>
      )}
    </div>
  );
}

export default App;