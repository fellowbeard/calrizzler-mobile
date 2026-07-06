import type { Resource } from "./resource";

export type Account = {
  id: number;
  business_name: string;
  resources: Resource[];
};