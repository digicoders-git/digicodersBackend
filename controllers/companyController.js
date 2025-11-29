import Company from "../models/company.js";
import asyncHandler from "express-async-handler";

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const industry = req.query.industry || "";

  // Build filter object
  let filters = {};
  if (industry) filters.industry = industry;
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { industry: { $regex: search, $options: "i" } },
    ];
  }

  const companies = await Company.getCompanies(filters, page, limit);
  const total = await Company.countDocuments(filters);

  res.status(200).json({
    success: true,
    message: "Companies fetched successfully",
    data: companies.map((company) => company.getDetails()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private
const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id).populate(
    "createdBy",
    "name email"
  );

  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }

  res.status(200).json({
    success: true,
    message: "Company fetched successfully",
    data: company.getDetails(),
  });
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private
const createCompany = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    mobile,
    contactNumber,
    contactPersonName,
    address,
    city,
    state,
    website,
    industry,
    description,
  } = req.body;

  // Check if company already exists
  const companyExists = await Company.findOne({ email });
  if (companyExists) {
    res.status(400);
    throw new Error("Company with this email already exists");
  }

  // Create company
  const company = await Company.create({
    name,
    email,
    phone,
    mobile,
    contactNumber,
    contactPersonName,
    address,
    city,
    state,
    website,
    industry,
    description,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Company created successfully",
    data: company.getDetails(),
  });
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private
const updateCompany = asyncHandler(async (req, res) => {
  let company = await Company.findById(req.params.id);

  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }

  // Check if email is being changed and if it already exists
  if (req.body.email && req.body.email !== company.email) {
    const companyExists = await Company.findOne({ email: req.body.email });
    if (companyExists) {
      res.status(400);
      throw new Error("Company with this email already exists");
    }
  }

  company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Company updated successfully",
    data: company.getDetails(),
  });
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }

  await Company.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Company deleted successfully",
    data: {},
  });
});

// @desc    Toggle company status
// @route   PATCH /api/companies/:id/status
// @access  Private
const toggleCompanyStatus = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }

  company.isActive = !company.isActive;
  await company.save();

  res.status(200).json({
    success: true,
    message: `Company ${
      company.isActive ? "activated" : "deactivated"
    } successfully`,
    data: company.getDetails(),
  });
});

// @desc    Get company statistics
// @route   GET /api/companies/stats/overview
// @access  Private
const getCompanyStats = asyncHandler(async (req, res) => {
  const totalCompanies = await Company.countDocuments();
  const activeCompanies = await Company.countDocuments({ isActive: true });
  const companiesByIndustry = await Company.aggregate([
    { $group: { _id: "$industry", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    message: "Company statistics fetched successfully",
    data: {
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      companiesByIndustry,
    },
  });
});

export {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  getCompanyStats,
};
