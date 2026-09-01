import { useCallback, useEffect, useMemo, useState } from 'react'
import { estimatorApi } from '../services/api.js'

export function useEstimator() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [serviceType, setServiceType] = useState('')
  const [hourId, setHourId] = useState(null)
  const [addonIds, setAddonIds] = useState(new Set())
  
  // NEW: State to track specific quantities for each add-on ID
  const [addonQuantities, setAddonQuantities] = useState({})

  // ============================================================
  // LOAD ESTIMATOR CONFIG
  // ============================================================

  useEffect(() => {
    let alive = true

    estimatorApi
      .config()
      .then((data) => {
        if (!alive) return

        setConfig(data)

        if (data?.hours?.length) {
          setHourId(data.hours[0].id)
        }

        // Select the first active service by default
        if (data?.services?.length) {
          setServiceType(data.services[0].name)
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message)
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false)
        }
      })

    return () => {
      alive = false
    }
  }, [])

  // ============================================================
  // TOGGLE ADD-ON
  // ============================================================

  const toggleAddon = useCallback((id) => {
    setAddonIds((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  // ============================================================
  // UPDATE ADD-ON QUANTITY
  // ============================================================

  const setAddonQuantity = useCallback((id, quantity) => {
    setAddonQuantities((prev) => ({
      ...prev,
      [id]: quantity
    }))
  }, [])

  // ============================================================
  // SELECTED ITEMS
  // ============================================================

  const selectedService = useMemo(() => {
    if (!config?.services) return null
    return config.services.find((service) => service.name === serviceType) || null
  }, [config, serviceType])

  const selectedHour = useMemo(() => {
    return config?.hours?.find((h) => Number(h.id) === Number(hourId)) || null
  }, [config, hourId])

  const selectedAddons = useMemo(() => {
    return (config?.addons || []).filter((a) => addonIds.has(a.id))
  }, [config, addonIds])

  // ============================================================
  // TOTAL
  // ============================================================

  const total = useMemo(() => {
    const servicePrice = selectedService ? Number(selectedService.starting_price || 0) : 0
    const hourPrice = selectedHour ? Number(selectedHour.price || 0) : 0

    const addonsPrice = selectedAddons.reduce((sum, addon) => {
      // Multiply by quantity if the add-on supports it (defaulting to 1)
      const qty = addon.is_quantity_based ? (addonQuantities[addon.id] || 1) : 1
      return sum + (Number(addon.price || 0) * qty)
    }, 0)

    return servicePrice + hourPrice + addonsPrice
  }, [selectedService, selectedHour, selectedAddons, addonQuantities])

  // ============================================================
  // BREAKDOWN
  // ============================================================

  const breakdown = useMemo(() => ({
    service: selectedService
      ? {
          id: selectedService.id,
          name: selectedService.name,
          price: Number(selectedService.starting_price || 0)
        }
      : null,

    service_type: selectedService?.name || serviceType,

    hours: selectedHour
      ? {
          id: selectedHour.id,
          label: selectedHour.label,
          hours: selectedHour.hours,
          price: Number(selectedHour.price || 0)
        }
      : null,

    addons: selectedAddons.map((addon) => {
      const qty = addon.is_quantity_based ? (addonQuantities[addon.id] || 1) : 1
      return {
        id: addon.id,
        label: addon.label,
        price: Number(addon.price || 0),
        quantity: qty,
        total: Number(addon.price || 0) * qty
      }
    }),

    total
  }), [selectedService, serviceType, selectedHour, selectedAddons, total, addonQuantities])

  // ============================================================
  // RETURN
  // ============================================================

  return {
    config,
    loading,
    error,

    serviceType,
    setServiceType,

    selectedService,

    hourId,
    setHourId,

    addonIds,
    toggleAddon,
    
    addonQuantities,
    setAddonQuantity,

    selectedHour,
    selectedAddons,

    total,
    breakdown
  }
}