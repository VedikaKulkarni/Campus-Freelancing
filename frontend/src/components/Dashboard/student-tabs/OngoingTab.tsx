import React from 'react';
import { Calendar, ExternalLink, Info, CheckCircle } from 'lucide-react';
import type { Application, Tab } from './types';

interface OngoingTabProps {
  applications: Application[];
  setActiveTab: (tab: Tab) => void;
  onChatWithClient: (clientId: string, clientName: string, taskId: string, taskTitle: string) => void;
  onReloadApplications?: () => void;
  onOpenSubmission: (app: Application) => void;
}

export const OngoingTab: React.FC<OngoingTabProps> = ({
  applications,
  setActiveTab,
  onChatWithClient,
  onOpenSubmission
}) => {
  const hiredApps = applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'In Progress');

  return (
    <div className="screen-fade-in ongoing-screen">
      <div className="screen-title-banner">
        <h1>Ongoing Hired Projects</h1>
        <p>Manage your active hired gigs, view secure milestone escrows, track deadlines, and submit your final deliverables to get paid.</p>
      </div>

      <div className="manage-tasks-list bg-glass" style={{ padding: '24px' }}>
        {hiredApps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {hiredApps.map((app) => (
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
                  background: '#10b981'
                }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600, display: 'inline-block', marginBottom: '8px' }}>
                      ACTIVE CONTRACT IN PROGRESS
                    </span>
                    <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 600, color: 'var(--dash-text-h)' }}>
                      {app.taskId?.title || 'Active Engineering Contract'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--dash-text)' }}>
                      Category: <strong>{app.taskId?.category || 'Development'}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: 'var(--dash-text)' }}>Secure Escrowed Budget</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', margin: '4px 0' }}>
                      ${app.taskId?.budget || 0}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#ef4444', fontWeight: 500, justifyContent: 'flex-end' }}>
                      <Calendar size={14} /> Due Date: {app.taskId?.deadline || 'No deadline specified'}
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--dash-border)', margin: '16px 0' }} />

                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-h)' }}>Gig Description</h4>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--dash-text)' }}>
                    {app.taskId?.description || 'No description provided by the client.'}
                  </p>
                </div>

                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--dash-text-h)' }}>Your Bid Proposal Details</h4>
                  <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--dash-border)', borderRadius: '8px', fontSize: '13px', fontStyle: 'italic' }}>
                    "{app.proposal || 'No proposal text attached.'}"
                  </div>
                </div>

                {/* If deliverables are submitted, show dynamic completion details */}
                {app.deliverables?.submittedAt && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px 20px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '12px',
                    textAlign: 'left'
                  }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} /> Deliverables Submitted Successfully
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <p style={{ margin: 0, color: 'var(--dash-text)' }}>
                        <strong>GitHub Repository:</strong>{' '}
                        <a href={app.deliverables.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                          {app.deliverables.githubUrl} <ExternalLink size={12} style={{ display: 'inline' }} />
                        </a>
                      </p>
                      
                      {app.deliverables.videoUrl && (
                        <p style={{ margin: 0, color: 'var(--dash-text)' }}>
                          <strong>Demo Link/Video:</strong>{' '}
                          <a href={app.deliverables.videoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            {app.deliverables.videoUrl} <ExternalLink size={12} style={{ display: 'inline' }} />
                          </a>
                        </p>
                      )}

                      <p style={{ margin: 0, color: 'var(--dash-text)' }}>
                        <strong>Submission Specifications:</strong> "{app.deliverables.description}"
                      </p>

                      {app.deliverables.screenshots && app.deliverables.screenshots.length > 0 && (
                        <div>
                          <strong style={{ display: 'block', marginBottom: '8px' }}>Attached Screenshots:</strong>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {app.deliverables.screenshots.map((src, sIdx) => (
                              <img 
                                key={sIdx} 
                                src={src} 
                                alt={`screenshot-${sIdx}`}
                                style={{
                                  width: '100px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.1)'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <span style={{ fontSize: '11px', color: 'var(--dash-text)', marginTop: '4px' }}>
                        Submitted on: {new Date(app.deliverables.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h5 style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--dash-text)' }}>ATTACHED SUBMISSION REPOS:</h5>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {app.projectLinks && app.projectLinks.length > 0 ? (
                        app.projectLinks.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="badge-status" style={{
                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--dash-text-h)', border: '1px solid var(--dash-border)'
                          }}>
                            {link.title} <ExternalLink size={12} />
                          </a>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>No links attached to bid.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => onOpenSubmission(app)}
                      className="btn-primary-dash" 
                      style={{ background: '#10b981', borderColor: '#10b981', padding: '8px 16px', fontSize: '13px' }}
                    >
                      {app.deliverables?.submittedAt ? 'Update Deliverable' : 'Submit Deliverable'}
                    </button>
                    <button 
                      onClick={() => {
                        const taskId = app.taskId?._id || '';
                        const taskTitle = app.taskId?.title || 'Active Contract';
                        const clientId = app.taskId?.clientId || '';
                        const clientName = app.taskId?.clientName || 'Client';
                        if (clientId && taskId) {
                          onChatWithClient(clientId, clientName, taskId, taskTitle);
                        } else {
                          alert('Error: Hired contract metadata is incomplete.');
                        }
                      }}
                      className="btn-secondary-dash" 
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      Chat with Client
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Info size={40} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--dash-text-h)' }}>No active ongoing projects</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--dash-text)' }}>
              You haven't been hired for any contracts yet. Submit compelling proposals for live campus gigs to get hired!
            </p>
            <button className="btn-primary-dash" onClick={() => setActiveTab('explore')}>
              Explore Live Gigs Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
