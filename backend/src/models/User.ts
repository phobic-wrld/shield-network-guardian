import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  subscriptionPlan: string; // new field
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    subscriptionPlan: { type: String, enum: ['Basic','Standard','Premium','Ultimate'], default: 'Standard' } // added
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
