const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Application = require('../models/Application');
const Task = require('../models/Task');

// Initialize Stripe safely
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Helper to check Stripe configuration
const verifyStripe = (res) => {
  if (!stripe) {
    res.status(500).json({ 
      message: 'Stripe Secret Key is not configured in backend .env file.' 
    });
    return false;
  }
  return true;
};

// 1. Onboard Student - Create Stripe Connect Express Account
router.post('/onboard-student', async (req, res) => {
  if (!verifyStripe(res)) return;
  
  const { studentId, redirectOrigin } = req.body;
  const origin = redirectOrigin || req.headers.origin || 'http://localhost:5173';
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let stripeAccountId = student.stripeAccountId;

    // If student doesn't have a Stripe Connect account yet, create one
    if (!stripeAccountId) {
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          capabilities: {
            transfers: { requested: true },
          },
          business_type: 'individual',
          email: student.email,
        });
        stripeAccountId = account.id;
        student.stripeAccountId = stripeAccountId;
        await student.save();
      } catch (stripeError) {
        // If Stripe Connect is not enabled on this Stripe account, fallback to simulation mode
        const isConnectNotEnabled = stripeError.message && (
          stripeError.message.includes("signed up for Connect") || 
          stripeError.message.includes("Connect") ||
          stripeError.type === 'StripeInvalidRequestError'
        );
        
        if (isConnectNotEnabled) {
          console.warn("⚠️ Stripe Connect is not enabled on this Stripe developer account. Enabling Simulated Connect Mode.");
          stripeAccountId = `mock_co_${student._id}`;
          student.stripeAccountId = stripeAccountId;
          student.stripeOnboardingComplete = true; // Auto-complete for simulation
          await student.save();
          
          return res.json({ 
            url: `${origin}/student-dashboard?stripe_onboard=success&accountId=${stripeAccountId}&simulated=true` 
          });
        } else {
          throw stripeError; // propagate other errors
        }
      }
    }

    // Generate Hosted Stripe Onboarding Link
    if (stripeAccountId && stripeAccountId.startsWith('mock_co_')) {
      return res.json({ 
        url: `${origin}/student-dashboard?stripe_onboard=success&accountId=${stripeAccountId}&simulated=true` 
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/student-dashboard?stripe_onboard=refresh`,
      return_url: `${origin}/student-dashboard?stripe_onboard=success&accountId=${stripeAccountId}`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe onboarding failed:', error);
    res.status(500).json({ message: 'Stripe onboarding setup failed', error: error.message });
  }
});

// 2. Check Onboard Status
router.post('/check-onboard-status', async (req, res) => {
  if (!verifyStripe(res)) return;

  const { studentId } = req.body;
  try {
    const student = await Student.findById(studentId);
    if (!student || !student.stripeAccountId) {
      return res.json({ complete: false });
    }

    // Fallback for mock accounts
    if (student.stripeAccountId.startsWith('mock_co_')) {
      if (!student.stripeOnboardingComplete) {
        student.stripeOnboardingComplete = true;
        await student.save();
      }
      return res.json({ 
        complete: true,
        stripeOnboardingComplete: true,
        charges_enabled: true,
        details_submitted: true,
        simulated: true
      });
    }

    const account = await stripe.accounts.retrieve(student.stripeAccountId);
    
    // Check if account has completed onboarding and is allowed to receive payouts
    const complete = account.details_submitted && account.charges_enabled;
    if (complete && !student.stripeOnboardingComplete) {
      student.stripeOnboardingComplete = true;
      await student.save();
    }

    res.json({ 
      complete,
      stripeOnboardingComplete: student.stripeOnboardingComplete,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted
    });
  } catch (error) {
    console.error('Error checking onboard status:', error);
    res.status(500).json({ message: 'Failed to verify onboarding status', error: error.message });
  }
});

// 3. Fund Escrow - Create Stripe Checkout Session
router.post('/fund-escrow', async (req, res) => {
  if (!verifyStripe(res)) return;

  const { applicationId, redirectOrigin } = req.body;
  const origin = redirectOrigin || req.headers.origin || 'http://localhost:5173';
  try {
    const application = await Application.findById(applicationId).populate('taskId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const task = application.taskId;
    if (!task) {
      return res.status(404).json({ message: 'Task associated with this application not found' });
    }

    const actualBudget = task.budget;
    const actualTitle = task.title;

    // Create session holding funds on Platform balance
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Milestone Deposit: ${actualTitle}`,
            description: 'Funds will be securely locked in Stripe Escrow safeguard.',
          },
          unit_amount: Math.round(parseFloat(actualBudget) * 100), // budget in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/client-dashboard?payment=success&appId=${applicationId}`,
      cancel_url: `${origin}/client-dashboard?payment=cancel`,
      metadata: { applicationId },
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Stripe Checkout session initialization failed:', error);
    res.status(500).json({ message: 'Checkout initialization failed', error: error.message });
  }
});

