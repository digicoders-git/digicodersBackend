import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Batch from "../models/batchs.js";
import { getBatchByStudentId } from "./batchController.js";

// Get all assignments
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("batches", "batchName")
      .populate("submissions")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get assignment by ID
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("batches", "batchName")
      .populate({
        path: "submissions",
        populate: [
          { path: "student", select: "name email" },
          { path: "batch", select: "batchName" },
        ],
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create new assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, batches, dueDate, maxMarks } = req.body;

    console.log("Request body:", req.body);
    console.log("Uploaded files:", req.files);

    // Validate required fields
    if (!title || !description || !batches || !dueDate || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Parse batches if it's a string
    let batchIds;
    try {
      batchIds = Array.isArray(batches) ? batches : JSON.parse(batches);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid batches format",
      });
    }

    // Check if batches exist
    const existingBatches = await Batch.find({ _id: { $in: batchIds } });
    if (existingBatches.length !== batchIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more batches not found",
      });
    }

    // Handle file uploads - FIXED
    const assignmentFiles = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // Cloudinary से सही data extract करें
        assignmentFiles.push({
          name: file.originalname,
          url: file.path, // Cloudinary URL
          publicId: file.filename, // Cloudinary public_id
          type: file.mimetype,
        });
      });
    }

    // Create assignment
    const assignment = new Assignment({
      title,
      description,
      batches: batchIds,
      dueDate,
      maxMarks,
      assignmentFiles, // अब यह properly formatted array है
      createdBy: req.user.id,
    });

    await assignment.save();

    // Populate batches for response
    await assignment.populate("batches", "batchName");

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { title, description, batches, dueDate, maxMarks } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = dueDate;
    if (maxMarks) assignment.maxMarks = maxMarks;

    // Handle batches update
    if (batches) {
      const batchIds = Array.isArray(batches) ? batches : JSON.parse(batches);
      const existingBatches = await Batch.find({ _id: { $in: batchIds } });

      if (existingBatches.length !== batchIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more batches not found",
        });
      }

      assignment.batches = batchIds;
    }

    // Handle file uploads
    if (req.files && req.files.assignmentFiles) {
      const files = Array.isArray(req.files.assignmentFiles)
        ? req.files.assignmentFiles
        : [req.files.assignmentFiles];

      files.forEach((file) => {
        assignment.assignmentFiles.push({
          name: file.originalname,
          url: file.path,
          publicId: file.filename,
          type: file.mimetype,
        });
      });
    }

    await assignment.save();
    await assignment.populate("batches", "batchName");

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Delete associated files from Cloudinary
    if (assignment.assignmentFiles.length > 0) {
      for (const file of assignment.assignmentFiles) {
        if (file.publicId) {
          await deleteFile(file.publicId);
        }
      }
    }

    // Delete all submissions for this assignment
    const submissions = await Submission.find({ assignment: req.params.id });
    for (const submission of submissions) {
      if (submission.submittedFile && submission.submittedFile.publicId) {
        await deleteFile(submission.submittedFile.publicId);
      }
    }
    await Submission.deleteMany({ assignment: req.params.id });

    // Delete the assignment
    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove file from assignment
export const removeFileFromAssignment = async (req, res) => {
  try {
    const { assignmentId, fileIndex } = req.params;
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (fileIndex >= assignment.assignmentFiles.length) {
      return res.status(400).json({
        success: false,
        message: "File index out of range",
      });
    }

    // Delete the file from Cloudinary
    const fileToRemove = assignment.assignmentFiles[fileIndex];
    if (fileToRemove.publicId) {
      await deleteFile(fileToRemove.publicId);
    }

    // Remove the file from the array
    assignment.assignmentFiles.splice(fileIndex, 1);
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "File removed successfully",
      assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const studentGetAllAssignments = async (req, res) => {
  try {
    const student = req.student;
    // Student ke saare batches find karo
    const batches = await Batch.find({ students: student._id }).select(
      "_id batchName"
    );

    if (!batches || batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No batches found for this student",
      });
    }  
    // Batch IDs extract karo
    const batchIds = batches.map(batch => batch._id);

     // Assignments find karo jo in batches me hain
    const assignments = await Assignment.find({ 
      batches: { $in: batchIds } 
    })
    .populate('batches', 'batchName')

   return res.status(200).json({
      success: true,
      batches: batches.map(b => b),
      assignments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
