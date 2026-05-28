# 🎓 CampusLance

> **A Secure, Smart, and Real-Time Freelancing & Note-Sharing Platform Tailored for University Ecosystems.**

CampusLance is a premium, end-to-end web application that connects student freelancers with clients seeking high-quality university talent. The platform streamlines the entire lifecycle of a freelance contract—ranging from AI-driven student credentials verification to robust financial escrow protection, interactive collaboration suites, and a fully-featured peer study note marketplace.

---

## ✨ Features at a Glance

### 🔍 1. Automated AI Student ID Verification
* **OCR-Powered Verification**: Built-in **Tesseract.js** engine extracts text from student-uploaded physical ID cards.
* **Smart Validation Engine**: Automatically cross-references extracted text against registration profile details, specifically:
  * **Full Name Match**: Verifies matching character sequences in the student's name.
  * **Institution Match**: Validates the name of the school or college.
  * **Enrollment Number Match**: Checks the database enrollment code matches the ID card text.
* **Instant Email Domain Whitelisting**: Students registering with standard academic domains (`.edu`, `.ac.in`, `.edu.in`, `.res.in`) receive instant, automatic trusted status.
* **Graceful Rejection Handling**: Interactive re-upload functionality with detailed auto-generated rejection logs to prompt users for cleaner image submissions.

### 💳 2. Financial Protection with Stripe Escrow & Connect
* **Secure Milestone Escrow**: Prevents non-payment disputes by securely holding project budgets on the platform balance via **Stripe Checkout Sessions** before work begins.
* **Automated Connected Transfers**: Distributes payouts seamlessly to students using **Stripe Connect Express accounts**.
* **Smart Platform Revenue Model**: Deducts a **10% commission** from the payout (transfers 90% of the project budget to the student) upon client approval of deliverables.
* **Developer Simulation Mode**: Gracefully falls back to a sandbox/simulated Connect Express account setup if real Connect features are disabled on testing Stripe developer accounts, ensuring an uninterrupted local testing workflow.

### 💬 3. Real-Time Interactive Collaboration
* **WebSocket Chat Rooms**: Instant communication through **Socket.io** with separate virtual rooms mapped to active database conversations.
* **Milestone Sync Scheduling**: Clients can initiate and schedule review syncs directly inside the conversation drawer.
* **Custom Google Meet Generator**: Automatically constructs unique Google Meet codes dynamically.
* **Automated Nodemailer Sync Invites**: Seamlessly notifies student freelancers of scheduled sync milestones via beautifully styled HTML invite emails dispatched automatically.

### 📚 4. Peer-to-Peer Notes Marketplace *(New!)*
A premium academic library where students list and monetize their peer study templates, lecture notes, and formula sheets.
* **Dual High-Fidelity Previews**: 
  * **PDFs (`.pdf`)**: Drawn locally to a canvas and compiled into base64 images of the first two pages during upload.
  * **Word Documents (`.docx`)**: Decompressed client-side using **JSZip** to parse out paragraphs from `word/document.xml`, segmenting actual text lines into clean, readable mock preview sheets.
* **Copy Protection**: 
  * The full base64 file data payload is completely stripped by the backend GET routes and is only returned once purchased or owned.
  * Preview pages are embedded under an absolute-positioned **`PREVIEW VERSION • CAMPUSLANCE` diagonal watermark** overlay with `pointer-events: none` to safeguard against easy screenshot drag-saving.
* **Spacious In-Place Workspace**: 
  * Replaces standard cramped popup modals with a dedicated **Early-Return Full-Tab Document Viewer** inside the dashboard's right-hand workspace.
  * Provides a massive two-column document layout (`1fr 1.6fr`) with a large scrolling page canvas (`maxHeight: 72vh`) and deep scrolling sheets (`minHeight: 480px`).
* **Verified Buyer Reviews**: Integrated feedback pipeline allowing verified buyers of notes to leave star ratings and course feedback.

---

## 🎨 Design System: Cosmic Galactic Theme *(New!)*

CampusLance features a high-end, responsive dark theme meticulously engineered to look beautiful in **both low and high screen brightness levels**:

