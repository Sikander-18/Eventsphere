const Payouts = () => {
  const rows = [
    { month: 'May 2026', gross: 82000, fee: 8200, status: 'Scheduled' },
    { month: 'April 2026', gross: 46000, fee: 4600, status: 'Paid' },
    { month: 'March 2026', gross: 37500, fee: 3750, status: 'Paid' }
  ];

  return (
    <div className="page-shell space-y-5">
      <h1 className="font-display text-5xl">Payouts</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.month} className="panel p-5">
            <span className="badge bg-signal">{row.status}</span>
            <h2 className="mt-3 font-display text-2xl">{row.month}</h2>
            <p className="mt-3 text-3xl font-black">₹{row.gross - row.fee}</p>
            <p className="font-semibold text-ink/70">Gross ₹{row.gross} · platform fee ₹{row.fee}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payouts;

