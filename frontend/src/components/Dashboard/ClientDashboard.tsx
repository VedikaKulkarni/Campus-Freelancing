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
  ExternalLink
} from 'lucide-react';
import './ClientDashboard.css';
import { ChatDrawer } from '../Chat/ChatDrawer';

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

interface Transaction {
  id: string;
  taskTitle: string;
  freelancerName: string;
  amount: number;
  status: 'In Escrow' | 'Released' | 'Refunding';
  date: string;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  // Local storage credentials
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  // Load Profile from Backend
  useEffect(() => {
    if (!userId || userRole !== 'client') {
      // If not logged in as a client, fallback or redirect
      console.warn('Unauthorized access to client dashboard, loading mocks');
      setClientProfile({
        name: 'Jane Cooper',
        email: 'jane.cooper@startup.co',
        mobileNumber: '+1 (555) 382-9018',
        companyName: 'Nova Technologies LLC',
        industryOrWorkType: 'Software Development',
      });
      setProfileForm({
        name: 'Jane Cooper',
        email: 'jane.cooper@startup.co',
        mobileNumber: '+1 (555) 382-9018',
        companyName: 'Nova Technologies LLC',
        industryOrWorkType: 'Software Development',
      });
      setLoadingProfile(false);
      return;
    }

    const fetchClientProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await fetch(`http://localhost:5000/api/auth/client/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setClientProfile(data);
          setProfileForm(data);
        } else {
          console.error('Failed to fetch backend profile, using mock fallbacks');
          // Fallback mocks
          setClientProfile({
            name: 'Jane Cooper',
            email: localStorage.getItem('userEmail') || 'jane.cooper@startup.co',
            mobileNumber: '+1 (555) 382-9018',
            companyName: 'Nova Technologies LLC',
            industryOrWorkType: 'Software Development',
          });
          setProfileForm({
            name: 'Jane Cooper',
            email: localStorage.getItem('userEmail') || 'jane.cooper@startup.co',
            mobileNumber: '+1 (555) 382-9018',
            companyName: 'Nova Technologies LLC',
            industryOrWorkType: 'Software Development',
          });
        }
      } catch (err) {
        console.error('Network error fetching client profile, using mock fallbacks', err);
        setClientProfile({
          name: 'Jane Cooper',
          email: localStorage.getItem('userEmail') || 'jane.cooper@startup.co',
          mobileNumber: '+1 (555) 382-9018',
          companyName: 'Nova Technologies LLC',
          industryOrWorkType: 'Software Development',
        });
        setProfileForm({
          name: 'Jane Cooper',
          email: localStorage.getItem('userEmail') || 'jane.cooper@startup.co',
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

  // Load client's tasks from database
  useEffect(() => {
    if (!userId || userRole !== 'client') return;

    const fetchClientTasks = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/client/${userId}`);
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
        const response = await fetch('http://localhost:5000/api/auth/students');
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
      const response = await fetch(`http://localhost:5000/api/auth/client/${userId}`, {
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
      const response = await fetch('http://localhost:5000/api/tasks', {
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
      const response = await fetch(`http://localhost:5000/api/applications/task/${task.id}`);
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

  // Hire student action
  const handleHireStudent = async (appId: string) => {
    if (!userId) {
      alert('Hired Student (Simulated Session)! Application status updated to Hired.');
      setTaskApplicants(taskApplicants.map(a => a._id === appId ? { ...a, status: 'Hired' } : a));
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Hired' })
      });
      if (response.ok) {
        alert('Student successfully Hired! Escrow payment has been designated.');
        if (reviewingTask) {
          const fresh = await fetch(`http://localhost:5000/api/applications/task/${reviewingTask.id}`);
          if (fresh.ok) {
            const data = await fresh.json();
            setTaskApplicants(data);
          }
          // Update local tasks
          setTasks(tasks.map(t => t.id === reviewingTask.id ? { ...t, status: 'In Progress' } : t));
        }
      } else {
        alert('Failed to update student applicant status.');
      }
    } catch (err) {
      console.error('Error hiring student:', err);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    alert('Logged out successfully.');
    navigate('/');
  };

  const handleChatWithStudent = async (task: Task) => {
    try {
      const response = await fetch(`http://localhost:5000/api/applications/task/${task.id}`);
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

              {/* GRID: CHARTS AND ACTIVE GIGS */}
              <div className="dashboard-overview-split">
                
                {/* Visual Chart Card */}
                <div className="overview-chart-card bg-glass">
                  <div className="card-top-title">
                    <div>
                      <h3>Analytics Overview</h3>
                      <p>Budget Allocation and Task Performance</p>
                    </div>
                    <div className="chart-legend">
                      <span className="legend-dot green"></span> Spent
                      <span className="legend-dot blue"></span> Escrow
                    </div>
                  </div>

                  {/* High Fidelity CSS/SVG Analytics Graph */}
                  <div className="visual-graphic-container">
                    <div className="graphic-y-axis">
                      <span>$1k</span>
                      <span>$500</span>
                      <span>$0</span>
                    </div>
                    <div className="graphic-plot-area">
                      {/* Grid Lines */}
                      <div className="grid-line line-1"></div>
                      <div className="grid-line line-2"></div>
                      <div className="grid-line line-3"></div>

                      {/* SVG Line & Area charts */}
                      <svg viewBox="0 0 500 150" className="chart-svg">
                        <defs>
                          <linearGradient id="chart-grad-1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                          </linearGradient>
                          <linearGradient id="chart-grad-2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path d="M 0 100 Q 125 40, 250 80 T 500 20 L 500 150 L 0 150 Z" fill="url(#chart-grad-1)" />
                        {/* Line */}
                        <path d="M 0 100 Q 125 40, 250 80 T 500 20" fill="none" stroke="var(--accent)" strokeWidth="3" />
                        
                        {/* Data point circles */}
                        <circle cx="125" cy="62" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                        <circle cx="250" cy="80" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                        <circle cx="375" cy="50" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                      </svg>

                      {/* Bar Indicators */}
                      <div className="bar-plots">
                        <div className="bar-set" style={{height: '70%'}}>
                          <div className="sub-bar val-spent"></div>
                          <div className="sub-bar val-escrow"></div>
                        </div>
                        <div className="bar-set" style={{height: '85%'}}>
                          <div className="sub-bar val-spent"></div>
                          <div className="sub-bar val-escrow"></div>
                        </div>
                        <div className="bar-set" style={{height: '50%'}}>
                          <div className="sub-bar val-spent"></div>
                          <div className="sub-bar val-escrow"></div>
                        </div>
                        <div className="bar-set" style={{height: '92%'}}>
                          <div className="sub-bar val-spent"></div>
                          <div className="sub-bar val-escrow"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="graphic-x-axis">
                    <span>Jan/Feb</span>
                    <span>Mar/Apr</span>
                    <span>May (Current)</span>
                    <span>Jun (Projected)</span>
                  </div>
                </div>

                {/* Recent Activities Panel */}
                <div className="overview-activity bg-glass">
                  <div className="card-top-title">
                    <h3>Recent Activity</h3>
                    <p>Timeline of events on your profile</p>
                  </div>

                  <div className="activity-timeline-feed">
                    <div className="timeline-item">
                      <div className="t-badge open"></div>
                      <div className="t-content">
                        <h5>Figma UI/UX Mockups posted</h5>
                        <p>Budget: $320 • Target: Design Freelancers</p>
                        <span className="t-time">Just now</span>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className="t-badge progress"></div>
                      <div className="t-content">
                        <h5>Milestone funded for Landing Page</h5>
                        <p>Alex Rivera started work on UI development</p>
                        <span className="t-time">3 hours ago</span>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className="t-badge completed"></div>
                      <div className="t-content">
                        <h5>Payment Released ($500)</h5>
                        <p>Paid Liam Chen for MongoDB API & Authentication</p>
                        <span className="t-time">2 days ago</span>
                      </div>
                    </div>
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
                        min="20"
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
                <p>Track student applications, inspect work statuses, approve active milestone deliverables, and view project summaries.</p>
              </div>

              <div className="manage-tasks-list bg-glass">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Project Task</th>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Applicants</th>
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
                            <div className="applicants-cell">
                              <span className="applicant-num">{task.applicants}</span>
                              <span className="applicants-text">applied</span>
                            </div>
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
                            {task.status === 'In Progress' || task.status === 'Completed' ? (
                              <button 
                                className="btn-table-action" 
                                style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                                onClick={() => handleChatWithStudent(task)}
                              >
                                Chat with Student
                              </button>
                            ) : (
                              <button className="btn-table-action" onClick={() => handleOpenReviewModal(task)}>
                                Review {task.applicants > 0 ? `(${task.applicants})` : ''}
                              </button>
                            )}
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
                    <h2>$500.00</h2>
                    <p>1 Fully Complete Contract</p>
                  </div>
                </div>

                <div className="financial-card bg-glass border-glow-blue">
                  <div className="fin-icon blue"><Clock size={24} /></div>
                  <div className="fin-details">
                    <span>Held in Escrow Safeguard</span>
                    <h2>$375.00</h2>
                    <p>2 Active Projects</p>
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
                  <button className="btn-secondary flex-btn"><Sliders size={14} /> Filter Columns</button>
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
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id}>
                          <td className="mono-text">{txn.id}</td>
                          <td>
                            <strong>{txn.taskTitle}</strong>
                          </td>
                          <td>{txn.freelancerName}</td>
                          <td>
                            <span className="price-bold">${txn.amount.toFixed(2)}</span>
                          </td>
                          <td>
                            <span className={`escrow-status-pill ${
                              txn.status === 'Released' ? 'released' :
                              txn.status === 'In Escrow' ? 'escrow' : 'refunding'
                            }`}>
                              {txn.status === 'Released' && <Check size={12} />}
                              {txn.status === 'In Escrow' && <Clock size={12} />}
                              {txn.status}
                            </span>
                          </td>
                          <td>{txn.date}</td>
                        </tr>
                      ))}
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
