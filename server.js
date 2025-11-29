import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import trainingRoutes from "./routes/tranningRoutes.js";
import technologyRoutes from "./routes/technologyRoute.js";
import educationRoutes from "./routes/educationRouter.js";
import collegeRoutes from "./routes/collegeRouter.js";
import feeRoutes from "./routes/feeRoutes.js";
import hrRoutes from "./routes/manageHrRoutes.js";
import branchRoutes from "./routes/branchRouter.js";
import qrCoderoutes from "./routes/qrCodeRouter.js";
import counstRoutes from "./routes/countRouter.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import remindersRoutes from "./routes/remindersRoutes.js";
import assignmentRoutes from "./routes/assignmentsRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import jobApplicationsRoutes from "./routes/jobApplicationRoutes.js";

dotenv.config();

const app = express();
connectDB();

// Security middleware
app.use(helmet());
// app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP" },
});
// app.use(limiter);
app.use(cookieParser());

// CORS configuration

// app.use(
//   cors({
//     // origin: process.env.CORS_ORIGIN,
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "https://thedigicodersadmin.netlify.app",
//       "https://digicoders-admin.vercel.app",
//       "https://digicoder-admin.onrender.com",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );


app.use(cors())
// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// Routes
app.use("/api/auth", authRoutes); // ✅
app.use("/api/registration", registrationRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/technology", technologyRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/fee", feeRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/qrcode", qrCoderoutes);
app.use("/api/counts", counstRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reminders", remindersRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', jobApplicationsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
});
