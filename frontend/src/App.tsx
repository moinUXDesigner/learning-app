import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { useAuthStore } from './auth/authStore';

function App() {
  const fetchMe = useAuthStore((state) => state.fetchMe);

  // Restore session state on app boot (hits /sanctum/csrf-cookie then /api/me).
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
