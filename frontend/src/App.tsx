import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
