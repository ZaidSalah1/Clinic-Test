require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const path = require("path");
const app = express();

const Doctor = require("./models/Doctor.js");
const Appointment = require("./models/Appointment");
const Specialty = require("./models/specialty");

const { PORT = 4000, MONGO_URI } = process.env;

app.use(cors());
app.use(express.json());

// صحّة
app.get("/", (_req, res) => res.json({ ok: true }));
const UPLOADS_DIR = path.resolve(__dirname, "../uploads"); // <-- المهم
app.use("/uploads", express.static(UPLOADS_DIR));

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

app.get('/doctor/:id', async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id)
      .populate('specialtyId', 'name iconUrl'); // عشان يرجع اسم التخصص
    if (!doc) return res.status(404).json({ ok:false, error:'Not found' });
    res.json({ ok:true, doctor: doc });
  } catch (e) {
    res.status(400).json({ ok:false, error:e.message });
  }
});

// GET /doctors?spec=Cardiology
app.get('/doctors', async (req, res) => {
  try {
    const { spec } = req.query; // ← اسم التخصص جاي من الـ query
    const filter = {};

    if (spec) {
      // دور على التخصص بالاسم (case-insensitive)
      const specialty = await Specialty.findOne({
        name: new RegExp(`^${spec}$`, 'i')
      });
      if (!specialty) {
        return res.json({ ok: true, total: 0, items: [] });
      }
      filter.specialtyId = specialty._id;
    }

    // رجع كل الدكاترة لهذا التخصص
    const doctors = await Doctor.find(filter)
      .populate('specialtyId', 'name iconUrl')
      .sort({ createdAt: -1 });

    res.json({ ok: true, total: doctors.length, items: doctors });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});



// كل الدكاترة
// app.get("/doctors", async (req, res) => {
//   try {
//     const docs = await Doctor.find().sort({ createdAt: -1 });

//     const origin = `${req.protocol}://${req.get("host")}`;
//     const withFullUrls = docs.map((d) => ({
//       ...d.toObject(),
//       photoUrl: d.photoUrl?.startsWith("/uploads")
//         ? origin + d.photoUrl // يرجّع URL كامل
//         : d.photoUrl,
//     }));

//     res.json(withFullUrls);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// إضافة دكتور جديد (مع رابط صورة)
// app.post("/doctors", async (req, res) => {
//   try {
//     const { name, specialty, photoUrl, price, rating, bio } = req.body;
//     if (!name?.trim() || !specialty?.trim() || !photoUrl?.trim()) {
//       return res
//         .status(400)
//         .json({ error: "name, specialty, photoUrl مطلوبة" });
//     }
//     const d = await Doctor.create({
//       name: name.trim(),
//       specialty: specialty.trim(),
//       photoUrl: photoUrl.trim(),
//       price: Number(price) || 0,
//       rating: Number(rating) || 4.5,
//       bio: bio || "",
//     });
//     res.status(201).json(d);
//   } catch (err) {
//     res.status(500).json({ error: e.message });
//   }
// });

// // seed سريع (بيانات جاهزة + صور)
// app.post("/seed-doctors", async (_req, res) => {
//   try {
//     await Doctor.deleteMany({});
//     const data = await Doctor.insertMany([
//       {
//         name: "Dr. Lina Al-Sabbagh",
//         specialty: "Emergency",
//         photoUrl: "/uploads/dr2.png",
//         price: 65,
//         rating: 4.5,
//         bio: "أخصائية طوارئ بخبرة في إنعاش الحالات الحرجة.",
//       },
//       {
//         name: "Dr. Samer Al-Masri",
//         specialty: "Endocrinology",
//         photoUrl: "/uploads/dr4.png",
//         price: 80,
//         rating: 4.6,
//         bio: "متخصص في الغدد الصماء والهرمونات وعلاج السكري.",
//       },
//       {
//         name: "Dr. Reem Al-Khatib",
//         specialty: "Family Medicine",
//         photoUrl: "/uploads/dr3.png",
//         price: 55,
//         rating: 4.4,
//         bio: "طبيبة أسرة تهتم بالرعاية الأولية والوقاية.",
//       },
//       {
//         name: "Dr. Hani Odeh",
//         specialty: "Neurosurgery",
//         photoUrl: "/uploads/dr5.png",
//         price: 150,
//         rating: 4.9,
//         bio: "جراح أعصاب متخصص في أورام الدماغ والعمود الفقري.",
//       },
//       {
//         name: "Dr. Ruba Awad",
//         specialty: "Obstetric",
//         photoUrl: "/uploads/dr13.png",
//         price: 95,
//         rating: 4.7,
//         bio: "أخصائية نسائية وتوليد بخبرة متابعة الحمل والولادة.",
//       },
//       {
//         name: "Dr. Fadi Suleiman",
//         specialty: "Ophthalmology",
//         photoUrl: "/uploads/dr12.png",
//         price: 75,
//         rating: 4.6,
//         bio: "طبيب عيون مختص بجراحة القرنية والليزر.",
//       },
//       {
//         name: "Dr. Maha Jaber",
//         specialty: "Orthopedic",
//         photoUrl: "/uploads/dr11.png",
//         price: 85,
//         rating: 4.5,
//         bio: "أخصائية عظام تعالج الكسور وإصابات الملاعب.",
//       },
//       {
//         name: "Dr. Tareq Qudsi",
//         specialty: "Otolaryngology",
//         photoUrl: "/uploads/dr8.png",
//         price: 70,
//         rating: 4.6,
//         bio: "اختصاصي أنف وأذن وحنجرة يعالج التهابات واضطرابات السمع.",
//       },
//       {
//         name: "Dr. Nour Al-Rashid",
//         specialty: "Physiotherapist",
//         photoUrl: "/uploads/dr3.png",
//         price: 50,
//         rating: 4.4,
//         bio: "معالجة فيزيائية متخصصة في إعادة التأهيل بعد الإصابات.",
//       },
//       {
//         name: "Dr. Karim Mansour",
//         specialty: "Plastic",
//         photoUrl: "/uploads/dr10.png",
//         price: 200,
//         rating: 4.8,
//         bio: "جراح تجميل وترميم بخبرة في عمليات التجميل الدقيقة.",
//       },
//       {
//         name: "Dr. Amani Hamdan",
//         specialty: "Psychiatry",
//         photoUrl: "/uploads/dr11.png",
//         price: 110,
//         rating: 4.7,
//         bio: "طبيبة نفسية متخصصة في علاج الاكتئاب والقلق.",
//       },
//       {
//         name: "Dr. Basel Najjar",
//         specialty: "Psychology",
//         photoUrl: "/uploads/dr12.png",
//         price: 65,
//         rating: 4.3,
//         bio: "أخصائي نفسي يقدم جلسات علاج سلوكي معرفي.",
//       },
//       {
//         name: "Dr. Dalia Haroun",
//         specialty: "Pulmonary",
//         photoUrl: "/uploads/dr13.png",
//         price: 90,
//         rating: 4.6,
//         bio: "أخصائية صدرية تعالج الربو وأمراض الرئة المزمنة.",
//       },
//       {
//         name: "Dr. Yazan Qasem",
//         specialty: "Rheumatology",
//         photoUrl: "/uploads/dr7.png",
//         price: 95,
//         rating: 4.5,
//         bio: "طبيب مفاصل يعالج الروماتيزم والتهابات المفاصل.",
//       },
//       {
//         name: "Dr. Hana Tannous",
//         specialty: "Urology",
//         photoUrl: "/uploads/dr1.png",
//         price: 85,
//         rating: 4.4,
//         bio: "أخصائية مسالك بولية وجراحة بسيطة للكلى والمثانة.",
//       },
//       {
//         name: "Dr. Ziad Shami",
//         specialty: "Vascular",
//         photoUrl: "/uploads/dr5.png",
//         price: 120,
//         rating: 4.7,
//         bio: "جراح أوعية دموية متخصص في القسطرة والدوالي.",
//       },
//     ]);
//     res.json({ inserted: data.length, data });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.get("/appointments/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // لو userId مخزّن ObjectId (مش نص):
//     // const list = await Appointment.find({ user: new mongoose.Types.ObjectId(userId) })
//     //   .sort({ createdAt: -1 });

//     // لو مخزّن كـ نص (زي ما عملنا مؤقتاً بـ userId: "user1"):
//     const list = await Appointment.find({ userId }).sort({ createdAt: -1 });

//     res.json(list);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/seed-appointments", async (req, res) => {
//   await Specialty.deleteMany({});
//   const data = await Appointment.insertMany([
//     {
//       userId: "user1",
//       doctorName: "Dr. Ahmad Barakat",
//       specialty: "Cardiology",
//       photoUrl: "/uploads/dr1.png",
//       date: "2025-09-20 10:00 AM",
//       notes: "مراجعة قلب",
//     },
//     {
//       userId: "user1",
//       doctorName: "Dr. Rania Khalid",
//       specialty: "Dermatology",
//       photoUrl: "/uploads/dr2.png",
//       date: "2025-09-21 02:00 PM",
//       notes: "جلسة ليزر",
//     },
//   ]);

//   res.json(data);
// });

// app.get("/specialties", async (req, res) => {
//   try {
//     const data = await Specialty.find().limit(6);
//     res.json(data);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get("/allSpecialties", async (req, res) => {
//   try {
//     const data = await Specialty.find();
//     res.json(data);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/add-Specialty", async (req, res) => {
//   try {
//     await Specialty.deleteMany({});
//     const data = await Specialty.insertMany([
//       { name: "Cardiology", iconUrl: "/uploads/icons/Cardiology-icon.png" },
//       { name: "Emergency", iconUrl: "/uploads/icons/Emergency-icon.png" },
//       {
//         name: "Endocrinology",
//         iconUrl: "/uploads/icons/Endocrinology-icon.png",
//       },
//       {
//         name: "Family Medicine",
//         iconUrl: "/uploads/icons/family-medicine-icon.png",
//       },
//       { name: "Neurosurgery", iconUrl: "/uploads/icons/Neurosurgery-icon.png" },
//       { name: "Obstetric", iconUrl: "/uploads/icons/Obstetric-icon.png" },
//       {
//         name: "Ophthalmology",
//         iconUrl: "/uploads/icons/Ophthalmology-icon.png",
//       },
//       { name: "Orthopedic", iconUrl: "/uploads/icons/Orthopedic-icon.png" },
//       {
//         name: "Otolaryngology",
//         iconUrl: "/uploads/icons/Otolaryngology-icon.png",
//       },
//       { name: "Pediatrics", iconUrl: "/uploads/icons/Pediatrics-icon.png" },
//       {
//         name: "Physiotherapist",
//         iconUrl: "/uploads/icons/Physiotherapist-icon.png",
//       },
//       { name: "Plastic", iconUrl: "/uploads/icons/Plastic-icon.png" },
//       { name: "Psychiatry", iconUrl: "/uploads/icons/Psychiatry-icon.png" },
//       { name: "Psychology", iconUrl: "/uploads/icons/Psychology-icon.png" },
//       { name: "Pulmonary", iconUrl: "/uploads/icons/Pulmonary-icon.png" },
//       { name: "Rheumatology", iconUrl: "/uploads/icons/Rheumatology-icon.png" },
//       { name: "Urology", iconUrl: "/uploads/icons/Urology-icon.png" },
//       { name: "Vascular", iconUrl: "/uploads/icons/Vascular-icon.png" },
//     ]);

//     res.json(data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// تشغيل + اتصال

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
