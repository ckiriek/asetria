import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Plus, FolderOpen, FileText, Calendar, MapPin } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      phase,
      indication,
      countries,
      created_at,
      documents (count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-muted-foreground">Manage your clinical trial projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Link 
              key={project.id} 
              href={`/dashboard/projects/${project.id}`}
              className="slide-in-from-bottom"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="hover-lift cursor-pointer h-full transition-smooth hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                    <Badge variant="secondary" size="sm">
                      {project.phase}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2 line-clamp-2">
                    {project.indication}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {project.countries && project.countries.length > 0 && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">
                          {project.countries.slice(0, 2).join(', ')}
                          {project.countries.length > 2 && ` +${project.countries.length - 2}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {Array.isArray(project.documents) ? project.documents.length : 0} documents
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first clinical trial project to start generating regulatory documents
          </p>
          <Link href="/dashboard/projects/new">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