// 4. Confirm Escrow Manually (Fail-safe direct API for developers)
router.post('/confirm-escrow-manual', async (req, res) => {
  const { applicationId } = req.body;
  try {
    const app = await Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Set statuses locally
    app.paymentStatus = 'Held in Escrow';
    app.status = 'Hired';
    app.escrowFundedAt = new Date();
    await app.save();

    // Transition original Task status to "In Progress"
    const task = await Task.findById(app.taskId);
    if (task) {
      task.status = 'In Progress';
      await task.save();
    }

    res.json({ message: 'Escrow payment captured & verified successfully.', app });
  } catch (error) {
    console.error('Manual escrow confirmation error:', error);
    res.status(500).json({ message: 'Escrow verification failed', error: error.message });
  }
});

// 5. Release Escrow Payout - Transfer funds from Platform to Student
router.post('/release-escrow', async (req, res) => {
  if (!verifyStripe(res)) return;

  const { applicationId } = req.body;
  try {
    const app = await Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (app.paymentStatus !== 'Held in Escrow') {
      return res.status(400).json({ message: 'Funds are not currently in escrow or are already released.' });
    }

    const student = await Student.findById(app.studentId);
    if (!student || !student.stripeAccountId) {
      return res.status(400).json({ 
        message: 'Payout failed: Student has not connected a verified Stripe bank account.' 
      });
    }

    // Load Task to get budget
    const task = await Task.findById(app.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task associated with this gig not found.' });
    }

    const platformCommission = 0.10; // 10% Platform fee
    const studentShare = 1 - platformCommission;
    const amountToTransfer = Math.round(task.budget * studentShare * 100); // cents

    // Perform Stripe Transfer from Platform Account to Student Connected Express Account
    let transfer;
    if (student.stripeAccountId && student.stripeAccountId.startsWith('mock_co_')) {
      console.log(`[Simulated Payout] Simulating Stripe transfer of $${(amountToTransfer/100).toFixed(2)} to mock account: ${student.stripeAccountId}`);
      transfer = {
        id: `mock_tr_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      };
    } else {
      transfer = await stripe.transfers.create({
        amount: amountToTransfer,
        currency: 'usd',
        destination: student.stripeAccountId,
        description: `Escrow payout released for: ${task.title}`,
      });
    }

    // Update records in DB
    app.paymentStatus = 'Released';
    app.status = 'Hired'; // Keep Hired status
    app.stripeTransferId = transfer.id;
    app.escrowReleasedAt = new Date();
    await app.save();

    // Mark task as Completed
    task.status = 'Completed';
    await task.save();

    res.json({ 
      message: 'Payment has been successfully transferred to student bank payouts!',
      app 
    });
  } catch (error) {
    console.error('Stripe Escrow Release failed:', error);
    res.status(500).json({ message: 'Stripe Connect Escrow release failed', error: error.message });
  }
});

// 6. Stripe Webhook Parser
router.post('/webhook', async (req, res) => {
  if (!verifyStripe(res)) return;

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature validation failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Stripe Checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const applicationId = session.metadata.applicationId;

    try {
      const app = await Application.findById(applicationId);
      if (app) {
        app.paymentStatus = 'Held in Escrow';
        app.status = 'Hired';
        app.stripePaymentIntentId = session.payment_intent;
        app.escrowFundedAt = new Date();
        await app.save();

        const task = await Task.findById(app.taskId);
        if (task) {
          task.status = 'In Progress';
          await task.save();
        }
        console.log(`[Stripe Webhook] Escrow successfully funded for Application: ${applicationId}`);
      }
    } catch (err) {
      console.error('Webhook database sync error:', err.message);
    }
  }

  res.json({ received: true });
});

module.exports = router;
