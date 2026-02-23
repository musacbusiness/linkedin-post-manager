'use client'

import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar Navigation */}
      <Sidebar onSignOut={handleSignOut} />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-16 md:pl-60 p-4 md:p-6">
        <div className="max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
