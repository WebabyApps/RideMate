'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Skeleton } from './ui/skeleton';

const render = (status: Status) => {
  if (status === Status.FAILURE) return <p>Error loading maps. Check API Key and network.</p>;
  return <Skeleton className="w-full h-full" />;
};

interface WaypointMapProps {
  waypoints: google.maps.LatLngLiteral[];
  onWaypointsChange: (waypoints: google.maps.LatLngLiteral[]) => void;
}

const MapComponent: React.FC<WaypointMapProps> = ({ waypoints, onWaypointsChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to SF
        zoom: 8,
        streetViewControl: false,
        mapTypeControl: false,
      });
      setMap(newMap);

      newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newWaypoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          onWaypointsChange([...waypoints, newWaypoint]);
        }
      });
    }
  }, [ref, map, onWaypointsChange, waypoints]);

  // Update markers and route when waypoints change
  useEffect(() => {
    if (map) {
      // Clear old markers
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = waypoints.map((position, index) => {
        return new google.maps.Marker({
          position,
          map,
          label: `${index + 1}`,
        });
      });
      setMarkers(newMarkers);

      // Initialize directions renderer
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true, // We are using our own markers
        });
      }
      directionsRendererRef.current.setMap(map);

      if (waypoints.length > 1) {
        const directionsService = new google.maps.DirectionsService();
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const intermediateWaypoints = waypoints.slice(1, -1).map(wp => ({
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
            } else {
              console.error(`Directions request failed due to ${status}`);
              // Clear previous route if new one fails
              directionsRendererRef.current?.setDirections({routes: []});
            }
          }
        );
      } else {
        // Clear route if less than 2 waypoints
        directionsRendererRef.current.setDirections({routes: []});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, waypoints]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}


export const WaypointMap: React.FC<WaypointMapProps> = ({ waypoints, onWaypointsChange }) => {
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
      <MapComponent waypoints={waypoints} onWaypointsChange={onWaypointsChange} />
    </Wrapper>
  )
}
