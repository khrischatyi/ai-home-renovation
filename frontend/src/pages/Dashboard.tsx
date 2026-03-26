import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { FileText, Clock, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <div className="bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-headline font-bold text-3xl mb-2 text-white">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="text-neutral-400 mb-8">Manage your renovation projects.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-headline font-bold text-white">0</p>
                <p className="text-sm text-neutral-400">Active Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-headline font-bold text-white">0</p>
                <p className="text-sm text-neutral-400">Contractor Matches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-headline font-bold text-white">$0</p>
                <p className="text-sm text-neutral-400">Total Estimated</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <CardTitle className="text-xl mb-3 text-white">No projects yet</CardTitle>
            <p className="text-neutral-400 mb-6">Start your first renovation project to see it here.</p>
            <a href="/project/new">
              <Button variant="primary">Start a Project</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
