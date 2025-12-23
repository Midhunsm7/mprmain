export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <img
        src="/logo.png"
        alt="Loading"
        className="w-32 animate-pulse"
      />
    </div>
  );
}
