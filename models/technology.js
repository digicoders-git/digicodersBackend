import mongoose from "mongoose";
import { type } from "os";

const technologySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    duration: {
      type: String,
      required: true,
      enum: ["45 days", "28 days", "6 months"],
    },
    price:{
        type:Number,
        required:true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for better performance
technologySchema.index({ trainingType: 1});

const TechnologyModal = mongoose.model("Technology", technologySchema);
export default TechnologyModal;