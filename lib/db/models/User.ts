import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  passwordHash: string | null;
  provider: "credentials" | "google";
  role: "customer" | "admin";
  walletBalanceCents: number;
  resetPasswordToken: string | null;
  resetPasswordTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    passwordHash: { type: String, default: null },
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    walletBalanceCents: { type: Number, default: 0 },
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" }
);

export const User = models.User || model<IUser>("User", UserSchema);
