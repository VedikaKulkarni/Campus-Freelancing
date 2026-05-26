import React from 'react';
import { 
  Search, 
  Sliders, 
  Filter, 
  Calendar, 
  CheckCircle, 
  Info 
} from 'lucide-react';
import type { Task, Application } from './types';

interface ExploreTabProps {
  tasks: Task[];
  applications: Application[];
  loadingTasks: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  skillFilter: string;
  setSkillFilter: (val: string) => void;
  handleOpenApplyModal: (task: Task) => void;
  studentProfile?: any;
}

export const ExploreTab: React.FC<ExploreTabProps> = ({
  tasks,
  applications,
  loadingTasks,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  skillFilter,
  setSkillFilter,
  handleOpenApplyModal,
  studentProfile
}) => {
  // Explore Filter Actions
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesSkill = !skillFilter.trim() || 
                         task.skillsRequired.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    return matchesSearch && matchesCategory && matchesSkill && task.status === 'Open';
  });

  return (
    <div className="screen-fade-in explore-screen">
      <div className="screen-title-banner">
        <h1>Browse Verified Student Gigs</h1>
        <p>Scan live tasks posted by clients inside your college ecosystem, apply immediately with custom proposal text, and bind escrow payments securely.</p>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="explore-search-bar bg-glass">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by gig title or keyword specifications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-input-wrapper">
          <Sliders size={18} />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Development">Development</option>
            <option value="Design">Design / UI/UX</option>
            <option value="Writing">Writing / SEO</option>
            <option value="Marketing">Marketing / Ads</option>
          </select>
        </div>

        <div className="filter-input-wrapper">
          <Filter size={18} />
          <input 
            type="text" 
            placeholder="Filter by skill tag..." 
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
          />
        </div>
      </div>

      {/* GIG CARDS GRID */}
      {loadingTasks ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading campus board gigs...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="gigs-grid">
          {filteredTasks.map((task) => {
            const alreadyApplied = applications.some(app => {
              if (!app.taskId) return false;
              const appId = typeof app.taskId === 'object' ? app.taskId._id : app.taskId;
              return appId === task._id;
            });
            return (
              <div className="gig-card bg-glass" key={task._id}>
                <div className="gig-card-header">
                  <span className="gig-category">{task.category}</span>
                  <span className="gig-budget">${task.budget}</span>
                </div>

                <div>
                  <h4 className="gig-title">{task.title}</h4>
                  <h6 className="gig-client">Posted by: <strong>{task.clientName || 'Campus Client'}</strong></h6>
                  <p className="gig-desc">{task.description}</p>
                  
                  <div className="gig-skills-list">
                    {task.skillsRequired.map((skill, index) => (
                      <span key={index} className="gig-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="gig-card-footer">
                  <span className="gig-deadline">
                    <Calendar size={12} />
                    Due: {task.deadline}
                  </span>

                  {alreadyApplied ? (
                    <span className="applied-status-badge">
                      <CheckCircle size={14} className="icon-success" />
                      <span>Applied</span>
                    </span>
                  ) : studentProfile && studentProfile.verificationStatus !== 'verified' ? (
                    <button 
                      className="btn-apply-gig disabled-verification"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        color: 'rgba(255, 255, 255, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'not-allowed',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      title={`Cannot apply: Account verification status is "${studentProfile.verificationStatus || 'pending'}"`}
                      disabled
                    >
                      🔒 Lock Pending
                    </button>
                  ) : (
                    <button 
                      className="btn-apply-gig"
                      onClick={() => handleOpenApplyModal(task)}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-glass" style={{ padding: '40px', textAlign: 'center' }}>
          <Info size={36} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
          <h4>No active gigs found matching criteria</h4>
          <p>Check back later or adjust filters to explore further opportunities.</p>
        </div>
      )}
    </div>
  );
};
