import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  name: string;
  mac?: string;
  ip?: string;
  status: 'connected' | 'disconnected' | 'unknown';
  lastSeen?: Date;
  owner?: mongoose.Types.ObjectId;
}

const DeviceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    mac: String,
    ip: String,
    status: { type: String, enum: ['connected', 'disconnected', 'unknown'], default: 'unknown' },
    lastSeen: Date,
    owner: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model<IDevice>('Device', DeviceSchema);
