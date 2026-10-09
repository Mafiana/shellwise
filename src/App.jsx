import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext.jsx'
import { EnterProvider } from './components/EnterOverlay.jsx'
import SiteShell from './components/SiteShell.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Legal from './pages/Legal.jsx'
import Auth from './pages/Auth.jsx'
import Lab from './pages/Lab.jsx'
import Admin from './pages/Admin.jsx'
import BillingCallback from './pages/BillingCallback.jsx'

export default function App() {
  return (
    <AuthProvider>
      <EnterProvider>
        <Routes>
          <Route element={<SiteShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/billing/callback" element={<BillingCallback />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </EnterProvider>
    </AuthProvider>
  )
}
