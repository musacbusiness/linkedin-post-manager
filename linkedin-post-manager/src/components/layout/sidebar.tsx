'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Activity,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  onSignOut: () => Promise<void>
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/posts',
      label: 'Posts',
      icon: FileText,
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: Calendar,
    },
    {
      href: '/system-health',
      label: 'System Health & Settings',
      icon: Activity,
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-bold text-white">LinkedIn AI</h1>
          <p className="text-sm text-gray-400">Post Manager</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200',
                active
                  ? 'bg-purple-accent text-white hover:bg-purple-light shadow-lg shadow-purple-accent/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-6 border-t border-gray-700">
        <button
          onClick={() => {
            setMobileOpen(false)
            onSignOut()
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 font-medium transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar - Enhanced Glass */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:h-screen md:w-60 md:bg-purple-dark/60 md:backdrop-blur-2xl md:border-r md:border-gray-700/30 md:block md:z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-purple-dark border border-gray-700 text-white hover:bg-gray-800 transition-colors"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
              onClick={() => setMobileOpen(false)}
            />
            {/* Sidebar - Enhanced Glass */}
            <motion.aside
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden fixed left-0 top-0 h-screen w-60 bg-purple-dark/60 backdrop-blur-2xl border-r border-gray-700/30 z-40"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
