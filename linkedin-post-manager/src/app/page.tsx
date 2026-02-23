export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          LinkedIn Post Manager
        </h1>
        <p className="text-gray-400 mb-8">
          AI-powered post management with Supabase and Claude
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-purple-accent hover:bg-purple-light text-white font-semibold transition-all duration-200 hover:scale-105"
        >
          Go to Dashboard
        </a>
      </div>
    </main>
  )
}
