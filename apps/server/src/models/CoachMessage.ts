import mongoose, { Schema } from "mongoose";

const coachMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const CoachMessage = mongoose.model("CoachMessage", coachMessageSchema);
