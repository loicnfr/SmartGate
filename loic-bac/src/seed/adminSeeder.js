import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../model/admin.js";

async function seedAdmin() {
  try {
    await Admin.deleteMany();

    const plainPassword = "admin123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const admin = new Admin({
      email: "admin@smartgate.com",
      password: hashedPassword,
    });

    await admin.save();

    console.log("Admin seeded successfully:");
    console.log({
      email: admin.email,
      password: plainPassword,
    });

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    mongoose.connection.close();
  }
}

export default seedAdmin;
