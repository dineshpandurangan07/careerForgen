import mongoose, { Schema } from "mongoose";

export const APP_STATUS = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type AppStatus = (typeof APP_STATUS)[number];

const historySchema = new Schema(
  { status: { type: String, enum: APP_STATUS, required: true }, at: { type: Date, default: Date.now } },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Number, required: true, index: true },
    status: { type: String, enum: APP_STATUS, default: "APPLIED", index: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
