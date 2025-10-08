require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const path = require("path");
const app = express();

const Doctor = require("./models/Doctor.js");
const Specialty = require("./models/specialty");

// const fetch = require('node-fetch');
const crypto = require('crypto');

const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

const LAHZA_SECRET = process.env.LAHZA_SECRET;
const CALLBACK_URL = process.env.LAHZA_CALLBACK_URL; // استخدم رابط ngrok

const { DateTime } = require('luxon');

const { PORT = 4000, MONGO_URI } = process.env;

app.use(cors());
app.use(express.json());

// صحّة
app.get("/", (_req, res) => res.json({ ok: true }));
const UPLOADS_DIR = path.resolve(__dirname, "../uploads"); // <-- المهم
app.use("/uploads", express.static(UPLOADS_DIR));


app.post('/appointments/init', async (req, res) => {
  try {
    const { doctorId, patientId, patient, dateISO, slotStartUTC, slotEndUTC } = req.body;

    // 1) احضر الدكتور
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) return res.status(400).json({ error: 'Doctor not found' });

    // 2) حضّر/أنشئ المريض (upsert)
    let pid = patientId;
    if (!pid) {
      if (!patient?.phone) return res.status(400).json({ error: 'phone is required' });

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

    // 3) حساب المبلغ بالأغورات (ILS * 100)
    const amount_agorot = Math.round((doctor.price || 0) * 100);

    // 4) إنشاء الحجز pending
    const appt = await Appointment.create({
      doctorId,
      patientId: pid,
      dateISO,
      slotStartUTC,
      slotEndUTC,
      payment: { currency: 'ILS', amount_agorot, callbackUrl: CALLBACK_URL, status: 'pending' }
    });

    // 5) تهيئة الدفع مع Lahza
    const pat = await Patient.findById(pid).lean();
    const initRes = await fetch('https://api.lahza.io/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LAHZA_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: String(amount_agorot),
        currency: 'ILS',
        email: pat?.email,
        mobile: pat?.phone,
        callback_url: CALLBACK_URL,
        reference: `APPT_${appt._id}`,
        metadata: JSON.stringify({ appointmentId: String(appt._id), doctorId, patientId: String(pid) })
      })
    }).then(r => r.json());

    if (!initRes?.status) {
      await Appointment.findByIdAndDelete(appt._id);
      return res.status(400).json({ error: initRes?.message || 'Lahza init failed' });
    }

    await Appointment.findByIdAndUpdate(appt._id, {
      $set: {
        'payment.authorizationUrl': initRes.data.authorization_url,
        'payment.reference': initRes.data.reference
      }
    });

    res.json({ appointmentId: appt._id, patientId: pid, authorizationUrl: initRes.data.authorization_url });
  } catch (e) {
    console.error('INIT_ERR', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});


