import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
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
    <div className="min-h-screen bg-black">
      {/* Sidebar Navigation */}
      <Sidebar onSignOut={signOut} />

      {/* Header */}
      <Header user={user} onSignOut={signOut} />

      {/* Main Content */}
      <main className="pt-16 md:pl-60">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
