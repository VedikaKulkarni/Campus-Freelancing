import React from 'react';
import { ExternalLink, Trash2, Plus } from 'lucide-react';
import type { StudentProfile } from './types';

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
  setNewLinkUrl
}) => {
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
        </div>

      </div>
    </div>
  );
};
