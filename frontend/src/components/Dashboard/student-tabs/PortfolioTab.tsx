import React from 'react';
import { ExternalLink, Trash2, Plus } from 'lucide-react';
import type { StudentProfile } from './types';
import { API_BASE_URL } from '../../../config';

interface PortfolioTabProps {
  studentProfile: StudentProfile;
  profileForm: StudentProfile;
  loadingProfile: boolean;
  savingProfile: boolean;
  handleProfileChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleProfileSubmit: (e: React.FormEvent) => void;
  setProfileForm: React.Dispatch<React.SetStateAction<StudentProfile>>;
  handleAddProjectLink: (e: React.FormEvent) => void;
  handleDeleteLink: (indexToDelete: number) => void;
  newLinkTitle: string;
  setNewLinkTitle: (val: string) => void;
  newLinkUrl: string;
  setNewLinkUrl: (val: string) => void;
  onStripeOnboard?: () => void;
  onProfileUpdate?: (updatedProfile: StudentProfile) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  studentProfile,
  profileForm,
  loadingProfile,
  savingProfile,
  handleProfileChange,
  handleProfileSubmit,
  setProfileForm,
  handleAddProjectLink,
  handleDeleteLink,
  newLinkTitle,
  setNewLinkTitle,
  newLinkUrl,
  setNewLinkUrl,
  onStripeOnboard,
  onProfileUpdate
}) => {
  const [reuploading, setReuploading] = React.useState(false);
  const [newIdCard, setNewIdCard] = React.useState('');
  const [newIdCardName, setNewIdCardName] = React.useState('');

  const handleReuploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewIdCardName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewIdCard(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdCard) {
      alert('Please select an ID Card image to upload.');
      return;
    }

    setReuploading(true);
    const userId = sessionStorage.getItem('userId');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/student/reupload/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardImage: newIdCard })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'ID Card re-uploaded successfully!');
        if (data.student && onProfileUpdate) {
          onProfileUpdate(data.student);
        }
        setNewIdCard('');
        setNewIdCardName('');
      } else {
        alert(`Verification Failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Re-upload failed:', err);
      alert('Network error. Failed to connect to server.');
    } finally {
      setReuploading(false);
    }
  };

  return (
    <div className="screen-fade-in portfolio-screen">
      <div className="screen-title-banner">
        <h1>Edit Professional Student Portfolio</h1>
        <p>Highlight your technical skills, college credentials, update bios, and upload permanent project/github links for hiring clients to scan.</p>
      </div>

      <div className="portfolio-grid">
        
        {/* Left side: Credentials & Bio Form */}
        <form className="portfolio-form bg-glass" onSubmit={handleProfileSubmit}>
          <h3>Account Portfolio Details</h3>
          <p>Credentials that persist to verified student directory searches.</p>

          {/* Verification Status Alerts */}
          {studentProfile.verificationStatus === 'verified' && (
            <div style={{
              margin: '12px 0 20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎉 <strong>Verification Status:</strong> Verified Student Account (ID Approved)
            </div>
          )}

          {studentProfile.verificationStatus === 'pending' && (
            <div style={{
              margin: '12px 0 20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 <strong>Verification Status:</strong> Processing Automated OCR Validation...
            </div>
          )}

          {studentProfile.verificationStatus === 'rejected' && (
            <div style={{
              margin: '12px 0 20px',
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ❌ Verification Rejected
              </div>
              <p style={{ margin: '0 0 12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12.5px', lineHeight: '1.4' }}>
                {studentProfile.rejectionReason || 'The uploaded student ID card could not be validated. Make sure your name and college match exactly.'}
              </p>
              
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Re-upload Clear ID Card Image
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    textAlign: 'center',
                    color: newIdCard ? '#ef4444' : 'rgba(255, 255, 255, 0.5)',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {newIdCardName ? `Selected: ${newIdCardName}` : 'Choose new ID image...'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleReuploadChange} 
                    />
                  </label>
                  <button 
                    type="button"
                    onClick={handleReuploadSubmit}
                    disabled={reuploading || !newIdCard}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: newIdCard ? 'pointer' : 'not-allowed',
                      opacity: newIdCard ? 1 : 0.5,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {reuploading ? 'Processing...' : 'Verify Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loadingProfile ? (
            <p>Loading database credentials...</p>
          ) : (
            <>
              <div className="form-group-dash">
                <label>Full Representative Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={profileForm.name} 
                  onChange={handleProfileChange}
                  required 
                />
              </div>

              <div className="form-row-dash">
                <div className="form-group-dash">
                  <label>Verified Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={profileForm.email} 
                    onChange={handleProfileChange}
                    required 
                  />
                </div>

                <div className="form-group-dash">
                  <label>Contact Phone Number</label>
                  <input 
                    type="tel" 
                    name="mobileNumber" 
                    value={profileForm.mobileNumber} 
                    onChange={handleProfileChange}
                    required 
                  />
                </div>
              </div>

              <div className="form-row-dash">
                <div className="form-group-dash">
                  <label>University / School Name</label>
                  <input 
                    type="text" 
                    name="schoolOrCollegeName" 
                    value={profileForm.schoolOrCollegeName} 
                    onChange={handleProfileChange}
                    required 
                  />
                </div>

                <div className="form-group-dash">
                  <label>Class Year</label>
                  <input 
                    type="text" 
                    name="classOrYear" 
                    value={profileForm.classOrYear} 
                    onChange={handleProfileChange}
                    placeholder="e.g. 4th Year, Graduate Student"
                    required 
                  />
                </div>
              </div>

              <div className="form-group-dash">
                <label>Portfolio Biography Statement</label>
                <textarea 
                  name="bio" 
                  rows={4}
                  value={profileForm.bio} 
                  onChange={handleProfileChange}
                  placeholder="Summarize your coding skills, core design values, and what kind of campus freelancing contracts you want to execute."
                ></textarea>
              </div>

              <div className="form-group-dash">
                <label>Technical Language Skills (Comma separated tags)</label>
                <input 
                  type="text" 
                  name="skills" 
                  value={Array.isArray(profileForm.skills) ? profileForm.skills.join(', ') : profileForm.skills} 
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g. React, TypeScript, Python, Figma"
                />
              </div>

              <button type="submit" className="btn-primary-dash" style={{ marginTop: '10px' }} disabled={savingProfile}>
                {savingProfile ? 'Saving database credentials...' : 'Update Portfolio Credentials'}
              </button>
            </>
          )}
        </form>

        {/* Right side: Project Links manager */}
        <div className="portfolio-links-card bg-glass">
          <h3>My Uploaded Projects & Repos</h3>
          <p>Add URLs to live applications, design profiles, or GitHub repos to bind into submissions.</p>

          <div className="portfolio-links-list">
            {profileForm.projectLinks.length > 0 ? (
              profileForm.projectLinks.map((link, idx) => (
                <div className="portfolio-link-card-row" key={idx}>
                  <div>
                    <h5>{link.title}</h5>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.url} <ExternalLink size={10} />
                    </a>
                  </div>
                  <button className="btn-delete-link" onClick={() => handleDeleteLink(idx)} title="Remove Link">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--dash-text)' }}>No links uploaded yet. Add links below.</span>
            )}
          </div>

          {/* Add Link Inline Form */}
          <form className="add-link-form-inline" onSubmit={handleAddProjectLink}>
            <h5 style={{ margin: '0 0 6px', color: 'var(--dash-text-h)', fontSize: '13px' }}>Upload New Project Link</h5>
            
            <div className="form-group-dash" style={{ marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Link Title (e.g. GitHub Repository)" 
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group-dash" style={{ marginBottom: '10px' }}>
              <input 
                type="url" 
                placeholder="Link URL (e.g. https://github.com/...)" 
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-secondary-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Plus size={14} /> Upload Link
            </button>
          </form>

          {/* Stripe Connect Card */}
          <div className="stripe-connect-card" style={{
            marginTop: '24px',
            padding: '20px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <h4 style={{ margin: '0 0 8px', color: 'var(--dash-text-h)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Secure Stripe Payouts Setup
            </h4>
            
            {studentProfile.stripeOnboardingComplete ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>✓ Bank Account Linked Successfully via Stripe Express!</strong>
                </p>
                <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>
                  You are fully enabled to receive real-time direct deposit payouts when clients approve your milestones.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--dash-text)' }}>
                  Set up your debit card or checking bank details to accept secure milestone escrow payouts from clients.
                </p>
                
                <button 
                  type="button" 
                  onClick={onStripeOnboard} 
                  className="btn-primary-dash"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 600,
                    width: '100%',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Connect Bank via Stripe Express
                </button>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' }}>
                  Onboarding is processed securely by Stripe. No setup fees.
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