* **Optimized Canvas Color Contrast**: Switched the background to a faint, soft cosmic violet-slate (`#151423`). This keeps the page rich and saturated at full brightness, and soft without looking muddy or overly dark when screen brightness is turned down.
* **Glassmorphic Obsidian Cards (`rgba(11, 11, 20, 0.82)`)**: Deeper, richer card overlays create a clear contrast barrier with the background canvas, keeping elements distinct and readable even when your monitor is dimmed.
* **Spring-Elastic Hover Elevations**: Cards (`.bg-glass`) transition using an organic spring physics cubic bezier (`cubic-bezier(0.34, 1.56, 0.64, 1)`), lifting up (`translateY(-4px)`) and projecting a soft violet neon shadow when hovered.
* **Luminous Gradient Headings**: Title tags clip a custom white-to-violet linear gradient for a modern visual hierarchy.
* **Focused Input Glows**: Interactive text elements display a lavender neon halo focus ring (`box-shadow` outline) to give clean user feedback.
* **Vibrant Lavender Scrollbars**: Replaces raw browser scrollbars with custom, rounded scrollbar tracks glowing in translucent lavender.

---

## 🛠️ Technology Stack

### Frontend Architecture
* **Library**: React 19
* **Language**: TypeScript
* **Build Tooling**: Vite
* **Libraries**: `pdfjs-dist` (PDF.js rendering), `jszip` (Word doc parsing), `lucide-react` (icons), `socket.io-client`
* **Styling**: Tailored Glassmorphic Vanilla CSS

### Backend Infrastructure
* **Runtime**: Node.js
* **Framework**: Express 5 (latest cutting-edge routing support)
* **Database**: MongoDB (Mongoose ODM layer)
* **Real-time WebSockets**: Socket.io
* **Email System**: Nodemailer
* **Optical Character Recognition (OCR)**: Tesseract.js
* **Payment Processor**: Stripe API

---

## 📁 Repository Structure

```text
Campus_Freelancing/
├── backend/                  # Node.js + Express Backend Service
│   ├── controllers/          # Business logic controllers (Auth, Chat)
│   ├── models/               # Mongoose schemas (Student, Client, Task, Note, etc.)
│   ├── routes/               # API endpoint routing declarations
│   ├── eng.traineddata       # Pre-downloaded Tesseract OCR language dataset
│   ├── index.js              # Server entry point, Socket.io, & Nodemailer setup
│   └── package.json          # Node dependency configurations
│
└── frontend/                 # React + TypeScript Client Application
    ├── public/               # Static assets & public files
    ├── src/                  # Application source
    │   ├── components/       # UI Components
    │   │   ├── Auth/         # Login & Role-based signup flows
    │   │   ├── Chat/         # Real-time WebSocket chat widgets
    │   │   ├── Dashboard/    # Comprehensive Client & Student workspaces (and .css styles)
    │   │   └── Landing/      # Dynamic marketing homepage
    │   ├── App.css           # Global layout adjustments
    │   ├── App.tsx           # Client router and path structure
    │   ├── index.css         # Styling system tokens & animations
    │   └── main.tsx          # Application renderer mount
    ├── vite.config.ts        # Vite configuration script
    └── package.json          # Frontend dependency specifications
```

---

## 🚀 Local Installation & Setup

Follow these steps to configure and run the entire local development environment.

### Step 1: Configure the Backend

1. Navigate into the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend/` folder and insert your credentials:
   ```env
   # Local MongoDB Connection (Bypasses Atlas IP Whitelists instantly!)
   MONGO_URL=mongodb://127.0.0.1:27017/campus_freelancing

   # Stripe API Keys (Test Mode)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_signing_key

   # Nodemailer SMTP Configuration (e.g., Mailtrap, Gmail)
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_EMAIL=your_smtp_user
   SMTP_PASSWORD=your_smtp_password
   ```
4. Start the backend developer server:
   ```bash
   npm start
   ```
   *The server defaults to port `5000` (WebSocket connects to `http://localhost:5000`).*

---

### Step 2: Configure the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the client packages:
   ```bash
   npm install
   ```
3. Boot the Vite local dev server:
   ```bash
   npm run dev
   ```
   *The frontend starts instantly on `http://localhost:5173`.*
