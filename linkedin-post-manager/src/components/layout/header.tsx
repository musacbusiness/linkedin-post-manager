'use client'

import { useAuth } from '@/hooks/use-auth'
import { Bell, LogOut, User as UserIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const userInitials = user?.email
    ?.split('@')[0]
    .split('')
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-16 bg-purple-dark/80 backdrop-blur-lg border-b border-gray-700 px-6 flex items-center justify-between z-20">
      {/* Left side - Page title */}
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        <p className="text-xs text-gray-400">Welcome back!</p>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors group">
          <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-purple-accent rounded-full"></span>
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-purple-accent/20 border-2 border-purple-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-light">
                  {userInitials}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.email?.split('@')[0]}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <p className="text-sm font-semibold">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button className="w-full justify-start cursor-pointer">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile Settings
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                onClick={handleSignOut}
                className="w-full justify-start cursor-pointer text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
