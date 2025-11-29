import Job from "../models/Job.js";
import asyncHandler from "express-async-handler";

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const jobType = req.query.jobType || "";
  const status = req.query.status || "active";
  const company = req.query.company || "";

  // Build filter object
  let filters = {};
  if (status) filters.status = status;
  if (jobType) filters.jobType = jobType;
  if (company) filters.company = company;

  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }
  if (req.student) {
    filters = { assignedStudents: req.student.id };
  }

  const jobs = await Job.getJobs(filters, page, limit);
  const total = await Job.countDocuments(filters);


  res.status(200).json({
    success: true,
    message: "Jobs fetched successfully",
    data: jobs.map((job) => job.getDetails()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
// @desc    Get all jobs for student
// @route   GET /api/jobs/for-student
// @access  Private
const getJobsForStu = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const jobType = req.query.jobType || "";
  const status = req.query.status || "active";
  const company = req.query.company || "";

  // Build filter object
  const filters = { assignedStudents: req.student.id };
  if (status) filters.status = status;
  if (jobType) filters.jobType = jobType;
  if (company) filters.company = company;

  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const jobs = await Job.getJobs(filters, page, limit);
  const total = await Job.countDocuments(filters);

  res.status(200).json({
    success: true,
    message: "Jobs fetched successfully",
    data: jobs.map((job) => job.getDetails()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("company", "name email industry")
    .populate("assignedStudents")
    .populate("createdBy", "name email");

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  res.status(200).json({
    success: true,
    message: "Job fetched successfully",
    data: job.getDetails(),
  });
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    company,
    jobType,
    location,
    salary,
    requirements,
    skills,
    applicationDeadline,
    status,
    assignedStudents,
  } = req.body;

  // Create job
  const job = await Job.create({
    title,
    description,
    company,
    jobType,
    location,
    salary,
    requirements,
    skills: skills || [],
    applicationDeadline: applicationDeadline || null,
    status: status || "active",
    assignedStudents: assignedStudents || [],
    createdBy: req.user.id,
  });

  // Populate the created job
  const populatedJob = await Job.findById(job._id)
    .populate("company", "name email industry")
    .populate("assignedStudents", "name email course skills")
    .populate("createdBy", "name email");

  res.status(201).json({
    success: true,
    message: "Job created successfully",
    data: {
      id: populatedJob._id,
      title: populatedJob.title,
      description: populatedJob.description,
      company: populatedJob.company,
      jobType: populatedJob.jobType,
      location: populatedJob.location,
      salary: populatedJob.salary,
      requirements: populatedJob.requirements,
      skills: populatedJob.skills,
      applicationDeadline: populatedJob.applicationDeadline,
      status: populatedJob.status,
      assignedStudents: populatedJob.assignedStudents,
      createdAt: populatedJob.createdAt,
      updatedAt: populatedJob.updatedAt
    },
  });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("company", "name email industry")
    .populate("assignedStudents", "name email course skills")
    .populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    data: job.getDetails(),
  });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
    data: {},
  });
});

// @desc    Toggle job status
// @route   PATCH /api/jobs/:id/status
// @access  Private
const toggleJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const newStatus = job.status === "active" ? "inactive" : "active";
  job.status = newStatus;
  await job.save();

  res.status(200).json({
    success: true,
    message: `Job ${
      newStatus === "active" ? "activated" : "deactivated"
    } successfully`,
    data: job.getDetails(),
  });
});

// @desc    Assign students to job
// @route   POST /api/jobs/:id/assign-students
// @access  Private
const assignStudentsToJob = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;

  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Verify all students exist
  const students = await Student.find({ _id: { $in: studentIds } });
  if (students.length !== studentIds.length) {
    res.status(400);
    throw new Error("One or more students not found");
  }

  // Add students to job (avoid duplicates)
  const uniqueStudentIds = [
    ...new Set([
      ...job.assignedStudents.map((id) => id.toString()),
      ...studentIds,
    ]),
  ];
  job.assignedStudents = uniqueStudentIds;
  await job.save();

  // Populate the updated job
  const populatedJob = await Job.findById(job._id)
    .populate("company", "name email industry")
    .populate("assignedStudents", "name email course skills")
    .populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Students assigned to job successfully",
    data: populatedJob.getDetails(),
  });
});

// @desc    Remove student from job
// @route   DELETE /api/jobs/:id/remove-student/:studentId
// @access  Private
const removeStudentFromJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Remove student from job
  job.assignedStudents = job.assignedStudents.filter(
    (studentId) => studentId.toString() !== req.params.studentId
  );

  await job.save();

  // Populate the updated job
  const populatedJob = await Job.findById(job._id)
    .populate("company", "name email industry")
    .populate("assignedStudents", "name email course skills")
    .populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Student removed from job successfully",
    data: populatedJob.getDetails(),
  });
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats/overview
// @access  Private
const getJobStats = asyncHandler(async (req, res) => {
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: "active" });
  const jobsByType = await Job.aggregate([
    { $group: { _id: "$jobType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    message: "Job statistics fetched successfully",
    data: {
      totalJobs,
      activeJobs,
      inactiveJobs: totalJobs - activeJobs,
      jobsByType,
    },
  });
});

export {
  getJobs,
  getJob,
  getJobsForStu,
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  assignStudentsToJob,
  removeStudentFromJob,
  getJobStats,
};
