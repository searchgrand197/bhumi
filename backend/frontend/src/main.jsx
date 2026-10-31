import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AdminApp from './AdminApp.jsx';

function Root() {
  const [isAdmin, setIsAdmin] = useState(() => (window.location.hash || '').startsWith('#/admin'));

  useEffect(() => {
    function onHash() {
      setIsAdmin((window.location.hash || '').startsWith('#/admin'));
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return isAdmin ? <AdminApp /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
