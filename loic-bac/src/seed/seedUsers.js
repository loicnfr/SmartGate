import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../model/user.js"; // Adjust path as needed

async function seedUsers() {
  try {
    // Clear existing users
    await User.deleteMany();

    // Sample users data
    const users = [
      {
        name: "Admin User",
        email: "admin@percy.com",
        password: "admin123",
        role: "admin",
        department: "Management",
        position: "System Administrator",
      },
      {
        name: "John Doe",
        email: "john.doe@smartgate.com",
        password: "staff123",
        department: "IT",
        position: "Software Developer",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@smartgate.com",
        password: "staff123",
        department: "HR",
        position: "HR Manager",
      },
    ];

    // Hash passwords and create users
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return User.create({
          ...user,
          password: hashedPassword,
        });
      })
    );

    console.log("✅ Users seeded successfully:");
    createdUsers.forEach((user) => {
      console.log({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      });
    });

    // Close connection if needed (optional)
    // mongoose.connection.close();
  } catch (err) {
    console.error("❌ User seeding error:", err.message);
    // mongoose.connection.close();
  }
}

export default seedUsers;
