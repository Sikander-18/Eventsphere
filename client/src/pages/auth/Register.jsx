import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'attendee',
    linkedinUrl: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      const fallback = user.role === 'organiser' ? '/organiser/dashboard' : user.role === 'admin' ? '/admin' : '/';
      navigate(location.state?.from?.pathname || fallback);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="page-shell grid min-h-[70vh] place-items-center">
      <form onSubmit={submit} className="panel w-full max-w-2xl p-6 space-y-4">
        <div>
          <span className="badge bg-signal">Create your sphere</span>
          <h1 className="mt-2 font-display text-4xl">Register</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-bold text-ink/70 block">Full Name</label>
            <input className="field" placeholder="e.g. John Doe" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required disabled={loading} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-ink/70 block">Email Address</label>
            <input className="field" type="email" placeholder="youremail@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required disabled={loading} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-ink/70 block">Password</label>
            <input className="field" type="password" placeholder="Create a password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required disabled={loading} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-ink/70 block">I am an...</label>
            <select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} disabled={loading}>
              <option value="attendee">Attendee (Browse & Buy tickets)</option>
              <option value="organiser">Organiser (Create & Manage events)</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-bold text-ink/70 block">LinkedIn Profile URL (Optional)</label>
            <input className="field" placeholder="e.g. https://linkedin.com/in/username" value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} disabled={loading} />
            <p className="text-[11px] font-semibold text-ink/50 mt-0.5">Let other attendees network with you on the event page.</p>
          </div>
        </div>

        {error && <p className="font-bold text-copper mt-2">{error}</p>}
        
        <button className="btn w-full mt-2" type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <UserPlus size={18} /> Register
            </span>
          )}
        </button>
        
        <p className="text-center font-semibold text-sm pt-2">
          Already registered? <Link className="underline" to="/login" state={location.state}>Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
