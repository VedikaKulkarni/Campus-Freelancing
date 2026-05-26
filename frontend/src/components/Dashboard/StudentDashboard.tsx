import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Briefcase, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronDown, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  Star, 
  User, 
  Mail, 
  Building, 
  Phone, 
  TrendingUp, 
  Send, 
  Info,
  Sliders,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  Trash2,
  Plus
} from 'lucide-react';
import './StudentDashboard.css';
import { ChatDrawer } from '../Chat/ChatDrawer';

import type { Tab, ProjectLink, StudentProfile, Task, Application } from './student-tabs/types';
import { OverviewTab } from './student-tabs/OverviewTab';
import { ExploreTab } from './student-tabs/ExploreTab';
import { ApplicationsTab } from './student-tabs/ApplicationsTab';
import { OngoingTab } from './student-tabs/OngoingTab';
import { CompletedTab } from './student-tabs/CompletedTab';
import { PortfolioTab } from './student-tabs/PortfolioTab';
import { LedgerTab } from './student-tabs/LedgerTab';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [activeChatSession, setActiveChatSession] = useState<{
    targetId: string;
    targetName: string;
    taskId: string;
    taskTitle: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: 'Loading Student...',
    email: '',
    mobileNumber: '',
    schoolOrCollegeName: '',
    classOrYear: '',
    enrollmentNumber: '',
    skills: [],
    bio: '',
    projectLinks: []
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form profile states
  const [profileForm, setProfileForm] = useState<StudentProfile>({
    name: '',
    email: '',
    mobileNumber: '',
    schoolOrCollegeName: '',
    classOrYear: '',
    enrollmentNumber: '',
    skills: [],
    bio: '',
    projectLinks: []
  });

  // Task list and Application states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);

  // Explore filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [skillFilter, setSkillFilter] = useState('');

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyingTask, setApplyingTask] = useState<Task | null>(null);
  const [proposalText, setProposalText] = useState('');
  const [selectedLinksToSubmit, setSelectedLinksToSubmit] = useState<ProjectLink[]>([]);
  const [submittingApp, setSubmittingApp] = useState(false);
  
  // Inline link states
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const userId = sessionStorage.getItem('userId');
  const userRole = sessionStorage.getItem('userRole');

  // Load Dashboard Data
  useEffect(() => {
    // Light/dark class toggler
    const root = document.getElementById('root');
    if (root) {
      if (isDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Verify Stripe connected account onboarding status if redirect returns
  useEffect(() => {
    const checkStripeStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const stripeOnboard = params.get('stripe_onboard');
      if (stripeOnboard === 'success' && userId) {
        try {
          const response = await fetch('http://localhost:5000/api/payments/check-onboard-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: userId })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.complete) {
              alert('🎉 Congratulations! Your Stripe Connect Express account is fully connected and active for payouts!');
            } else {
              alert('Stripe account onboarding was not finished. Please make sure to complete all details to enable payouts.');
            }
            // Clear URL search params without page reload
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Reload profile data to get updated Stripe Connect status
            const profileRes = await fetch(`http://localhost:5000/api/auth/student/${userId}`);
            if (profileRes.ok) {
              const freshProfile = await profileRes.json();
              setStudentProfile(freshProfile);
              setProfileForm(freshProfile);
            }
          }
        } catch (err) {
          console.error('Stripe check status error:', err);
        }
      }
    };

    checkStripeStatus();
  }, [userId]);

  // Setup Stripe Connect Express Onboarding redirect
  const handleStripeOnboard = async () => {
    if (!userId) return;
    try {
      const response = await fetch('http://localhost:5000/api/payments/onboard-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId })
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        alert(`Setup error: ${data.message}`);
      }
    } catch (err) {
      console.error('Stripe setup request error:', err);
      alert('Failed to connect to Stripe onboarding server.');
    }
  };

  // Load Profile from Backend
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userId || userRole !== 'student') {
        console.warn('No active student session detected, redirecting to login');
        navigate('/');
        return;
      }

      try {
        setLoadingProfile(true);
        const response = await fetch(`http://localhost:5000/api/auth/student/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStudentProfile(data);
          setProfileForm(data);
        } else {
          throw new Error(`Failed to load profile. Status: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchStudentData();
  }, [userId, userRole]);

  // Load Tasks from Database
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const response = await fetch('http://localhost:5000/api/tasks');
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        } else {
          throw new Error('Tasks API failed');
        }
      } catch (err) {
        console.warn('Backend tasks unreachable, loading empty board', err);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [userId]);

  // Load Applications from Database
  const fetchApplications = async () => {
    if (!userId) {
      setApplications([]);
      setLoadingApps(false);
      return;
    }

    try {
      // Only show loading spinner on initial mount when applications are empty
      const shouldShowLoading = applications.length === 0;
      if (shouldShowLoading) {
        setLoadingApps(true);
      }
      const response = await fetch(`http://localhost:5000/api/applications/student/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        throw new Error('Applications API failed');
      }
    } catch (err) {
      console.warn('Backend applications unreachable, loading empty applications list', err);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [userId, activeTab]);

  // Handle Profile Update Input
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  // Submit Profile Changes
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      console.warn('Cannot update profile: No active student session detected');
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/student/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json();
      if (response.ok) {
        setStudentProfile(data.student);
        alert('Your premium student portfolio has been updated successfully!');
      } else {
        console.error('Failed to save profile changes:', data.message);
      }
    } catch (err) {
      console.error('Error saving profile changes:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Add Project Link
  const handleAddProjectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    if (!userId) {
      console.warn('Cannot add project link: No active student session detected');
      return;
    }

    const updatedLinks = [...profileForm.projectLinks, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }];
    const updatedForm = { ...profileForm, projectLinks: updatedLinks };
    setProfileForm(updatedForm);

    setNewLinkTitle('');
    setNewLinkUrl('');

    try {
      const response = await fetch(`http://localhost:5000/api/auth/student/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedForm)
      });
      if (response.ok) {
        const data = await response.json();
        setStudentProfile(data.student);
      } else {
        const data = await response.json();
        console.error('Failed to sync link with database:', data.message);
      }
    } catch (err) {
      console.error('Could not sync links with database:', err);
    }
  };

  // Delete Project Link
  const handleDeleteLink = async (indexToDelete: number) => {
    if (!userId) {
      console.warn('Cannot delete project link: No active student session detected');
      return;
    }

    const updatedLinks = profileForm.projectLinks.filter((_, i) => i !== indexToDelete);
    const updatedForm = { ...profileForm, projectLinks: updatedLinks };
    setProfileForm(updatedForm);

    try {
      const response = await fetch(`http://localhost:5000/api/auth/student/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedForm)
      });
      if (response.ok) {
        const data = await response.json();
        setStudentProfile(data.student);
      } else {
        const data = await response.json();
        console.error('Failed to sync link deletion with database:', data.message);
      }
    } catch (err) {
      console.error('Could not sync links deletion:', err);
    }
  };

  // Apply Modal Open
  const handleOpenApplyModal = (task: Task) => {
    if (studentProfile.verificationStatus !== 'verified') {
      alert(`Access Restricted: Your account is currently in "${studentProfile.verificationStatus || 'pending'}" status. You can only apply for gigs after your student ID card is successfully verified.`);
      return;
    }
    setApplyingTask(task);
    setProposalText('');
    setSelectedLinksToSubmit([]);
    setApplyModalOpen(true);
  };

  // Toggle selected project link to submit
  const handleToggleLinkSelection = (link: ProjectLink) => {
    const exists = selectedLinksToSubmit.find(l => l.url === link.url);
    if (exists) {
      setSelectedLinksToSubmit(selectedLinksToSubmit.filter(l => l.url !== link.url));
    } else {
      setSelectedLinksToSubmit([...selectedLinksToSubmit, link]);
    }
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingTask) return;

    if (!proposalText.trim()) {
      alert('Please provide a short proposal describing your skills.');
      return;
    }

    setSubmittingApp(true);
    const applicationPayload = {
      taskId: applyingTask._id,
      studentId: userId || 'student-fallback-id',
      proposal: proposalText,
      projectLinks: selectedLinksToSubmit
    };

    if (!userId) {
      // Mock submit application in-memory
      alert(`Application for "${applyingTask.title}" submitted successfully inside local session!`);
      const newMockApp: Application = {
        _id: `app-${Date.now()}`,
        taskId: {
          _id: applyingTask._id,
          title: applyingTask.title,
          budget: applyingTask.budget,
          deadline: applyingTask.deadline
        },
        proposal: proposalText,
        projectLinks: selectedLinksToSubmit,
        status: 'Pending',
        appliedAt: new Date().toISOString()
      };
      setApplications([newMockApp, ...applications]);
      setApplyModalOpen(false);
      setSubmittingApp(false);
      setActiveTab('applications');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationPayload)
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Application submitted successfully!');
        
        // Immediately add the application locally to ensure it is visible without delay
        const newApp: Application = {
          _id: data.application?._id || `app-${Date.now()}`,
          taskId: {
            _id: applyingTask._id,
            title: applyingTask.title,
            budget: applyingTask.budget,
            deadline: applyingTask.deadline,
            category: applyingTask.category,
            description: applyingTask.description,
            skillsRequired: applyingTask.skillsRequired,
            clientId: applyingTask.clientId,
            clientName: applyingTask.clientName,
            status: applyingTask.status,
            applicants: (applyingTask.applicants || 0) + 1
          },
          proposal: proposalText,
          projectLinks: selectedLinksToSubmit,
          status: 'Pending',
          appliedAt: data.application?.appliedAt || new Date().toISOString()
        };

        setApplications(prevApps => {
          if (prevApps.some(a => a._id === newApp._id || (a.taskId?._id || a.taskId) === applyingTask._id)) {
            return prevApps;
          }
          return [newApp, ...prevApps];
        });

        // Fetch updated applications in the background to ensure absolute accuracy
        fetch(`http://localhost:5000/api/applications/student/${userId}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('API failed');
          })
          .then(freshApps => {
            setApplications(freshApps);
          })
          .catch(err => console.warn('Background application sync failed, relying on instant local state:', err));

        // Update task count locally
        setTasks(tasks.map(t => t._id === applyingTask._id ? { ...t, applicants: (t.applicants || 0) + 1 } : t));
        
        setApplyModalOpen(false);
        setActiveTab('applications');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Failed to submit application to database, simulating...', err);
      alert('Database connection unavailable. Submitting app to temporary memory.');
      const newMockApp: Application = {
        _id: `app-${Date.now()}`,
        taskId: {
          _id: applyingTask._id,
          title: applyingTask.title,
          budget: applyingTask.budget,
          deadline: applyingTask.deadline
        },
        proposal: proposalText,
        projectLinks: selectedLinksToSubmit,
        status: 'Pending',
        appliedAt: new Date().toISOString()
      };
      setApplications([newMockApp, ...applications]);
      setApplyModalOpen(false);
      setActiveTab('applications');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userEmail');
    alert('Logged out successfully.');
    navigate('/');
  };

  // Explore Filter Actions
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesSkill = !skillFilter.trim() || 
                         task.skillsRequired.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    return matchesSearch && matchesCategory && matchesSkill && task.status === 'Open';
  });

  // Dynamic calculations
  const totalEarnings = applications
    .filter(a => a.paymentStatus === 'Released')
    .reduce((sum, current) => sum + (current.taskId?.budget || 0), 0);

  const activeEscrow = applications
    .filter(a => a.paymentStatus === 'Held in Escrow')
    .reduce((sum, current) => sum + (current.taskId?.budget || 0), 0);

  return (
    <div className={`dashboard-root ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* Decorative Blur Backgrounds */}
      <div className="dash-blur-1"></div>
      <div className="dash-blur-2"></div>

      {/* ============================================================== */}
      {/* SIDEBAR                                                        */}
      {/* ============================================================== */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-symbol">CL</div>
          <div className="logo-text">
            <h3>Campus<span className="accent-text">Lance</span></h3>
            <span className="user-role-badge">STUDENT PORTAL</span>
          </div>
          <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
          >
            <BarChart3 size={18} />
            <span>Overview Dashboard</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => { setActiveTab('explore'); setMobileMenuOpen(false); }}
          >
            <Briefcase size={18} />
            <span>Explore Campus Gigs</span>
            <span className="badge-count">{tasks.filter(t => t.status === 'Open').length}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('applications'); setMobileMenuOpen(false); }}
          >
            <Users size={18} />
            <span>My Gigs Applied</span>
            {applications.length > 0 && (
              <span className="badge-count" style={{ background: '#3b82f6' }}>{applications.length}</span>
            )}
          </button>

          <button 
            className={`nav-item ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ongoing'); setMobileMenuOpen(false); }}
          >
            <Clock size={18} style={{ color: '#10b981' }} />
            <span>Ongoing Projects</span>
            {applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'In Progress').length > 0 && (
              <span className="badge-count" style={{ background: '#10b981' }}>
                {applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'In Progress').length}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => { setActiveTab('completed'); setMobileMenuOpen(false); }}
          >
            <CheckCircle size={18} style={{ color: '#a78bfa' }} />
            <span>Completed Projects</span>
            {applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'Completed').length > 0 && (
              <span className="badge-count" style={{ background: '#a78bfa' }}>
                {applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'Completed').length}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => { setActiveTab('portfolio'); setMobileMenuOpen(false); }}
          >
            <Settings size={18} />
            <span>My Portfolio & Bio</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ledger'); setMobileMenuOpen(false); }}
          >
            <CreditCard size={18} />
            <span>Earnings Ledger</span>
          </button>
        </nav>

        <div className="sidebar-user-footer">
          <div className="footer-avatar">
            {studentProfile.name.charAt(0)}
          </div>
          <div className="footer-user-info">
            <h4 className="truncate">{studentProfile.name}</h4>
            <p className="truncate">{studentProfile.email}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTAINER                                                 */}
      {/* ============================================================== */}
      <main className="dashboard-main-content">
        
        {/* TOP NAVIGATION BAR */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="breadcrumb-trail">
              <span>Portal</span>
              <span className="bc-separator">▼</span>
              <span className="current-page">
                {activeTab === 'overview' && 'Overview Analytics'}
                {activeTab === 'explore' && 'Browse Campus Board'}
                {activeTab === 'applications' && 'Application Center'}
                {activeTab === 'ongoing' && 'Ongoing Hired Projects'}
                {activeTab === 'completed' && 'Completed Projects'}
                {activeTab === 'portfolio' && 'Edit Student Portfolio'}
                {activeTab === 'ledger' && 'Escrow Accounting'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Theme toggle */}
            <button 
              className="theme-toggle-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Notification alert */}
            <div className="notification-wrapper" style={{ position: 'relative' }}>
              <button 
                className="theme-toggle-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={18} />
                {applications.filter(a => a.status === 'Hired').length > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown-menu" style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                  width: '300px', background: 'var(--dash-card-bg)', backdropFilter: 'blur(25px)',
                  border: '1px solid var(--dash-border)', borderRadius: '12px', boxShadow: 'var(--dash-shadow)',
                  padding: '12px', zIndex: 1000
                }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--dash-text-h)' }}>Portal Notifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {applications.filter(a => a.status === 'Hired').map((app) => (
                      <div key={app._id} style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10b981', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}>
                        <p style={{ margin: '0 0 2px', color: 'var(--dash-text-h)' }}><strong>Hired Alert!</strong> You have been hired for <strong>{app.taskId?.title}</strong>.</p>
                        <span style={{ fontSize: '10px', color: 'var(--dash-text)' }}>Release escrow upon final delivery.</span>
                      </div>
                    ))}
                    {applications.filter(a => a.status === 'Hired').length === 0 && (
                      <p style={{ margin: 0, fontSize: '12px', textAlign: 'center', padding: '10px' }}>No new notifications.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Micro avatar */}
            <div className="user-profile-header-widget" onClick={() => setActiveTab('portfolio')}>
              <div className="widget-avatar">
                {studentProfile.name.charAt(0)}
              </div>
              <div className="widget-details">
                <h5>{studentProfile.name}</h5>
              </div>
            </div>
          </div>
        </header>

        {/* Verification Status Alert Banners */}
        {studentProfile.verificationStatus === 'pending' && (
          <div className="verification-alert-banner pending bg-glass-amber" style={{
            margin: '20px 30px 0',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            color: 'var(--dash-text-h)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock className="spin-icon animate-pulse" size={18} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                <strong>🔍 ID Verification Pending:</strong> We are running a 100% automated OCR check on your uploaded student ID card. This normally takes about 10-30 seconds. Click refresh or reload the page shortly.
              </span>
            </div>
            <button 
              className="banner-refresh-btn" 
              onClick={() => window.location.reload()}
              style={{
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              Refresh Status
            </button>
          </div>
        )}

        {studentProfile.verificationStatus === 'rejected' && (
          <div className="verification-alert-banner rejected bg-glass-red" style={{
            margin: '20px 30px 0',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            color: 'var(--dash-text-h)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={18} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                <strong>⚠️ Auto-Verification Rejected:</strong> {studentProfile.rejectionReason || 'The uploaded student ID card could not be automatically validated.'} Please go to portfolio settings to re-upload.
              </span>
            </div>
            <button 
              className="banner-action-btn" 
              onClick={() => setActiveTab('portfolio')}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Re-upload ID
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN ROUTING                                                 */}
        {/* ============================================================== */}
        <div className="dashboard-screens-scroller">
          {activeTab === 'overview' && (
            <OverviewTab 
              studentProfile={studentProfile}
              applications={applications}
              totalEarnings={totalEarnings}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'explore' && (
            <ExploreTab 
              tasks={tasks}
              applications={applications}
              loadingTasks={loadingTasks}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              skillFilter={skillFilter}
              setSkillFilter={setSkillFilter}
              handleOpenApplyModal={handleOpenApplyModal}
              studentProfile={studentProfile}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsTab 
              applications={applications}
              loadingApps={loadingApps}
            />
          )}

          {activeTab === 'ongoing' && (
            <OngoingTab 
              applications={applications}
              setActiveTab={setActiveTab}
              onChatWithClient={(clientId, clientName, taskId, taskTitle) => {
                setActiveChatSession({
                  targetId: clientId,
                  targetName: clientName,
                  taskId: taskId,
                  taskTitle: taskTitle
                });
              }}
              onReloadApplications={fetchApplications}
            />
          )}

          {activeTab === 'completed' && (
            <CompletedTab 
              applications={applications}
              setActiveTab={setActiveTab}
              onChatWithClient={(clientId, clientName, taskId, taskTitle) => {
                setActiveChatSession({
                  targetId: clientId,
                  targetName: clientName,
                  taskId: taskId,
                  taskTitle: taskTitle
                });
              }}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioTab 
              studentProfile={studentProfile}
              profileForm={profileForm}
              loadingProfile={loadingProfile}
              savingProfile={savingProfile}
              handleProfileChange={handleProfileChange}
              handleProfileSubmit={handleProfileSubmit}
              setProfileForm={setProfileForm}
              handleAddProjectLink={handleAddProjectLink}
              handleDeleteLink={handleDeleteLink}
              newLinkTitle={newLinkTitle}
              setNewLinkTitle={setNewLinkTitle}
              newLinkUrl={newLinkUrl}
              setNewLinkUrl={setNewLinkUrl}
              onStripeOnboard={handleStripeOnboard}
              onProfileUpdate={(updatedProfile) => {
                setStudentProfile(updatedProfile);
                setProfileForm(updatedProfile);
              }}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerTab 
              applications={applications}
              totalEarnings={totalEarnings}
              activeEscrow={activeEscrow}
            />
          )}
        </div>

      </main>

      {/* ============================================================== */}
      {/* APPLY MODAL OVERLAY                                            */}
      {/* ============================================================== */}
      {applyModalOpen && applyingTask && (
        <div className="modal-overlay">
          <div className="modal-content-wrapper bg-glass">
            <button className="modal-close-btn" onClick={() => setApplyModalOpen(false)}>
              <X size={20} />
            </button>

            <div className="modal-header">
              <span className="gig-category" style={{ fontSize: '10px' }}>APPLYING FOR</span>
              <h3>{applyingTask.title}</h3>
              <p>Budget Allocation: <strong style={{ color: '#10b981' }}>${applyingTask.budget}</strong> • Category: {applyingTask.category}</p>
            </div>

            <form onSubmit={handleSubmitApplication}>
              <div className="form-group-dash">
                <label>Custom Proposal Letter</label>
                <textarea 
                  rows={5}
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  placeholder="Explain why you are qualified to build this project milestone, highlight relevant framework skills, and discuss how quickly you can deliver deliverables..."
                  required
                ></textarea>
              </div>

              <div className="form-group-dash">
                <label>Select Project Links to Include (Optional)</label>
                <div className="modal-project-links-list">
                  {profileForm.projectLinks.length > 0 ? (
                    profileForm.projectLinks.map((link, idx) => {
                      const selected = selectedLinksToSubmit.some(l => l.url === link.url);
                      return (
                        <div className="project-link-item-row" key={idx}>
                          <div className="checkbox-wrapper">
                            <input 
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleToggleLinkSelection(link)}
                            />
                            <div>
                              <h6>{link.title}</h6>
                              <p>{link.url}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>
                      No project links uploaded to your portfolio yet. Add links under the Settings/Portfolio tab.
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary-dash" onClick={() => setApplyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-dash" disabled={submittingApp}>
                  {submittingApp ? 'Submitting Bid...' : 'Submit Application Bids'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Glassmorphic Milestone Chat Drawer */}
      <ChatDrawer
        userId={userId}
        userRole={userRole}
        userName={studentProfile.name}
        activeChatSession={activeChatSession}
        onClearActiveChatSession={() => setActiveChatSession(null)}
      />

    </div>
  );
};

export default StudentDashboard;
