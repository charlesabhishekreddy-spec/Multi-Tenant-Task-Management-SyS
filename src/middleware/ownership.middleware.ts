export function canManageTask(
  role: "ADMIN" | "MEMBER",
  userId: string,
  createdBy: string
): boolean {
  if (role === "ADMIN") {
    return true;
  }

  return userId === createdBy;
}
