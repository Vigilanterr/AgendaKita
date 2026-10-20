"use client";

import { useEffect, useState } from "react";
import AppShell, { type NavSection } from "@/components/layout/app-shell";
import {
  IconClasses,
  IconDashboard,
  IconDiscussion,
  IconTasks,
} from "@/components/ui/icons";
import type { TeacherAssignment } from "@/components/teacher/task-editor";

export default function TeacherShell({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.user) setName(data.user.name ?? "");
      })
      .catch(() => undefined);

    fetch("/api/teacher/classes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.assignments)) {
          setAssignments(data.assignments);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const sections: NavSection[] = [
    {
      title: "Mengajar",
      items: [
        {
          href: "/teacher/dashboard",
          label: "Dashboard",
          icon: <IconDashboard />,
        },
        { href: "/teacher/tasks", label: "Tugas", icon: <IconTasks /> },
        { href: "/teacher/classes", label: "Kelas Mengajar", icon: <IconClasses /> },
        {
          href: "/teacher/discussions",
          label: "Diskusi",
          icon: <IconDiscussion />,
        },
      ],
    },
  ];

  const classNames = Array.from(
    new Set(assignments.map((a) => a.class_name))
  ).join(", ");

  return (
    <AppShell
      sections={sections}
      userName={name || "Guru"}
      roleLabel={classNames ? `Mengajar: ${classNames}` : "Guru"}
      headerTitle="Portal Guru"
    >
      {children}
    </AppShell>
  );
}
