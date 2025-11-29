import ExpressMongoSanitize from "express-mongo-sanitize";
import Hr from "../models/manageHr.js";

export const createHr = async (req, res) => {
  try {
    const { name, branch, personalNo, officeNo } = req.body;

    // Required fields check
    if (!name || !branch) {
      return res.status(400).json({
        success: false,
        message: "Name and Branch are required",
      });
    }

    const hr = await Hr.create({ name, branch, personalNo, officeNo });

    return res.status(201).json({
      success: true,
      message: "HR created successfully!",
      data: hr, // created HR object return karo
    });
  } catch (error) {
    console.error("Error creating HR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getAllHr = async (req, res) => {
  try {
    const hr = await Hr.find().populate("branch","name");
    return res
      .status(200)
      .json({ message: "successfull", data: hr, success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error", error, success: false });
  }
};

export const updataHr = async (req, res) => {
  try {
    const { name, isActive, branch, personalNo, officeNo } = req.body;
    const hr = await Hr.findById(req.params.id);
    if (!hr)
      return res.status(404).json({ message: "hr not found", success: false });
    if (typeof isActive !== "undefined") hr.isActive = isActive;
    if (name) hr.name = name;
    if (branch) hr.branch = branch;
    if (personalNo) hr.personalNo = personalNo;
    if (officeNo) hr.officeNo = officeNo;
    await hr.save();
    return res
      .status(200)
      .json({ message: "Hr updated successfull", success: true });
  } catch (error) {
    res.status(500).json({
      message: "internal server error",
      success: false,
      error,
      success: false,
    });
  }
};

export const deletaHr = async (req, res) => {
  try {
    const hr = await Hr.findByIdAndDelete(req.params.id);
    if (!hr)
      return res
        .status(404)
        .json({ message: "Hr deleting faild!", success: false });
    return res
      .status(200)
      .json({ message: "Hr deleted successfull ", success: true });
  } catch (error) {
    res.status(500).json({ message: "internal server error", success: false });
  }
};
