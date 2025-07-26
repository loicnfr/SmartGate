const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

mongoose.connect(
  process.env.MONGO_URL ||
    'mongodb+srv://etoganfor6:eudoxie@smartgatefr.2nh8vux.mongodb.net/?retryWrites=true&w=majority&appName=smartgateFR',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  faceEncoding: { type: String },
  department: { type: String },
  position: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'partial'], default: 'absent' },
  workingHours: { type: Number },
  method: { type: String, enum: ['face-recognition', 'manual'], default: 'face-recognition' },
});

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const upload = multer({ storage: multer.memoryStorage() });

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Face recognition endpoint
app.post('/api/auth/recognize', upload.single('image'), async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.json({ success: false, message: 'No image provided' });
    }

    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, '');

    try {
      const response = await axios.post(
        'http://localhost:5000/recognize',
        {
          image: imageData,
        },
        {
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.userId) {
        const user = await User.findById(response.data.userId);
        if (user) {
          const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
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

      res.json({ success: false, message: 'Face not recognized' });
    } catch (pythonError) {
      console.error('Python service error:', pythonError.message);
      res.json({ success: false, message: 'Recognition service unavailable' });
    }
  } catch (error) {
    console.error('Recognition error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Attendance mark helper
const markAttendance = async (userId, userName) => {
  const today = new Date().toISOString().split('T')[0];

  let attendance = await Attendance.findOne({ userId, date: today });

  if (!attendance) {
    attendance = new Attendance({
      userId,
      userName,
      date: today,
      checkIn: new Date(),
      status: 'present',
    });
  } else if (!attendance.checkOut) {
    attendance.checkOut = new Date();
    if (attendance.checkIn) {
      const workingHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
      attendance.workingHours = Math.round(workingHours * 100) / 100;
    }
  }

  await attendance.save();
  return attendance;
};

// Validate token endpoint
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all staff (admin only)
app.get('/api/users/staff', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const staff = await User.find({ role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register new staff (admin only)
app.post('/api/users/staff', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, email, department, position } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate random password
    const generatedPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      department,
      position,
      role: 'staff',
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send email with credentials (admin only)
app.post('/api/users/staff/send-email', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, message: 'Missing email, name or password' });
    }

    const mailOptions = {
      from: `"Admin Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Staff Account Credentials',
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

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

// Attendance endpoints omitted for brevity (unchanged)

// Face encoding endpoint (unchanged)
app.post('/api/users/face-encoding', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user.userId;

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, '');

    try {
      const response = await axios.post('http://localhost:5000/encode', {
        image: imageData,
        userId: userId,
      });

      if (response.data.success) {
        await User.findByIdAndUpdate(userId, {
          faceEncoding: response.data.encoding,
        });

        res.json({ success: true, message: 'Face encoding saved successfully' });
      } else {
        res.json({ success: false, message: 'Failed to process face encoding' });
      }
    } catch (pythonError) {
      console.error('Python service error:', pythonError.message);
      res.status(500).json({ success: false, message: 'Encoding service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create default admin user if none exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'admin',
        department: 'IT',
        position: 'Administrator',
      });
      await admin.save();
      // Default admin credentials: admin@company.com / admin123
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createDefaultAdmin();
});
