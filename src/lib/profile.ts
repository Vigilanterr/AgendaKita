import { query } from "@/lib/db";

export { dashboardForRole } from "@/lib/roles";

export type ProfileStatus = {
  class_id: number | null;
  has_password: boolean;
  role: string;
  needs_onboarding: boolean;
};

export async function getProfileStatus(userId: string): Promise<ProfileStatus | null> {
  const { rows } = await query<{
    class_id: number | null;
    role: string;
    has_password: boolean;
  }>(
    `SELECT
       u.class_id,
       u.role,
       EXISTS (
         SELECT 1 FROM accounts a
         WHERE a.user_id = u.id
           AND a.provider_id = 'credential'
           AND a.password IS NOT NULL
       ) AS has_password
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    class_id: row.class_id ?? null,
    has_password: Boolean(row.has_password),
    role: row.role,
    needs_onboarding:
      row.role === "student" && (row.class_id == null || !row.has_password),
  };
}
