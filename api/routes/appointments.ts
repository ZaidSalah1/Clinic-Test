// routes/appointments.ts
import express from 'express';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import fetch from 'node-fetch';
const router = express.Router();

const LAHZA_SECRET = process.env.LAHZA_SECRET!; // Bearer
const CALLBACK_URL  = process.env.LAHZA_CALLBACK_URL || 'https://abcd1234.ngrok.io/payments/lahza/callback';

// routes/appointments.ts (مقتطف فقط)
router.post('/appointments/init', async (req, res) => {
  try {
    const { doctorId, patientId, patient, dateISO, slotStartUTC, slotEndUTC } = req.body;

    // 1) هات الدكتور
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) return res.status(400).json({ error: 'Doctor not found' });

    // 2) جهّز/أحصل patientId
    let pid = patientId;
    if (!pid) {
      // نتوقع patient = { firstName, lastName, email, phone, gender?, dob? }
      if (!patient?.phone) return res.status(400).json({ error: 'phone is required' });
      // حاول لُقطة حسب الهاتف أو الإيميل
      let existing = await Patient.findOne({
        $or: [
          ...(patient.email ? [{ email: patient.email.toLowerCase() }] : []),
          { phone: patient.phone }
        ]
      });
      if (!existing) {
        existing = await Patient.create({
          firstName: patient.firstName || 'Guest',
          lastName:  patient.lastName  || 'User',
          email:     (patient.email || `${patient.phone}@guest.local`).toLowerCase(),
          phone:     patient.phone,
          gender:    patient.gender,
          dob:       patient.dob
        });
      }
      pid = existing._id;
    }

    // 3) احسب المبلغ (أغورات)
    const amount_agorot = Math.round((doctor.price || 0) * 100);

    // 4) أنشئ الحجز pending
    const appt = await Appointment.create({
      doctorId, patientId: pid, dateISO, slotStartUTC, slotEndUTC,
      payment: { currency:'ILS', amount_agorot, callbackUrl: CALLBACK_URL, status:'pending' }
    });

    // 5) جهّز الدفع مع Lahza
    const pat = await Patient.findById(pid).lean();
    const initRes = await fetch('https://api.lahza.io/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LAHZA_SECRET}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        amount: String(amount_agorot),
        currency: 'ILS',
        email: pat?.email,
        mobile: pat?.phone,
        callback_url: CALLBACK_URL,
        reference: `APPT_${appt._id}`,
        metadata: JSON.stringify({ appointmentId:String(appt._id), doctorId, patientId:String(pid) }),
      })
    }).then(r => r.json());

    if (!initRes?.status) {
      await Appointment.findByIdAndDelete(appt._id);
      return res.status(400).json({ error: initRes?.message || 'Lahza init failed' });
    }

    await Appointment.findByIdAndUpdate(appt._id, {
      $set: {
        'payment.authorizationUrl': initRes.data.authorization_url,
        'payment.reference':        initRes.data.reference
      }
    });

    res.json({ appointmentId: appt._id, patientId: pid, authorizationUrl: initRes.data.authorization_url });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});


export default router;
