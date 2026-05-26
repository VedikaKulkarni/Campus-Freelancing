export type Tab = 'overview' | 'explore' | 'applications' | 'portfolio' | 'ledger' | 'ongoing' | 'completed';

export interface ProjectLink {
  title: string;
  url: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  mobileNumber: string;
  schoolOrCollegeName: string;
  classOrYear: string;
  enrollmentNumber: string;
  skills: string[];
  bio: string;
  projectLinks: ProjectLink[];
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  idCardImage?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  skillsRequired: string[];
  clientId: string;
  clientName: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Draft';
  applicants: number;
  createdAt?: string;
}

export interface DeliverableSubmission {
  githubUrl: string;
  description: string;
  screenshots: string[];
  videoUrl: string;
  submittedAt: string | null;
}

export interface Application {
  _id: string;
  taskId: any; // populated or object
  proposal: string;
  projectLinks: ProjectLink[];
  status: 'Pending' | 'Interviewing' | 'Hired' | 'Rejected';
  appliedAt: string;
  paymentStatus?: 'Unpaid' | 'Held in Escrow' | 'Released' | 'Refunded';
  deliverables?: DeliverableSubmission;
}
