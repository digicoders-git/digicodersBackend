import mongoose from "mongoose";

const tranningSchama = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    duration: {
      type: String,
      required: true,
      enum: ["45 days", "28 days", "6 months"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const TranningModal = mongoose.model("Tranning", tranningSchama);
export default TranningModal;
