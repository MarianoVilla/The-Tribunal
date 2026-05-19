import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { TrialPage } from './pages/TrialPage'
import { GalleryPage } from './pages/GalleryPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuthProvider } from './auth/AuthContext'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trial/:id" element={<TrialPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}
