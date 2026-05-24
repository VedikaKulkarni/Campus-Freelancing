import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Code, 
  Paintbrush, 
  BookOpen, 
  MessageSquare, 
  DollarSign, 
  Users, 
  Menu, 
  X, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-container">
      {/* Decorative Blur Background Elements */}
      <div className="bg-blur blur-1"></div>
      <div className="bg-blur blur-2"></div>
      <div className="bg-blur blur-3"></div>

      {/* HEADER / NAVBAR */}
      <header className="landing-navbar">
        <div className="nav-logo">
          <GraduationCap className="logo-icon" />
          <span>Campus<span className="gradient-text-alt">Lance</span></span>
        </div>

        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#categories" onClick={() => setMobileMenuOpen(false)}>Categories</a>
          <a href="#trust" onClick={() => setMobileMenuOpen(false)}>Trust & Security</a>
          
          <div className="nav-auth-mobile">
            <Link to="/auth?mode=signin" className="nav-btn signin-btn" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/auth?mode=signup" className="nav-btn signup-btn" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
          </div>
        </nav>

        <div className="nav-auth-desktop">
          <Link to="/auth?mode=signin" className="nav-btn signin-btn">Sign In</Link>
          <Link to="/auth?mode=signup" className="nav-btn signup-btn">Get Started</Link>
        </div>

        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Award size={16} className="badge-icon" />
            <span>The #1 Campus Freelancing Marketplace</span>
          </div>
          <h1>
            Unleash <span className="gradient-text">Campus Talent</span>.<br />
            Earn while you learn.
          </h1>
          <p>
            Bridging highly skilled, verified campus student freelancers with businesses and clients who want high-quality, cost-effective solutions.
          </p>
          <div className="hero-ctas">
            <Link to="/auth?mode=signup&role=student" className="cta-primary">
              Start Freelancing <ArrowRight size={18} />
            </Link>
            <Link to="/auth?mode=signup&role=client" className="cta-secondary">
              Hire a Student
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card main-visual">
            <div className="card-header-visual">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
            </div>
            <div className="card-body-visual">
              <div className="placeholder-code-lines">
                <div className="line l1"></div>
                <div className="line l2"></div>
                <div className="line l3"></div>
                <div className="line l4"></div>
              </div>
            </div>
          </div>

          {/* Floating Glassmorphic Metric Cards */}
          <div className="floating-card stat-card-1">
            <div className="stat-icon-wrapper blue">
              <Users size={20} />
            </div>
            <div>
              <h4>5,000+</h4>
              <p>Active Students</p>
            </div>
          </div>

          <div className="floating-card stat-card-2">
            <div className="stat-icon-wrapper green">
              <DollarSign size={20} />
            </div>
            <div>
              <h4>$250k+</h4>
              <p>Student Earnings</p>
            </div>
          </div>

          <div className="floating-card stat-card-3">
            <div className="stat-icon-wrapper purple">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4>100%</h4>
              <p>ID Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE STATS BAR */}
      <section className="stats-bar">
        <div className="stat-item">
          <h3>98%</h3>
          <p>Client Satisfaction</p>
        </div>
        <div className="divider"></div>
        <div className="stat-item">
          <h3>24 Hours</h3>
          <p>Average Match Time</p>
        </div>
        <div className="divider"></div>
        <div className="stat-item">
          <h3>100% Safe</h3>
          <p>Milestone Safeguards</p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Designed for Both Sides of the Marketplace</h2>
          <p>Whether you want to build a career or scale your operations, CampusLance provides the tools.</p>
        </div>

        <div className="features-grid">
          {/* For Students Card */}
          <div className="feature-perspective-card student-perspective">
            <div className="perspective-header">
              <GraduationCap className="perspective-icon" />
              <h3>For Student Freelancers</h3>
            </div>
            <ul className="perspective-list">
              <li>
                <div className="icon-bullet"><Briefcase size={16} /></div>
                <div>
                  <h4>Build a Real Portfolio</h4>
                  <p>Skip generic exercises. Work on real-world projects that get noticed by future recruiters.</p>
                </div>
              </li>
              <li>
                <div className="icon-bullet"><DollarSign size={16} /></div>
                <div>
                  <h4>Earn While You Learn</h4>
                  <p>Flexible gigs that fit seamlessly around your class lectures, study sessions, and exams.</p>
                </div>
              </li>
              <li>
                <div className="icon-bullet"><TrendingUp size={16} /></div>
                <div>
                  <h4>Industry Mentorship</h4>
                  <p>Connect with startups and developers who provide guidance and reference letters.</p>
                </div>
              </li>
            </ul>
            <Link to="/auth?mode=signup&role=student" className="perspective-btn student-btn">
              Apply as Freelancer <ChevronRight size={16} />
            </Link>
          </div>

          {/* For Clients Card */}
          <div className="feature-perspective-card client-perspective">
            <div className="perspective-header">
              <Briefcase className="perspective-icon" />
              <h3>For Clients & Hirees</h3>
            </div>
            <ul className="perspective-list">
              <li>
                <div className="icon-bullet"><Zap size={16} /></div>
                <div>
                  <h4>Cost-Effective Talent</h4>
                  <p>Get professional work on a budget tailored for startups, small businesses, and academic research.</p>
                </div>
              </li>
              <li>
                <div className="icon-bullet"><Users size={16} /></div>
                <div>
                  <h4>Fresh Innovation</h4>
                  <p>Harness the latest technologies taught in universities directly in your commercial applications.</p>
                </div>
              </li>
              <li>
                <div className="icon-bullet"><ShieldCheck size={16} /></div>
                <div>
                  <h4>Verified Student Gigs</h4>
                  <p>Every student is verified using their university student ID card before being allowed to take gigs.</p>
                </div>
              </li>
            </ul>
            <Link to="/auth?mode=signup&role=client" className="perspective-btn client-btn">
              Post a Project <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section id="categories" className="categories-section">
        <div className="section-header">
          <h2>Explore Dynamic Categories</h2>
          <p>Find the exact expertise you require across core development and creative fields.</p>
        </div>

        <div className="categories-grid">
          <div className="category-card">
            <Code className="cat-icon color-1" />
            <h3>Web & App Development</h3>
            <p>React, Node.js, Python, Flutter, Tailwind CSS integrations</p>
          </div>
          <div className="category-card">
            <Paintbrush className="cat-icon color-2" />
            <h3>Graphic & UI/UX Design</h3>
            <p>Figma prototyping, logos, brand guides, marketing assets</p>
          </div>
          <div className="category-card">
            <BookOpen className="cat-icon color-3" />
            <h3>Content & Copywriting</h3>
            <p>Blog writing, academic research, SEO copywriting, pitch decks</p>
          </div>
          <div className="category-card">
            <MessageSquare className="cat-icon color-4" />
            <h3>Digital Marketing</h3>
            <p>Social media campaigns, community management, newsletter ads</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2>Streamlined Marketplace Workflow</h2>
          <p>Our interactive pipeline makes collaborating effortless and transparent.</p>
        </div>

        <div className="timeline">
          <div className="timeline-step">
            <div className="step-number">1</div>
            <h3>Quick Registration</h3>
            <p>Students upload their academic credentials (like student ID cards). Clients set up their business profile.</p>
          </div>
          <div className="timeline-arrow"><ArrowRight size={24} /></div>
          <div className="timeline-step">
            <div className="step-number">2</div>
            <h3>Post & Match</h3>
            <p>Clients outline projects and budgets. Smart algorithms match the most qualified campus specialists.</p>
          </div>
          <div className="timeline-arrow"><ArrowRight size={24} /></div>
          <div className="timeline-step">
            <div className="step-number">3</div>
            <h3>Safe Collaboration</h3>
            <p>Use escrow milestone payments. Work is verified and approved step-by-step prior to fund releases.</p>
          </div>
        </div>
      </section>

      {/* TRUST & SECURITY */}
      <section id="trust" className="trust-section">
        <div className="trust-content">
          <h2>We Take Trust & Security Seriously</h2>
          <p>
            CampusLance is built with safeguards that protect both student freelancers and hiring clients throughout every collaboration.
          </p>

          <div className="trust-bullets">
            <div className="trust-bullet">
              <ShieldCheck className="trust-icon" />
              <div>
                <h3>Student Credential Verification</h3>
                <p>Every student freelancer goes through rigorous manual verification of their university enrollment ID card to prevent fraud and ensure academic compliance.</p>
              </div>
            </div>

            <div className="trust-bullet">
              <DollarSign className="trust-icon" />
              <div>
                <h3>Milestone Escrow Payments</h3>
                <p>Funds are held securely in escrow at the start of a milestone, and only released once the client approves the completed work, protecting both parties.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="cta-banner">
        <div className="cta-banner-content">
          <h2>Ready to transform your campus journey?</h2>
          <p>Join the next generation of talented student freelancers and innovative businesses starting today.</p>
          <div className="cta-banner-buttons">
            <Link to="/auth?mode=signup" className="cta-banner-primary">Get Started Now</Link>
            <Link to="/auth?mode=signin" className="cta-banner-secondary">Access Account</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="nav-logo">
              <GraduationCap className="logo-icon" />
              <span>Campus<span className="gradient-text-alt">Lance</span></span>
            </div>
            <p>Empowering student potential through real-world opportunities.</p>
          </div>

          <div className="footer-links-group">
            <div>
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#categories">Explore Gigs</a>
            </div>
            <div>
              <h4>Security</h4>
              <a href="#trust">Student Verification</a>
              <a href="#trust">Payment Safety</a>
              <a href="#trust">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CampusLance Inc. All rights reserved. Built with passion for campus communities.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
