import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  PlusCircle, 
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
  Video
} from 'lucide-react';
import './ClientDashboard.css';
import { ChatDrawer } from '../Chat/ChatDrawer';
import { API_BASE_URL } from '../../config';

// Active Menu Tabs
type Tab = 'overview' | 'create-task' | 'manage-tasks' | 'students' | 'payments' | 'profile';

interface StudentFreelancer {
  id: string;
  name: string;
  college: string;
  year: string;
  rating: number;
  reviewsCount: number;
  skills: string[];
  hourlyRate: number;
  avatarUrl: string;
  completedGigs: number;
  matchScore: number;
}

interface Task {
  id: string;
  title: string;
  category: string;
  budget: number;
  applicants: number;
  status: 'Open' | 'In Progress' | 'Completed' | 'Draft';
  deadline: string;
  description: string;
  skillsRequired: string[];
}


const ClientDashboard = () => {
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
  
  // Real user state fetched from backend
  const [clientProfile, setClientProfile] = useState({
    name: 'Loading...',
    email: '',
    mobileNumber: '',
    companyName: '',
    industryOrWorkType: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Tasks and Ledger States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clientApplications, setClientApplications] = useState<any[]>([]);


  // Stats Counters
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const totalStudentsGivenWork = tasks.filter(t => t.status === 'In Progress' || t.status === 'Completed').length;

  // Form State for Creating Task
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'Development',
    budget: '',
    deadline: '',
    skills: '',
  });
  
  // Update Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    companyName: '',
    industryOrWorkType: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [taskCreationMessage, setTaskCreationMessage] = useState('');
  
  // Review applicants states
  const [reviewingTask, setReviewingTask] = useState<any | null>(null);
  const [taskApplicants, setTaskApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Session storage credentials
  const userId = sessionStorage.getItem('userId');
  const userRole = sessionStorage.getItem('userRole');

  // Load Profile from Backend
  useEffect(() => {
    if (!userId || userRole !== 'client') {
      console.warn('Unauthorized access to client dashboard, redirecting to login');
      navigate('/');
      return;
    }

    const fetchClientProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await fetch(`${API_BASE_URL}/api/auth/client/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setClientProfile(data);
          setProfileForm(data);
        } else {
          console.error('Failed to fetch backend profile, using mock fallbacks');
          // Fallback mocks
          setClientProfile({
            name: 'Jane Cooper',
            email: sessionStorage.getItem('userEmail') || 'jane.cooper@startup.co',
            mobileNumber: '+1 (555) 382-9018',
            companyName: 'Nova Technologies LLC',
            industryOrWorkType: 'Software Development',
          });
          setProfileForm({
            name: 'Jane Cooper',
            email: sessionStorage.getItem('userEmail') || 'jane.cooper@startup.co',
            mobileNumber: '+1 (555) 382-9018',
            companyName: 'Nova Technologies LLC',
            industryOrWorkType: 'Software Development',
          });
        }
      } catch (err) {
        console.error('Network error fetching client profile, using mock fallbacks', err);
        setClientProfile({
          name: 'Jane Cooper',
          email: sessionStorage.getItem('userEmail') || 'jane.cooper@startup.co',
          mobileNumber: '+1 (555) 382-9018',
          companyName: 'Nova Technologies LLC',
          industryOrWorkType: 'Software Development',
        });
        setProfileForm({
          name: 'Jane Cooper',
          email: sessionStorage.getItem('userEmail') || 'jane.cooper@startup.co',
          mobileNumber: '+1 (555) 382-9018',
          companyName: 'Nova Technologies LLC',
          industryOrWorkType: 'Software Development',
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchClientProfile();
  }, [userId, userRole]);

  // Capture Stripe Checkout redirect success parameters
  useEffect(() => {
    const confirmEscrowPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const appId = params.get('appId');

      if (paymentStatus === 'success' && appId) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/payments/confirm-escrow-manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: appId })
          });
          const data = await response.json();
          if (response.ok) {
            alert('💳 Escrow Secured! $' + data.app?.taskId?.budget + ' budget is locked in safeguards. Student freelancer is officially hired.');
            // Reload list immediately
            fetchClientApplications();
          }
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Error verifying Stripe escrow deposit:', err);
        }
      }
    };

    confirmEscrowPayment();
  }, [userId]);

  // Fetch all applications associated with this client's tasks
  const fetchClientApplications = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/client/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setClientApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch client applications:', err);
    }
  };

  useEffect(() => {
    if (userId && (activeTab === 'payments' || activeTab === 'overview')) {
      fetchClientApplications();
    }
  }, [userId, activeTab]);

  // Release Escrow Payout - Transfer platform balance to student Connected Express bank
  const handleReleaseEscrow = async (appId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/release-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId })
      });
      const data = await response.json();
      if (response.ok) {
        alert('🎉 Payout released successfully! Real-time direct deposit has been transferred to the student connect bank account.');
        // Refresh ledger
        fetchClientApplications();
      } else {
        alert(`Escrow release failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Error releasing escrow payment:', err);
      alert('Network error releasing escrow.');
    }
  };

  // Fund Escrow - Redirect client to Stripe Checkout card payment
  const handlePayProject = async (app: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/fund-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app._id,
          redirectOrigin: window.location.origin
        })
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // Redirect client directly to Stripe card checkout
      } else {
        alert(`Setup error: ${data.message}`);
      }
    } catch (err) {
      console.error('Stripe Checkout session request error:', err);
      alert('Failed to connect to payments server.');
    }
  };

  // Load client's tasks from database
  useEffect(() => {
    if (!userId || userRole !== 'client') return;

    const fetchClientTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks/client/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((t: any) => ({
            id: t._id,
            title: t.title,
            category: t.category,
            budget: t.budget,
            applicants: t.applicants || 0,
            status: t.status,
            deadline: t.deadline,
            description: t.description,
            skillsRequired: t.skillsRequired || []
          }));
          setTasks(mapped);
          setTotalTasksCount(mapped.length);
        }
      } catch (err) {
        console.error('Failed to fetch client tasks from backend', err);
      }
    };

    fetchClientTasks();
  }, [userId, userRole]);

  // Real-time student freelancers directory state
  const [studentFreelancers, setStudentFreelancers] = useState<StudentFreelancer[]>([]);

  // Fetch all students from backend database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/students`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((s: any) => ({
            id: s._id,
            name: s.name,
            college: s.schoolOrCollegeName || 'Verified University',
            year: s.classOrYear || 'Active Student',
            rating: 5.0,
            reviewsCount: s.projectLinks ? s.projectLinks.length : 0,
            skills: s.skills || [],
            hourlyRate: 25,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`,
            completedGigs: s.projectLinks ? s.projectLinks.length : 0,
            matchScore: 95
          }));
          setStudentFreelancers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch students from backend', err);
      }
    };

    fetchStudents();
  }, [userId]);

  // Handle Profile Form input
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  // Submit Profile Form to Database
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Simulation: Profile updated inside application memory.');
      setClientProfile({ ...clientProfile, ...profileForm });
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/client/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json();
      if (response.ok) {
        setClientProfile(data.client);
        alert('Your premium profile has been updated successfully!');
      } else {
        alert(`Error updating profile: ${data.message}`);
      }
    } catch (err) {
      console.error('Failed to connect to backend, simulating save', err);
      setClientProfile({ ...clientProfile, ...profileForm });
      alert('Database connection unavailable. Profile simulated update successfully!');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Task Creation
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskPayload = {
      title: taskForm.title,
      description: taskForm.description,
      category: taskForm.category,
      budget: parseFloat(taskForm.budget) || 100,
      deadline: taskForm.deadline,
      skillsRequired: taskForm.skills,
      clientId: userId || 'fallback-client-id'
    };

    if (!userId) {
      // Create mock in-memory
      const newTask: Task = {
        id: `task-${Date.now().toString().slice(-3)}`,
        title: taskForm.title,
        category: taskForm.category,
        budget: parseFloat(taskForm.budget) || 100,
        applicants: 0,
        status: 'Open',
        deadline: taskForm.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: taskForm.description,
        skillsRequired: taskForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      setTasks([newTask, ...tasks]);
      setTotalTasksCount(prev => prev + 1);
      setTaskCreationMessage('Task posted successfully (Local session)! It is now live in the student job feed.');
      setTimeout(() => setTaskCreationMessage(''), 5000);
      
      setTaskForm({
        title: '',
        description: '',
        category: 'Development',
        budget: '',
        deadline: '',
        skills: '',
      });
      setTimeout(() => setActiveTab('manage-tasks'), 1500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload)
      });
      const data = await response.json();
      if (response.ok) {
        const fresh: Task = {
          id: data.task._id,
          title: data.task.title,
          category: data.task.category,
          budget: data.task.budget,
          applicants: 0,
          status: data.task.status,
          deadline: data.task.deadline,
          description: data.task.description,
          skillsRequired: data.task.skillsRequired || []
        };
        setTasks([fresh, ...tasks]);
        setTotalTasksCount(prev => prev + 1);
        setTaskCreationMessage('Task posted successfully! It is now live in the student job feed.');
        setTimeout(() => setTaskCreationMessage(''), 5000);
        
        setTaskForm({
          title: '',
          description: '',
          category: 'Development',
          budget: '',
          deadline: '',
          skills: '',
        });
        setTimeout(() => setActiveTab('manage-tasks'), 1500);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error posting task:', err);
      alert('Database unavailable. Post simulated in temporary state.');
    }
  };

  // Mark task as completed and close project
  const handleCloseAndCompleteTask = async (taskId: string) => {
    const confirmClose = window.confirm("Are you sure you want to finalize and close this project milestone? This will mark it as Completed across the platform.");
    if (!confirmClose) return;

    try {
      if (!userId) {
        // Mock fallback for offline session
        alert('🎉 Project successfully marked as Completed and closed (Local Session)!');
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
      });
      
      if (response.ok) {
        alert('🎉 Project successfully marked as Completed and closed!');
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
      } else {
        const data = await response.json();
        alert(`Failed to update project status: ${data.message}`);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Network error updating task status.');
    }
  };

  // Open applicants review modal
  const handleOpenReviewModal = async (task: Task) => {
    setReviewingTask(task);
    setShowReviewModal(true);
    setTaskApplicants([]);

    if (!userId) {
      // Mock review data for offline demonstration
      setTaskApplicants([
        {
          _id: 'app-mock-1',
          studentName: 'Alex Rivera',
          studentCollege: 'Stanford University',
          studentYear: '4th Year',
          studentEmail: 'alex.rivera@stanford.edu',
          proposal: 'I can complete the responsive landing page with full glassmorphism cards and premium dark mode in 4 days. Check my github repo!',
          projectLinks: [{ title: 'CSS Sandbox', url: 'https://github.com/alexrivera/css-sandbox' }],
          status: 'Pending'
        }
      ]);
      return;
    }

    try {
      setLoadingApplicants(true);
      const response = await fetch(`${API_BASE_URL}/api/applications/task/${task.id}`);
      if (response.ok) {
        const data = await response.json();
        setTaskApplicants(data);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Hire student action - Triggers secure card payment through Stripe Checkout
  const handleHireStudent = async (appId: string) => {
    if (!reviewingTask) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/fund-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          redirectOrigin: window.location.origin
        })
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // Redirect client directly to Stripe card checkout
      } else {
        alert(`Setup error: ${data.message}`);
      }
    } catch (err) {
      console.error('Stripe Checkout session request error:', err);
      alert('Failed to connect to payments server.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userEmail');
    alert('Logged out successfully.');
    navigate('/');
  };

  const handleChatWithStudent = async (task: Task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/task/${task.id}`);
      if (response.ok) {
        const apps = await response.json();
        const hiredApp = apps.find((a: any) => a.status === 'Hired');
        if (hiredApp) {
          setActiveChatSession({
            targetId: hiredApp.studentId,
            targetName: hiredApp.studentName,
            taskId: task.id,
            taskTitle: task.title
          });
        } else {
          alert('No student has been hired for this task yet.');
        }
      }
    } catch (err) {
      console.error('Error fetching hired student details:', err);
      alert('Could not open chat. Hired student details unavailable.');
    }
  };

  // Switch tabs
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Search Filter State for Students
  const [studentSearch, setStudentSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  // Filtered student list
  const filteredStudents = studentFreelancers.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          student.college.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesSkill = skillFilter === '' || student.skills.some(skill => 
      skill.toLowerCase().includes(skillFilter.toLowerCase())
    );
    return matchesSearch && matchesSkill;
  });

  return (
    <div className={`dashboard-root ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* Decorative Blur Spheres */}
      <div className="dash-blur-1"></div>
      <div className="dash-blur-2"></div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-expanded' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-symbol">
            <span>CL</span>
          </div>
          <div className="logo-text">
            <h3>Campus<span className="accent-text">Lance</span></h3>
            <span className="user-role-badge">Client Portal</span>
          </div>
          <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <BarChart3 size={18} />
            <span>Statistics & Feed</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'create-task' ? 'active' : ''}`}
            onClick={() => handleTabChange('create-task')}
          >
            <PlusCircle size={18} />
            <span>Create Task</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'manage-tasks' ? 'active' : ''}`}
            onClick={() => handleTabChange('manage-tasks')}
          >
            <Briefcase size={18} />
            <span>Manage Tasks</span>
            <span className="badge-count">{tasks.filter(t => t.status === 'Open' || t.status === 'In Progress').length}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
          >
            <Users size={18} />
            <span>Talent Directory</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => handleTabChange('payments')}
          >
            <CreditCard size={18} />
            <span>Payments Ledger</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <Settings size={18} />
            <span>Update Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="sidebar-user-footer">
          <div className="footer-avatar">
            {clientProfile.name.charAt(0)}
          </div>
          <div className="footer-user-info">
            <h4 className="truncate">{clientProfile.name}</h4>
            <p className="truncate">{clientProfile.companyName || 'Campus Client'}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="dashboard-main-content">
        
        {/* TOP BAR / HEADER */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="breadcrumb-trail">
              <span>Home</span>
              <ChevronDown size={14} className="bc-separator" />
              <span className="current-page">
                {activeTab === 'overview' && 'Statistics & Feed'}
                {activeTab === 'create-task' && 'Create Task'}
                {activeTab === 'manage-tasks' && 'Manage Tasks'}
                {activeTab === 'students' && 'Talent Directory'}
                {activeTab === 'payments' && 'Payments & Escrow'}
                {activeTab === 'profile' && 'Update Profile'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Dark Mode toggle */}
            <button 
              className="theme-toggle-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>

            {/* Notification Dropdown */}
            <div className="notification-wrapper">
              <button className="icon-badge-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={20} />
                <span className="dot-indicator"></span>
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown-menu">
                  <div className="nd-header">
                    <h4>Notifications</h4>
                    <span>2 New</span>
                  </div>
                  <div className="nd-body">
                    <div className="nd-item unread">
                      <div className="nd-icon blue"><Users size={14} /></div>
                      <div className="nd-text">
                        <p><strong>Liam Chen</strong> applied to your project: Setup MongoDB API.</p>
                        <span>5 minutes ago</span>
                      </div>
                    </div>
                    <div className="nd-item unread">
                      <div className="nd-icon green"><DollarSign size={14} /></div>
                      <div className="nd-text">
                        <p>Milestone payment of $225 for Glassmorphic Landing Page secured in escrow.</p>
                        <span>3 hours ago</span>
                      </div>
                    </div>
                    <div className="nd-item">
                      <div className="nd-icon purple"><CheckCircle size={14} /></div>
                      <div className="nd-text">
                        <p>Your profile verification completed successfully.</p>
                        <span>Yesterday</span>
                      </div>
                    </div>
                  </div>
                  <div className="nd-footer">
                    <button onClick={() => setNotificationsOpen(false)}>Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            {/* User Widget */}
            <div className="user-profile-header-widget" onClick={() => handleTabChange('profile')}>
              <div className="widget-avatar">
                {clientProfile.name.charAt(0)}
              </div>
              <div className="widget-details">
                <h5>{clientProfile.name}</h5>
                <span>{clientProfile.industryOrWorkType || 'Hiring Client'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* SCREEN VIEWS CONTAINER */}
        <div className="dashboard-content-viewport">
          
          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & STATISTICS                                   */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="screen-fade-in dashboard-overview-screen">
              
              <div className="overview-hero">
                <div className="hero-text">
                  <h1>Welcome back, <span className="gradient-text">{clientProfile.name}</span>!</h1>
                  <p>Here's a strategic summary of your campus projects, budgets, and student freelancer activities.</p>
                </div>
                <div className="quick-action-cta">
                  <button className="btn-primary" onClick={() => setActiveTab('create-task')}>
                    <PlusCircle size={16} /> Post a New Task
                  </button>
                </div>
              </div>

              {/* STATS METRIC GRID */}
              <div className="stats-metric-grid">
                <div className="metric-card bg-glass">
                  <div className="metric-header">
                    <div className="metric-icon-wrap blue">
                      <Briefcase size={20} />
                    </div>
                    <span className="metric-percentage pos">+15% vs last month</span>
                  </div>
                  <div className="metric-body">
                    <h2>{totalTasksCount}</h2>
                    <p>Total Tasks Posted</p>
                  </div>
                </div>

                <div className="metric-card bg-glass">
                  <div className="metric-header">
                    <div className="metric-icon-wrap green">
                      <Users size={20} />
                    </div>
                    <span className="metric-percentage pos">Active Match</span>
                  </div>
                  <div className="metric-body">
                    <h2>{totalStudentsGivenWork}</h2>
                    <p>Students Given Work</p>
                  </div>
                </div>

                <div className="metric-card bg-glass">
                  <div className="metric-header">
                    <div className="metric-icon-wrap gold">
                      <DollarSign size={20} />
                    </div>
                    <span className="metric-percentage">Milestone Escrow</span>
                  </div>
                  <div className="metric-body">
                    <h2>{"$" + tasks.reduce((sum, t) => sum + t.budget, 0)}</h2>
                    <p>Total Project Budget</p>
                  </div>
                </div>

                <div className="metric-card bg-glass">
                  <div className="metric-header">
                    <div className="metric-icon-wrap purple">
                      <TrendingUp size={20} />
                    </div>
                    <span className="metric-percentage pos">Top Matching</span>
                  </div>
                  <div className="metric-body">
                    <h2>{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0}%</h2>
                    <p>Contract Complete Rate</p>
                  </div>
                </div>

              </div>



              {/* QUICK LIST OF HIRED STUDENT FREELANCERS */}
              <div className="hired-students bg-glass">
                <div className="hired-students-header">
                  <div>
                    <h3>Active Hired Student Freelancers</h3>
                    <p>Students currently handling your contract milestones</p>
                  </div>
                  <button className="btn-secondary" onClick={() => setActiveTab('students')}>
                    Browse More Students <ArrowRight size={14} />
                  </button>
                </div>

                <div className="hired-cards-scroller">
                  {studentFreelancers.slice(0, 2).map((freelancer) => (
                    <div className="hired-card" key={freelancer.id}>
                      <img src={freelancer.avatarUrl} alt={freelancer.name} className="hired-avatar" />
                      <div className="hired-details">
                        <h4>{freelancer.name}</h4>
                        <span className="school">{freelancer.college}</span>
                        <div className="hired-substats">
                          <span className="rating"><Star size={12} fill="gold" stroke="gold" /> {freelancer.rating}</span>
                          <span className="rate">${freelancer.hourlyRate}/hr</span>
                        </div>
                      </div>
                      <div className="hired-milestone-status">
                        <span className="badge-status progress">Milestone 1 Active</span>
                        <p className="milestone-desc">Delivery due in 4 days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CREATE TASK                                             */}
          {/* ============================================================== */}
          {activeTab === 'create-task' && (
            <div className="screen-fade-in create-task-screen">
              <div className="screen-title-banner">
                <h1>Post a New Task for Students</h1>
                <p>Describe your project parameters, outline necessary skills, define budgets, and post your gig directly to verified university boards.</p>
              </div>

              {taskCreationMessage && (
                <div className="alert-success">
                  <CheckCircle size={18} />
                  <span>{taskCreationMessage}</span>
                </div>
              )}

              <div className="create-task-grid">
                
                {/* Create Task Form */}
                <form className="task-creation-form bg-glass" onSubmit={handleCreateTaskSubmit}>
                  <h3>Task Parameters</h3>
                  
                  <div className="form-group-dash">
                    <label>Task Title</label>
                    <input 
                      type="text" 
                      name="title" 
                      placeholder="e.g. Build modern React Native login page with bio authentication"
                      value={taskForm.title} 
                      onChange={handleTaskChange} 
                      required 
                    />
                  </div>

                  <div className="form-row-dash">
                    <div className="form-group-dash">
                      <label>Category</label>
                      <select name="category" value={taskForm.category} onChange={handleTaskChange}>
                        <option value="Development">Development</option>
                        <option value="Design">Design / UI/UX</option>
                        <option value="Writing">Writing / SEO</option>
                        <option value="Marketing">Marketing / Ads</option>
                        <option value="Video & Media">Video & Media</option>
                      </select>
                    </div>

                    <div className="form-group-dash">
                      <label>Payment Budget ($)</label>
                      <input 
                        type="number" 
                        name="budget" 
                        placeholder="e.g. 350"
                        value={taskForm.budget} 
                        onChange={handleTaskChange} 
                        required 
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-row-dash">
                    <div className="form-group-dash">
                      <label>Target Deadline</label>
                      <input 
                        type="date" 
                        name="deadline" 
                        value={taskForm.deadline} 
                        onChange={handleTaskChange} 
                        required 
                      />
                    </div>

                    <div className="form-group-dash">
                      <label>Required Skills (Comma separated)</label>
                      <input 
                        type="text" 
                        name="skills" 
                        placeholder="e.g. React, CSS Gradients, API Integration"
                        value={taskForm.skills} 
                        onChange={handleTaskChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group-dash">
                    <label>Detailed Specifications</label>
                    <textarea 
                      name="description" 
                      rows={5}
                      placeholder="Clearly define project goals, expected deliverables, and how milestones will be tested. Note that student developers will view this detail text in full."
                      value={taskForm.description} 
                      onChange={handleTaskChange} 
                      required
                    ></textarea>
                  </div>

                  <div className="form-actions-dash">
                    <button type="submit" className="btn-primary">
                      <Send size={16} /> Publish Task to Campus Feed
                    </button>
                  </div>
                </form>

                {/* Real-time Interactive Job Preview (Wow factor) */}
                <div className="task-preview-sidebar">
                  <div className="sticky-preview-wrapper bg-glass">
                    <div className="preview-header">
                      <Sparkles size={16} className="sparkle-icon" />
                      <h4>Live Student Feed Preview</h4>
                      <span className="live-pill">LIVE PREVIEW</span>
                    </div>

                    <div className="student-feed-card-mock">
                      <div className="sf-card-header">
                        <div>
                          <span className="sf-category">{taskForm.category}</span>
                          <h4 className="sf-title">{taskForm.title || 'Draft: Untitled Project Task'}</h4>
                        </div>
                        <span className="sf-budget">${taskForm.budget || '0.00'}</span>
                      </div>

                      <p className="sf-description">
                        {taskForm.description || 'Provide details on the left. University student freelancers will see your complete project description details here...'}
                      </p>

                      <div className="sf-metadata">
                        <div className="sf-meta-item">
                          <Calendar size={12} />
                          <span>Due: {taskForm.deadline || 'MM/DD/YYYY'}</span>
                        </div>
                        <div className="sf-meta-item">
                          <Building size={12} />
                          <span>{clientProfile.companyName || 'Campus Client'}</span>
                        </div>
                      </div>

                      <div className="sf-skills-list">
                        {taskForm.skills ? (
                          taskForm.skills.split(',').map((skill, index) => (
                            <span key={index} className="sf-skill-tag">{skill.trim()}</span>
                          ))
                        ) : (
                          <span className="sf-skill-tag-placeholder">Add skills to generate tags</span>
                        )}
                      </div>

                      <div className="sf-card-footer">
                        <div className="client-identity">
                          <div className="client-mock-avatar">
                            {clientProfile.name.charAt(0)}
                          </div>
                          <div>
                            <h6>{clientProfile.name}</h6>
                            <span>⭐ New Client</span>
                          </div>
                        </div>
                        <button type="button" className="btn-sf-mock" disabled>Apply Now</button>
                      </div>
                    </div>

                    <div className="preview-explanation">
                      <Info size={14} />
                      <p>This widget demonstrates exactly what students see inside their client dashboard feeds when applying.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: MANAGE TASKS                                            */}
          {/* ============================================================== */}
          {activeTab === 'manage-tasks' && (
            <div className="screen-fade-in manage-tasks-screen">
              <div className="screen-title-banner">
                <h1>Manage Your Posted Gigs</h1>
                <p>Track project work statuses, finalize milestones, approve active deliverables, and close projects once finished.</p>
              </div>

              <div className="manage-tasks-list bg-glass">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Project Task</th>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td>
                            <div className="table-task-info">
                              <span className="task-id-tag">{task.id}</span>
                              <h4 className="table-title">{task.title}</h4>
                              <p className="table-desc truncate">{task.description}</p>
                            </div>
                          </td>
                          <td>
                            <span className="table-cat-badge">{task.category}</span>
                          </td>
                          <td>
                            <span className="table-price">${task.budget}</span>
                          </td>
                          <td>
                            <div className="table-date">
                              <Calendar size={14} />
                              <span>{task.deadline}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge-status ${
                              task.status === 'Open' ? 'open' : 
                              task.status === 'In Progress' ? 'progress' : 
                              task.status === 'Completed' ? 'completed' : 'draft'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {task.status === 'In Progress' && (
                                <>
                                  <button 
                                    className="btn-table-action" 
                                    style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                                    onClick={() => handleChatWithStudent(task)}
                                  >
                                    Chat with Student
                                  </button>
                                  <button 
                                    className="btn-table-action" 
                                    style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', borderColor: '#7c3aed', color: '#fff', fontWeight: 600 }}
                                    onClick={() => handleCloseAndCompleteTask(task.id)}
                                  >
                                    Finalize & Close
                                  </button>
                                </>
                              )}
                              {task.status === 'Completed' && (
                                <button 
                                  className="btn-table-action" 
                                  style={{ background: 'rgba(167, 139, 250, 0.12)', borderColor: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa', cursor: 'default' }}
                                  disabled
                                >
                                  Project Closed
                                </button>
                              )}
                              {task.status !== 'In Progress' && task.status !== 'Completed' && (
                                <button className="btn-table-action" onClick={() => handleOpenReviewModal(task)}>
                                  Review {task.applicants > 0 ? `(${task.applicants})` : ''}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: TALENT DIRECTORY                                         */}
          {/* ============================================================== */}
          {activeTab === 'students' && (
            <div className="screen-fade-in talent-directory-screen">
              <div className="screen-title-banner">
                <h1>Discover Student Freelancers</h1>
                <p>Scan verified portfolios, filter by essential languages/skills, inspect past ratings, and initiate chat invites.</p>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="talent-search-bar bg-glass">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by student name or college..." 
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="filter-input-wrapper">
                  <Filter size={18} />
                  <input 
                    type="text" 
                    placeholder="Filter by skill (e.g. React, Python, Figma)..." 
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* STUDENT CARDS GRID */}
              <div className="student-freelancers-grid">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div className="student-profile-card bg-glass" key={student.id}>
                      
                      <div className="student-card-header">
                        <img src={student.avatarUrl} alt={student.name} className="student-card-avatar" />
                        <div className="student-card-meta">
                          <span className="match-score-badge">{student.matchScore}% Match</span>
                          <h4>{student.name}</h4>
                          <p className="college-name truncate">{student.college}</p>
                          <span className="academic-year">{student.year}</span>
                        </div>
                      </div>

                      <div className="student-card-rating-row">
                        <div className="rating-pill">
                          <Star size={14} fill="gold" stroke="gold" />
                          <span>{student.rating}</span>
                          <span className="reviews">({student.reviewsCount} reviews)</span>
                        </div>
                        <div className="rate-info">
                          <span className="value">${student.hourlyRate}</span>
                          <span className="unit">/hr</span>
                        </div>
                      </div>

                      <div className="student-card-skills">
                        {student.skills.map((skill, i) => (
                          <span className="skill-tag" key={i}>{skill}</span>
                        ))}
                      </div>

                      <div className="student-card-stats">
                        <div className="sub-stat">
                          <span className="stat-val">{student.completedGigs}</span>
                          <span className="stat-lbl">Jobs Done</span>
                        </div>
                        <div className="vertical-divider"></div>
                        <div className="sub-stat">
                          <span className="stat-val">100%</span>
                          <span className="stat-lbl">Success Rate</span>
                        </div>
                      </div>

                      <div className="student-card-actions">
                        <button className="btn-invite" style={{ width: '100%' }}>Invite to Project</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results bg-glass">
                    <Info size={36} />
                    <h3>No student freelancers found matching your criteria</h3>
                    <p>Try resetting filters or adjusting search queries to locate campus candidates.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PAYMENTS LEDGER                                          */}
          {/* ============================================================== */}
          {/* ============================================================== */}
          {/* TAB 5: PAYMENTS LEDGER                                          */}
          {/* ============================================================== */}
          {activeTab === 'payments' && (
            <div className="screen-fade-in payments-screen">
              <div className="screen-title-banner">
                <h1>Payments & Milestone Escrow Ledger</h1>
                <p>CampusLance holds funds securely in third-party escrow at start of contract milestones. Approve completed code/assets to release payment.</p>
              </div>

              <div className="ledger-financial-summary">
                <div className="financial-card bg-glass border-glow-green">
                  <div className="fin-icon green"><DollarSign size={24} /></div>
                  <div className="fin-details">
                    <span>Released to Students</span>
                    <h2>${clientApplications.filter(a => a.paymentStatus === 'Released').reduce((sum, curr) => sum + (curr.taskId?.budget || 0), 0).toFixed(2)}</h2>
                    <p>{clientApplications.filter(a => a.paymentStatus === 'Released').length} Complete Transactions</p>
                  </div>
                </div>

                <div className="financial-card bg-glass border-glow-blue">
                  <div className="fin-icon blue"><Clock size={24} /></div>
                  <div className="fin-details">
                    <span>Held in Escrow Safeguard</span>
                    <h2>${clientApplications.filter(a => a.paymentStatus === 'Held in Escrow').reduce((sum, curr) => sum + (curr.taskId?.budget || 0), 0).toFixed(2)}</h2>
                    <p>{clientApplications.filter(a => a.paymentStatus === 'Held in Escrow').length} Hired Gigs Active</p>
                  </div>
                </div>

                <div className="financial-card bg-glass border-glow-gold">
                  <div className="fin-icon gold"><ShieldCheck size={24} /></div>
                  <div className="fin-details">
                    <span>Escrow Account Shield</span>
                    <h2>Active</h2>
                    <p>100% Milestone Protection</p>
                  </div>
                </div>
              </div>

              {/* TRANSACTIONS LEDGER TABLE */}
              <div className="transactions-list bg-glass">
                <div className="ledger-header">
                  <h3>Transaction Records</h3>
                  <button className="btn-secondary flex-btn"><Sliders size={14} /> Live Sync Enabled</button>
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Project Milestone</th>
                        <th>Student Freelancer</th>
                        <th>Milestone Amount</th>
                        <th>Escrow Status</th>
                        <th>Transaction Date</th>
                        <th>Milestone Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientApplications.filter(a => a.status === 'Hired').map((app) => (
                        <tr key={app._id}>
                          <td className="mono-text" style={{ fontSize: '12px' }}>CL-TXN-{app._id.slice(-4).toUpperCase()}</td>
                          <td>
                            <strong>{app.taskId?.title || 'Untitled milestone'}</strong>
                            {app.deliverables?.submittedAt && (
                              <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px', fontSize: '12px', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 4px', color: 'var(--dash-text-h)' }}><strong>✓ Deliverables Submitted:</strong></p>
                                <p style={{ margin: '0 0 4px' }}>"{app.deliverables.description}"</p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                                  <a href={app.deliverables.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="10" width="10" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                                      <path d="M9 18c-4.51 2-5-2-7-2"></path>
                                    </svg>{' '}
                                    GitHub <ExternalLink size={8} />
                                  </a>
                                  {app.deliverables.videoUrl && (
                                    <a href={app.deliverables.videoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <Video size={10} /> Video Demo <ExternalLink size={8} />
                                    </a>
                                  )}
                                </div>
                                {app.deliverables.screenshots && app.deliverables.screenshots.length > 0 && (
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    {app.deliverables.screenshots.map((src: string, sIdx: number) => (
                                      <img 
                                        key={sIdx} 
                                        src={src} 
                                        alt="screenshot" 
                                        style={{ width: '50px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                        onClick={() => window.open(src)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>{app.studentName}</td>
                          <td>
                            <span className="price-bold">${app.taskId?.budget || 0}</span>
                          </td>
                          <td>
                            <span className={`escrow-status-pill ${
                              app.paymentStatus === 'Released' ? 'released' :
                              app.paymentStatus === 'Held in Escrow' ? 'escrow' : 'unpaid'
                            }`} style={app.paymentStatus !== 'Released' && app.paymentStatus !== 'Held in Escrow' ? { background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' } : undefined}>
                              {app.paymentStatus === 'Released' && <Check size={12} />}
                              {app.paymentStatus === 'Held in Escrow' && <Clock size={12} />}
                              {app.paymentStatus || 'Unpaid'}
                            </span>
                          </td>
                          <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                          <td>
                            {app.paymentStatus === 'Held in Escrow' ? (
                              <button 
                                className="btn-table-action" 
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#059669', color: '#fff', fontWeight: 600 }}
                                onClick={() => handleReleaseEscrow(app._id)}
                              >
                                Approve & Release Payout
                              </button>
                            ) : app.paymentStatus === 'Released' ? (
                              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600 }}>✓ Released to Bank</span>
                            ) : (
                              <button 
                                className="btn-table-action" 
                                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderColor: '#2563eb', color: '#fff', fontWeight: 600 }}
                                onClick={() => handlePayProject(app)}
                              >
                                Pay & Fund Escrow
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {clientApplications.filter(a => a.status === 'Hired').length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                            <p style={{ margin: 0, color: 'var(--dash-text)' }}>No ongoing hired milestone transactions found. Hire candidates to start escrow contracts.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: UPDATE PROFILE                                           */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <div className="screen-fade-in profile-update-screen">
              <div className="screen-title-banner">
                <h1>Edit Your Client Profile</h1>
                <p>Modify corporate identifiers, contact phone strings, or business industry sectors. Changes persist immediately to databases.</p>
              </div>

              <div className="profile-form-grid">
                
                {/* Left: Input Form */}
                <form className="client-profile-form bg-glass" onSubmit={handleProfileSubmit}>
                  <h3>Account Credentials</h3>
                  
                  {loadingProfile ? (
                    <div className="loading-spinner-dash">
                      <p>Loading database credentials...</p>
                    </div>
                  ) : (
                    <>
                      <div className="form-group-dash">
                        <label>Full Contact Name</label>
                        <div className="input-icon-wrapper-dash">
                          <User size={16} />
                          <input 
                            type="text" 
                            name="name" 
                            value={profileForm.name} 
                            onChange={handleProfileChange} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-row-dash">
                        <div className="form-group-dash">
                          <label>Work Email Address</label>
                          <div className="input-icon-wrapper-dash">
                            <Mail size={16} />
                            <input 
                              type="email" 
                              name="email" 
                              value={profileForm.email} 
                              onChange={handleProfileChange} 
                              required 
                            />
                          </div>
                        </div>

                        <div className="form-group-dash">
                          <label>Mobile Contact Number</label>
                          <div className="input-icon-wrapper-dash">
                            <Phone size={16} />
                            <input 
                              type="tel" 
                              name="mobileNumber" 
                              value={profileForm.mobileNumber} 
                              onChange={handleProfileChange} 
                              required 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-row-dash">
                        <div className="form-group-dash">
                          <label>Company / Organization Name</label>
                          <div className="input-icon-wrapper-dash">
                            <Building size={16} />
                            <input 
                              type="text" 
                              name="companyName" 
                              placeholder="Optional, e.g. Acme Labs"
                              value={profileForm.companyName} 
                              onChange={handleProfileChange} 
                            />
                          </div>
                        </div>

                        <div className="form-group-dash">
                          <label>Industry or Business Work Type</label>
                          <div className="input-icon-wrapper-dash">
                            <Briefcase size={16} />
                            <input 
                              type="text" 
                              name="industryOrWorkType" 
                              placeholder="e.g. Technology, Education"
                              value={profileForm.industryOrWorkType} 
                              onChange={handleProfileChange} 
                              required 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-actions-dash">
                        <button type="submit" className="btn-primary" disabled={savingProfile}>
                          {savingProfile ? 'Persisting to Database...' : 'Save Settings Changes'}
                        </button>
                      </div>
                    </>
                  )}
                </form>

                {/* Right: Premium Corporate Badge Card */}
                <div className="profile-badge-card bg-glass">
                  <div className="badge-card-design">
                    <div className="badge-card-blur"></div>
                    <div className="badge-identity">
                      <div className="corp-avatar">
                        {clientProfile.name.charAt(0)}
                      </div>
                      <div className="corp-meta">
                        <h2>{clientProfile.name}</h2>
                        <span className="corp-label">VERIFIED HIRER</span>
                      </div>
                    </div>

                    <div className="badge-details-grid">
                      <div className="bd-item">
                        <span className="bd-lbl">Organization</span>
                        <h5 className="bd-val">{clientProfile.companyName || 'Not Provided'}</h5>
                      </div>
                      <div className="bd-item">
                        <span className="bd-lbl">Email Contact</span>
                        <h5 className="bd-val truncate">{clientProfile.email || 'Not Provided'}</h5>
                      </div>
                      <div className="bd-item">
                        <span className="bd-lbl">Mobile Phone</span>
                        <h5 className="bd-val">{clientProfile.mobileNumber || 'Not Provided'}</h5>
                      </div>
                      <div className="bd-item">
                        <span className="bd-lbl">Sector Industry</span>
                        <span className="bd-sector-badge">{clientProfile.industryOrWorkType || 'Not Provided'}</span>
                      </div>
                    </div>

                    <div className="badge-card-footer">
                      <div className="trust-stamp">
                        <ShieldCheck size={14} className="green-stamp" />
                        <span>University Escrow Connected</span>
                      </div>
                      <span className="member-since">Since {new Date().getFullYear()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </main>

      {/* ============================================================== */}
      {/* REVIEW APPLICANTS MODAL                                        */}
      {/* ============================================================== */}
      {showReviewModal && reviewingTask && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content-wrapper bg-glass" style={{ width: '90%', maxWidth: '700px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--dash-text)', cursor: 'pointer' }} onClick={() => setShowReviewModal(false)}>
              <X size={20} />
            </button>

            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <span className="table-cat-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>REVIEW GIG APPLICATIONS</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '20px', color: 'var(--dash-text-h)' }}>{reviewingTask.title}</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>Total budget allocated for escrow: <strong style={{ color: '#10b981' }}>${reviewingTask.budget}</strong></p>
            </div>

            <div style={{ marginTop: '20px' }}>
              {loadingApplicants ? (
                <p style={{ textAlign: 'center' }}>Querying student applications...</p>
              ) : taskApplicants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {taskApplicants.map((app) => (
                    <div key={app._id} className="bg-glass" style={{ padding: '16px', border: '1px solid var(--dash-border)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 2px', fontSize: '15px', color: 'var(--dash-text-h)' }}>{app.studentName}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>
                            {app.studentCollege} • {app.studentYear}
                          </span>
                        </div>
                        <div>
                          <span className={`badge-status ${app.status.toLowerCase()}`}>
                            {app.status}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '13px', lineHeight: '145%', marginBottom: '12px' }}>
                        <p style={{ margin: 0 }}>"{app.proposal}"</p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {app.projectLinks && app.projectLinks.map((link: any, idx: number) => (
                            <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {link.title} <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>

                        {app.status === 'Pending' && (
                          <button 
                            className="btn-sf-mock"
                            style={{ padding: '6px 14px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleHireStudent(app._id)}
                          >
                            Hire Student Freelancer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <Info size={24} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                  <p style={{ margin: 0 }}>No applications submitted for this task yet. Students can view and apply inside their student portal feed!</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--dash-border)' }}>
              <button className="btn-secondary-dash" onClick={() => setShowReviewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Glassmorphic Milestone Chat Drawer */}
      <ChatDrawer
        userId={userId}
        userRole={userRole}
        userName={clientProfile.name}
        activeChatSession={activeChatSession}
        onClearActiveChatSession={() => setActiveChatSession(null)}
      />

    </div>
  );
};

export default ClientDashboard;
