import { CalendarDays, LayoutDashboard, LogOut, ShoppingCart, Ticket, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navClass = ({ isActive }) => `px-3 py-2 text-sm font-bold ${isActive ? 'bg-signal text-ink' : 'hover:bg-white/70'}`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/92 backdrop-blur">
      <div className="page-shell flex min-h-[72px] flex-wrap items-center justify-between gap-3 py-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center border-2 border-ink bg-ink text-paper shadow-hard">
            <CalendarDays size={22} />
          </span>
          <span>
            <span className="block font-display text-2xl leading-none">EventSphere</span>
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-denim">tickets + check-in</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 border border-ink bg-white/45 p-1">
          <NavLink className={navClass} to="/">Events</NavLink>
          {user?.role === 'attendee' && <NavLink className={navClass} to="/my-tickets">My Tickets</NavLink>}
          {user?.role === 'attendee' && <NavLink className={navClass} to="/wishlist">Wishlist</NavLink>}
          {user?.role === 'organiser' && <NavLink className={navClass} to="/organiser/dashboard">Organiser</NavLink>}
          {user?.role === 'admin' && <NavLink className={navClass} to="/admin">Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <Link className="btn secondary px-3" to="/checkout" title="Cart">
            <ShoppingCart size={18} />
            <span>{items.length}</span>
          </Link>
          {user ? (
            <>
              <span className="hidden items-center gap-2 border border-ink bg-white/60 px-3 py-2 text-sm font-bold sm:flex">
                <UserRound size={16} /> {user.name}
              </span>
              <button className="btn dark px-3" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link className="btn secondary" to="/login">Login</Link>
              <Link className="btn" to="/register">
                <Ticket size={17} /> Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

