import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WindowManagerProvider } from './context/WindowManagerContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <WindowManagerProvider>
      <Layout />
    </WindowManagerProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
