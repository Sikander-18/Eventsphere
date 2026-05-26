import { BarChart3, CalendarDays, ClipboardCheck, IndianRupee, Ticket, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import ManageEvents from './ManageEvents';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading admin stats dashboard" />;
  }

  return (
    <div className="page-shell space-y-6">
      <h1 className="font-display text-5xl">Admin Dashboard</h1>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="panel p-5"><CalendarDays /><p className="mt-3 text-3xl font-black">{stats?.totalEvents || 0}</p><span className="font-bold">Events</span></div>
        <div className="panel p-5"><Users /><p className="mt-3 text-3xl font-black">{stats?.totalUsers || 0}</p><span className="font-bold">Users</span></div>
        <div className="panel p-5"><Ticket /><p className="mt-3 text-3xl font-black">{stats?.totalRegistrations || 0}</p><span className="font-bold">Registrations</span></div>
        <div className="panel p-5"><ClipboardCheck /><p className="mt-3 text-3xl font-black">{stats?.checkedIn || 0}</p><span className="font-bold">Checked in</span></div>
        <div className="panel p-5"><IndianRupee /><p className="mt-3 text-3xl font-black">₹{stats?.revenue || 0}</p><span className="font-bold">Revenue</span></div>
      </section>
      <section className="panel p-5">
        <div className="flex items-center gap-2">
          <BarChart3 />
          <h2 className="font-display text-3xl">Top Categories</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(stats?.topCategories || []).map((category) => (
            <span className="badge bg-signal" key={category._id}>{category._id}: {category.count}</span>
          ))}
        </div>
      </section>
      <ManageEvents />
    </div>
  );
};

export default AdminDashboard;
