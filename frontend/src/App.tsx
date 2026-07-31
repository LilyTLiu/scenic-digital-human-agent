import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import SplashScreen from './components/SplashScreen'
import TouristLayout from './pages/tourist/Layout'
import AdminLayout from './pages/admin/Layout'
import HomePage from './pages/tourist/HomePage'
import ChatPage from './pages/tourist/ChatPage'
import SpotExplorePage from './pages/tourist/SpotExplorePage'
import TourPage from './pages/tourist/TourPage'
import SmartPlanPage from './pages/tourist/SmartPlanPage'
import FAQPage from './pages/tourist/FAQPage'
import Dashboard from './pages/admin/Dashboard'
import KnowledgeBase from './pages/admin/KnowledgeBase'
import DigitalHuman from './pages/admin/DigitalHuman'
import ReportPage from './pages/admin/ReportPage'
import ScenicSpots from './pages/admin/ScenicSpots'
import Reviews from './pages/admin/Reviews'
import Checkins from './pages/admin/Checkins'

export default function App() {
  return (
    <UserProvider>
      <SplashScreen />
      <Routes>
        <Route path="/" element={<Navigate to="/tourist" replace />} />
        <Route path="/tourist" element={<TouristLayout />}>
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tour" element={<TourPage />} />
          <Route path="recommend" element={<SpotExplorePage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="plan" element={<SmartPlanPage />} />
          <Route path="real" element={<Navigate to="/tourist/chat" replace />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="scenic-spots" element={<ScenicSpots />} />
          <Route path="digital-human" element={<DigitalHuman />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="checkins" element={<Checkins />} />
          <Route path="reports" element={<ReportPage />} />
        </Route>
      </Routes>
    </UserProvider>
  )
}
