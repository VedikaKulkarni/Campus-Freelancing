import React from 'react';
import { DollarSign, Clock, ShieldCheck, Check } from 'lucide-react';
import type { Application } from './types';

interface LedgerTabProps {
  applications: Application[];
  totalEarnings: number;
  activeEscrow: number;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  applications,
  totalEarnings,
  activeEscrow
}) => {
  return (
    <div className="screen-fade-in ledger-screen">
      <div className="screen-title-banner">
        <h1>Milestone Escrow & Earnings Ledger</h1>
        <p>View payments processed, trace held funds within third-party campus escrow shields, and inspect complete transaction history.</p>
      </div>

      <div className="earnings-financial-grid">
        <div className="earnings-financial-card bg-glass" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="earnings-fin-icon green">
            <DollarSign size={24} />
          </div>
          <div className="earnings-fin-details">
            <span>Revenue Released</span>
            <h2>${totalEarnings}.00</h2>
            <p>From completed milestone payouts</p>
          </div>
        </div>

        <div className="earnings-financial-card bg-glass" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="earnings-fin-icon blue">
            <Clock size={24} />
          </div>
          <div className="earnings-fin-details">
            <span>Active Escrow Target</span>
            <h2>${activeEscrow}.00</h2>
            <p>Held securely in safeguard vaults</p>
          </div>
        </div>

        <div className="earnings-financial-card bg-glass" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="earnings-fin-icon gold">
            <ShieldCheck size={24} />
          </div>
          <div className="earnings-fin-details">
            <span>Escrow Verification</span>
            <h2>Active</h2>
            <p>100% Student Protection Seal</p>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="earnings-transactions-list bg-glass">
        <div className="ledger-header">
          <h3>Payment Transaction History</h3>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction Code</th>
                <th>Associated Task</th>
                <th>Payout Amount</th>
                <th>Verification Status</th>
                <th>Date Processed</th>
              </tr>
            </thead>
            <tbody>
              {applications.filter(a => a.status === 'Hired' || a.paymentStatus === 'Held in Escrow' || a.paymentStatus === 'Released').map((app, idx) => {
                const status = app.paymentStatus || 'Unpaid';
                return (
                  <tr key={app._id}>
                    <td className="mono-text" style={{ fontSize: '12px' }}>CL-TXN-{status === 'Released' ? '98' : '21'}{idx}{idx + 2}</td>
                    <td>
                      <strong>{app.taskId?.title}</strong>
                    </td>
                    <td>
                      <strong style={{ color: status === 'Released' ? '#10b981' : status === 'Held in Escrow' ? '#3b82f6' : 'var(--dash-text)' }}>
                        ${app.taskId?.budget}
                      </strong>
                    </td>
                    <td>
                      {status === 'Released' && (
                        <span className="escrow-status-pill released">
                          <Check size={10} /> Payout Released
                        </span>
                      )}
                      {status === 'Held in Escrow' && (
                        <span className="escrow-status-pill escrow">
                          <Clock size={10} /> Held in Escrow
                        </span>
                      )}
                      {status === 'Unpaid' && (
                        <span className="escrow-status-pill awaiting" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <Clock size={10} /> Awaiting Escrow
                        </span>
                      )}
                    </td>
                    <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {applications.filter(a => a.status === 'Hired' || a.paymentStatus === 'Held in Escrow' || a.paymentStatus === 'Released').length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--dash-text)' }}>
                    No payment transactions or active escrow locks recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
