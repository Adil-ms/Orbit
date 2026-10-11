import { Link } from 'react-router'
import { Compass } from 'lucide-react'
import Mascot from '../components/mascot/Mascot'
import { buttonClass } from '../lib/ui'

export default function NotFound({
  title = 'This page drifted out of orbit',
  text = 'The page you’re looking for doesn’t exist. Let’s get you back on course.',
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Mascot state="thinking" size={150} />
      <h1 className="mt-6 text-3xl font-medium sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/adventure" className={buttonClass('primary', 'lg')}>
          <Compass className="size-5" /> Find an Adventure
        </Link>
        <Link to="/" className={buttonClass('secondary', 'lg')}>
          Go home
        </Link>
      </div>
    </div>
  )
}
