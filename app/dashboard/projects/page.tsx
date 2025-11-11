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
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your clinical trial projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <Link 
              key={project.id} 
              href={`/dashboard/projects/${project.id}`}
              className="hover-lift slide-in-from-bottom"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="hover-lift cursor-pointer h-full transition-smooth hover:border-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <FolderOpen className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{project.title}</CardTitle>
                    </div>
                    <Badge size="sm">{project.phase}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs">
                    {project.indication}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs">
                    {project.countries && project.countries.length > 0 && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">
                          {project.countries.slice(0, 2).join(', ')}
                          {project.countries.length > 2 && ` +${project.countries.length - 2}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {Array.isArray(project.documents) ? project.documents.length : 0} documents
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
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
