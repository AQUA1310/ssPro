import { createContext, useState, useContext, useEffect } from 'react';

const ScreenshotContext = createContext();

export function ScreenshotProvider({ children }) {
  const [currentImage, setCurrentImage] = useState(null);
  const [activeTool, setActiveTool] = useState('rect');
  const [history, setHistory] = useState([]);

  // Load baseline history logs out of Chrome Storage on mount
  useEffect(() => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get({ screenshotHistory: [] }, (result) => {
        setHistory(result.screenshotHistory);
      });
    }
  }, []);

  const saveToHistory = (dataUrl) => {
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      image: dataUrl
    };
    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ screenshotHistory: updatedHistory });
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ screenshotHistory: [] });
    }
  };

  return (
    <ScreenshotContext.Provider value={{
      currentImage, setCurrentImage,
      activeTool, setActiveTool,
      history, saveToHistory, clearAllHistory
    }}>
      {children}
    </ScreenshotContext.Provider>
  );
}

export function useScreenshot() {
  return useContext(ScreenshotContext);
}