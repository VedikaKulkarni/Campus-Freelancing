import { Mail, Lock, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

interface SignInProps {
  role: 'student' | 'client';
}

const SignIn = ({ role }: SignInProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });
      const data = await response.json();
      if (response.ok) {
        // Save user info to sessionStorage
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('userRole', data.userRole);
        sessionStorage.setItem('userEmail', formData.email);
        
        alert(`Successfully Logged In as ${role}!`);
        if (role === 'client') {
          navigate('/client-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to connect to the server');
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Email Address</label>
        <div className="input-wrapper">
          <Mail className="input-icon" />
          <input 
            type="email" 
            name="email"
            className="auth-input" 
            placeholder="Enter your email" 
            required 
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" />
          <input 
            type="password" 
            name="password"
            className="auth-input" 
            placeholder="Enter your password" 
            required 
            onChange={handleChange}
          />
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
      </button>
    </form>
  );
};

export default SignIn;
