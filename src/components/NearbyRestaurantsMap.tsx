'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps'
import { MapPin, X, Navigation, Loader2 } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface Restaurant {
  name: string
  address: string
  lat: number
  lng: number
  rating: number
  userRatingsTotal: number
  placeId: string
}

interface NearbyRestaurantsMapProps {
  cuisine: string
  recipeTitle: string
  onClose: () => void
}

export default function NearbyRestaurantsMap({ cuisine, recipeTitle, onClose }: NearbyRestaurantsMapProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [center, setCenter] = useState({ lat: 12.8406, lng: 80.1534 })
  const [geoError, setGeoError] = useState('')
  // true only in the browser, so the portal never renders during SSR
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const searchRestaurants = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    setGeoError('')

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCenter({ lat, lng })
        try {
          const response = await fetch(
            `/api/places?lat=${lat}&lng=${lng}&cuisine=${encodeURIComponent(cuisine)}`
          )
          const data = await response.json()
          setRestaurants(data.results || [])
        } catch {
          setRestaurants([])
        }
        setLoading(false)
      },
      (err) => {
        setGeoError(`Location access denied: ${err.message}. Using default location.`)
        setCenter({ lat: 12.8406, lng: 80.1534 })
        fetch(`/api/places?lat=12.8406&lng=80.1534&cuisine=${encodeURIComponent(cuisine)}`)
          .then(r => r.json())
          .then(data => setRestaurants(data.results || []))
          .catch(() => setRestaurants([]))
          .finally(() => setLoading(false))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [cuisine])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#fdf9ee] w-full max-w-5xl border-[3px] border-black flex flex-col max-h-[90vh]" style={{ boxShadow: '6px 6px 0 0 #000' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-[#363cff]">
          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-white">Nearby {cuisine} Restaurants</h2>
            <p className="font-mono text-[10px] uppercase text-white/60 mt-0.5">For &ldquo;{recipeTitle}&rdquo;</p>
          </div>
          <button type="button" onClick={onClose}
            className="bg-[#b71422] text-white p-2 border-2 border-black cursor-pointer hover:bg-red-700"
            style={{ boxShadow: '3px 3px 0 0 #000' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!searched ? (
            <div className="py-16 text-center space-y-4">
              <MapPin className="w-12 h-12 mx-auto text-black/20" />
              <p className="font-mono text-sm uppercase text-black/50">Find {cuisine} restaurants near you</p>
              <p className="font-mono text-[10px] text-black/30">Location access will be requested</p>
              <button type="button" onClick={searchRestaurants}
                className="brutalist-btn bg-[#363cff] text-white px-8 py-3 text-sm">
                Search Nearby
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {geoError && (
                <div className="bg-[#ffe500] border-[3px] border-black p-3 font-mono text-xs">
                  {geoError}
                </div>
              )}

              <div className="h-[400px] border-[3px] border-black overflow-hidden relative">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#ece8dd]">
                    <Loader2 className="w-8 h-8 animate-spin text-black/30" />
                    <span className="font-mono text-sm uppercase ml-2 text-black/40">Loading map...</span>
                  </div>
                ) : (
                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                    <Map
                      defaultZoom={13}
                      defaultCenter={center}
                      mapId="recipe-nearby-map"
                      className="w-full h-full"
                      gestureHandling="greedy"
                    >
                      {restaurants.map(r => (
                        <AdvancedMarker
                          key={r.placeId}
                          position={{ lat: r.lat, lng: r.lng }}
                          onClick={() => setSelectedPlace(r)}
                        >
                          <Pin background="#363cff" glyphColor="white" borderColor="#000" />
                        </AdvancedMarker>
                      ))}
                      {selectedPlace && (
                        <InfoWindow
                          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                          onCloseClick={() => setSelectedPlace(null)}
                        >
                          <div className="font-mono text-xs max-w-[200px]">
                            <strong className="font-black text-sm uppercase">{selectedPlace.name}</strong>
                            <p className="text-gray-600 mt-1">{selectedPlace.address}</p>
                            <p className="mt-1">{'★'.repeat(Math.round(selectedPlace.rating))} {selectedPlace.rating} ({selectedPlace.userRatingsTotal})</p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}&query_place_id=${selectedPlace.placeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 bg-[#363cff] text-white px-2 py-1 uppercase text-[10px] font-black border-2 border-black hover:bg-[#ffe500] hover:text-black transition-colors"
                            >
                              More Info
                            </a>
                          </div>
                        </InfoWindow>
                      )}
                      <AdvancedMarker position={center}>
                        <div className="w-6 h-6 bg-[#ffe500] border-[3px] border-black rounded-full flex items-center justify-center">
                          <Navigation className="w-3 h-3" />
                        </div>
                      </AdvancedMarker>
                    </Map>
                  </APIProvider>
                )}
              </div>

              {!loading && restaurants.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[150px] overflow-y-auto">
                  {restaurants.map(r => (
                    <div key={r.placeId}
                      className="brutalist-card bg-white p-3 cursor-pointer hover:bg-[#ffe500] transition-none"
                      onClick={() => setSelectedPlace(r)}>
                      <p className="font-mono font-bold text-xs uppercase truncate">{r.name}</p>
                      <p className="font-mono text-[10px] text-black/50 truncate mt-0.5">{r.address}</p>
                      <p className="font-mono text-[10px] mt-1">{'★'.repeat(Math.round(r.rating))} {r.rating}</p>
                    </div>
                  ))}
                </div>
              )}

              {!loading && restaurants.length === 0 && (
                <div className="py-4 text-center">
                  <p className="font-mono text-sm uppercase text-black/40">No {cuisine} restaurants found nearby</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
