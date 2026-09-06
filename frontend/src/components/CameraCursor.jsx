import { useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'

const STANDARD_CURSOR_TARGETS = 'a, button, input, textarea, select, label, [role="button"], p, h1, h2, h3, h4, li'

export default function CameraCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)')
    if (!finePointer.matches) return undefined

    document.body.classList.add('has-camera-cursor')

    const moveCursor = (event) => {
      const cursor = cursorRef.current
      if (!cursor) return

      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
      cursor.classList.toggle('is-hidden', Boolean(event.target.closest(STANDARD_CURSOR_TARGETS)))
    }

    const hideCursor = () => cursorRef.current?.classList.add('is-hidden')
    const showCursor = () => cursorRef.current?.classList.remove('is-hidden')

    window.addEventListener('pointermove', moveCursor)
    document.documentElement.addEventListener('mouseleave', hideCursor)
    document.documentElement.addEventListener('mouseenter', showCursor)

    return () => {
      document.body.classList.remove('has-camera-cursor')
      window.removeEventListener('pointermove', moveCursor)
      document.documentElement.removeEventListener('mouseleave', hideCursor)
      document.documentElement.removeEventListener('mouseenter', showCursor)
    }
  }, [])

  return (
    <span ref={cursorRef} className="camera-cursor" aria-hidden="true">
      <Camera size={19} strokeWidth={2.1} />
    </span>
  )
}
