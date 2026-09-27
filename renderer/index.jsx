// renderer/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupBrowserMockApi } from './utils/browserMockApi';

// If running in a standard web browser (e.g. Chrome/Edge live preview), initialize mock API
setupBrowserMockApi();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
