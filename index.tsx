import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AchievementProvider } from './contexts/AchievementContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AccessibilityProvider>
      <AchievementProvider>
        <App />
      </AchievementProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);