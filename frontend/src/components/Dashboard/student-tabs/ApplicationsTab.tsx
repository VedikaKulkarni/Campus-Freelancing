import React from 'react';
import { Calendar, ExternalLink, Info } from 'lucide-react';
import type { Application } from './types';

interface ApplicationsTabProps {
  applications: Application[];
  loadingApps: boolean;
}

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  applications,
  loadingApps
}) => {
  return (
    <div className="screen-fade-in applications-screen">
      <div className="screen-title-banner">
        <h1>Submitted Application Status</h1>
        <p>Track bids, review proposal letters, check client review state, and verify milestones before initiating escrow agreements.</p>
      </div>

      <div className="manage-tasks-list bg-glass">
        {loadingApps ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <p>Loading application center...</p>
          </div>
        ) : applications.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Bid Amount</th>
                  <th>Apply Date</th>
                  <th>Project Links Sent</th>
                  <th>Status Badge</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <strong>{app.taskId?.title || 'Simulated Gig'}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>${app.taskId?.budget || 0}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Calendar size={14} />
                        <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {app.projectLinks && app.projectLinks.length > 0 ? (
                          app.projectLinks.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '12px', textDecoration: 'none' }}>
                              {link.title} <ExternalLink size={10} />
                            </a>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--dash-text)' }}>None Attached</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge-status ${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Info size={30} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
            <h4>You have not applied for any campus gigs yet</h4>
            <p>Visit the Explore Gigs tab to review projects and make your first submission!</p>
          </div>
        )}
      </div>
    </div>
  );
};
