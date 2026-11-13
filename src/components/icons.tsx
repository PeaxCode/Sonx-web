import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export const IconHome = (props: IconProps) => (
  <Icon {...props}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" /></Icon>
);
export const IconArrow = (props: IconProps) => (
  <Icon {...props}><path d="M5 12h14m-5-5 5 5-5 5" /></Icon>
);
export const IconCreate = (props: IconProps) => (
  <Icon {...props}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></Icon>
);
export const IconVideo = (props: IconProps) => (
  <Icon {...props}><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m16 10 6-3v10l-6-3" /></Icon>
);
export const IconLibrary = (props: IconProps) => (
  <Icon {...props}><path d="M4 4v16M8 4v16" /><path d="m13 4 7 15.5" /></Icon>
);
export const IconAccount = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
);
export const IconPricing = (props: IconProps) => (
  <Icon {...props}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" /><circle cx="7.5" cy="7.5" r="1.5" /></Icon>
);
export const IconExplore = (props: IconProps) => (
  <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
export const IconBlog = (props: IconProps) => (
  <Icon {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h4M7 13h10M7 16h7" /></Icon>
);
export const IconMail = (props: IconProps) => (
  <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Icon>
);
export const IconPolicy = (props: IconProps) => (
  <Icon {...props}><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const IconPlay = (props: IconProps) => (
  <Icon {...props} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></Icon>
);
export const IconPause = (props: IconProps) => (
  <Icon {...props} fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Icon>
);
export const IconNext = (props: IconProps) => (
  <Icon {...props}><path d="m6 5 10 7-10 7V5Z" fill="currentColor" stroke="none" /><path d="M18 5v14" /></Icon>
);
export const IconPrevious = (props: IconProps) => (
  <Icon {...props}><path d="m18 5-10 7 10 7V5Z" fill="currentColor" stroke="none" /><path d="M6 5v14" /></Icon>
);
export const IconHeart = ({ filled, ...props }: IconProps & { filled?: boolean }) => (
  <Icon {...props} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </Icon>
);
export const IconTrash = (props: IconProps) => (
  <Icon {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Icon>
);
export const IconDownload = (props: IconProps) => (
  <Icon {...props}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></Icon>
);
export const IconClose = (props: IconProps) => (
  <Icon {...props}><path d="M6 6l12 12M18 6 6 18" /></Icon>
);
export const IconChevronDown = (props: IconProps) => (
  <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon>
);
