const LoadingSpinner = ({ label = 'Loading' }) => (
  <div className="flex min-h-[240px] items-center justify-center">
    <div className="panel flex items-center gap-3 px-5 py-4">
      <span className="h-4 w-4 animate-spin border-2 border-ink border-t-transparent" />
      <span className="font-bold">{label}</span>
    </div>
  </div>
);

export default LoadingSpinner;

