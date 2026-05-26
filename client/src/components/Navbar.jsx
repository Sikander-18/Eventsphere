import { CalendarDays, LogOut, ShoppingCart, Ticket, UserRound, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navClass = ({ isActive }) => `px-3 py-2 text-sm font-bold w-full md:w-auto text-left md:text-center ${isActive ? 'bg-signal text-ink' : 'hover:bg-white/70'}`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/92 backdrop-blur">
      <div className="page-shell flex flex-col py-3 md:flex-row md:min-h-[72px] md:items-center md:justify-between md:py-0">
        
        {/* Brand Logo & Mobile Toggle */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <span className="grid h-11 w-11 place-items-center border-2 border-ink bg-ink text-paper shadow-hard">
              <CalendarDays size={22} />
            </span>
            <span>
              <span className="block font-display text-2xl leading-none">EventSphere</span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-denim">tickets + check-in</span>
            </span>
          </Link>

          {/* Cart & Menu toggler for small screens */}
          <div className="flex items-center gap-2 md:hidden">
            <Link className="btn secondary px-3 py-1.5" to="/checkout" title="Cart" onClick={() => setIsOpen(false)}>
              <ShoppingCart size={18} />
              <span className="text-xs">{items.length}</span>
            </Link>
            <button 
              className="btn secondary p-2" 
              onClick={() => setIsOpen(!isOpen)} 
              title="Toggle Menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Collapsible panel of links and buttons */}
        <div className={`mt-3 flex-col gap-3 transition-all duration-300 md:mt-0 md:flex md:flex-row md:items-center ${isOpen ? 'flex' : 'hidden'}`}>
          
          <nav className="flex flex-col gap-1 border border-ink bg-white/45 p-1 md:flex-row md:items-center">
            <NavLink className={navClass} to="/" onClick={() => setIsOpen(false)}>Events</NavLink>
            {user?.role === 'attendee' && <NavLink className={navClass} to="/my-tickets" onClick={() => setIsOpen(false)}>My Tickets</NavLink>}
            {user?.role === 'attendee' && <NavLink className={navClass} to="/wishlist" onClick={() => setIsOpen(false)}>Wishlist</NavLink>}
            {user?.role === 'organiser' && <NavLink className={navClass} to="/organiser/dashboard" onClick={() => setIsOpen(false)}>Organiser</NavLink>}
            {user?.role === 'admin' && <NavLink className={navClass} to="/admin" onClick={() => setIsOpen(false)}>Admin</NavLink>}
          </nav>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {/* Desktop Cart button (hidden on mobile) */}
            <Link className="hidden btn secondary px-3 md:inline-flex" to="/checkout" title="Cart">
              <ShoppingCart size={18} />
              <span>{items.length}</span>
            </Link>
            
            {user ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:flex-row md:gap-2">
                <span className="flex items-center gap-2 border border-ink bg-white/60 px-3 py-2 text-sm font-bold w-full md:w-auto">
                  <UserRound size={16} /> <span className="truncate max-w-[120px]">{user.name}</span>
                </span>
                <button className="btn dark px-3 w-full md:w-auto" onClick={handleLogout} title="Logout">
                  <LogOut size={18} /> <span className="md:hidden">Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto">
                <Link className="btn secondary w-full md:w-auto text-center" to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                <Link className="btn w-full md:w-auto text-center" to="/register" onClick={() => setIsOpen(false)}>
                  <Ticket size={17} /> Register
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;

