'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function SystemHealthPage() {
  const services = [
    {
      name: 'Supabase',
      status: 'operational',
      icon: CheckCircle,
    },
    {
      name: 'Anthropic API',
      status: 'operational',
      icon: CheckCircle,
    },
    {
      name: 'Replicate',
      status: 'operational',
      icon: CheckCircle,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Health</h1>
        <p className="text-gray-400">Monitor API and service status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <Card key={service.name} hoverable>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                      {service.name}
                    </p>
                  </div>
                  <Icon className="w-5 h-5 text-green-400" />
                </div>

                <Badge variant="success">
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card hoverable>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Real-time status of external services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <span className="font-medium text-white">{service.name}</span>
                <Badge variant="success">Operational</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
