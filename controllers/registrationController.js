import Registration from "../models/regsitration.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import College from "../models/college.js";
import TechnologyModal from "../models/technology.js";
import Fee from "../models/fee.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendSMS } from "../utils/sendSMS.js";
// Add new registration
export const addRegistration = async (req, res) => {
  try {
    const {
      mobile,
      whatshapp,
      studentName,
      training,
      technology,
      education,
      eduYear,
      fatherName,
      email,
      alternateMobile,
      hrName,
      branch,
      collegeName,
      discount,

      amount,
      tnxStatus,
      paymentType,
      paymentMethod,
      password,
      qrcode,
      remark,
      tnxId,
      registeredBy,
    } = req.body;

    // Get technology price if amount not provided
    const tech = await TechnologyModal.findById(technology).select("price");
    const totalFee = tech.price;
    const finalFee = totalFee - discount;
    // Validate payment type
    if (!["registration", "full"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type. Use 'registration' or 'full'",
      });
    }
    // Check if college exists, if not create it
    // let college = await College.findOne({ name: collegeName });
    // if (!college) {
    //   college = new College({ name: collegeName });
    //   await college.save();
    // }
    // Create new registration
    if (paymentMethod === "online" && tnxId) {
      const existingTxn = await Registration.findOne({ tnxId: tnxId });
      if (existingTxn) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID already used for another registration",
        });
      }
    }

    // Create new registration
    const newRegistration = await Registration.create({
      mobile,
      whatshapp,
      studentName,
      training,
      technology,
      education,
      eduYear,
      fatherName,
      email,
      alternateMobile,
      hrName,
      branch,
      collegeName,
      totalFee,
      discount,
      finalFee,
      amount,
      paidAmount: paymentType === "full" ? finalFee : amount,
      dueAmount: paymentType === "full" ? 0 : finalFee - amount,
      tnxStatus: tnxStatus,
      trainingFeeStatus: paymentType === "full" ? "full paid" : "pending",
      paymentType,
      paymentMethod,
      password,
      qrcode,
      remark,
      tnxId: tnxId,
      registeredBy: registeredBy || null,
    });

    const savedRegistration = await newRegistration.save();
    if (amount > 0) {
      const feePayment = await Fee.create({
        registrationId: savedRegistration._id,
        totalFee,
        discount,
        finalFee,
        paidAmount: paymentType === "full" ? finalFee : amount,
        dueAmount: paymentType === "full" ? 0 : finalFee - amount,
        amount: paymentType === "full" ? finalFee : amount,
        paymentType: paymentType,
        mode: paymentMethod,
        qrcode,
        tnxId: tnxId,
        status: "new",
        tnxStatus: tnxStatus,
      });

      await feePayment.save();
    }
    const populatedRegistration = await Registration.findById(
      savedRegistration._id
    )
      .select("-password")
      .populate("training", "name ")
      .populate("technology", "name ")
      .populate("education", "name")
      .populate("hrName", "name");

    const { password: _, ...userResponse } = savedRegistration.toObject();

    // ✅ Send Email
    sendEmail(
      email,
      "Welcome to DigiCoders! Your Registration Details",
      `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Welcome to DigiCoders</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        .detail-row { margin-bottom: 8px; }
        .detail-label { font-weight: 600; color: #444; display: inline-block; width: 150px; }
        .detail-value { color: #222; }
      </style>
    </head>
    <body style="font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; padding: 0; margin: 0;">
      <table align="center" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #0d6efd, #0b5ed7); padding: 25px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;" >DigiCoders</h1>
            <p style="margin: 10px 0 0; font-size: 14px; letter-spacing: 0.5px;">Empowering Future Innovators</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 30px;">
            <h2 style="color: #333333; margin-top: 0; font-weight: 600;">Hello ${
              populatedRegistration.studentName
            } 👋,</h2>
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              Congratulations! Your registration with <strong style="color: #0d6efd;">DigiCoders</strong> has been successfully completed.  
              We're thrilled to have you join our tech family! 🚀
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0; border-left: 4px solid #0d6efd;">
              <h3 style="margin-top: 0; color: #0d6efd; font-size: 18px;">Your Registration Details</h3>
              
              <div class="detail-row"><span class="detail-label">Training Program:</span> <span class="detail-value">${
                populatedRegistration.training?.name
              }</span></div>
              <div class="detail-row"><span class="detail-label">Technology:</span> <span class="detail-value">${
                populatedRegistration.technology?.name
              }</span></div>
              <div class="detail-row"><span class="detail-label">Education:</span> <span class="detail-value">${
                populatedRegistration.education?.name
              } (${eduYear})</span></div>
              <div class="detail-row"><span class="detail-label">College:</span> <span class="detail-value">${
                populatedRegistration.collegeName
              }</span></div>
              <div class="detail-row"><span class="detail-label">Branch:</span> <span class="detail-value">${
                populatedRegistration.branch
              }</span></div>
              <div class="detail-row"><span class="detail-label">HR Contact:</span> <span class="detail-value">${
                populatedRegistration.hrName?.name
              }</span></div>

              
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;">
                <div class="detail-row"><span class="detail-label">Payment Type:</span> <span class="detail-value">${
                  populatedRegistration.paymentType
                }</span></div>
                <div class="detail-row"><span class="detail-label">Total Fee:</span> <span class="detail-value">₹${
                  populatedRegistration.totalFee
                }</span></div>
                ${
                  populatedRegistration.paidAmount
                    ? `<div class="detail-row"><span class="detail-label">Amount Paid:</span> <span class="detail-value">₹${populatedRegistration.paidAmount}</span></div>`
                    : ""
                }
                ${
                  populatedRegistration.dueAmount
                    ? `<div class="detail-row"><span class="detail-label">Remaining Amount:</span> <span class="detail-value">₹${populatedRegistration.dueAmount}</span></div>`
                    : ""
                }
                ${
                  populatedRegistration.couponCode
                    ? `<div class="detail-row"><span class="detail-label">Coupon Code:</span> <span class="detail-value">${
                        populatedRegistration?.couponCode
                      } (₹${couponDiscount || "0"} discount)</span></div>`
                    : ""
                }
                ${
                  populatedRegistration.tnxId
                    ? `<div class="detail-row"><span class="detail-label">Transaction ID:</span> <span class="detail-value">${populatedRegistration.tnxId}</span></div>`
                    : ""
                }
                ${
                  populatedRegistration.orderId
                    ? `<div class="detail-row"><span class="detail-label">Order ID:</span> <span class="detail-value">${populatedRegistration.orderId}</span></div>`
                    : ""
                }
              </div>
            </div>

            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              Your learning journey begins now — and we're here to guide you at every step. Please keep this email for your reference.
            </p>

            <div style="margin: 25px 0; text-align: center;">
              <a href="https://thedigicoders.com" target="_blank" style="background-color: #0d6efd; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; transition: all 0.3s ease;" onmouseover="this.style.backgroundColor='#0b5ed7'" onmouseout="this.style.backgroundColor='#0d6efd'">Visit Our Website</a>
            </div>

            <div style="background-color: #fff8e1; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #ff8f00; font-size: 16px;">📌 Important Notes</h4>
              <ul style="margin-bottom: 0; padding-left: 20px; font-size: 14px; color: #555;">
                <li>Your login credentials UserID: ${
                  populatedRegistration.mobile
                } Password: ${populatedRegistration.mobile}</li>
                <li>Please save your Transaction ID for future reference</li>
                <li>Contact your HR ${
                  populatedRegistration.hrName?.name
                } for any queries</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #888888; border-top: 1px solid #eee; padding-top: 15px; margin-bottom: 5px;">
              <strong>Need help?</strong> Contact us at:
              <br/> 📧 <a href="mailto:support@thedigicoders.com" style="color: #0d6efd;">support@thedigicoders.com</a>  
              <br/> 📞 <a href="tel:+916394296293" style="color: #0d6efd;">+91 6394296293</a>
              <br/> 📱 Alternate: <a href="tel:919198483820" style="color: #0d6efd;">91 9198483820</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} DigiCoders. All rights reserved.</p>
            <p style="margin: 5px 0 0; font-size: 11px;">Empowering the next generation of tech innovators</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: userResponse,
      populatedRegistration,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(400).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

//login student email / mobile / UserId
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password",
      });
    }
    const user = await Registration.findOne({
      $or: [{ email: username }, { mobile: username }, { userid: username }],
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const isMatch = user.password === password;
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    return res
      .status(200)
      .json({ message: "login successfull", success: true, user });
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ message: "internal server error", success: false, error });
  }
};

//get singal user by email or mobile or id
export const getOneRegistrations = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Please provide username",
      });
    }

    const registration = await Registration.find({
      $or: [{ email: username }, { mobile: username }, { userid: username }],
    })
      .select("-password")
      .populate("training", "name")
      .populate("technology", "name")
      .populate("education", "name")
      .populate("registeredBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("hrName", "name")
      .populate("branch", "name")
      .populate("qrcode", "name upi")
      .sort({ createdAt: -1 });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registration",
      error: error.message,
    });
  }
};

// Get single registration by ID or email
export const getRegistration = async (req, res) => {
  try {
    const { id, email, userid } = req.query;

    let query = {};
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
        });
      }
      query._id = id;
    } else if (email) {
      query.email = email;
    } else if (userid) {
      query.userid = userid;
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide id, email, or userid",
      });
    }

    const registration = await Registration.findOne(query)
      .select("-password")
      .populate("training", "name duration")
      .populate("technology", "name")
      .populate("education", "name")
      .populate("registeredBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("hrName", "name")
      .populate("branch", "name")
      .populate("qrcode", "name upi");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registration",
      error: error.message,
    });
  }
};

// Get all registrations with pagination and filters
export const getAllRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      training,
      technology,
      status,
      acceptStatus,
    } = req.query;

    // Build filter object
    const filter = {};
    if (training) filter.training = training;
    if (technology) filter.technology = technology;
    if (status) filter.status = status;
    if (acceptStatus) filter.acceptStatus = acceptStatus;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const registrations = await Registration.find(filter)
      .select("-password")
      .populate("training", "name duration")
      .populate("technology", "name duration")
      .populate("education", "name")
      .populate("registeredBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("branch", "name ")
      .populate("qrcode")
      .populate("hrName", "name ")
      .sort({ createdAt: -1 });
    // .skip(skip)
    // .limit(limitNum);

    const total = await Registration.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching registrations",
      error: error.message,
    });
  }
};

// Update registration
export const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    // For formidable, fields are in req.fields and files in req.files
    const body = req.body || {};
    const files = req.files || {};

    // console.log("Request body:", id);
    console.log("Request body:", body);
    console.log("Request files:", files);

    const {
      whatshapp,
      studentName,
      technology,
      eduYear,
      fatherName,
      alternateMobile,
      joiningData,
      isJoin,
      dateOfBirth,
      gender,
      address,
      district,
      pincode,
      guardianMobile,
      guardianMobileVerification,
      guardianRelation,
      higherEducation,
      lastQualification,
      idCardIssued,
      certificateIssued,
      hardForm,
      aadharCardUploded,
      tSartIssued,
      isJobNeed,
      placementStatus,
      cvUploded,
      placeInCompany,
      interviewInCompanines,
      photoSummited,
      branch,
      collegeName,
      tnxId,
      remark,
    } = body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Registration ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Find the existing registration
    const student = await Registration.findById(id).populate("technology");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (files.profilePhoto) {
      student.profilePhoto.url = files.profilePhoto[0].path;
      student.profilePhoto.public_id = files.profilePhoto[0].filename;
    }

    if (files.cv) {
      student.cv.url = files.cv[0].path;
      student.cv.public_id = files.cv[0].filename;
    }

    if (files.aadharCard) {
      student.aadharCard.url = files.aadharCard[0].path;
      student.aadharCard.public_id = files.aadharCard[0].filename;
    }

    if (whatshapp) student.whatshapp = whatshapp;
    if (studentName) student.studentName = studentName;
    if (eduYear) student.eduYear = eduYear;
    if (fatherName) student.fatherName = fatherName;
    if (alternateMobile) student.alternateMobile = alternateMobile;
    if (joiningData) student.joiningData = joiningData;
    if (typeof isJoin !== "undefined") student.isJoin = isJoin;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (address) student.address = address;
    if (district) student.district = district;
    if (pincode) student.pincode = pincode;
    if (guardianMobile) student.guardianMobile = guardianMobile;
    if (typeof guardianMobileVerification !== "undefined")
      student.guardianMobileVerification = guardianMobileVerification;
    if (guardianRelation) student.guardianRelation = guardianRelation;
    if (higherEducation) student.higherEducation = higherEducation;
    if (lastQualification) student.lastQualification = lastQualification;
    if (typeof idCardIssued !== "undefined")
      student.idCardIssued = idCardIssued;
    if (typeof certificateIssued !== "undefined")
      student.certificateIssued = certificateIssued;
    if (typeof hardForm !== "undefined") student.hardForm = hardForm;
    if (typeof aadharCardUploded !== "undefined")
      student.aadharCardUploded = aadharCardUploded;
    if (typeof tSartIssued !== "undefined") student.tSartIssued = tSartIssued;
    if (typeof isJobNeed !== "undefined") student.isJobNeed = isJobNeed;
    if (typeof placementStatus !== "undefined")
      student.placementStatus = placementStatus;
    if (typeof cvUploded !== "undefined") student.cvUploded = cvUploded;
    if (placeInCompany) student.placeInCompany = placeInCompany;
    if (interviewInCompanines)
      student.interviewInCompanines = interviewInCompanines;
    if (typeof photoSummited !== "undefined")
      student.photoSummited = photoSummited;

    if (branch) student.branch = branch;
    if (collegeName) student.collegeName = collegeName;
    if (tnxId) student.tnxId = tnxId;
    if (remark) student.remark = remark;
    // If technology is being changed, fetch the new technology's price
    if (technology && technology !== student.technology._id) {
      const newTechnology = await TechnologyModal.findById(technology);
      if (!newTechnology) {
        return res.status(404).json({
          success: false,
          message: "Technology not found",
        });
      }

      // Update technology and total fee
      student.technology = technology;
      student.totalFee = newTechnology.price;

      // Recalculate final fee and due fee
      student.finalFee = student.totalFee - student.discount;

      student.dueAmount =
        newTechnology.price - student.paidAmount - student.discount;
    }

    // Save the updated student
    await student.save();

    res.status(200).json({
      success: true,
      message: "Registration updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({
      success: false,
      message: "Error updating registration",
      error: error.message,
    });
  }
};
// Update registration status
export const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Registration ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Validate status values
    const validStatuses = ["new", "accepted", "rejected"];
    // const validAcceptStatuses = ["pending", "accepted", "rejected"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: new, accepted, rejected",
      });
    }

    // if (acceptStatus && !validAcceptStatuses.includes(acceptStatus)) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "Invalid accept status. Must be one of: pending, accepted, rejected",
    //   });
    // }

    // Build update object
    const updateData = {};
    if (status) updateData.status = status;
    // if (acceptStatus) updateData.acceptStatus = acceptStatus;
    if (status === "accepted") updateData.tnxStatus = "paid";
    // Set verifiedBy to current user
    updateData.verifiedBy = user._id;

    const updatedRegistration = await Registration.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    // .select("-password")
    // .populate("training", "name duration")
    // .populate("technology", "name duration")
    // .populate("education", "name")
    // .populate("registeredBy", "name email")
    // .populate("verifiedBy", "name email");

    if (!updatedRegistration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration status updated successfully",
      data: updatedRegistration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating registration status",
      error: error.message,
    });
  }
};

// Delete registration
export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Registration ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const deletedRegistration = await Registration.findByIdAndDelete(id);

    if (!deletedRegistration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting registration",
      error: error.message,
    });
  }
};

export const sendmail = async (req, res) => {
  try {
    const { mobile } = req.body;

    await sendSMS(
      mobile,
      `Hi KRISHNA KUMAR, thank you for registering at DigiCoders.`
    );
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending email",
      error: error.message,
    });
  }
};
export const sendOtp = async (req, res) => {
  try {
    const { userid } = req.body;
    const student = await Registration.findById(userid);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid userid or mobile",
      });
    }

    const newotp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
    student.otp = newotp;
    await student.save();

    // Send email
    await sendEmail(student.email, `Your OTP is: ${newotp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      email: student.email,
      newotp,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const { otp, userid } = req.body;
    const student = await Registration.findById(userid);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid userid or mobile",
      });
    }

    // Convert both to string for safe comparison
    if (String(student.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ✅ OTP matched → clear it
    student.otp = null;
    await student.save();
    // Generate tokens
    const accessToken = await student.generateToken();
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: parseInt(process.env.COOKIE_EXPIRE),
    });
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      userId: student._id,
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};
