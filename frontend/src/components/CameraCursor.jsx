import { useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'

export default function CameraCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!finePointer.matches) return undefined

    const root = document.documentElement
    root.classList.add('has-camera-cursor')

    const moveCursor = (event) => {
      const cursor = cursorRef.current
      if (!cursor) return

      cursor.style.setProperty('--cursor-x', `${event.clientX}px`)
      cursor.style.setProperty('--cursor-y', `${event.clientY}px`)
      cursor.classList.add('is-ready')
      cursor.classList.remove('is-hidden')
    }

    const hideCursor = () => cursorRef.current?.classList.add('is-hidden')
    const showCursor = () => cursorRef.current?.classList.remove('is-hidden')

    window.addEventListener('pointermove', moveCursor)
    document.documentElement.addEventListener('mouseleave', hideCursor)
    document.documentElement.addEventListener('mouseenter', showCursor)

    return () => {
      root.classList.remove('has-camera-cursor')
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
