import userModel from "../model/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { transporter } from "../utils/mailer.js";

export const getAllStaff = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const staff = await userModel
      .find({ role: "staff" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const registerStaff = async (req, res) => {
  try {
    console.log("req.body: ", req.body);
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { name, email, department, position } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Generate random password
    const generatedPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      department,
      position,
      role: "staff",
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Staff registered successfully",
      credentials: {
        email,
        password: generatedPassword,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
      },
    });
  } catch (error) {
    console.log("error adding staff: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendEmail = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing email, name or password",
      });
    }

    const mailOptions = {
      from: `"Admin Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Staff Account Credentials",
      text: `Hello ${name},

Your staff account has been created. Here are your login credentials:

Email: ${email}
Password: ${password}

Please log in and change your password as soon as possible.

Best regards,
Admin Team`,
      html: `<p>Hello ${name},</p>
             <p>Your staff account has been created. Here are your login credentials:</p>
             <ul>
               <li><b>Email:</b> ${email}</li>
               <li><b>Password:</b> ${password}</li>
             </ul>
             <p>Please log in and change your password as soon as possible.</p>
             <p>Best regards,<br/>Admin Team</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
};

export const faceEncoding = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user.userId;

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "No image provided" });
    }

    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");

    try {
      const response = await axios.post("http://localhost:5000/encode", {
        image: imageData,
        userId: userId,
      });

      if (response.data.success) {
        await User.findByIdAndUpdate(userId, {
          faceEncoding: response.data.encoding,
        });

        res.json({
          success: true,
          message: "Face encoding saved successfully",
        });
      } else {
        res.json({
          success: false,
          message: "Failed to process face encoding",
        });
      }
    } catch (pythonError) {
      console.error("Python service error:", pythonError.message);
      res
        .status(500)
        .json({ success: false, message: "Encoding service unavailable" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
