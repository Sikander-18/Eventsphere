import { BarChart3, CalendarDays, IndianRupee, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import ManageEvents from './ManageEvents';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  return (
    <div className="page-shell space-y-6">
      <h1 className="font-display text-5xl">Admin Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5"><CalendarDays /><p className="mt-3 text-3xl font-black">{stats?.totalEvents || 0}</p><span className="font-bold">Events</span></div>
        <div className="panel p-5"><Users /><p className="mt-3 text-3xl font-black">{stats?.totalUsers || 0}</p><span className="font-bold">Users</span></div>
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

