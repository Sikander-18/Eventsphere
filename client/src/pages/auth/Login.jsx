import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const fallback = user.role === 'organiser' ? '/organiser/dashboard' : user.role === 'admin' ? '/admin' : '/';
      navigate(location.state?.from?.pathname || fallback);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="page-shell grid min-h-[70vh] place-items-center">
      <form onSubmit={submit} className="panel w-full max-w-md p-6 space-y-4">
        <div>
          <span className="badge bg-signal">Welcome back</span>
          <h1 className="mt-2 font-display text-4xl">Login</h1>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-bold text-ink/70 block">Email Address</label>
            <input className="field" type="email" placeholder="youremail@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required disabled={loading} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-ink/70 block">Password</label>
            <input className="field" type="password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required disabled={loading} />
          </div>
        </div>

        {error && <p className="font-bold text-copper mt-2">{error}</p>}
        
        <button className="btn w-full mt-2" type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Logging in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LogIn size={18} /> Login
            </span>
          )}
        </button>
        
        <p className="text-center font-semibold text-sm pt-2">
          New here? <Link className="underline" to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
