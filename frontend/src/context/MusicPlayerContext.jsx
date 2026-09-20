import { createContext, useContext, useMemo, useState } from 'react'
import { useEffect } from 'react'
import { useSiteContent } from './SiteContentContext.jsx'

export const FAVORITE_SONGS = [
  { title: 'I Want It That Way', artist: 'Backstreet Boys', youtubeId: '4fndeDfaWCg' },
  { title: 'Wonderful Tonight', artist: 'Eric Clapton', youtubeId: 'fxAiUq8yn34' },
  { title: 'Wake Me Up Before You Go-Go', artist: 'Wham!', youtubeId: 'pIgZ7gMze7A' },
  { title: '214', artist: 'Rivermaya', youtubeId: 'd59MC-PEJK0' },
  { title: 'Every Breath You Take', artist: 'The Police', youtubeId: 'OMOGaugKpzs' },
  { title: 'Kahit Maputi Na Ang Buhok Ko', artist: 'Rey Valera', youtubeId: 'EuuWgPrhvWQ' },
  { title: 'Truly Madly Deeply', artist: 'Savage Garden', youtubeId: 'WQnAxOQxQIU' },
  { title: 'With a Smile', artist: 'Eraserheads', youtubeId: 'TtqAUOxwh-k' },
  { title: 'Tuwing Umuulan at Kapiling Ka', artist: 'Eraserheads', youtubeId: 'vDxPghU4UBU' },
  { title: 'How Deep Is Your Love', artist: 'Bee Gees', youtubeId: 'XpqqjU7u5Yc' }
]

const MusicPlayerContext = createContext(null)

export function MusicPlayerProvider({ children }) {
  const siteContent = useSiteContent()
  const songs = siteContent.music?.songs?.length ? siteContent.music.songs : FAVORITE_SONGS
  const [selectedSong, setSelectedSong] = useState(songs[0])
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const selectAt = (index) => {
    const wrappedIndex = (index + songs.length) % songs.length
    setSelectedSong(songs[wrappedIndex])
    setIsOpen(true)
    setIsPlaying(true)
  }

  const value = useMemo(() => ({
    songs,
    selectedSong,
    isOpen,
    isPlaying,
    selectSong(song) {
      setSelectedSong(song)
      setIsOpen(true)
      setIsPlaying(true)
    },
    openPlayer() {
      setIsOpen(true)
      setIsPlaying(true)
    },
    togglePlayback() {
      setIsOpen(true)
      setIsPlaying((playing) => !playing)
    },
    stopPlayback() {
      setIsPlaying(false)
    },
    nextSong() {
      selectAt(songs.findIndex((song) => song.youtubeId === selectedSong.youtubeId) + 1)
    },
    previousSong() {
      selectAt(songs.findIndex((song) => song.youtubeId === selectedSong.youtubeId) - 1)
    }
  }), [selectedSong, isOpen, isPlaying, songs])

  useEffect(() => {
    if (!songs.some((song) => song.youtubeId === selectedSong?.youtubeId)) setSelectedSong(songs[0])
  }, [songs, selectedSong])

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const value = useContext(MusicPlayerContext)
  if (!value) throw new Error('useMusicPlayer must be used inside MusicPlayerProvider')
  return value
}
