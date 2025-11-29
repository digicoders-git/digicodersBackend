// controllers/feeController.js
import Registration from "../models/regsitration.js";
import Fee from "../models/fee.js";

// Record a payment
export const recordPayment = async (req, res) => {
  try {
    const {
      registrationId,
      amount,
      paymentType,
      mode,
      isFullPaid,
      hrName,
      tnxStatus,
      qrcode,
      tnxId,
      remark,
    } = req.body;
    // console.log(req.body);

    // Validate payment
    if (!registrationId || !amount || !mode) {
      return res.status(400).json({
        success: false,
        message: "Registration ID, amount and payment mode are required",
      });
    }
    // Create new registration
    if (mode === "online" && tnxId) {
      const existingTxn = await Fee.findOne({ tnxId: tnxId });
      if (existingTxn) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID already used for another registration",
        });
      }
    }

    // Find registration
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    let admin;
    admin = req.user;
    admin = req.student;
    const img = req.file;

    const paidAmount = Number(registration.paidAmount) + Number(amount);
    const dueAmount = Number(registration.dueAmount) - Number(amount);
    const fee = await Fee.create({
      registrationId,
      totalFee: registration.totalFee,
      finalFee: registration.finalFee,
      paidAmount: paidAmount,
      amount,
      dueAmount: registration.dueAmount - amount,
      paymentType,
      mode,
      tnxStatus: dueAmount === 0 ? "full paid" : tnxStatus,
      qrcode,
      tnxId: tnxId,
      remark,
      image: {
        url: img?.path,
        public_id: img?.filename,
      },
      paidBy: admin?._id,
    });

    // await fee.save();

    // Update registration payment status
    registration.paidAmount = paidAmount;
    registration.dueAmount = dueAmount;
    registration.trainingFeeStatus = dueAmount === 0 ? "full paid" : "partial";

    await registration.save();

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      id: fee._id,
      fee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};
//get all payments
// export const getallPayments = async (req, res) => {
//   try {
//     const payments = await Fee.find()
//       .populate(
//         "registrationId",
//         "studentName email mobile userid fatherName collegeName"
//       )
//       .populate("qrcode")
//       .sort({ paymentDate: -1 });
//     res.status(200).json({
//       success: true,
//       data: payments,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching payments",
//       error: error.message,
//     });
//   }
// };
// controllers/feeController.js

// backend controller mein yeh changes karein:

