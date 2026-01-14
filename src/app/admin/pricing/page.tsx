"use client"

import { useEffect, useState } from "react"
import { 
  Plus, 
  CreditCard, 
  Check, 
  Trash2, 
  Settings,
  Shield,
  Zap,
  Loader2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface SystemPlan {
  id: string
  name: string
  code: string
  amount: number
  interval: string
  member_limit: number
  storage_gb: number
  features: string[]
  is_active: boolean
}

export default function AdminPricing() {
  const [plans, setPlans] = useState<SystemPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Partial<SystemPlan> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newFeature, setNewFeature] = useState("")

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      setPlans(data.plans)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error("Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!editingPlan?.name || !editingPlan?.code) {
      toast.error("Name and Code are required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      })

      if (!res.ok) throw new Error('Failed to save plan')
      
      toast.success("Plan saved successfully")
      setEditingPlan(null)
      fetchPlans()
    } catch (error) {
      console.error('Save plan error:', error)
      toast.error("Failed to save plan")
    } finally {
      setIsSaving(false)
    }
  }

  async function deletePlan(planId: string) {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (!res.ok) throw new Error('Failed to delete plan')
      
      setPlans(plans.filter(p => p.id !== planId))
      toast.success("Plan deleted successfully")
    } catch (error) {
      console.error('Delete plan error:', error)
      toast.error("Failed to delete plan")
    }
  }

  const addFeature = () => {
    if (!newFeature.trim() || !editingPlan) return
    const currentFeatures = editingPlan.features || []
    setEditingPlan({
      ...editingPlan,
      features: [...currentFeatures, newFeature.trim()]
    })
    setNewFeature("")
  }

  const removeFeature = (index: number) => {
    if (!editingPlan?.features) return
    const newFeatures = [...editingPlan.features]
    newFeatures.splice(index, 1)
    setEditingPlan({ ...editingPlan, features: newFeatures })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Pricing & Features</h1>
          <p className="text-muted-foreground">Manage subscription tiers and system limits.</p>
        </div>
        <Button onClick={() => setEditingPlan({
          name: "",
          code: "",
          amount: 0,
          interval: "monthly",
          member_limit: 5,
          storage_gb: 1,
          features: [],
          is_active: true
        })}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted" />
              <CardContent className="space-y-4 pt-6">
                <div className="h-4 bg-muted w-3/4 rounded" />
                <div className="h-4 bg-muted w-1/2 rounded" />
              </CardContent>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No plans defined</h3>
            <p className="text-muted-foreground">Create your first subscription tier to get started.</p>
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className="relative overflow-hidden border-none shadow-sm flex flex-col">
              {!plan.is_active && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription className="font-mono text-xs">{plan.code}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₦{(plan.amount / 100).toLocaleString()}</span>
                  <span className="text-muted-foreground ml-1">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm py-2 border-y">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase font-semibold">Members</span>
                    <span className="font-medium">{plan.member_limit} Limit</span>
                  </div>
                  <div className="flex flex-col border-l pl-4">
                    <span className="text-muted-foreground text-xs uppercase font-semibold">Storage</span>
                    <span className="font-medium">{plan.storage_gb} GB</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Features Included</span>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingPlan(plan)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Tier
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePlan(plan.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? "Edit Tier" : "Create New Tier"}</DialogTitle>
            <DialogDescription>
              Configure the pricing, limits, and features for this plan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input 
                  value={editingPlan?.name || ""} 
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g., Enterprise Tier"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan Code (Permanent)</Label>
                <Input 
                  value={editingPlan?.code || ""} 
                  onChange={(e) => setEditingPlan({ ...editingPlan, code: e.target.value })}
                  placeholder="e.g., enterprise_tier"
                  disabled={!!editingPlan?.id}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (in Kobo/Cents)</Label>
                <Input 
                  type="number"
                  value={editingPlan?.amount || 0} 
                  onChange={(e) => setEditingPlan({ ...editingPlan, amount: parseInt(e.target.value) })}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Example: 500000 = ₦5,000.00
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Member Limit</Label>
                  <Input 
                    type="number"
                    value={editingPlan?.member_limit || 0} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, member_limit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage (GB)</Label>
                  <Input 
                    type="number"
                    value={editingPlan?.storage_gb || 0} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, storage_gb: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Features List</Label>
                <div className="flex gap-2">
                  <Input 
                    value={newFeature} 
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button type="button" size="icon" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto pr-2">
                  {editingPlan?.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                      <span className="truncate">{feature}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeFeature(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(!editingPlan?.features || editingPlan.features.length === 0) && (
                    <p className="text-center py-6 text-muted-foreground text-xs italic">
                      No features added yet.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={editingPlan?.is_active ?? true}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_active">Tier is active and visible</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingPlan(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={savePlan} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPlan?.id ? "Update Tier" : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
