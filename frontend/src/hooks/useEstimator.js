import { useCallback, useEffect, useMemo, useState } from 'react'

import { estimatorApi } from '../services/api.js'

export function useEstimator() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [serviceType, setServiceType] = useState('')
  const [hourId, setHourId] = useState(null)
  const [addonIds, setAddonIds] = useState(new Set())

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
          setServiceType(
            data.services[0].name
          )
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
  // SELECTED SERVICE
  // ============================================================

  const selectedService = useMemo(() => {
    if (!config?.services) {
      return null
    }

    return (
      config.services.find(
        (service) =>
          service.name === serviceType
      ) || null
    )
  }, [config, serviceType])

  // ============================================================
  // SELECTED HOUR
  // ============================================================

  const selectedHour = useMemo(
    () =>
      config?.hours?.find(
        (h) =>
          Number(h.id) ===
          Number(hourId)
      ) || null,
    [config, hourId]
  )

  // ============================================================
  // SELECTED ADD-ONS
  // ============================================================

  const selectedAddons = useMemo(
    () =>
      (config?.addons || []).filter(
        (a) =>
          addonIds.has(a.id)
      ),
    [config, addonIds]
  )

  // ============================================================
  // TOTAL
  // ============================================================
  //
  // FINAL PRICE =
  //
  // Service starting_price
  // + Coverage hour price
  // + Add-ons
  //
  // ============================================================

  const total = useMemo(() => {
    const servicePrice =
      selectedService
        ? Number(
            selectedService.starting_price ||
              0
          )
        : 0

    const hourPrice =
      selectedHour
        ? Number(
            selectedHour.price || 0
          )
        : 0

    const addonsPrice =
      selectedAddons.reduce(
        (sum, addon) =>
          sum +
          Number(
            addon.price || 0
          ),
        0
      )

    return (
      servicePrice +
      hourPrice +
      addonsPrice
    )
  }, [
    selectedService,
    selectedHour,
    selectedAddons
  ])

  // ============================================================
  // BREAKDOWN
  // ============================================================

  const breakdown = useMemo(
    () => ({
      service: selectedService
        ? {
            id: selectedService.id,
            name: selectedService.name,
            price: Number(
              selectedService.starting_price ||
                0
            )
          }
        : null,

      service_type:
        selectedService?.name ||
        serviceType,

      hours: selectedHour
        ? {
            id: selectedHour.id,
            label: selectedHour.label,
            hours: selectedHour.hours,
            price: Number(
              selectedHour.price ||
                0
            )
          }
        : null,

      addons:
        selectedAddons.map(
          (addon) => ({
            id: addon.id,
            label: addon.label,
            price: Number(
              addon.price || 0
            )
          })
        ),

      total
    }),
    [
      selectedService,
      serviceType,
      selectedHour,
      selectedAddons,
      total
    ]
  )

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

    selectedHour,
    selectedAddons,

    total,
    breakdown
  }
}