"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRole } from "@/features/admin/users-actions";
import type { Enums } from "@/types/database.types";

export function UserRoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: Enums<"user_role">;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Enums<"user_role">>(role);
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const nextRole = next as Enums<"user_role">;
    setValue(nextRole);
    startTransition(async () => {
      const res = await setUserRole(userId, nextRole);
      if (res.error) {
        toast.error(res.error);
        setValue(role);
        return;
      }
      toast.success("Role updated.");
      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="mentor">Mentor</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
