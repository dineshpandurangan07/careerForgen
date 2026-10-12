import mongoose, { Schema } from "mongoose";

/**
 * The whole student state (skills, projects, connections, weights, applications,
 * chat history) is stored as a single mixed document that mirrors the shared
 * `StudentState` type. This keeps the readiness engine byte-for-byte compatible
 * with the client. Frequently queried fields are duplicated for indexing.
 */
const studentProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    state: { type: Schema.Types.Mixed, default: {} },
    role: { type: String, default: "fullstack", index: true },
    targetSet: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false },
);

export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
