import QrCode from "../models/qrCode.js";

// ✅ Create new QR Code
export const createQrCode = async (req, res) => {
  try {
    const { name ,upi,bankName} = req.body;
    const img = req.file;

    if (!name ||!upi ||!bankName || !img) {
      return res.status(400).json({
        success: false,
        message: "Name and image and upi are required",
      });
    }

    const qrCode = await QrCode.create({
      name,
      upi,
      bankName,
      image: {
        url: img?.path,
        public_id: img?.filename,
      },
    });

    return res.status(201).json({
      success: true,
      message: "QR Code created successfully",

    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating QR Code",
      error: error.message,
    });
  }
};

// ✅ Get all QR Codes
export const getAllQrCodes = async (req, res) => {
  try {
    const qrCodes = await QrCode.find();

    return res.status(200).json({
      success: true,
      count: qrCodes.length,
      data: qrCodes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching QR Codes",
      error: error.message,
    });
  }
};

// ✅ Get QR Code by ID
export const getQrCodeById = async (req, res) => {
  try {
    const qrCode = await QrCode.findById(req.params.id);

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR Code not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: qrCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching QR Code",
      error: error.message,
    });
  }
};


export const deleteQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findByIdAndDelete(req.params.id);
    if (!qrCode) {
      return res.status(404).json({ message: "QR Code not found" });
    }
    return res.status(200).json({ message: "QR Code deleted successfully" });
    
  } catch (error) {
    res.status(500).json({ message: "Error deleting QR Code", error: error.message });
  }
}
export const updataQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, name,upi,bankName } = req.body;
    const img=req?.file
    if (!id) return res.status(400).json({ message: "id is requrid",success:false });
    const qrCode = await QrCode.findById(id);
    if (!qrCode)
      return res.status(404).json({ message: "qrCode data is not found",success:false });
    if (name) qrCode.name = name;
    if (bankName) qrCode.bankName = bankName;
    if (upi) qrCode.upi = upi;
    if (typeof isActive !== "undefined") qrCode.isActive = isActive;
    if(img) {
      qrCode.image.url=img.path
      qrCode.image.public_id=img.filename
    }

    await qrCode.save();
    return res
      .status(200)
      .json({ message: "updata succesfull",success:true  });
  } catch (error) {
    res.status(500).json({ message: "Error updateing qrCode detels" });
  }
};