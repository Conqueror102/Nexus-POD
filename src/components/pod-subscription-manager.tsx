"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Loader2, Crown, Users, HardDrive, Sparkles, Check, X, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import type { PodSubscription, PodWithRole } from "@/lib/types"

const LITE_PLAN_FEATURES = [
  { text: "Up to 10 members", included: true },
  { text: "1GB storage", included: true },
  { text: "Basic features", included: true },
  { text: "Premium automations", included: false },
]

interface PodSubscriptionManagerProps {
  pod: PodWithRole
  isFounder: boolean
  memberCount: number
  storageUsedBytes: number
}

export function PodSubscriptionManager({
  pod,
  isFounder,
  memberCount,
  storageUsedBytes,
}: PodSubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<PodSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [pod.id])

  async function fetchSubscription() {
    try {
      const res = await fetch(`/api/subscriptions?pod_id=${pod.id}`)
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe() {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pod_id: pod.id }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Checkout failed")
      }

      const { authorization_url } = await res.json()
      window.location.href = authorization_url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleCancel() {
    setCancelLoading(true)
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pod_id: pod.id }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Cancellation failed")
      }

      toast.success("Subscription cancelled successfully")
      fetchSubscription()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel subscription")
    } finally {
      setCancelLoading(false)
    }
  }

  const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024)
  const storageLimitGB = subscription?.storage_limit_bytes
    ? subscription.storage_limit_bytes / (1024 * 1024 * 1024)
    : 1
  const storagePercentage = Math.min((storageUsedGB / storageLimitGB) * 100, 100)

  const memberLimit = subscription?.member_limit || 10
  const memberPercentage = Math.min((memberCount / memberLimit) * 100, 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isActive = subscription?.status === "active"
  const isPending = subscription?.status === "pending"
  const isPastDue = subscription?.status === "past_due"
  const isCancelled = subscription?.status === "cancelled"

  return (
    <div className="space-y-6">
      <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Lite Tier</CardTitle>
                <CardDescription>Perfect for small teams</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-600">
                ₦5,000<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              {isActive && subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  Renews {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {LITE_PLAN_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                {feature.included ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={feature.included ? "" : "text-muted-foreground line-through"}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {isActive && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Members</span>
                  </div>
                  <span className={memberPercentage >= 90 ? "text-amber-500 font-medium" : ""}>
                    {memberCount}/{memberLimit}
                  </span>
                </div>
                <Progress value={memberPercentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>Storage</span>
                  </div>
                  <span className={storagePercentage >= 90 ? "text-amber-500 font-medium" : ""}>
                    {storageUsedGB.toFixed(2)}GB/{storageLimitGB}GB
                  </span>
                </div>
                <Progress value={storagePercentage} className="h-2" />
              </div>
            </div>
          )}

          {isPastDue && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-600">Payment Failed</p>
                <p className="text-sm text-muted-foreground">
                  Please update your payment method to continue using premium features.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isFounder ? (
            <>
              {!isActive && !isPending ? (
                <Button
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting checkout...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Subscribe to Lite Tier
                    </>
                  )}
                </Button>
              ) : isPending ? (
                <Badge variant="outline" className="w-full justify-center py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Payment pending...
                </Badge>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant={isActive ? "default" : isPastDue ? "destructive" : "secondary"}
                      className="px-4 py-1"
                    >
                      {isActive ? "Active" : isPastDue ? "Past Due" : "Cancelled"}
                    </Badge>
                  </div>

                  {isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your subscription will remain active until the end of the current billing period
                            ({subscription?.current_period_end
                              ? format(new Date(subscription.current_period_end), "MMMM d, yyyy")
                              : "the billing cycle ends"}
                            ). After that, your pod will lose access to premium features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancel}
                            disabled={cancelLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {cancelLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              "Yes, Cancel"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {isCancelled && (
                    <Button
                      onClick={handleSubscribe}
                      disabled={checkoutLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting checkout...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Reactivate Subscription
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Only the pod founder can manage subscriptions.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
