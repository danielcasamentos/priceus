import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { getProductByPriceId } from '../stripe-config'
import { isPrivilegedUser } from '../config/privilegedUsers'

interface Subscription {
  subscription_status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(false)
  }, [user])

  const getSubscriptionPlan = () => {
    if (!subscription?.price_id) return null
    return getProductByPriceId(subscription.price_id)
  }

  const isPrivileged = isPrivilegedUser(user?.email)
  const isActive = isPrivileged || subscription?.subscription_status === 'active'
  const isTrialing = subscription?.subscription_status === 'trialing'
  const isPastDue = subscription?.subscription_status === 'past_due'
  const isCanceled = subscription?.subscription_status === 'canceled'

  return {
    subscription,
    loading,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    plan: getSubscriptionPlan()
  }
}