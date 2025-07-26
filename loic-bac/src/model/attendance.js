import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  date: { type: String, required: true },
  status: {
    type: String,
    enum: ["present", "absent", "partial"],
    default: "absent",
  },
  workingHours: { type: Number },
  method: {
    type: String,
    enum: ["face-recognition", "manual"],
    default: "face-recognition",
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
