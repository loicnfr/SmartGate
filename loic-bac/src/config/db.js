import mongoose from "mongoose";
import dotenv from "dotenv";
import seedAdmin from "../seed/adminSeeder.js";
import seedUsers from "../seed/seedUsers.js";
dotenv.config();

export const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB successfully connected!");
    // seedAdmin();
    // seedUsers()
  } catch (error) {
    console.log(`failed to connect to mongodb ${error}`);
    process.exit(1);
  }
};
