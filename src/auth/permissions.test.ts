import { canWrite, isOwner, isReadOnly } from "./permissions";
import type { User } from "@/types/user";

const user = (role: User["role"]): User => ({
  id: 1,
  account_id: 1,
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  role,
});

describe("permissions", () => {
  it("allows owners and staff to write", () => {
    expect(canWrite(user("owner"))).toBe(true);
    expect(canWrite(user("staff"))).toBe(true);
    expect(canWrite(user("read_only"))).toBe(false);
  });

  it("identifies owners and read-only users", () => {
    expect(isOwner(user("owner"))).toBe(true);
    expect(isOwner(user("staff"))).toBe(false);
    expect(isReadOnly(user("read_only"))).toBe(true);
    expect(isReadOnly(null)).toBe(false);
  });

  it("does not grant permissions to a missing user", () => {
    expect(canWrite(null)).toBe(false);
    expect(isOwner(null)).toBe(false);
  });
});
