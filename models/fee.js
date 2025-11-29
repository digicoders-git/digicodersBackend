// models/Fee.js
import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },
    totalFee: { type: Number, required: true }, // Set during registration
    discount: { type: Number },
    finalFee: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["registration", "installment", "full"],
      required: true,
    },
    mode: {
      type: String,
      enum: ["cash", "online", "cheque"],
      required: true,
    },
    qrcode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QrCode",
    },
    hrName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hr",
    },
    tnxId: {
      type: String,
      sparse: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["accepted", "rejected", "new"],
      default: "new",
    },
    tnxStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "full paid"],
      default: "pending",
    },
    installmentNo: {
      type: Number,
      default: 0,
    },
    receiptNo: {
      type: String,
      unique: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    isFullPaid: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    image: {
      url: { type: String },
      public_id: { type: String },
    },
    remark: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);
// Auto-generate receiptNo
feeSchema.pre("save", function (next) {
  if (!this.receiptNo) {
    this.receiptNo = `DCTREC-${new Date().getFullYear()}-${Math.floor(
      100 + Math.random() * 900
    )}`;
  }
  next();
});

const Fee = mongoose.model("Fee", feeSchema);
export default Fee;
