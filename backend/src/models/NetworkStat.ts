import mongoose, { Schema, Document } from 'mongoose';

export interface INetworkStat extends Document {
  timestamp: Date;
  throughputMbps: number;
  latencyMs?: number;
  packetLossPercent?: number;
}

const NetworkStatSchema: Schema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    throughputMbps: { type: Number, required: true },
    latencyMs: Number,
    packetLossPercent: Number
  },
  { timestamps: true }
);

export default mongoose.model<INetworkStat>('NetworkStat', NetworkStatSchema);
