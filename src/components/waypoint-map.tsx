'use client';

import React, { useEffect, useRef, useState } from 'react';
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

const MapComponent: React.FC<WaypointMapProps> = ({ waypoints, onMapClick, activeInput }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

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


  // Update route when waypoints change
  useEffect(() => {
    if (map) {
      // Initialize directions renderer
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer();
      }
      directionsRendererRef.current.setMap(map);

      const validWaypoints = waypoints.filter(wp => wp.trim() !== '');

      if (validWaypoints.length > 1) {
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
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRendererRef.current?.setDirections(result);
            } else if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
                // Do nothing, wait for better address
                directionsRendererRef.current?.setDirections({routes: []});
            } else {
              console.error(`Directions request failed due to ${status}`);
              directionsRendererRef.current?.setDirections({routes: []});
            }
          }
        );
      } else {
        // Clear route if less than 2 waypoints
        directionsRendererRef.current.setDirections({routes: []});
      }
    }
  }, [map, waypoints]);

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
