import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class strings, resolving conflicts (last wins). */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return twMerge(inputs.filter(Boolean).join(' '))
}
