import mongoose from "mongoose";
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema)
export default Admin;