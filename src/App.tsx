import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import EventsPage from './pages/EventsPage'
import EventDetailsPage from './pages/EventDetailsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotFoundPage from './pages/NotFoundPage'
import AddEventButton from './components/AddEventButton'
import EventModal from './components/EventModal'
import MyEventsPage from './pages/MyEventsPage'
import MembersPage from './pages/MembersPage'
import ConnectPage from './pages/ConnectPage'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="appShell">
          <Navbar />
          <main className="appMain">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<EventsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/event/:id" element={<EventDetailsPage />} />
                <Route path="/my-events" element={<MyEventsPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/connect" element={<ConnectPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <AddEventButton />
          <EventModal />
          <ToastContainer position="bottom-center" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
