import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { WorkflowProvider } from './contexts/workflow-context';

// Safe check for opener
let isPopup = false;
try {
  isPopup = window.opener && window.opener !== window;
} catch (e) {
  isPopup = false;
}

const hash = window.location.hash || '';
const hasToken = hash.includes('access_token=') || hash.includes('id_token=');
const hasError = window.location.search.includes('error=') || hash.includes('error=');

if (isPopup && (hasToken || hasError)) {
  if (hasToken) {
    try {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const token = params.get('access_token') || params.get('id_token');
      if (token) {
        window.opener.postMessage({
          type: 'MS_OAUTH_TOKEN',
          token: token,
          isAccessToken: !!params.get('access_token')
        }, '*');
        
        setTimeout(() => {
          window.close();
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
    document.getElementById('root')!.innerHTML = '<div style="padding: 20px; font-family: sans-serif; text-align: center;"><h2>Authentifizierung erfolgreich.</h2><p>Dieses Fenster wird automatisch geschlossen...</p></div>';
  } else if (hasError) {
    let errorDetail = 'Fehler bei der Anmeldung.';
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      errorDetail = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error') || 'Fehler bei der Anmeldung';
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({
          type: 'MS_OAUTH_ERROR',
          error: errorDetail
        }, '*');
      }
    } catch (e) {
      console.error(e);
    }
    document.getElementById('root')!.innerHTML = `<div style="padding: 24px; font-family: system-ui, -apple-system, sans-serif; text-align: center; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #e11d48; margin-bottom: 8px; font-size: 18px;">Microsoft Authentifizierung gestoppt</h2>
      <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorDetail}</p>
      <p style="color: #64748b; font-size: 12px;">Informationen wurden an das Hauptfenster übermittelt. Sie können dieses Fenster nun schließen.</p>
    </div>`;
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <WorkflowProvider>
        <App />
      </WorkflowProvider>
    </StrictMode>
  );
}
