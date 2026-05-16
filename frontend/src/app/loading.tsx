export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm text-brand-700/70">Loading…</p>
      </div>
    </main>
  );
}
