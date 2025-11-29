import Registration from "../models/regsitration.js";
import Fee from "../models/fee.js";
import Batch from "../models/batchs.js";
import Teachers from "../models/teachers.js";
import College from "../models/college.js";
import BranchModal from "../models/branch.js";
import manageHr from "../models/manageHr.js";
import TechnologyModal from "../models/technology.js";
import TranningModal from "../models/tranning.js";
export const getAll = async (req, res) => {
  try {
    // Students (Registrations)
    const studentsNew = await Registration.countDocuments({ status: "new" });
    const studentsAccepted = await Registration.countDocuments({
      status: "accepted",
    });
    const studentsRejected = await Registration.countDocuments({
      status: "rejected",
    });
    const studentsAll = await Registration.countDocuments();

    // Fees (Payments)
    const feesNew = await Fee.countDocuments({ status: "new" });
    const feesAccepted = await Fee.countDocuments({ status: "accepted" });
    const feesRejected = await Fee.countDocuments({ status: "rejected" });
    const feesAll = await Fee.countDocuments();

    //  Batch find
    const batchCount = await Batch.countDocuments({ isActive: true });
    //  Teachers find
    const teachersCount = await Teachers.countDocuments({ isActive: true });
    const collegeCount = await College.countDocuments({ isActive: true });
    const branchCount = await BranchModal.countDocuments({ isActive: true });
    const manageHrCount = await manageHr.countDocuments({ isActive: true });
    const technologyCount = await TechnologyModal.countDocuments({
      isActive: true,
    });
    const tranningCount = await TranningModal.countDocuments({
      isActive: true,
    });

    // Final response object
    const counts = {
      students: {
        new: studentsNew,
        accepted: studentsAccepted,
        rejected: studentsRejected,
        all: studentsAll,
      },
      fees: {
        new: feesNew,
        accepted: feesAccepted,
        rejected: feesRejected,
        all: feesAll,
      },
      batchCount,
      teachersCount,
      collegeCount,
      branchCount,
      manageHrCount,
      technologyCount,
      tranningCount,
    };

    res.status(200).json(counts);
  } catch (error) {
    console.error("Error in getAll controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};
