'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    phase: 'Phase 2',
    indication: '',
    drug_class: '',
    countries: '',
    design_type: 'randomized',
    blinding: 'double-blind',
    arms: '2',
    duration_weeks: '24',
    primary_endpoint: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to create a project')
        return
      }

      // Get user's org_id
      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      const countriesArray = formData.countries
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)

      const designJson = {
        design_type: formData.design_type,
        blinding: formData.blinding,
        arms: parseInt(formData.arms),
        duration_weeks: parseInt(formData.duration_weeks),
        primary_endpoint: formData.primary_endpoint,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          phase: formData.phase,
          indication: formData.indication,
          drug_class: formData.drug_class || null,
          countries: countriesArray,
          design_json: designJson,
          org_id: userData?.org_id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/projects/${data.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
        <p className="mt-2 text-gray-600">Create a new clinical trial project</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter the basic information about your clinical trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., AST-101 Phase 2 Trial"
              />
            </div>

            {/* Phase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phase *
              </label>
              <select
                required
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
                <option value="Phase 3">Phase 3</option>
                <option value="Phase 4">Phase 4</option>
              </select>
            </div>

            {/* Indication */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indication *
              </label>
              <Input
                required
                value={formData.indication}
                onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                placeholder="e.g., Type 2 Diabetes"
              />
            </div>

            {/* Drug Class / Active Ingredient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug Class / Active Ingredient
              </label>
              <Input
                value={formData.drug_class}
                onChange={(e) => setFormData({ ...formData, drug_class: e.target.value })}
                placeholder="e.g., DPP-4 inhibitor, metformin, SGLT2 inhibitor"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for safety data search. For investigational drugs, specify the drug class or similar approved drug.
              </p>
            </div>

            {/* Countries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Countries
              </label>
              <Input
                value={formData.countries}
                onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                placeholder="e.g., USA, Germany, Japan (comma-separated)"
              />
            </div>

            {/* Study Design */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Study Design</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Type
                  </label>
                  <select
                    value={formData.design_type}
                    onChange={(e) => setFormData({ ...formData, design_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="randomized">Randomized</option>
                    <option value="non-randomized">Non-randomized</option>
                    <option value="observational">Observational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blinding
                  </label>
                  <select
                    value={formData.blinding}
                    onChange={(e) => setFormData({ ...formData, blinding: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="open-label">Open Label</option>
                    <option value="single-blind">Single Blind</option>
                    <option value="double-blind">Double Blind</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Arms
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.arms}
                    onChange={(e) => setFormData({ ...formData, arms: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (weeks)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Endpoint
                </label>
                <Input
                  value={formData.primary_endpoint}
                  onChange={(e) => setFormData({ ...formData, primary_endpoint: e.target.value })}
                  placeholder="e.g., Change in HbA1c from baseline at Week 24"
                />
                <p className="mt-1 text-xs text-gray-500">
                  💡 If left empty, we'll automatically use the most common endpoint from similar clinical trials for your indication.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
