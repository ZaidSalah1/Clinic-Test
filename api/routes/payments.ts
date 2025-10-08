// routes/payments.ts
import express from 'express';
import fetch from 'node-fetch';
import Appointment from '../models/Appointment';

const router = express.Router();
const LAHZA_SECRET = process.env.LAHZA_SECRET!;

router.get('/payments/lahza/verify', async (req, res) => {
  try {
    const { reference } = req.query as { reference: string };
    if (!reference) return res.status(400).json({ error: 'Missing reference' });

    const out = await fetch(`https://api.lahza.io/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${LAHZA_SECRET}` }
    }).then(r => r.json());

    if (!out?.status) return res.status(400).json({ error: out?.message || 'verify failed' });

    const appt = await Appointment.findOne({ 'payment.reference': reference });
    if (appt) {
      await Appointment.updateOne(
        { _id: appt._id },
        {
          $set: {
            'payment.status': out.data.status === 'success' ? 'success' : 'failed',
            'payment.channel': out.data.channel,
            'payment.gatewayResponse': out.data.gateway_response,
            'payment.rawVerify': out.data,
            status: out.data.status === 'success' ? 'paid' : appt.status
          }
        }
      );
    }

    res.json({ ok: true, data: out.data });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
