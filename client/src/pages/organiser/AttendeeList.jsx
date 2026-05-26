import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const AttendeeList = () => {
  const { id } = useParams();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get(`/events/${id}/attendees`).then(({ data }) => setRows(data));
  }, [id]);

  const download = async () => {
    const response = await api.get(`/events/${id}/attendees`, {
      params: { format: 'csv' },
      responseType: 'blob'
    });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendees.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-shell space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-5xl">Attendees</h1>
        <button className="btn" onClick={download}><Download size={18} /> CSV</button>
      </div>
      <div className="overflow-x-auto border-2 border-ink bg-white">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-ink text-paper">
            <tr>
              {['Name', 'Email', 'Ticket', 'Checked in', 'LinkedIn'].map((header) => <th key={header} className="p-3">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.email}-${index}`} className="border-t border-ink">
                <td className="p-3 font-bold">{row.name}</td>
                <td className="p-3">{row.email}</td>
                <td className="p-3">{row.ticketType}</td>
                <td className="p-3">{row.checkedIn}</td>
                <td className="p-3">{row.linkedinUrl || 'Not shared'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendeeList;

