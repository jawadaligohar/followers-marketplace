import mongoose, { Schema, models, model } from "mongoose";

export interface IServiceTier {
  qty: string;
  qtyValue: number;
  priceCents: number;
  highlight?: boolean;
}

export interface IService {
  _id: mongoose.Types.ObjectId;
  platformId: string;
  platformLabel: string;
  category: string;
  active: boolean;
  supplierServiceId: string | null;
  tiers: IServiceTier[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceTierSchema = new Schema<IServiceTier>(
  {
    qty: { type: String, required: true },
    qtyValue: { type: Number, required: true },
    priceCents: { type: Number, required: true },
    highlight: { type: Boolean, default: false },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    platformId: { type: String, required: true, index: true },
    platformLabel: { type: String, required: true },
    category: { type: String, required: true, default: "Followers" },
    active: { type: Boolean, default: true },
    supplierServiceId: { type: String, default: null },
    tiers: { type: [ServiceTierSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "services" }
);

export const Service = models.Service || model<IService>("Service", ServiceSchema);
