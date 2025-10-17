'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Skeleton } from './ui/skeleton';

const render = (status: Status) => {
  if (status === Status.FAILURE) return <p>Error loading maps. Check API Key and network.</p>;
  return <Skeleton className="w-full h-full" />;
};

interface WaypointMapProps {
  waypoints: string[];
  onMapClick: (address: string) => void;
  activeInput: string | null;
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const MapComponent: React.FC<WaypointMapProps> = ({ waypoints, onMapClick, activeInput }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const debouncedWaypoints = useDebounce(waypoints, 500); // 500ms debounce delay

  // Function to clear existing markers from the map
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 8,
        streetViewControl: false,
        mapTypeControl: false,
      });
      setMap(newMap);
    }
  }, [ref, map]);
  
  // Add map click listener
  useEffect(() => {
    if (map) {
      const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng && activeInput) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: e.latLng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onMapClick(results[0].formatted_address);
            } else {
              console.error(`Geocode was not successful for the following reason: ${status}`);
            }
          });
        }
      });

      return () => {
        google.maps.event.removeListener(clickListener);
      };
    }
  }, [map, onMapClick, activeInput]);


  // Update route when debounced waypoints change
  useEffect(() => {
    if (!map) return;
  
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    }
    directionsRendererRef.current.setMap(map);
  
    clearMarkers();
    directionsRendererRef.current.setDirections({ routes: [] });
  
    const geocoder = new google.maps.Geocoder();
    const validWaypoints = debouncedWaypoints.filter(wp => wp && wp.trim() !== '');
  
    if (validWaypoints.length === 0) {
      return; 
    }
  
    if (validWaypoints.length === 1) {
      geocoder.geocode({ address: validWaypoints[0] }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const marker = new google.maps.Marker({
            position: location,
            map: map,
          });
          markersRef.current.push(marker);
          map.setCenter(location);
          map.setZoom(12);
        }
      });
    } else {
      const directionsService = new google.maps.DirectionsService();
      const origin = validWaypoints[0];
      const destination = validWaypoints[validWaypoints.length - 1];
      const intermediateWaypoints = validWaypoints.slice(1, -1).map(wp => ({
        location: wp,
        stopover: true,
      }));
  
      directionsService.route(
        {
          origin,
          destination,
          waypoints: intermediateWaypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);
            
            result.routes[0].legs.forEach((leg, i) => {
                if(i === 0) {
                    const startMarker = new google.maps.Marker({
                        position: leg.start_location,
                        map: map,
                        label: 'A'
                    });
                    markersRef.current.push(startMarker);
                }

                const endMarker = new google.maps.Marker({
                    position: leg.end_location,
                    map: map,
                    label: String.fromCharCode(65 + i + 1)
                });
                markersRef.current.push(endMarker);
            });

          } else if (status !== google.maps.DirectionsStatus.ZERO_RESULTS && status !== google.maps.DirectionsStatus.NOT_FOUND) {
            console.error(`Directions request failed due to ${status}`);
          }
        }
      );
    }
  }, [map, debouncedWaypoints]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} data-active-input={!!activeInput} className="cursor-crosshair data-[active-input=false]:cursor-default" />;
}


export const WaypointMap: React.FC<WaypointMapProps> = ({ waypoints, onMapClick, activeInput }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
        <div className="w-full h-full bg-muted flex items-center justify-center p-4">
            <p className="text-center text-muted-foreground">Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file to see the map.</p>
        </div>
    )
  }
  
  return (
    <Wrapper apiKey={apiKey} render={render}>
      <MapComponent waypoints={waypoints} onMapClick={onMapClick} activeInput={activeInput} />
    </Wrapper>
  )
}
