// routes/webhooks.ts
import express from 'express';
import crypto from 'crypto';
import Appointment from '../models/Appointment';
const router = express.Router();

const LAHZA_SECRET = process.env.LAHZA_SECRET!; // نفس المفتاح السري

router.post('/webhooks/lahza', express.raw({ type: '*/*' }), async (req, res) => {
  // لَحْظة تبعث توقيع HMAC بالهيدر x-lahza-signature – لازم نتحقق منه
  // ملاحظة: استخدمنا express.raw حتى نقرأ الـ payload الأصلي
  try {
    const signature = req.header('x-lahza-signature') || '';
    const payload   = req.body as Buffer;
    const digest    = crypto.createHmac('sha256', LAHZA_SECRET).update(payload).digest('hex');
    if (digest !== signature) return res.sendStatus(200); // نتجاهل الحدث بصمت

    const event = JSON.parse(payload.toString('utf8'));
    // مثال: event.type === 'charge.success'
    const ref = event?.data?.reference;
    if (!ref) return res.sendStatus(200);

    const appt = await Appointment.findOne({ 'payment.reference': ref });
    if (!appt) return res.sendStatus(200);

    const status = event?.type === 'charge.success' ? 'success' :
                   event?.type?.startsWith('refund') ? appt.payment.status : // تجاهل تغييرات ثانية
                   'failed';

    await Appointment.updateOne(
      { _id: appt._id },
      {
        $set: {
          'payment.status': status,
          'payment.channel': event?.data?.channel,
          'payment.gatewayResponse': event?.data?.gateway_response,
          'payment.rawWebhook': event
        },
        ...(status === 'success' ? { $setOnInsert: {} } : {})
      }
    );

    if (status === 'success') {
      await Appointment.updateOne({ _id: appt._id }, { $set: { status: 'paid' } });
      // TODO: قفّل السلوْت / أرسل إشعارات / أنشئ Meeting...
    }

    res.sendStatus(200); // مهم جدًا حتى لا يعيد الإرسال
  } catch {
    res.sendStatus(200);
  }
});

export default router;
