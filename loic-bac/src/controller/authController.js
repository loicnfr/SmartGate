import userModel from "../model/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
      },
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const validateToken = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const faceRecognition = async (res, req) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.json({ success: false, message: "No image provided" });
    }

    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");

    try {
      const response = await axios.post(
        "http://localhost:5000/recognize",
        {
          image: imageData,
        },
        {
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.userId) {
        const user = await userModel.findById(response.data.userId);
        if (user) {
          const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "24h" }
          );

          await markAttendance(user._id, user.name);

          return res.json({
            success: true,
            token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
              position: user.position,
            },
            message: `Welcome, ${user.name}!`,
          });
        }
      }

      res.json({ success: false, message: "Face not recognized" });
    } catch (pythonError) {
      console.error("Python service error:", pythonError.message);
      res.json({ success: false, message: "Recognition service unavailable" });
    }
  } catch (error) {
    console.error("Recognition error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
