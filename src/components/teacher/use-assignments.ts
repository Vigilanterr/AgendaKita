"use client";

import { useCallback } from "react";
import { useApiData } from "@/lib/use-api-data";
import type { TeacherAssignment } from "@/components/teacher/task-editor";

type AssignmentsResponse = {
  scope: string;
  assignments: TeacherAssignment[];
};

export function useAssignments() {
  const { data, loading, reload: reloadRaw } = useApiData<AssignmentsResponse>(
    "/api/teacher/classes"
  );

  const reload = useCallback(() => {
    reloadRaw();
  }, [reloadRaw]);

  return {
    assignments: data?.assignments ?? [],
    loading,
    reload,
  };
}
