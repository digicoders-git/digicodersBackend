import College from "../models/college.js";

// Get college names for datalist
export const getCollegeNames = async (req, res) => {
  try {
    const colleges = await College.find();

    return res.status(200).json({
      success: true,
      colleges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching college names",
      error: error.message,
    });
  }
};

// Add new college name
export const addCollegeName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "College name is required",
      });
    }

    const newCollege = await College.create({ name: name ,addedBy:req.user._id });

    res.status(201).json({
      success: true,
      message: "College name added successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "College name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error adding college name",
      error: error.message,
    });
  }
};
export const updataCollage = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      isActive, 
      name, 
      district, 
      state, 
      address, 
      course, 
      tpoNo1, 
      tpoNo2, 
      hodNo 
    } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        message: "ID is required", 
        success: false 
      });
    }
    
    const collage = await College.findById(id);
    if (!collage) {
      return res.status(404).json({ 
        message: "College data not found", 
        success: false 
      });
    }
    
    // Update all provided fields
    if (name) collage.name = name;
    if (typeof isActive !== "undefined") collage.isActive = isActive;
    if (district !== undefined) collage.district = district;
    if (state !== undefined) collage.state = state;
    if (address !== undefined) collage.address = address;
    if (course !== undefined) collage.course = course;
    if (tpoNo1 !== undefined) collage.tpoNo1 = tpoNo1;
    if (tpoNo2 !== undefined) collage.tpoNo2 = tpoNo2;
    if (hodNo !== undefined) collage.hodNo = hodNo;
    
    await collage.save();
    
    return res.status(200).json({ 
      message: "Update successful", 
      success: true,
      college: collage 
    });
  } catch (error) {
    console.error("Error updating college:", error);
    
    // Handle duplicate key error (unique name constraint)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "College name already exists", 
        success: false 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: errors,
        success: false 
      });
    }
    
    return res.status(500).json({ 
      message: "Error updating college details", 
      success: false 
    });
  }
};

export const deleteCollage=async (req,res) => {
  try {
    const collage= await College.findByIdAndDelete(req.params.id)
    if(!collage) return res.status(404).json({message:"data not found",success: false,})
      return res.status(200).json({message:"data deleted successfull",success: true,})
  } catch (error) {
    res.status(500).json({message:"Error deleteing college detels",error,success: false,})
  }
}