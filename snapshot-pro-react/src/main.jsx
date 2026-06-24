import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ScreenshotProvider } from './context/ScreenshotContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ScreenshotProvider>
      <App />
    </ScreenshotProvider>
  </React.StrictMode>,
)