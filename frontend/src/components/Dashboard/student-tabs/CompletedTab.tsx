import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import type { Application, Tab } from './types';

interface CompletedTabProps {
  applications: Application[];
  setActiveTab: (tab: Tab) => void;
}

export const CompletedTab: React.FC<CompletedTabProps> = ({
  applications,
  setActiveTab
}) => {
  const completedApps = applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'Completed');

  return (
    <div className="screen-fade-in completed-screen">
      <div className="screen-title-banner">
        <h1>Completed Projects</h1>
        <p>View your completed milestone gigs, released escrows, and submitted code repository records.</p>
      </div>

      <div className="manage-tasks-list bg-glass" style={{ padding: '24px' }}>
        {completedApps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {completedApps.map((app) => (
              <div key={app._id} className="bg-glass-card" style={{
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid var(--dash-border)',
                background: 'rgba(255, 255, 255, 0.01)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                  background: '#a78bfa'
                }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ textAlign: 'left', flex: 1, minWidth: '280px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: 'var(--dash-text-h)' }}>
                      {app.taskId?.title || 'Completed Project'}
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: '1.5', color: 'var(--dash-text)' }}>
                      {app.taskId?.description || 'No description provided.'}
                    </p>
                    
                    {app.deliverables?.githubUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--dash-text)', fontWeight: 500 }}>GitHub Repository:</span>
                        <a 
                          href={app.deliverables.githubUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                        >
                          {app.deliverables.githubUrl} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right', minWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600, display: 'inline-block', marginBottom: '4px' }}>
                      PAID & SETTLED
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>Revenue Paid</span>
                    <span style={{ fontSize: '26px', fontWeight: 700, color: '#10b981' }}>
                      ${app.taskId?.budget || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Info size={40} style={{ color: '#a78bfa', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--dash-text-h)' }}>No completed projects yet</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--dash-text)' }}>
              Complete active contracts, submit your deliverables, and receive platform releases to populate this list!
            </p>
            <button className="btn-primary-dash" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }} onClick={() => setActiveTab('ongoing')}>
              Manage Ongoing Projects
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
