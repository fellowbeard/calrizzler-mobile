import type { Resource } from "./resource";

export type Account = {
  id: number;
  business_name: string;
  resources: Resource[];
  timezone: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};
