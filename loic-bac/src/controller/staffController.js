import Staff from "../model/staff.js";
import { generatePassword, generateEmail } from "../utils/generateCredidential.js";

export const addStaff = async (req, res) => {
  try {
    const { fullName, department, position } = req.body;

    const email = generateEmail(fullName);
    const password = generatePassword();

    const newStaff = new Staff({
      fullName,
      email,
      department,
      position,
      password
    });

    await newStaff.save();

    res.status(201).json({
      message: "Staff created successfully",
      credentials: {
        email,
        password,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
