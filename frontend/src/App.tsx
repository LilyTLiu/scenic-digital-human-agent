import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import TouristLayout from './pages/tourist/Layout'
import AdminLayout from './pages/admin/Layout'
import HomePage from './pages/tourist/HomePage'
import ChatPage from './pages/tourist/ChatPage'
import RecommendPage from './pages/tourist/RecommendPage'
import TourPage from './pages/tourist/TourPage'
import DigitalHumanPage from './pages/tourist/DigitalHumanPage'
import FAQPage from './pages/tourist/FAQPage'
import Dashboard from './pages/admin/Dashboard'
import KnowledgeBase from './pages/admin/KnowledgeBase'
import DigitalHuman from './pages/admin/DigitalHuman'
import ReportPage from './pages/admin/ReportPage'

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/tourist" replace />} />
        <Route path="/tourist" element={<TouristLayout />}>
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tour" element={<TourPage />} />
          <Route path="recommend" element={<RecommendPage />} />
          <Route path="digital-human" element={<DigitalHumanPage />} />
          <Route path="faq" element={<FAQPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="digital-human" element={<DigitalHuman />} />
          <Route path="reports" element={<ReportPage />} />
        </Route>
      </Routes>
    </UserProvider>
  )
}
