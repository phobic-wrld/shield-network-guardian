import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityEvent extends Document {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  device?: mongoose.Types.ObjectId;
  resolved: boolean;
  createdAt: Date;
}

const SecurityEventSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    device: { type: Schema.Types.ObjectId, ref: 'Device' },
    resolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);
