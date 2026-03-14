import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { GenerationManager } from '@/components/generation/generation-manager'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient Background Overlay */}
      <div className="fixed inset-0 hero-gradient opacity-60 pointer-events-none z-0" />

      {/* Content with z-index layering */}
      <div className="relative z-10">
        {/* Sidebar Navigation */}
        <Sidebar onSignOut={signOut} />

        {/* Header */}
        <Header user={user} onSignOut={signOut} />

        {/* Main Content */}
        <main className="pt-16 md:pl-60">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Generation manager — runs SSE in background across all pages */}
      <GenerationManager />
    </div>
  )
}
