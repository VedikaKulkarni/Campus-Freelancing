import React from 'react';
import { 
  Briefcase, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Info 
} from 'lucide-react';
import type { StudentProfile, Application, Tab } from './types';

interface OverviewTabProps {
  studentProfile: StudentProfile;
  applications: Application[];
  totalEarnings: number;
  setActiveTab: (tab: Tab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  studentProfile,
  applications,
  totalEarnings,
  setActiveTab
}) => {
  return (
    <div className="screen-fade-in overview-screen">
      <div className="overview-hero">
        <div className="hero-text">
          <h1>Welcome Back, {studentProfile.name}!</h1>
          <p>Check campus boards for new opportunities, track submitted project bids, and expand your freelancing portfolio.</p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-metric-grid">
        <div className="metric-card bg-glass" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('applications')}>
          <div className="metric-header">
            <div className="metric-icon-wrap blue">
              <Briefcase size={20} />
            </div>
            <span className="metric-percentage pos">Active Bids</span>
          </div>
          <div className="metric-body">
            <h2>{applications.length}</h2>
            <p>Total Gigs Applied</p>
          </div>
        </div>

        <div className="metric-card bg-glass" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ongoing')}>
          <div className="metric-header">
            <div className="metric-icon-wrap green">
              <CheckCircle size={20} />
            </div>
            <span className="metric-percentage pos">Success Hired</span>
          </div>
          <div className="metric-body">
            <h2>{applications.filter(a => a.status === 'Hired').length}</h2>
            <p>Contracts Completed / Active</p>
          </div>
        </div>

        <div className="metric-card bg-glass" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ledger')}>
          <div className="metric-header">
            <div className="metric-icon-wrap gold">
              <DollarSign size={20} />
            </div>
            <span className="metric-percentage">Milestone Earnings</span>
          </div>
          <div className="metric-body">
            <h2>${totalEarnings}</h2>
            <p>Total Revenue Released</p>
          </div>
        </div>

        <div className="metric-card bg-glass">
          <div className="metric-header">
            <div className="metric-icon-wrap purple">
              <TrendingUp size={20} />
            </div>
            <span className="metric-percentage pos">Top Match</span>
          </div>
          <div className="metric-body">
            <h2>98%</h2>
            <p>Portfolio Compatibility Score</p>
          </div>
        </div>
      </div>

      {/* ONGOING PROJECTS WIDGET */}
      <div className="hired-students bg-glass" style={{ marginBottom: '30px', padding: '24px' }}>
        <div className="hired-students-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: 'var(--dash-text-h)' }}>Ongoing Projects & Active Milestones</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>Milestone funds are securely held in escrow. Deliver tasks before the targeted deadline.</p>
          </div>
        </div>

        <div className="hired-cards-scroller" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.filter(a => a.status === 'Hired').length > 0 ? (
            applications.filter(a => a.status === 'Hired').map((app) => (
              <div className="hired-card" key={app._id} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                padding: '20px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--dash-border)', 
                borderRadius: '16px',
                textAlign: 'left',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 600, color: 'var(--dash-text-h)' }}>
                      {app.taskId?.title || 'Active Engineering Contract'}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>
                      Category: <strong>{app.taskId?.category || 'Development'}</strong>
                    </span>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className="badge-status hired" style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>
                      IN PROGRESS
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> Target Due Date: <strong style={{ color: '#ef4444' }}>{app.taskId?.deadline || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: '12px 14px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px dashed var(--dash-border)', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--dash-text)',
                  lineHeight: '1.5'
                }}>
                  <strong>Project Details:</strong> {app.taskId?.description || 'No project specifications provided by the client.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingTop: '4px' }}>
                  <div>
                    <span style={{ color: 'var(--dash-text)' }}>Secure Escrow: </span>
                    <strong style={{ color: '#10b981', fontSize: '15px' }}>${app.taskId?.budget || 0}</strong>
                  </div>
                  <button 
                    onClick={() => setActiveTab('ongoing')}
                    className="btn-sf-mock"
                    style={{ 
                      padding: '5px 12px', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      border: '1px solid rgba(59, 130, 246, 0.2)', 
                      color: '#3b82f6', 
                      borderRadius: '6px', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Manage Deliverables
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--dash-border)', borderRadius: '12px' }}>
              <Info size={24} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
              <h5 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--dash-text-h)' }}>No active ongoing projects yet</h5>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--dash-text)' }}>Explore live gigs inside the campus board and submit proposals to begin earning milestone payouts!</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid split: Profile Card & Recent Bids */}
      <div className="dashboard-overview-split">
        
        {/* Visual Glassmorphic Profile Badge */}
        <div className="student-premium-profile-card bg-glass">
          <div className="profile-card-glow"></div>
          <div className="profile-avatar-large">
            {studentProfile.name.charAt(0)}
          </div>
          <h3 className="student-name-title">{studentProfile.name}</h3>
          <p className="student-college-sub">{studentProfile.schoolOrCollegeName} • {studentProfile.classOrYear}</p>
          
          <span className="student-year-badge">⭐ CAMPUS FREELANCER PRO</span>
          
          <p className="student-bio-quote">
            "{studentProfile.bio || 'Add a bio inside the Portfolio tab to help clients learn about your engineering specialities and interest.'}"
          </p>

          <div className="profile-skills-tags-wrap">
            {studentProfile.skills.map((skill, index) => (
              <span key={index} className="profile-skill-tag">{skill}</span>
            ))}
          </div>
        </div>

        {/* Recent Activities Timeline */}
        <div className="overview-chart-card bg-glass">
          <div className="card-top-title">
            <h3>Recent Bids Status</h3>
            <p>Timeline of your submitted campus project bids</p>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {applications.length > 0 ? (
              applications.slice(0, 3).map((app) => (
                <div key={app._id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: app.status === 'Hired' ? '#10b981' : app.status === 'Interviewing' ? '#3b82f6' : '#f59e0b',
                    marginTop: '4px'
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px', color: 'var(--dash-text-h)', fontSize: '14px' }}>
                      {app.taskId?.title || 'Untitled Gig'}
                    </h5>
                    <p style={{ margin: '0 0 4px', fontSize: '12px' }}>
                      Status: <strong style={{ textTransform: 'uppercase' }}>{app.status}</strong> • Budget: ${app.taskId?.budget || 0}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--dash-text)' }}>
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--dash-text)' }}>
                <Info size={24} style={{ marginBottom: '8px' }} />
                <p>No active applications submitted yet. Browse open gigs to begin!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
