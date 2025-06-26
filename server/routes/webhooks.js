const express = require('express');
const { prisma } = require('../config/database');
const { stripe } = require('../config/stripe');

// Sprawdź czy Stripe jest skonfigurowany
if (!stripe) {
  console.warn('⚠️  Webhooks Stripe są niedostępne - STRIPE_SECRET_KEY nie jest skonfigurowany');
}

const router = express.Router();
// Middleware do parsowania raw body dla webhooków Stripe
const parseRawBody = (req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

// POST /api/webhooks/stripe - Webhook Stripe
router.post('/stripe', parseRawBody, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe nie jest skonfigurowany' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Weryfikuj webhook
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Błąd weryfikacji webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Otrzymano webhook Stripe:', event.type);

  try {
    // Obsłuż różne typy zdarzeń
    switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;

    default:
      console.log(`Nieobsługiwany typ zdarzenia: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Błąd obsługi webhook:', error);
    res.status(500).json({ error: 'Błąd serwera podczas obsługi webhook' });
  }
});

// Obsługa zakończonej sesji checkout
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);

  const userId = session.metadata.userId;
  const planId = session.metadata.planId;

  if (!userId || !planId) {
    console.error('Brak userId lub planId w metadanych sesji');
    return;
  }

  // Pobierz plan z bazy danych
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    console.error('Plan nie został znaleziony:', planId);
    return;
  }

  // Pobierz subskrypcję Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

  // Utwórz lub zaktualizuj subskrypcję w bazie danych
  const trialEndDate = stripeSubscription.trial_end ?
    new Date(stripeSubscription.trial_end * 1000) : null;
  const nextBillingDate = stripeSubscription.current_period_end ?
    new Date(stripeSubscription.current_period_end * 1000) : null;

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: stripeSubscription.status.toUpperCase(),
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      planId: planId,
      trialEndDate,
      nextBillingDate
    },
    create: {
      userId,
      planId,
      status: stripeSubscription.status.toUpperCase(),
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      trialEndDate,
      nextBillingDate
    }
  });

  console.log(`Subskrypcja utworzona/zaktualizowana dla użytkownika ${userId}`);
}

// Obsługa utworzenia subskrypcji
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);

  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;

  if (!userId || !planId) {
    console.error('Brak userId lub planId w metadanych subskrypcji');
    return;
  }

  const trialEndDate = subscription.trial_end ?
    new Date(subscription.trial_end * 1000) : null;
  const nextBillingDate = subscription.current_period_end ?
    new Date(subscription.current_period_end * 1000) : null;

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: subscription.status.toUpperCase(),
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      trialEndDate,
      nextBillingDate
    },
    create: {
      userId,
      planId,
      status: subscription.status.toUpperCase(),
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      trialEndDate,
      nextBillingDate
    }
  });
}

// Obsługa aktualizacji subskrypcji
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!dbSubscription) {
    console.error('Subskrypcja nie została znaleziona w bazie danych:', subscription.id);
    return;
  }

  const nextBillingDate = subscription.current_period_end ?
    new Date(subscription.current_period_end * 1000) : null;

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: subscription.status.toUpperCase(),
      nextBillingDate,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });
}

// Obsługa usunięcia subskrypcji
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!dbSubscription) {
    console.error('Subskrypcja nie została znaleziona w bazie danych:', subscription.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'CANCELED',
      endDate: new Date(),
      canceledAt: new Date()
    }
  });
}

// Obsługa udanej płatności
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription }
  });

  if (!subscription) {
    console.error('Subskrypcja nie została znaleziona dla faktury:', invoice.id);
    return;
  }

  // Zapisz płatność w bazie danych
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: 'SUCCEEDED',
      stripePaymentIntentId: invoice.payment_intent,
      stripeInvoiceId: invoice.id,
      description: `Płatność za subskrypcję - ${invoice.lines.data[0]?.description || 'Plan subskrypcji'}`,
      receiptUrl: invoice.hosted_invoice_url,
      invoiceUrl: invoice.invoice_pdf,
      paidAt: new Date(invoice.status_transitions.paid_at * 1000)
    }
  });

  // Zaktualizuj status subskrypcji
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      nextBillingDate: new Date(invoice.lines.data[0]?.period?.end * 1000)
    }
  });
}

// Obsługa nieudanej płatności
async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription }
  });

  if (!subscription) {
    console.error('Subskrypcja nie została znaleziona dla faktury:', invoice.id);
    return;
  }

  // Zapisz nieudaną płatność
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: 'FAILED',
      stripeInvoiceId: invoice.id,
      description: `Nieudana płatność za subskrypcję - ${invoice.lines.data[0]?.description || 'Plan subskrypcji'}`,
      failedAt: new Date()
    }
  });

  // Zaktualizuj status subskrypcji
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE'
    }
  });
}

// Obsługa końca okresu próbnego
async function handleTrialWillEnd(subscription) {
  console.log('Trial will end:', subscription.id);

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true }
  });

  if (!dbSubscription) {
    console.error('Subskrypcja nie została znaleziona w bazie danych:', subscription.id);
    return;
  }

  // Tutaj można dodać logikę wysyłania emaila z przypomnieniem o końcu trial
  console.log(`Okres próbny kończy się dla użytkownika: ${dbSubscription.user.email}`);
}

module.exports = router;
