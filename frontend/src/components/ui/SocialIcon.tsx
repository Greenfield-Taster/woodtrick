import type { SocialAccount } from '../../data/social'

const MARKS: Record<SocialAccount['id'], React.ReactNode> = {
  instagram: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17" cy="7" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" />
      <path d="M15.2 7.9h-1.2a2 2 0 0 0-2 2v6.6" />
      <path d="M10 12.4h4.3" />
    </>
  ),
  twitter: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" />
      <path d="M8.6 8.6 15.4 15.4" />
      <path d="M15.4 8.6 8.6 15.4" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="4.4" />
      <path d="M10.5 9.4 16 12l-5.5 2.6z" fill="currentColor" stroke="none" />
    </>
  ),
}

export function SocialIcon({ id, className }: { id: SocialAccount['id']; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'h-4 w-4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {MARKS[id]}
    </svg>
  )
}
