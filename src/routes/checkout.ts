import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;


router.post('/', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const { eventTitle, amountPence } = req.body as { eventTitle: string; amountPence: number };
  if (!amountPence || amountPence < 50) return res.status(400).json({ error: 'Min £0.50' });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: { currency: 'gbp', product_data: { name: eventTitle }, unit_amount: amountPence },
      quantity: 1
    }],
    success_url: `${process.env.FRONTEND_URL}/thanks?ok=1`,
    cancel_url: `${process.env.FRONTEND_URL}/thanks?cancel=1`,
  });
  res.json({ url: session.url });
});

export default router;
