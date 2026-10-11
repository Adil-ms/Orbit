import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { photoUrl } from '../../data/images'
import { cn } from '../../lib/ui'

/**
 * Remote photo with a branded gradient underneath. If the photo is slow or fails,
 * the gradient (and an optional icon) still looks intentional.
 */
export default function SmartImage({ image, alt, width = 800, className, icon: Icon, eager = false }) {
  const src = photoUrl(image, width)
  const [status, setStatus] = useState(src ? 'loading' : 'error')

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-linear-to-br from-navy via-navy-700 to-sky',
        className,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center text-white/35">
        {Icon ? <Icon className="size-10" strokeWidth={1.5} /> : status === 'error' && <ImageOff className="size-8" />}
      </div>
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-500',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  )
}
