import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CameraOff, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import { servicesApi } from '../services/api.js'

const FALLBACK_FILTERS = ['Weddings', 'Engagement', 'Birthday', 'Christening', 'Debut', 'Burial', 'Portrait']

const FILTER_RECIPES = [
  { filter: 'brightness(1.05) contrast(1.04) saturate(.88) sepia(.08)', accent: '#ead6bd' },
  { filter: 'brightness(1.07) contrast(1.08) saturate(1.08) sepia(.04)', accent: '#f2cb05' },
  { filter: 'brightness(1.08) contrast(1.03) saturate(1.24)', accent: '#e58a62' },
  { filter: 'brightness(1.1) contrast(.96) saturate(.82)', accent: '#d7e7e4' },
  { filter: 'brightness(1.03) contrast(1.12) saturate(.92) sepia(.12)', accent: '#bca2c8' },
  { filter: 'grayscale(.88) contrast(1.12) brightness(.92)', accent: '#b9b7ae' },
  { filter: 'contrast(1.08) saturate(.78) sepia(.1)', accent: '#cab08a' }
]

function uniqueServiceNames(rows) {
  const names = rows.map((service) => service?.name?.trim()).filter(Boolean)
  return [...new Set([...FALLBACK_FILTERS, ...names])]
}

export default function Photobooth() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [filters, setFilters] = useState(FALLBACK_FILTERS)
  const [selected, setSelected] = useState(FALLBACK_FILTERS[0])
  const [cameraState, setCameraState] = useState('idle')
  const [captured, setCaptured] = useState(false)
  const [facingMode, setFacingMode] = useState('user')
  const [message, setMessage] = useState('Camera access starts only when you choose Start camera.')

  useEffect(() => {
    servicesApi.list().then((rows) => setFilters(uniqueServiceNames(Array.isArray(rows) ? rows : []))).catch(() => {})
  }, [])

  const recipe = useMemo(() => {
    const index = Math.max(0, filters.indexOf(selected))
    return FILTER_RECIPES[index % FILTER_RECIPES.length]
  }, [filters, selected])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraState('idle')
  }

  const startCamera = async (mode = facingMode) => {
    stopCamera()
    setCaptured(false)
    setCameraState('loading')
    setMessage('Waiting for camera permission…')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraState('ready')
      setMessage('Live preview stays on this device and is never uploaded.')
    } catch (error) {
      setCameraState('error')
      setMessage(error?.name === 'NotAllowedError'
        ? 'Camera permission was declined. You can allow it in your browser settings and try again.'
        : 'This camera could not be opened. Camera access requires HTTPS or localhost and a supported browser.')
    }
  }

  const switchCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    startCamera(next)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video?.videoWidth || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.save()
    context.filter = recipe.filter
    if (facingMode === 'user') {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.restore()
    context.strokeStyle = recipe.accent
    context.lineWidth = Math.max(8, canvas.width * 0.012)
    context.strokeRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'rgba(10,10,9,.74)'
    context.fillRect(0, canvas.height - Math.max(70, canvas.height * .095), canvas.width, Math.max(70, canvas.height * .095))
    context.fillStyle = '#fff'
    context.font = `600 ${Math.max(24, canvas.width * .027)}px Inter, sans-serif`
    context.fillText(`${selected} · Jonathan Photography`, Math.max(22, canvas.width * .025), canvas.height - Math.max(25, canvas.height * .032))
    setCaptured(true)
    setMessage('Moment captured temporarily. Retake it when you are ready; saving is intentionally unavailable.')
  }

  const retake = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setCaptured(false)
    setMessage('Live preview stays on this device and is never uploaded.')
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <section className="photobooth-page">
      <div className="container photobooth-page__inner">
        <header className="photobooth-intro">
          <div>
            <span className="eyebrow eyebrow--yellow">You found the hidden frame</span>
            <h1 className="display">A small studio<br />inside your <wbr />screen.</h1>
          </div>
          <p>Choose a service-inspired finish, open your camera, and take a temporary portrait. Nothing is uploaded, stored, or offered for download.</p>
        </header>

        <div className="photobooth-studio">
          <div className="photobooth-stage" style={{ '--booth-accent': recipe.accent }} onContextMenu={(event) => event.preventDefault()}>
            <video ref={videoRef} className={captured ? 'is-hidden' : ''} style={{ filter: recipe.filter, transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} autoPlay muted playsInline />
            <canvas ref={canvasRef} className={captured ? 'is-visible' : ''} aria-label="Temporary captured photograph" />
            {cameraState !== 'ready' && !captured && (
              <div className="photobooth-stage__empty">
                <span className="photobooth-stage__camera-mark">
                  {cameraState === 'error' ? <CameraOff size={22} /> : <Camera size={22} />}
                </span>
                <span>{cameraState === 'loading' ? 'Opening camera' : 'Private preview'}</span>
              </div>
            )}
            <span className="photobooth-stage__mark">JP / FOUND FRAME</span>
          </div>

          <aside className="photobooth-controls">
            <div className="photobooth-controls__heading">
              <Sparkles size={17} />
              <span>Occasion finish</span>
            </div>
            <div className="photobooth-filters" role="list" aria-label="Photobooth filters">
              {filters.map((name) => (
                <button key={name} type="button" className={selected === name ? 'is-active' : ''} onClick={() => setSelected(name)}>
                  <i style={{ background: FILTER_RECIPES[filters.indexOf(name) % FILTER_RECIPES.length].accent }} />
                  {name}
                </button>
              ))}
            </div>
            <p className="photobooth-privacy">{message}</p>
            <div className="photobooth-actions">
              {cameraState !== 'ready' && !captured && <button type="button" className="btn btn--primary" onClick={() => startCamera()}>Start camera</button>}
              {cameraState === 'ready' && !captured && <button type="button" className="btn btn--primary" onClick={capture}><Camera size={16} /> Capture</button>}
              {cameraState === 'ready' && !captured && <button type="button" className="btn btn--ghost-dark" onClick={switchCamera}><RefreshCw size={16} /> Flip camera</button>}
              {captured && <button type="button" className="btn btn--primary" onClick={retake}><RotateCcw size={16} /> Retake</button>}
              {(cameraState === 'ready' || captured) && <button type="button" className="btn btn--ghost-dark" onClick={stopCamera}>Close camera</button>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
