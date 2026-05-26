import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/attendee/Home';
import EventDetail from './pages/attendee/EventDetail';
import Checkout from './pages/attendee/Checkout';
import MyTickets from './pages/attendee/MyTickets';
import Wishlist from './pages/attendee/Wishlist';
import OrderHistory from './pages/attendee/OrderHistory';
import Dashboard from './pages/organiser/Dashboard';
import CreateEvent from './pages/organiser/CreateEvent';
import EditEvent from './pages/organiser/EditEvent';
import ManageTickets from './pages/organiser/ManageTickets';
import CheckIn from './pages/organiser/CheckIn';
import AttendeeList from './pages/organiser/AttendeeList';
import Refunds from './pages/organiser/Refunds';
import Payouts from './pages/organiser/Payouts';
import ScheduleBuilder from './pages/organiser/ScheduleBuilder';
import AdminDashboard from './pages/admin/AdminDashboard';

const Shell = ({ children }) => (
  <>
    <Navbar />
    <main className="py-8">{children}</main>
  </>
);

const NotFound = () => (
  <div className="page-shell panel p-8">
    <h1 className="font-display text-4xl">Page not found</h1>
  </div>
);

const App = () => (
  <BrowserRouter>
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/my-tickets" element={<ProtectedRoute roles={['attendee', 'admin']}><MyTickets /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute roles={['attendee', 'admin']}><Wishlist /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['attendee', 'admin']}><OrderHistory /></ProtectedRoute>} />

        <Route path="/organiser/dashboard" element={<ProtectedRoute roles={['organiser', 'admin']}><Dashboard /></ProtectedRoute>} />
        <Route path="/organiser/events/create" element={<ProtectedRoute roles={['organiser', 'admin']}><CreateEvent /></ProtectedRoute>} />
        <Route path="/organiser/events/:id/edit" element={<ProtectedRoute roles={['organiser', 'admin']}><EditEvent /></ProtectedRoute>} />
        <Route path="/organiser/events/:id/tickets" element={<ProtectedRoute roles={['organiser', 'admin']}><ManageTickets /></ProtectedRoute>} />
        <Route path="/organiser/events/:id/checkin" element={<ProtectedRoute roles={['organiser', 'admin']}><CheckIn /></ProtectedRoute>} />
        <Route path="/organiser/events/:id/attendees" element={<ProtectedRoute roles={['organiser', 'admin']}><AttendeeList /></ProtectedRoute>} />
        <Route path="/organiser/events/:id/schedule" element={<ProtectedRoute roles={['organiser', 'admin']}><ScheduleBuilder /></ProtectedRoute>} />
        <Route path="/organiser/refunds" element={<ProtectedRoute roles={['organiser', 'admin']}><Refunds /></ProtectedRoute>} />
        <Route path="/organiser/payouts" element={<ProtectedRoute roles={['organiser', 'admin']}><Payouts /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  </BrowserRouter>
);

export default App;

