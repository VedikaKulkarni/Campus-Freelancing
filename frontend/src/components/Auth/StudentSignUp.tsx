import { User, Mail, Lock, Phone, BookOpen, GraduationCap, Hash, ImagePlus, ArrowRight, School } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const StudentSignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    schoolOrCollegeName: '',
    classOrYear: '',
    enrollmentNumber: '',
    password: '',
    idCardImage: '',
  });
  
  const [institutionType, setInstitutionType] = useState('');
  const [fileName, setFileName] = useState('');
  const [, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, idCardImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInstitutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setInstitutionType(value);
    setFormData(prev => ({ ...prev, classOrYear: '' }));
  };

  const getClassOptions = () => {
    if (institutionType === 'school') {
      return Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
    } else if (institutionType === 'higher_secondary') {
      return ['Class 11', 'Class 12'];
    } else if (institutionType === 'college') {
      return ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    }
    return [];
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Student Registered Successfully!');
        setSearchParams({ mode: 'signin', role: 'student' });
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
          <input 
            type="text" 
            name="name" 
            className="auth-input" 
            placeholder="John Doe" 
            required 
            value={formData.name} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <div className="input-wrapper">
          <Mail className="input-icon" />
          <input 
            type="email" 
            name="email" 
            className="auth-input" 
            placeholder="student@college.edu" 
            required 
            value={formData.email} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Mobile Number</label>
        <div className="input-wrapper">
          <Phone className="input-icon" />
          <input 
            type="tel" 
            name="mobileNumber" 
            className="auth-input" 
            placeholder="+1 (555) 000-0000" 
            required 
            value={formData.mobileNumber} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Institution Type</label>
        <div className="input-wrapper">
          <GraduationCap className="input-icon" />
          <select
            name="institutionType"
            className="auth-input"
            required
            value={institutionType}
            onChange={handleInstitutionChange}
          >
            <option value="" disabled>-- Select Institution Type --</option>
            <option value="school">School</option>
            <option value="higher_secondary">Higher Secondary School</option>
            <option value="college">College</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>School / College Name</label>
        <div className="input-wrapper">
          <School className="input-icon" />
          <input 
            type="text" 
            name="schoolOrCollegeName" 
            className="auth-input" 
            placeholder="University Name" 
            required 
            value={formData.schoolOrCollegeName} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Class / Year</label>
          <div className="input-wrapper">
            <BookOpen className="input-icon" />
            <select
              name="classOrYear"
              className="auth-input"
              required
              value={formData.classOrYear}
              onChange={handleChange}
              disabled={!institutionType}
            >
              <option value="" disabled>
                {institutionType ? '-- Select Class / Year --' : 'Select Institution First'}
              </option>
              {getClassOptions().map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Enrollment Number</label>
          <div className="input-wrapper">
            <Hash className="input-icon" />
            <input 
              type="text" 
              name="enrollmentNumber" 
              className="auth-input" 
              placeholder="ENR-12345" 
              required 
              value={formData.enrollmentNumber} 
              onChange={handleChange} 
            />
          </div>
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
            placeholder="Create a strong password" 
            required 
            value={formData.password} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Upload ID Card Image</label>
        <div className="file-upload-wrapper">
          <label 
            className="file-upload-label"
            style={{ 
              borderStyle: formData.idCardImage ? 'solid' : 'dashed', 
              borderColor: formData.idCardImage ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              background: formData.idCardImage ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <ImagePlus size={20} style={{ color: formData.idCardImage ? '#10b981' : 'inherit' }} />
            <span style={{ color: formData.idCardImage ? '#10b981' : 'inherit', fontWeight: formData.idCardImage ? 600 : 'normal' }}>
              {formData.idCardImage && fileName ? `Selected: ${fileName}` : 'Click to upload ID Card'}
            </span>
            <input 
              type="file" 
              className="file-upload-input" 
              accept="image/*" 
              onChange={handleFileChange}
              required
            />
          </label>
          
          {formData.idCardImage && (
            <div className="image-preview-container" style={{ marginTop: '12px', textAlign: 'center' }}>
              <img 
                src={formData.idCardImage} 
                alt="ID Card Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '140px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)'
                }} 
              />
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Registering...' : 'Create Student Account'} <ArrowRight size={18} />
      </button>
    </form>
  );
};

export default StudentSignUp;
