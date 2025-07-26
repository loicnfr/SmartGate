import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      require: true,
      unique: true,
      lowercase: true
    },
    email: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      require: true,
    },
    position: {
      type: String,
      require: true,
    },
    password: {
        type: String,
        required: true,
      },
  },
  { timestamps: true }
);

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
