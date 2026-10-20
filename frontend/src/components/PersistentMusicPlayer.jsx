import { useEffect, useRef, useState } from 'react'
import { Music2, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { useMusicPlayer } from '../context/MusicPlayerContext.jsx'

export default function PersistentMusicPlayer() {
  const iframeRef = useRef(null)
  const [minimized, setMinimized] = useState(false)
  const {
    selectedSong,
    hasStarted,
    isPlaying,
    togglePlayback,
    nextSong,
    previousSong
  } = useMusicPlayer()

  const command = (name) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func: name,
      args: []
    }), '*')
  }

  useEffect(() => {
    if (!hasStarted) return
    command(isPlaying ? 'playVideo' : 'pauseVideo')
  }, [hasStarted, isPlaying])

  const closePlayer = () => {
    if (isPlaying) togglePlayback()
    setMinimized(true)
  }

  return (
    <aside className={`persistent-player is-open${minimized ? ' is-minimized' : ''}`} aria-label="Music player">
      {hasStarted && <iframe
        ref={iframeRef}
        key={selectedSong.youtubeId}
        className="persistent-player__engine"
        title={`${selectedSong.title} audio player`}
        src={`https://www.youtube-nocookie.com/embed/${selectedSong.youtubeId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`}
        allow="autoplay; encrypted-media"
        onLoad={() => command(isPlaying ? 'playVideo' : 'pauseVideo')}
      />}
      <div className="persistent-player__pill">
        <Music2 className="persistent-player__note" size={16} aria-hidden="true" />
        <span className="persistent-player__track" title={`${selectedSong.title} — ${selectedSong.artist}`}>
          <strong className="persistent-player__title">{selectedSong.title}</strong>
          <small className="persistent-player__artist">{selectedSong.artist}</small>
        </span>
        <span className="persistent-player__controls">
          <button type="button" onClick={previousSong} aria-label="Previous song"><SkipBack size={15} /></button>
          <button className="persistent-player__play" type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause song' : 'Play song'}>
            {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </button>
          <button type="button" onClick={nextSong} aria-label="Next song"><SkipForward size={15} /></button>
          <button className="persistent-player__close" type="button" onClick={closePlayer} aria-label="Close music player"><X size={16} /></button>
        </span>
      </div>
      <button className="persistent-player__restore" type="button" onClick={() => setMinimized(false)} aria-label={`Reopen music player. Current song: ${selectedSong.title}`}>
        <Music2 size={17} aria-hidden="true" />
        <span>Music</span>
      </button>
    </aside>
  )
}
