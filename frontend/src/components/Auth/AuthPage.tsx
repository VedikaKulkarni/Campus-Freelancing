import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Auth.css';
import SignIn from './SignIn';
import StudentSignUp from './StudentSignUp';
import ClientSignUp from './ClientSignUp';

type AuthMode = 'signin' | 'signup';
type UserRole = 'student' | 'client';

const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMode = searchParams.get('mode');

  const [mode, setMode] = useState<AuthMode>(
    queryMode === 'signup' ? 'signup' : 'signin'
  );
  const [role, setRole] = useState<UserRole>(
    (searchParams.get('role') === 'client') ? 'client' : 'student'
  );

  const queryRole = searchParams.get('role');

  useEffect(() => {
    if (queryMode === 'signup' || queryMode === 'signin') {
      setMode(queryMode);
    }
    if (queryRole === 'student' || queryRole === 'client') {
      setRole(queryRole);
    }
  }, [queryMode, queryRole]);

  const toggleMode = () => {
    const nextMode = mode === 'signin' ? 'signup' : 'signin';
    setMode(nextMode);
    setSearchParams({ mode: nextMode, role });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'signin' ? 'Welcome Back' : 'Create an Account'}</h1>
          <p>{mode === 'signin' ? 'Log in to your account to continue' : 'Join our campus freelancing community'}</p>
        </div>

        <div className="role-selector">
          <button 
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => {
              setRole('student');
              setSearchParams({ mode, role: 'student' });
            }}
          >
            Student Freelancer
          </button>
          <button 
            className={`role-btn ${role === 'client' ? 'active' : ''}`}
            onClick={() => {
              setRole('client');
              setSearchParams({ mode, role: 'client' });
            }}
          >
            Hire a Student
          </button>
        </div>

        {mode === 'signin' ? (
          <SignIn role={role} />
        ) : role === 'student' ? (
          <StudentSignUp />
        ) : (
          <ClientSignUp />
        )}

        <div className="toggle-auth">
          {mode === 'signin' ? (
            <p>Don't have an account? <span onClick={toggleMode}>Sign up</span></p>
          ) : (
            <p>Already have an account? <span onClick={toggleMode}>Sign in</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
