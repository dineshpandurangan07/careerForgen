import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ROLES = ["STUDENT", "RECRUITER", "PLACEMENT_OFFICER", "ADMIN"] as const;
export type UserRole = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, default: null, select: false },
    provider: { type: String, enum: ["password", "google"], default: "password" },
    role: { type: String, enum: ROLES, default: "STUDENT", index: true },
    emailVerified: { type: Boolean, default: false },
    refreshTokenHash: { type: String, default: null, select: false },
    refreshVersion: { type: Number, default: 0, select: false },
    failedLogins: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
    resetTokenHash: { type: String, default: null, select: false },
    resetExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.model("User", userSchema);