app.get('/payments/lahza/verify', async (req, res) => {
  try {
    const { reference } = req.query;
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.post('/webhooks/lahza', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.header('x-lahza-signature') || '';
    const payload = req.body; // Buffer
    const digest  = crypto.createHmac('sha256', LAHZA_SECRET).update(payload).digest('hex');
    if (digest !== signature) return res.sendStatus(200); // تجاهل لو التوقيع غلط

    const event = JSON.parse(payload.toString('utf8'));
    const ref = event?.data?.reference;
    if (!ref) return res.sendStatus(200);

    const appt = await Appointment.findOne({ 'payment.reference': ref });
    if (!appt) return res.sendStatus(200);

    const status = event?.type === 'charge.success' ? 'success' : 'failed';

    await Appointment.updateOne(
      { _id: appt._id },
      {
        $set: {
          'payment.status': status,
          'payment.channel': event?.data?.channel,
          'payment.gatewayResponse': event?.data?.gateway_response,
          'payment.rawWebhook': event,
          ...(status === 'success' ? { status: 'paid' } : {})
        }
      }
    );

    res.sendStatus(200);
  } catch (e) {
    console.error('WEBHOOK_ERR', e);
    res.sendStatus(200);
  }
});




app.post("/reset", async (_req, res) => {
  try {
    await Promise.all([Doctor.deleteMany({}), Specialty.deleteMany({})]);
    res.json({ ok: true, message: "All collections cleared." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/addSpecialties", async (_req, res) => {
  try {
    const SPECIALTIES = [
      { name: "Cardiology", iconUrl: "/uploads/icons/Cardiology-icon.png" },
      { name: "Emergency", iconUrl: "/uploads/icons/Emergency-icon.png" },
      {
        name: "Endocrinology",
        iconUrl: "/uploads/icons/Endocrinology-icon.png",
      },
      {
        name: "Family Medicine",
        iconUrl: "/uploads/icons/family-medicine-icon.png",
      },
      { name: "Neurosurgery", iconUrl: "/uploads/icons/Neurosurgery-icon.png" },
      { name: "Obstetric", iconUrl: "/uploads/icons/Obstetric-icon.png" },
      {
        name: "Ophthalmology",
        iconUrl: "/uploads/icons/Ophthalmology-icon.png",
      },
      { name: "Orthopedic", iconUrl: "/uploads/icons/Orthopedic-icon.png" },
      {
        name: "Otolaryngology",
        iconUrl: "/uploads/icons/Otolaryngology-icon.png",
      },
      { name: "Pediatrics", iconUrl: "/uploads/icons/Pediatrics-icon.png" },
      {
        name: "Physiotherapist",
        iconUrl: "/uploads/icons/Physiotherapist-icon.png",
      },
      { name: "Plastic", iconUrl: "/uploads/icons/Plastic-icon.png" },
      { name: "Psychiatry", iconUrl: "/uploads/icons/Psychiatry-icon.png" },
      { name: "Psychology", iconUrl: "/uploads/icons/Psychology-icon.png" },
      { name: "Pulmonary", iconUrl: "/uploads/icons/Pulmonary-icon.png" },
      { name: "Rheumatology", iconUrl: "/uploads/icons/Rheumatology-icon.png" },
      { name: "Urology", iconUrl: "/uploads/icons/Urology-icon.png" },
      { name: "Vascular", iconUrl: "/uploads/icons/Vascular-icon.png" },
    ];
    const inserted = await Specialty.insertMany(SPECIALTIES);
    res.json({ inserted: inserted.length, items: inserted });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/specialties", async (req, res) => {
  try {
    const data = await Specialty.find().limit(6);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/allSpecialties", async (req, res) => {
  try {
    const data = await Specialty.find();
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/getAllDoctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({}).populate(
      "specialtyId",
      "name iconUrl"
    ); // برجع اسم/أيقونة التخصص
    res.json({ ok: true, count: doctors.length, doctors });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/get6Doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .populate("specialtyId", "name iconUrl") // برجع اسم/أيقونة التخصص
      .limit(6);
    res.json({ ok: true, count: doctors.length, doctors });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/doctor", async (req, res) => {
  try {
    const { name, specName, photoUrl, price, rating, bio } = req.body;

    if (!name || !specName || !photoUrl) {
      return res
        .status(400)
        .json({ error: "name, specName, photoUrl مطلوبين" });
    }

    // get spec
    let specialty = await Specialty.findOne({
      name: new RegExp(`^${specName}$`, "i"),
    });

    if (!specialty) {
      specialty = await Specialty.create({
        name: specName,
        iconUrl: "/uploads/icons/default-icon.png",
      });
    }

    const doctor = await Doctor.create({
      name,
      specialtyId: specialty._id,
      photoUrl,
      price: price ?? 0,
      rating: rating ?? 4.5,
      bio: bio ?? "",
    });

    res.status(201).json({
      ok: true,
      doctor,
      specialty: {
        _id: specialty._id,
        name: specialty.name,
        iconUrl: specialty.iconUrl,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/doctor/:id", async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id).populate(
      "specialtyId",
      "name iconUrl"
    ); // عشان يرجع اسم التخصص
    if (!doc) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, doctor: doc });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// GET /doctors?spec=Cardiology
app.get("/doctors", async (req, res) => {
  try {
    const { spec } = req.query; // ← اسم التخصص جاي من الـ query
    const filter = {};

    if (spec) {
      // دور على التخصص بالاسم (case-insensitive)
      const specialty = await Specialty.findOne({
        name: new RegExp(`^${spec}$`, "i"),
      });
      if (!specialty) {
        return res.json({ ok: true, total: 0, items: [] });
      }
      filter.specialtyId = specialty._id;
    }

    // رجع كل الدكاترة لهذا التخصص
    const doctors = await Doctor.find(filter)
      .populate("specialtyId", "name iconUrl")
      .sort({ createdAt: -1 });

    res.json({ ok: true, total: doctors.length, items: doctors });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 🕒 تحويل وقت نصي "HH:mm" إلى عدد دقائق من بداية اليوم
function hhmmToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes;
  return totalMinutes;
}

// ⏰ تحويل عدد دقائق إلى وقت نصي "HH:mm"
function minutesToHHMM(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 📅 تحديد فترة العمل (start/end) للطبيب في اليوم المحدد
function getWorkingWindowForDate(doctor, dateString) {
  // المنطقة الزمنية للطبيب
  const timezone = doctor.timezone || 'UTC';

  // تحويل التاريخ إلى كائن DateTime من luxon
  const dateObject = DateTime.fromISO(dateString, { zone: timezone });

  // تحديد اليوم من الأسبوع: sun → 0, mon → 1, ...
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const weekdayKey = weekdayKeys[dateObject.weekday % 7];

  // جلب فترة الدوام لهذا اليوم من doctor.workingHours
  const daySchedule = doctor.workingHours?.[weekdayKey];

  // لو ما في دوام أو اليوم معطل → رجّع null
  if (!daySchedule || !daySchedule.enabled) {
    return null;
  }

  // رجّع start و end لهذا اليوم
  return {
    startTime: daySchedule.startTime,
    endTime: daySchedule.endTime,
  };
}

// 🧭 توليد الفترات الزمنية المتاحة للحجز
function generateSlots(doctor, dateString) {
  // طول كل فترة (مثلاً 30 دقيقة)
  const slotDuration = doctor.slotMinutes || 30;
  const timezone = doctor.timezone || 'UTC';

  // جلب فترة دوام الطبيب لليوم
  const workingWindow = getWorkingWindowForDate(doctor, dateString);
  if (!workingWindow) return [];

  // تحويل وقت البداية والنهاية إلى دقائق
  const startInMinutes = hhmmToMinutes(workingWindow.startTime);
  const endInMinutes = hhmmToMinutes(workingWindow.endTime);

  const availableSlots = [];

  // Loop من وقت البداية للنهاية بفاصل slotDuration
  for (let currentMinute = startInMinutes; currentMinute + slotDuration <= endInMinutes; currentMinute += slotDuration) {
    // تحويل الدقائق إلى وقت محلي بالتاريخ المحدد
    const localStartTime = DateTime.fromISO(
      `${dateString}T${minutesToHHMM(currentMinute)}`,
      { zone: timezone }
    );

    availableSlots.push({
      label: localStartTime.toFormat('hh:mm a'),  // مثل "09:00 AM"
      utc: localStartTime.toUTC().toISO(),        // وقت UTC للتخزين
    });
  }

  return availableSlots;
}

// 🌐 Endpoint لاستخراج المواعيد المتاحة للطبيب حسب التاريخ
app.get('/doctors/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      return res.status(404).json({ error: 'doctor not found' });
    }

    const slots = generateSlots(doctor, date);
    res.json({ date, slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 API http://localhost:${PORT}`);
  connectToMongo();
});

async function connectToMongo() {
  try {
    if (!MONGO_URI) return console.error("❌ MONGO_URI missing");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected");
  } catch (e) {
    console.error("❌ Mongo error:", e.message);
  }
}
