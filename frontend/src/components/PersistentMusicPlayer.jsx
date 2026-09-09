import { ChevronDown, Music2 } from 'lucide-react'
import { useMusicPlayer } from '../context/MusicPlayerContext.jsx'

export default function PersistentMusicPlayer() {
  const { selectedSong, isOpen, isMinimized, openPlayer, minimizePlayer } = useMusicPlayer()

  return (
    <aside className={`persistent-player ${isOpen ? 'is-open' : ''} ${isMinimized ? 'is-minimized' : ''}`} aria-label="Persistent music player">
      <button className="persistent-player__restore" type="button" onClick={openPlayer} aria-label={`Open music player: ${selectedSong.title}`}>
        <Music2 size={16} aria-hidden="true" />
        <span>{selectedSong.title}</span>
      </button>
      <div className="persistent-player__panel">
        <div className="persistent-player__bar">
          <span>Full song · no Spotify login</span>
          <button type="button" onClick={minimizePlayer} aria-label="Minimize music player"><ChevronDown size={16} /></button>
        </div>
        {isOpen && (
          <iframe
            key={selectedSong.youtubeId}
            className="persistent-player__embed"
            title={`${selectedSong.title} by ${selectedSong.artist} on YouTube`}
            src={`https://www.youtube-nocookie.com/embed/${selectedSong.youtubeId}?autoplay=1&playsinline=1&rel=0`}
            width="100%"
            height="198"
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
    </aside>
  )
}