export const getallPayments = async (req, res) => {
  console.log(req.query)
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "paymentDate",
      sortOrder = "desc",
      branch,
      batch,
      minPaid,
      maxPaid,
      due,
      startDate,
      endDate,
      tnxStatus,
      paymentType,  // ✅ ADD: For payment type filter
      mode,         // ✅ ADD: For payment mode filter
    } = req.query;

    console.log("📥 Received filters:", branch); // Debug log

    const skip = (page - 1) * limit;
    const match = {};

    // 💰 Paid Amount range
    if (minPaid || maxPaid) {
      match.paidAmount = {};
      if (minPaid) match.paidAmount.$gte = Number(minPaid);
      if (maxPaid) match.paidAmount.$lte = Number(maxPaid);
    }

    // 💸 Due Amount
    if (due) {
      if (due === "yes") match.dueAmount = { $gt: 0 };
      if (due === "no") match.dueAmount = { $eq: 0 };
    }

    // 📅 Date range
    if (startDate || endDate) {
      match.paymentDate = {};
      if (startDate) match.paymentDate.$gte = new Date(startDate);
      if (endDate) match.paymentDate.$lte = new Date(endDate);
    }

    // ✅ ADD: Transaction status filter
    if (tnxStatus) {
      match.tnxStatus = tnxStatus;
    }

    // ✅ ADD: Payment type filter
    if (paymentType) {
      match.paymentType = paymentType;
    }

    // ✅ ADD: Payment mode filter
    if (mode) {
      match.mode = mode;
    }

    // 🚀 Aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "registrations",
          localField: "registrationId",
          foreignField: "_id",
          as: "registrationId",
        },
      },
      { $unwind: "$registrationId" },

      // 🎯 Branch & Batch filters
      ...(branch ? [{ $match: { "registrationId.branch": branch } }] : []),
      ...(batch ? [{ $match: { "registrationId.batch": batch } }] : []),

      // 🔍 Search filter
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "registrationId.studentName": { $regex: search, $options: "i" } },
                  { "registrationId.email": { $regex: search, $options: "i" } },
                  { "registrationId.mobile": { $regex: search, $options: "i" } },
                  { "registrationId.userid": { $regex: search, $options: "i" } },
                  { "registrationId.fatherName": { $regex: search, $options: "i" } },
                  { "registrationId.collegeName": { $regex: search, $options: "i" } },
                  { "registrationId.branch": { $regex: search, $options: "i" } },
                  { "registrationId.batch": { $regex: search, $options: "i" } },
                  { tnxId: { $regex: search, $options: "i" } },
                  { receiptNo: { $regex: search, $options: "i" } },
                  { paymentType: { $regex: search, $options: "i" } },
                  { mode: { $regex: search, $options: "i" } },
                  { tnxStatus: { $regex: search, $options: "i" } },
                  { status: { $regex: search, $options: "i" } },
                  { remark: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      // ✅ Apply all match conditions
      { $match: match },

      // 🧾 Sort
      { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },

      // 📄 Pagination
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ];


    // ⚙️ Execute aggregation
    const payments = await Fee.aggregate(pipeline);

    // 📊 Count total documents
    const countPipeline = [
      {
        $lookup: {
          from: "registrations",
          localField: "registrationId",
          foreignField: "_id",
          as: "registrationId",
        },
      },
      { $unwind: "$registrationId" },
      ...(branch ? [{ $match: { "registrationId.branch": branch } }] : []),
      ...(batch ? [{ $match: { "registrationId.batch": batch } }] : []),
      ...(search ? [{
        $match: {
          $or: [
            { "registrationId.studentName": { $regex: search, $options: "i" } },
            { "registrationId.email": { $regex: search, $options: "i" } },
            { "registrationId.mobile": { $regex: search, $options: "i" } },
            { tnxId: { $regex: search, $options: "i" } },
            { receiptNo: { $regex: search, $options: "i" } },
            { paymentType: { $regex: search, $options: "i" } },
            { mode: { $regex: search, $options: "i" } },
          ],
        },
      }] : []),
      { $match: match },
      { $count: "total" }
    ];

    const totalResult = await Fee.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// Get payment history for a registration
export const getPaymentHistory = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const payments = await Fee.find({ registrationId: registrationId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment history",
      error: error.message,
    });
  }
};
export const getPaymentHistoryToken = async (req, res) => {
  try {
    const id = req.student;
    const payments = await Fee.find({ registrationId: id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment history",
      error: error.message,
    });
  }
};

// Check dues for a registration
export const checkDues = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalFee: registration.totalFee,
        paidAmount: registration.paidAmount,
        remainingFee: registration.dueAmount,
        paymentStatus: registration.paymentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking dues",
      error: error.message,
    });
  }
};

export const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !["accepted", "rejected", "new"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Find fee
    const FeeData = await Fee.findById(id);
    if (!FeeData) {
      return res.status(404).json({
        success: false,
        message: "Fee Data not found",
      });
    }

    const Student = await Registration.findById({
      _id: FeeData.registrationId,
    });
    if (!Student)
      return res
        .status(404)
        .json({ message: "registration data is not found" });

    // Update status
    FeeData.status = status;
    FeeData.verifiedBy = req.user.id;
    FeeData.tnxStatus =
      status === "accepted"
        ? "paid"
        : status === "rejected"
        ? "failed"
        : "pending";
    if (status === "rejected") {
      Student.paidAmount = Student.paidAmount - FeeData.amount;
      Student.dueAmount = Student.dueAmount + FeeData.amount;
      await Student.save();
    }
    await FeeData.save();

    res.status(200).json({
      success: true,
      message: "FeeData status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating FeeData status",
      error: error.message,
    });
  }
};
export const getFeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedata = await Fee.findOne({
      $or: [{ _id: id }, { registrationId: id }],
    }).populate({
      path: "registrationId",
      select:
        "collegeName fatherName email mobile paymentStatus studentName training technology education userid eduYear",
      populate: [
        { path: "training", select: "name" },
        { path: "technology", select: "name" },
        { path: "education", select: "name" },
      ],
    });
    if (!feedata)
      return res
        .status(404)
        .json({ success: false, message: "fee data not found" });
    return res
      .status(200)
      .json({ success: true, message: "feaching successfull", data: feedata });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error featching fee data",
      error: error.message,
    });
  }
};
export const deleteFeeData = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const feeData = await Fee.findById(id);
    if (!feeData) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    // Delete record
    await Fee.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Fee record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
