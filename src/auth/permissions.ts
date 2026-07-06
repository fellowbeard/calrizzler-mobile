import type { User } from "@/types/user";

export function canWrite(user: User | null) {
  return user?.role === "owner" || user?.role === "staff";
}

export function isOwner(user: User | null) {
  return user?.role === "owner";
}

export function isReadOnly(user: User | null) {
  return user?.role === "read_only";
}