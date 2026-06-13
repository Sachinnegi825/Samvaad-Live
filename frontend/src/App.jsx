import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import useAuthStore from './store/useAuthStore';

/**
 * ProtectedRoute
 * A wrapper component that redirects unauthenticated users to /login.
 * If we have a token, show the child component. Otherwise, redirect.
 */
function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // On every app load/refresh, verify the stored token is still valid
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
