import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout         from '@/components/layout/Layout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LandingPage    from '@/pages/LandingPage'
import GeneratePage   from '@/pages/GeneratePage'
import MoodPage       from '@/pages/MoodPage'
import GardenPage     from '@/pages/GardenPage'
import CollectPage    from '@/pages/CollectPage'
import ProfilePage    from '@/pages/ProfilePage'
import XpToast        from '@/components/gamification/XpToast'
import MusicPlayer    from '@/components/player/MusicPlayer'

export default function App() {
  const location = useLocation()

  return (
    <>
      <XpToast />
      <MusicPlayer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public: landing is now the auth page */}
          <Route path="/"     element={<LandingPage />} />

          {/* Protected: require login for everything inside the app */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/generate"      element={<GeneratePage />} />
              <Route path="/mood/:worldId" element={<MoodPage />} />
              <Route path="/garden"        element={<GardenPage />} />
              <Route path="/collection"    element={<CollectPage />} />
              <Route path="/profile"       element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Redirect /auth → / since auth is now on the landing page */}
          <Route path="/auth" element={<LandingPage />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
