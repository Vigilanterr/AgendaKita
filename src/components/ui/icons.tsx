type IconProps = { className?: string };

const base = "h-4 w-4";

export function IconDashboard({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M3 10.5L10 4l7 6.5M5 9.5V16h10V9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconTasks({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M4 5.5h12M4 10h12M4 14.5h8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IconClasses({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M3 15.5V6.5L10 4l7 2.5v9L10 18l-7-2.5zM10 4v14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="8" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M3 16c0-2.5 2.2-4 5-4s5 1.5 5 4M13.5 5.2a2.4 2.4 0 010 4.6M14.5 12.2c1.6.5 2.5 1.8 2.5 3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IconSubjects({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M3 5.5l7-2 7 2-7 2-7-2zM3 5.5v9L10 16.5l7-2v-9M10 9.5v7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconAssignment({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M4 5.5h12M4 10h7M4 14.5h9M14 9.5l1.6 1.6L19 7.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconOverview({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M3.5 10.5l4-4 3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M3.5 16.5h13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IconDiscussion({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M16.5 11.5a2 2 0 01-2 2H7l-3.5 3v-3a2 2 0 01-1-1.75V5.5a2 2 0 012-2h10a2 2 0 012 2v6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6.5 7.5h7M6.5 10.5h4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
