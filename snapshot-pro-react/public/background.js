chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Revert straight back to your working CAPTURE_TAB action
  if (message.action === "CAPTURE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab) return;

      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          console.error("Capture failed:", chrome.runtime.lastError);
          return;
        }

        const workspaceUrl = chrome.runtime.getURL("index.html") + "?fullscreen=true";
        
        chrome.tabs.create({ url: workspaceUrl }, (newTab) => {
          chrome.storage.local.set({ tempScreenshot: dataUrl });
        });
      });
    });
    
    sendResponse({ status: "success" });
    return true;
  }
});