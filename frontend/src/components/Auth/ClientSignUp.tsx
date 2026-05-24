import { User, Mail, Lock, Phone, Briefcase, Building, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const ClientSignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    companyName: '',
    industryOrWorkType: '',
    password: '',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Client Registered Successfully!');
        setSearchParams({ mode: 'signin', role: 'client' });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to connect to the server');
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Full Name</label>
        <div className="input-wrapper">
          <User className="input-icon" />
          <input type="text" name="name" className="auth-input" placeholder="Jane Doe" required onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <div className="input-wrapper">
          <Mail className="input-icon" />
          <input type="email" name="email" className="auth-input" placeholder="jane@company.com" required onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Mobile Number</label>
        <div className="input-wrapper">
          <Phone className="input-icon" />
          <input type="tel" name="mobileNumber" className="auth-input" placeholder="+1 (555) 000-0000" required onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Company / Organization Name (Optional)</label>
        <div className="input-wrapper">
          <Building className="input-icon" />
          <input type="text" name="companyName" className="auth-input" placeholder="Company LLC" onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Industry or Work Type</label>
        <div className="input-wrapper">
          <Briefcase className="input-icon" />
          <input type="text" name="industryOrWorkType" className="auth-input" placeholder="e.g. Web Development, Design" required onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" />
          <input type="password" name="password" className="auth-input" placeholder="Create a strong password" required onChange={handleChange} />
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Registering...' : 'Create Client Account'} <ArrowRight size={18} />
      </button>
    </form>
  );
};

export default ClientSignUp;
