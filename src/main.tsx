import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { AuthProvider } from './security/AuthContext.tsx';
import './index.css';

// Guard against non-fatal Firebase / iframe network rejection messages
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason?.message || String(reason) || '').toLowerCase();
    const code = (reason?.code || '').toLowerCase();
    if (
      code.includes('auth/network-request-failed') ||
      code.includes('auth/popup-closed-by-user') ||
      code.includes('auth/cancelled-popup-request') ||
      msg.includes('auth/network-request-failed') ||
      msg.includes('firestore backend timeout') ||
      msg.includes('failed to get document because the client is offline')
    ) {
      // Prevent uncaught error bubble for benign offline / network status notices
      event.preventDefault();
      console.warn('Network sync notice handled gracefully:', reason?.message || reason);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>,
);

