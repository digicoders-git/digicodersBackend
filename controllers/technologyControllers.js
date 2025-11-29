// ===== TECHNOLOGY CRUD =====
import TranningModal from "../models/tranning.js";
import TechnologyModal from "../models/technology.js";
export const technologyController = async (req, res) => {
  const { action } = req.params;

  try {
    switch (action) {
      case "create":
        await createTechnology(req, res);
        break;

      case "getAll":
        await getAllTechnologies(req, res);
        break;

      case "getById":
        await getTechnologyById(req, res);
        break;

      case "update":
        await updateTechnology(req, res);
        break;

      case "delete":
        await deleteTechnology(req, res);
        break;

      case "getByTrainingDuration":
        await getTechnologiesByTrainingDuration(req, res);
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid action. Available actions: create, getAll, getById, update, delete, getByTrainingType",
        });
    }
  } catch (error) {
    console.error("Technology Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createTechnology = async (req, res) => {
  try {
    const { name, duration, price } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, training type, and category are required",
      });
    }

    const existingTechnology = await TechnologyModal.findOne({ name });
    if (existingTechnology) {
      return res.status(400).json({
        success: false,
        message: "Technology with this name already exists",
      });
    }

    const newTechnology = new TechnologyModal({
      name,
      duration,
      price,
    });

    const savedTechnology = await newTechnology.save();

    return res.status(201).json({
      success: true,
      message: "Technology created successfully",

    });
  } catch (error) {
    throw error;
  }
};

const getAllTechnologies = async (req, res) => {
  try {

    const technologies = await TechnologyModal.find()
      .sort({ createdAt: -1 })
      // .limit(limit * 1)
      // .skip((page - 1) * limit);

    const total = await TechnologyModal.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Technologies retrieved successfully",
      data: technologies,
      // pagination: {
      //   current: page,
      //   pages: Math.ceil(total / limit),
      //   total,
      // },
    });
  } catch (error) {
    throw error;
  }
};

const getTechnologyById = async (req, res) => {
  try {
    const { id } = req.params;

    const technology = await TechnologyModal.findById(id);

    if (!technology) {
      return res.status(404).json({
        success: false,
        message: "Technology not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Technology retrieved successfully",
      data: technology,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid technology ID format",
      });
    }
    throw error;
  }
};

const updateTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, isActive,price } = req.body;

    const existingTechnology = await TechnologyModal.findById(id);
    if (!existingTechnology) {
      return res.status(404).json({
        success: false,
        message: "Technology not found",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;

    if (duration) updateData.duration = duration;
    if (price) updateData.price = price;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    const updatedTechnology = await TechnologyModal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Technology updated successfully",

    });
  } catch (error) {
    throw error;
  }
};

const deleteTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Technology ID is required",
      });
    }
    const technology = await TechnologyModal.findByIdAndDelete(id);
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: "Technology not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Technology deleted successfully",
      data: technology,
    });
  } catch (error) {
    throw error;
  }
};

const getTechnologiesByTrainingDuration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Training id is required",
      });
    }
    const tranning = await TranningModal.findById(id);
    const technologies = await TechnologyModal.find({
      duration: tranning.duration,
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Technologies retrieved successfully",
      data: technologies,
    });
  } catch (error) {
    throw error;
  }
};
