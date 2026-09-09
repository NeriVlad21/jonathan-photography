import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CameraCursor from '../components/CameraCursor.jsx'
import PersistentMusicPlayer from '../components/PersistentMusicPlayer.jsx'
import { MusicPlayerProvider } from '../context/MusicPlayerContext.jsx'

export default function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('public-scroll-theme')

    return () => root.classList.remove('public-scroll-theme')
  }, [])

  return (
    <MusicPlayerProvider>
      <div className="public-shell">
        <CameraCursor />
        <Navbar />
        <main>
          <Outlet />
        </main>
        <PersistentMusicPlayer />
        <Footer />
      </div>
    </MusicPlayerProvider>
  )
}
