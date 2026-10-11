export const cn = (...classes) => classes.filter(Boolean).join(' ')

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] cursor-pointer'

const sizes = {
  sm: 'h-11 px-4 text-sm sm:h-9', // 44px touch target on phones
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-base',
}

const variants = {
  primary: 'bg-orange text-white hover:bg-orange-600',
  secondary: 'bg-white text-navy ring-1 ring-navy/10 hover:ring-sky hover:text-sky-600',
  dark: 'bg-navy text-white hover:bg-navy-700',
  danger: 'bg-danger text-white hover:bg-red-800', // destructive confirmations only
  ghost: 'text-navy hover:bg-navy/5',
  sky: 'bg-sky-600 text-white hover:bg-navy-700',
  outlineLight: 'text-white ring-1 ring-white/40 hover:bg-white/10',
}

export function buttonClass(variant = 'primary', size = 'md', extra = '') {
  return cn(base, sizes[size], variants[variant], extra)
}
