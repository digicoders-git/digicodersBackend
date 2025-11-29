import mongoose from "mongoose";
import Attendance from "../models/attendance.js";
import Batch from "../models/batchs.js";

// ✅ Create attendance for a batch (new date)
export const createAttendance = async (req, res) => {
  try {
    const { batchId, date, records ,absents,presents,total} = req.body;

    // ensure batch exists
    const batch = await Batch.findById(batchId).populate("students");
    if (!batch) {
      return res.status(404).json({ message: "Batch not found",success:false });
    }

    const attendance = new Attendance({
      batchId,
      date,
      records,
      presents,
      absents,
      total,
      attendBy:req.user._id
    });

    await attendance.save();
    res.status(201).json({ message: "Attendance created", attendance,success:true });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Attendance already exists for this date & batch", });
    }
    res.status(500).json({ message: error.message ,success:false});
  }
};

// ✅ Mark attendance (update specific student’s status)
export const markAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { studentId, status } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    // update record
    const record = attendance.records.find(
      (r) => r.student.toString() === studentId
    );
    if (record) {
      record.status = status;
    } else {
      attendance.records.push({ student: studentId, status });
    }

    await attendance.save();
    res.json({ message: "Attendance updated", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get attendance by batch (all dates)
export const getBatchAttendance = async (req, res) => {
  try {
    const { batchId } = req.params;
    const attendance = await Attendance.find({ batchId })
      .populate("records.studentId", "studentName fatherName").populate("attendBy","name")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get attendance of single student in a batch
export const getStudentAttendance = async (req, res) => {
  try {
    const { batchId, studentId } = req.params;
    const records = await Attendance.find({ batch: batchId, "records.student": studentId })
      .select("date records")
      .sort({ date: -1 });

    // filter student only
    const studentRecords = records.map((a) => ({
      date: a.date,
      status: a.records.find(
        (r) => r.student.toString() === studentId
      )?.status,
    }));

    res.json(studentRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get student attendance
export const getStuAttendance = async (req, res) => {
  try {
    const  studentId  = req.student.id;

    
    const { month, year } = req.query;
    
    // Validate studentId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format"
      });
    }
    
    // Calculate start and end dates for the selected month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Find attendance records for the student in the specified month/year
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
      "records.studentId": studentId
    })
    .populate("batchId", "batchName")
    .populate("attendBy", "name")
    .sort({ date: 1 });
    
    // Process the data to extract student-specific information
    const studentAttendance = [];
    let presentCount = 0;
    let totalClasses = 0;
    
    attendanceRecords.forEach(record => {
      const studentRecord = record.records.find(
        r => r.studentId.toString() === studentId
      );
      
      if (studentRecord) {
        totalClasses++;
        if (studentRecord.status === "Present") {
          presentCount++;
        }
        
        studentAttendance.push({
          date: record.date,
          subject: record.batchId.batchName, // Assuming batchName represents the subject
          status: studentRecord.status.toLowerCase(),
          remarks: "", // You can add remarks field to your schema if needed
          takenBy: record.attendBy.name
        });
      }
    });
    
    // Calculate attendance percentage
    const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        records: studentAttendance,
        totalClasses,
        present: presentCount,
        absent: totalClasses - presentCount,
        percentage
      }
    });
    
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get student attendance summary (for dashboard)
// export const getStudentAttendanceSummary = async (req, res) => {
//   try {
//     const { studentId } = req.params;
    
//     // Validate studentId
//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid student ID format"
//       });
//     }
    
//     // Get current month and year
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1;
//     const currentYear = currentDate.getFullYear();
    
//     // Calculate start and end dates for current month
//     const startDate = new Date(currentYear, currentMonth - 1, 1);
//     const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
//     // Find attendance records for the student in current month
//     const attendanceRecords = await Attendance.find({
//       date: { $gte: startDate, $lte: endDate },
//       "records.studentId": studentId
//     });
    
//     // Calculate statistics
//     let presentCount = 0;
//     let totalClasses = 0;
    
//     attendanceRecords.forEach(record => {
//       const studentRecord = record.records.find(
//         r => r.studentId.toString() === studentId
//       );
      
//       if (studentRecord) {
//         totalClasses++;
//         if (studentRecord.status === "Present") {
//           presentCount++;
//         }
//       }
//     });
    
//     // Calculate attendance percentage
//     const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
//     res.status(200).json({
//       success: true,
//       data: {
//         totalClasses,
//         present: presentCount,
//         absent: totalClasses - presentCount,
//         percentage
//       }
//     });
    
//   } catch (error) {
//     console.error("Error fetching student attendance summary:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };

// Get student attendance by date range
// export const getStudentAttendanceByDateRange = async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const { startDate, endDate } = req.query;
    
//     // Validate studentId
//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid student ID format"
//       });
//     }
    
//     // Validate dates
//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Start date and end date are required"
//       });
//     }
    
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     end.setHours(23, 59, 59, 999); // Set to end of day
    
//     // Find attendance records for the student in the date range
//     const attendanceRecords = await Attendance.find({
//       date: { $gte: start, $lte: end },
//       "records.studentId": studentId
//     })
//     .populate("batchId", "batchName")
//     .populate("attendBy", "name")
//     .sort({ date: 1 });
    
//     // Process the data
//     const studentAttendance = [];
//     let presentCount = 0;
//     let totalClasses = 0;
    
//     attendanceRecords.forEach(record => {
//       const studentRecord = record.records.find(
//         r => r.studentId.toString() === studentId
//       );
      
//       if (studentRecord) {
//         totalClasses++;
//         if (studentRecord.status === "Present") {
//           presentCount++;
//         }
        
//         studentAttendance.push({
//           date: record.date,
//           subject: record.batchId.batchName,
//           status: studentRecord.status.toLowerCase(),
//           takenBy: record.attendBy.name
//         });
//       }
//     });
    
//     // Calculate attendance percentage
//     const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
//     res.status(200).json({
//       success: true,
//       data: {
//         records: studentAttendance,
//         totalClasses,
//         present: presentCount,
//         absent: totalClasses - presentCount,
//         percentage,
//         dateRange: {
//           start: start.toISOString().split('T')[0],
//           end: end.toISOString().split('T')[0]
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error("Error fetching student attendance by date range:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };