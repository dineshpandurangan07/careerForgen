import { blank, type StudentState } from "@careerforge/shared";
import { StudentProfile } from "../models/StudentProfile.js";

export interface LoadedProfile {
  profileId: string;
  state: StudentState;
  isNew: boolean;
}

/** Loads a student's state, seeding a blank one (with the login email) on first use. */
export async function loadProfile(userId: string, email: string): Promise<LoadedProfile> {
  let doc = await StudentProfile.findOne({ userId });
  if (!doc) {
    const state = blank(email);
    doc = await StudentProfile.create({ userId, state, role: state.role, targetSet: false });
    return { profileId: String(doc._id), state, isNew: true };
  }
  const state = { ...blank(email), ...(doc.state as StudentState) } as StudentState;
  if (!state.connect?.email) state.connect.email = email;
  return { profileId: String(doc._id), state, isNew: false };
}

export async function saveState(userId: string, state: StudentState): Promise<void> {
  await StudentProfile.updateOne(
    { userId },
    { $set: { state, role: state.role, targetSet: state.targetSet } },
    { upsert: true },
  );
}
