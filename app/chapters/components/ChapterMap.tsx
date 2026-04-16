'use client';

import { useEffect, useRef } from 'react';

interface ChapterMapProps {
  lat: string | number;
  lng: string | number;
  title: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function ChapterMap({ lat, lng, title }: ChapterMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      if (window.L && mapRef.current && !mapInstance.current) {
        const L = window.L;
        const latitude = parseFloat(lat.toString());
        const longitude = parseFloat(lng.toString());

        mapInstance.current = L.map(mapRef.current).setView([latitude, longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        // Add a custom Moveee-style marker if possible, or just a default one
        L.marker([latitude, longitude])
          .addTo(mapInstance.current)
          .bindPopup(`<b>${title}</b>`)
          .openPopup();
      }
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = loadLeaflet;
      document.head.appendChild(script);
    } else {
      loadLeaflet();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, title]);

  return (
    <div className="chapter-map-container">
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%', zIndex: 1 }} 
      />
    </div>
  );
}
