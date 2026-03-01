'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type TourBannerVisibleContextValue = {
  isTourBannerVisible: boolean
  setTourBannerVisible: (visible: boolean) => void
}

const TourBannerVisibleContext = createContext<TourBannerVisibleContextValue | null>(null)

export function TourBannerVisibleProvider({ children }: { children: React.ReactNode }) {
  const [isTourBannerVisible, setTourBannerVisible] = useState(false)
  const setVisible = useCallback((visible: boolean) => {
    setTourBannerVisible(visible)
  }, [])
  return (
    <TourBannerVisibleContext.Provider value={{ isTourBannerVisible, setTourBannerVisible: setVisible }}>
      {children}
    </TourBannerVisibleContext.Provider>
  )
}

export function useTourBannerVisible() {
  const ctx = useContext(TourBannerVisibleContext)
  return ctx
}
