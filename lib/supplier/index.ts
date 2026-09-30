import type { SupplierClient } from "./types";
import { MockSupplierClient } from "./mockSupplierClient";
import { PeakerrSupplierClient } from "./peakerrSupplierClient";

export const supplierClient: SupplierClient = process.env.PEAKERR_API_KEY
  ? new PeakerrSupplierClient(process.env.PEAKERR_API_KEY)
  : new MockSupplierClient();

export type { SupplierClient } from "./types";
