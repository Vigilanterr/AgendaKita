"use client";

import { useEffect, useState } from "react";
import AppShell, { type NavSection } from "@/components/layout/app-shell";
import {
  IconAssignment,
  IconClasses,
  IconOverview,
  IconSubjects,
  IconTasks,
  IconUsers,
} from "@/components/ui/icons";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setName(data.user.name ?? "");
      })
      .catch(() => undefined);
  }, []);

  const sections: NavSection[] = [
    {
      title: "Administrasi",
      items: [
        {
          href: "/admin/dashboard",
          label: "Overview",
          icon: <IconOverview />,
        },
        { href: "/admin/users", label: "Pengguna", icon: <IconUsers /> },
        { href: "/admin/classes", label: "Kelas", icon: <IconClasses /> },
        {
          href: "/admin/subjects",
          label: "Mata pelajaran",
          icon: <IconSubjects />,
        },
        {
          href: "/admin/assignments",
          label: "Penugasan mengajar",
          icon: <IconAssignment />,
        },
        { href: "/admin/tasks", label: "Tugas", icon: <IconTasks /> },
      ],
    },
  ];

  return (
    <AppShell
      sections={sections}
      userName={name || "Admin"}
      roleLabel="Administrator"
      headerTitle="Administrasi"
    >
      {children}
    </AppShell>
  );
}
