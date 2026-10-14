import mongoose, { Schema, models, model } from "mongoose";
import type { LinkTarget, ServiceKind } from "@/lib/catalog";
import {
  PROVIDERS,
  type ProviderId,
  type ProviderMappings,
} from "@/lib/supplier/providers";

/** Auto plans: surcharge for covering more posts than the included 30. */
export interface IPostsOption {
  posts: number;
  priceCents: number;
}

export interface IServiceTier {
  defaultProvider?: ProviderId | null;
  providerMappings?: ProviderMappings;
  qty: string;
  qtyValue: number;
  priceCents: number;
  highlight?: boolean;
  postsOptions?: IPostsOption[];
}

export interface IService {
  _id: mongoose.Types.ObjectId;
  slug: string;
  kind: ServiceKind;
  target: LinkTarget;
  platformId: string;
  platformLabel: string;
  category: string;
  active: boolean;
  supplierServiceId: string | null;
  defaultProvider?: ProviderId;
  providerMappings?: ProviderMappings;
  tiers: IServiceTier[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostsOptionSchema = new Schema<IPostsOption>(
  {
    posts: { type: Number, required: true },
    priceCents: { type: Number, required: true },
  },
  { _id: false },
);

const ProviderMappingsSchema = new Schema(
  { jap: String, peakerr: String, tiksta: String },
  { _id: false },
);
const ServiceTierSchema = new Schema<IServiceTier>(
  {
    qty: { type: String, required: true },
    defaultProvider: {
      type: String,
      enum: [...PROVIDERS, null],
      default: null,
    },
    providerMappings: { type: ProviderMappingsSchema, default: undefined },
    qtyValue: { type: Number, required: true },
    priceCents: { type: Number, required: true },
    highlight: { type: Boolean, default: false },
    postsOptions: { type: [PostsOptionSchema], default: undefined },
  },
  { _id: false },
);

const ServiceSchema = new Schema<IService>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    kind: {
      type: String,
      enum: ["standard", "auto", "comments", "poll"],
      default: "standard",
    },
    target: {
      type: String,
      enum: [
        "profile",
        "post",
        "video",
        "reel",
        "live",
        "page",
        "tweet",
        "space",
      ],
      default: "profile",
    },
    platformId: { type: String, required: true, index: true },
    platformLabel: { type: String, required: true },
    category: { type: String, required: true, default: "Followers" },
    active: { type: Boolean, default: true },
    supplierServiceId: { type: String, default: null },
    defaultProvider: { type: String, enum: PROVIDERS, default: "peakerr" },
    providerMappings: { type: ProviderMappingsSchema, default: undefined },
    tiers: { type: [ServiceTierSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "services" },
);

if (
  process.env.NODE_ENV === "development" &&
  models.Service &&
  !models.Service.schema.path("providerMappings")
)
  mongoose.deleteModel("Service");
export const Service =
  models.Service || model<IService>("Service", ServiceSchema);
