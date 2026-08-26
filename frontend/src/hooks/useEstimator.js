import { useCallback, useEffect, useMemo, useState } from 'react'
import { estimatorApi } from '../services/api.js'

export function useEstimator() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [serviceType, setServiceType] = useState('')
  const [hourId, setHourId] = useState(null)
  const [addonIds, setAddonIds] = useState(new Set())

  useEffect(() => {
    let alive = true
    estimatorApi
      .config()
      .then((data) => {
        if (!alive) return
        setConfig(data)
        if (data.hours?.length) setHourId(data.hours[0].id)
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const toggleAddon = useCallback((id) => {
    setAddonIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectedHour = useMemo(
    () => config?.hours.find((h) => h.id === hourId) || null,
    [config, hourId]
  )

  const selectedAddons = useMemo(
    () => (config?.addons || []).filter((a) => addonIds.has(a.id)),
    [config, addonIds]
  )

  const total = useMemo(() => {
    const hourPrice = selectedHour ? Number(selectedHour.price) : 0
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)
    return hourPrice + addonsPrice
  }, [selectedHour, selectedAddons])

  const breakdown = useMemo(() => ({
    service_type: serviceType,
    hours: selectedHour ? { label: selectedHour.label, hours: selectedHour.hours, price: selectedHour.price } : null,
    addons: selectedAddons.map((a) => ({ label: a.label, price: a.price })),
    total,
  }), [serviceType, selectedHour, selectedAddons, total])

  return {
    config,
    loading,
    error,
    serviceType,
    setServiceType,
    hourId,
    setHourId,
    addonIds,
    toggleAddon,
    selectedHour,
    selectedAddons,
    total,
    breakdown,
  }
}
