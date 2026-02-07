'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any;
  }
}

export default function CesiumPreview({ czmlUrl }: { czmlUrl?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Cesium) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Cesium.js';
      script.onload = () => setLoaded(true);
      script.onerror = () => setError('Failed to load CesiumJS');
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.Cesium) {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;

    try {
      const viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        animation: true,
        timeline: true,
        navigationHelpButton: false,
        sceneModePicker: true,
        fullscreenButton: false,
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
          url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'),
        }),
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-2.2426, 53.4808, 15000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
      });

      const start = Cesium.JulianDate.fromDate(new Date(-79, 0, 1));
      // Year 79 AD: JS Date year 0 = 1 BC, so 79 AD = year 78 in 0-indexed
      start.dayNumber = 1757582; // Julian day for Jan 1, 79 AD
      const stop = Cesium.JulianDate.fromIso8601('2025-12-31T23:59:59Z');
      const current = Cesium.JulianDate.fromIso8601('2025-01-01T00:00:00Z');
      viewer.clock.startTime = start;
      viewer.clock.stopTime = stop;
      viewer.clock.currentTime = current;
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 31536000;
      viewer.timeline.zoomTo(start, stop);

      viewerRef.current = viewer;

      if (czmlUrl) {
        const dataSource = new Cesium.CzmlDataSource();
        dataSource.load(czmlUrl).then(() => {
          viewer.dataSources.add(dataSource);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
    }

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [loaded, czmlUrl]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded text-gray-500 text-sm">
          Loading CesiumJS...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
