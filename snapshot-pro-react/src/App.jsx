import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Toolbar from './components/Toolbar';
import { useScreenshot } from './context/ScreenshotContext';

function App() {
  const [activeView, setActiveView] = useState('workspace');
  const { saveToHistory } = useScreenshot();

  const handleCapture = () => {
    if (!window.chrome || !chrome.runtime) {
      alert("Extension context missing. Build and test inside Chrome!");
      return;
    }

    chrome.runtime.sendMessage({ action: "CAPTURE_TAB" }, (response) => {
      if (response && response.status === "success") {
        // We will pass this data URL down to our drawing surface next!
        console.log("Captured image payload successfully!");
        saveToHistory(response.dataUrl);
      }
    });
  };

  const handleClear = () => {
    // This will trigger a reset inside our upcoming canvas component
    console.log("Clear workspace initiated.");
  };

  return (
    <div style={{ width: '540px', padding: '15px', backgroundColor: '#f4f6f9', fontFamily: 'sans-serif' }}>
      <h2>📸 SnapShot Pro — React Edition</h2>
      
      <Navigation activeView={activeView} setActiveView={setActiveView} />

      {activeView === 'workspace' ? (
        <div>
          <Toolbar onCapture={handleCapture} onClear={handleClear} />
          <div style={{ textAlign: 'center', color: '#666', padding: '20px', background: '#fff', border: '1px dashed #ccc', borderRadius: '8px' }}>
            [Canvas Canvas Drawing Surface Component Coming Next]
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