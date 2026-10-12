import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    co: { type: String, required: true, index: true },
    loc: { type: String, required: true, index: true },
    mode: { type: String, enum: ["Remote", "Hybrid", "On-site"], required: true, index: true },
    lpa: { type: String, required: true },
    min: { type: Number, required: true },
    req: { type: [String], default: [], index: true },
    pref: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "published",
      index: true,
    },
  },
  { timestamps: true },
);

export type JobDoc = mongoose.InferSchemaType<typeof jobSchema> & { _id: mongoose.Types.ObjectId };

export const Job = mongoose.model("Job", jobSchema);
