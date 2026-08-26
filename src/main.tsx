import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx'
import { startBackupService } from './lib/backupManager';
import './index.css';

startBackupService();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
