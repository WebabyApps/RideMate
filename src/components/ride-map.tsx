'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Skeleton } from './ui/skeleton';

const render = (status: Status) => {
  if (status === Status.FAILURE) return <p>Error loading maps. Check API Key and network.</p>;
  return <Skeleton className="w-full h-full" />;
};

interface RideMapProps {
  origin?: string;
  destination?: string;
  waypoints?: string[];
}

const MapComponent: React.FC<RideMapProps> = ({ origin, destination, waypoints }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();

  useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to SF
        zoom: 8,
        disableDefaultUI: true,
      }));
    }
  }, [ref, map]);

  useEffect(() => {
    if (!map) return;
    
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    let requestOrigin = origin;
    let requestDestination = destination;
    let requestWaypoints = waypoints ? waypoints.slice(1, -1).map(wp => ({ location: wp, stopover: true })) : [];

    if (waypoints && waypoints.length > 1) {
        requestOrigin = waypoints[0];
        requestDestination = waypoints[waypoints.length - 1];
    } else if (!requestOrigin || !requestDestination) {
      directionsRenderer.setDirections({routes: []});
      return;
    }

    directionsService.route(
        {
          origin: requestOrigin,
          destination: requestDestination,
          waypoints: requestWaypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          } else if (status !== 'ZERO_RESULTS' && status !== 'NOT_FOUND') {
            console.error(`Directions request failed due to ${status}`);
          }
        }
      );
  }, [map, origin, destination, waypoints]);


  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}


export const RideMap: React.FC<RideMapProps> = (props) => {
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
      <MapComponent {...props} />
    </Wrapper>
  )
}
