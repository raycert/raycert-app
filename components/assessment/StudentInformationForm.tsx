"use client";

import { Input } from "@/components/ui/input";

/** Required before starting a Post-test (Phase 9C §2) — no email/password/
 * account/PIN, just enough to attribute an attempt to a person + department. */
export function StudentInformationForm({
  fullName,
  department,
  onFullNameChange,
  onDepartmentChange,
  errors,
}: {
  fullName: string;
  department: string;
  onFullNameChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  errors: { fullName?: string; department?: string };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="student-full-name" className="text-[13px] font-semibold text-heading">
          Họ tên
        </label>
        <Input
          id="student-full-name"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          maxLength={100}
          placeholder="Nguyễn Văn A"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "student-full-name-error" : undefined}
          className="h-12"
        />
        {errors.fullName ? (
          <p id="student-full-name-error" role="alert" className="text-sm text-destructive">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="student-department" className="text-[13px] font-semibold text-heading">
          Bộ phận
        </label>
        <Input
          id="student-department"
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          maxLength={100}
          placeholder="Phòng Kinh doanh"
          aria-invalid={!!errors.department}
          aria-describedby={errors.department ? "student-department-error" : undefined}
          className="h-12"
        />
        {errors.department ? (
          <p id="student-department-error" role="alert" className="text-sm text-destructive">
            {errors.department}
          </p>
        ) : null}
      </div>
    </div>
  );
}
