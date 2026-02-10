'use client';

import { useEffect, useRef, useState } from 'react';
import { NARRATIVE_PERIODS } from '@/lib/narrative-periods';
import { TERRITORY_POLYGONS } from '@/lib/narrative-geodata';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any;
  }
}

interface Props {
  activePeriodId: string;
}

export default function NarrativeMap({ activePeriodId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const lastPeriodRef = useRef<string>('');

  // Load CesiumJS from CDN (same pattern as CesiumPreview.tsx)
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

  // Initialize viewer once
  useEffect(() => {
    if (!loaded || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;

    try {
      const viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        animation: false,
        timeline: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayer: new Cesium.ImageryLayer(
          new Cesium.UrlTemplateImageryProvider({
            url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            credit: 'CartoDB',
            maximumLevel: 19,
          })
        ),
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      // Start at England-wide view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-1.5, 53.0, 600000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });

      viewerRef.current = viewer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
    }

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [loaded]);

  // Update map when active period changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded) return;
    if (activePeriodId === lastPeriodRef.current) return;
    lastPeriodRef.current = activePeriodId;

    const Cesium = window.Cesium;
    const period = NARRATIVE_PERIODS.find(p => p.id === activePeriodId);
    if (!period) return;

    // Clear existing entities
    viewer.entities.removeAll();

    // Add territory polygons
    for (const territory of period.territories) {
      const coords = TERRITORY_POLYGONS[territory.id];
      if (!coords || coords.length < 3) continue;

      // Flatten [lon, lat] pairs into [lon, lat, lon, lat, ...]
      const flat: number[] = [];
      for (const [lon, lat] of coords) {
        flat.push(lon, lat);
      }

      // Compute centroid for label placement
      let cLon = 0, cLat = 0;
      for (const [lon, lat] of coords) {
        cLon += lon;
        cLat += lat;
      }
      cLon /= coords.length;
      cLat /= coords.length;

      const color = Cesium.Color.fromCssColorString(territory.color);

      // Add polygon entity
      viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flat),
          material: color.withAlpha(territory.opacity),
          outline: true,
          outlineColor: color.withAlpha(Math.min(territory.opacity + 0.3, 1.0)),
          outlineWidth: 2,
        },
      });

      // Add label entity
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cLon, cLat),
        label: {
          text: territory.label,
          font: '13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(50000, 1.0, 1000000, 0.4),
        },
      });
    }

    // Fly camera to period position
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        period.camera.longitude,
        period.camera.latitude,
        period.camera.height,
      ),
      orientation: {
        heading: 0,
        pitch: period.camera.pitch ?? Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.5,
    });
  }, [activePeriodId, loaded]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
          Loading map...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
