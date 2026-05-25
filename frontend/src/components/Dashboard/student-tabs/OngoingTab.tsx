import React, { useState } from 'react';
import { Calendar, ExternalLink, Info, X, Image, Video, CheckCircle } from 'lucide-react';
import type { Application, Tab } from './types';

interface OngoingTabProps {
  applications: Application[];
  setActiveTab: (tab: Tab) => void;
  onChatWithClient: (clientId: string, clientName: string, taskId: string, taskTitle: string) => void;
  onReloadApplications?: () => void;
}

export const OngoingTab: React.FC<OngoingTabProps> = ({
  applications,
  setActiveTab,
  onChatWithClient,
  onReloadApplications
}) => {
  const hiredApps = applications.filter(a => a.status === 'Hired' && a.taskId?.status === 'In Progress');

  // Submit Deliverables Modal state
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submittingApp, setSubmittingApp] = useState<Application | null>(null);
  
  // Submission Form States
  const [githubUrl, setGithubUrl] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle screenshots multi-upload & base64 conversion
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const convertPromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(convertPromises);
      setScreenshots((prev) => [...prev, ...results]);
    } catch (err) {
      console.error('Screenshot conversion failed:', err);
    }
  };

  // Remove screenshot from list
  const handleRemoveScreenshot = (indexToRemove: number) => {
    setScreenshots((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Open submission modal
  const handleOpenSubmission = (app: Application) => {
    setSubmittingApp(app);
    setGithubUrl(app.deliverables?.githubUrl || '');
    setDescription(app.deliverables?.description || '');
    setScreenshots(app.deliverables?.screenshots || []);
    setVideoUrl(app.deliverables?.videoUrl || '');
    setSubmissionModalOpen(true);
  };

  // Submit Deliverables API
  const handleSubmitDeliverables = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingApp) return;

    if (!githubUrl.trim() || !description.trim()) {
      alert('Please fill out the GitHub URL and description specifications.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/applications/${submittingApp._id}/submit-deliverables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl,
          description,
          screenshots,
          videoUrl
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert('🎉 Deliverables submitted successfully! The hiring client has been notified to review and release your escrow payout.');
        setSubmissionModalOpen(false);
        if (onReloadApplications) onReloadApplications();
      } else {
        alert(`Submission failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Submit deliverables error:', err);
      alert('Failed to connect to deliverables server.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      onClick={() => handleOpenSubmission(app)}
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

      {/* ============================================================== */}
      {/* SUBMISSION MODAL OVERLAY                                       */}
      {/* ============================================================== */}
      {submissionModalOpen && submittingApp && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content-wrapper bg-glass" style={{ width: '90%', maxWidth: '650px', padding: '30px', position: 'relative' }}>
            <button className="modal-close-btn" style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--dash-text)', cursor: 'pointer' }} onClick={() => setSubmissionModalOpen(false)}>
              <X size={20} />
            </button>

            <div className="modal-header" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <span className="table-cat-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>MILESTONE DELIVERABLE DELIVERY</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '20px', color: 'var(--dash-text-h)' }}>{submittingApp.taskId?.title}</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>Milestone Escrow Funds locked: <strong style={{ color: '#10b981' }}>${submittingApp.taskId?.budget}</strong></p>
            </div>

            <form onSubmit={handleSubmitDeliverables} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              
              <div className="form-group-dash">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>{' '}
                  GitHub Repository Link
                </label>
                <input 
                  type="url" 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo" 
                  required
                />
              </div>

              <div className="form-group-dash">
                <label>Submission Description & Spec details</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core engineering additions, outline how the client can test the deliverables, and mention any key milestones completed..."
                  required
                ></textarea>
              </div>

              <div className="form-group-dash">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Video size={14} /> Optional Video / Demo Link</label>
                <input 
                  type="url" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. YouTube loom demo link, or drive URL" 
                />
              </div>

              <div className="form-group-dash">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Image size={14} /> Optional Work Screenshots</label>
                <div style={{
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--dash-text)' }}>Click to upload multiple work screenshots</span>
                </div>

                {screenshots.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {screenshots.map((src, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '50px' }}>
                        <img 
                          src={src} 
                          alt={`upload-${idx}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveScreenshot(idx)}
                          style={{
                            position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary-dash" onClick={() => setSubmissionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-dash" style={{ background: '#10b981', borderColor: '#10b981' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting Deliverables...' : 'Deliver & Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
