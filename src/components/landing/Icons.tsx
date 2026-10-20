import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { children?: ReactNode };
export function Icon({ children, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}
export function CalendarIcon(props: SVGProps<SVGSVGElement>) { return <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2"/></Icon>; }
export function BellIcon(props: SVGProps<SVGSVGElement>) { return <Icon {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></Icon>; }
export function ChatIcon(props: SVGProps<SVGSVGElement>) { return <Icon {...props}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></Icon>; }
export function ShieldIcon(props: SVGProps<SVGSVGElement>) { return <Icon {...props}><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></Icon>; }
export function ArrowIcon(props: SVGProps<SVGSVGElement>) { return <Icon {...props}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>; }
export function CheckIcon(props: SVGProps<SVGSVGElement>) { return <Icon {...props}><path d="m5 12 4 4L19 6"/></Icon>; }
