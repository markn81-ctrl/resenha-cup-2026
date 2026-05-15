import { ApprovalStatus, Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      approvalStatus: ApprovalStatus;
      username?: string | null;
    };
  }

  interface User {
    role: Role;
    approvalStatus: ApprovalStatus;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    approvalStatus?: ApprovalStatus;
    username?: string | null;
  }
}
