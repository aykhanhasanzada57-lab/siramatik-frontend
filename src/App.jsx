import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfigProvider } from 'antd';

function App() {
  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#1890ff',
        fontFamily: "'Outfit', sans-serif",
        borderRadius: 8,
      }
    }}>
      <Router>
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/dashboard' element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path='/:slug' element={<BookingPage />} />
          <Route path='/' element={<Navigate to='/berber-aydin' replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
