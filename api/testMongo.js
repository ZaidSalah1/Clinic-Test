require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected!");

    // ثبّت اسم المجموعة (collection) = "zaid" بدل ما تتجمع تلقائيًا
    const listSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        age: { type: Number, required: true },
      },
      { collection: "zaid" }
    );

    // فهرس فريد على الاسم لمنع التكرار
    listSchema.index({ name: 1 }, { unique: true });

    const List = mongoose.model("List", listSchema);
    await List.init(); // يضمن إنشاء الفهارس قبل الكتابة

    // 👇 seed مرّة واحدة فقط
    const count = await List.estimatedDocumentCount();
    if (count === 0) {
      await List.insertMany([
        { name: "zft", age: 21 },
        { name: "aaa", age: 25 },
      ]);
      console.log("🌱 Seeded initial data (once).");
    } else {
      console.log(`⏭️ Collection already has ${count} docs — skip seeding.`);
    }

    // قراءة
    const readList = await List.find().sort({ name: 1 });
    console.log("📋 All docs:");
    console.log(readList);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

main();
