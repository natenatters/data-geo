'use client';

import { useEffect, useRef, useState } from 'react';
import type { Source } from '@/lib/types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any;
  }
}

interface Props {
  czmlUrl?: string;
  sources?: Source[];
  enabledTiles?: Map<number, Set<number>>;
}

export default function CesiumPreview({ czmlUrl, sources, enabledTiles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  // Track imagery layers by "sourceId-tileIdx" key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersRef = useRef<Map<string, any>>(new Map());
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

  // Initialize viewer once
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
        baseLayer: new Cesium.ImageryLayer(
          new Cesium.UrlTemplateImageryProvider({
            url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            credit: 'CartoDB',
            maximumLevel: 19,
          })
        ),
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

  // Sync imagery layers with sources + enabledTiles
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded) return;

    const Cesium = window.Cesium;
    const currentLayers = layersRef.current;

    // Build set of desired layer keys
    const desiredKeys = new Set<string>();
    if (sources && enabledTiles) {
      for (const source of sources) {
        const enabledIndices = enabledTiles.get(source.id);
        if (!enabledIndices) continue;
        Array.from(enabledIndices).forEach(idx => {
          if (idx < source.tiles.length) {
            desiredKeys.add(`${source.id}-${idx}`);
          }
        });
      }
    }

    // Remove layers no longer desired
    Array.from(currentLayers.entries()).forEach(([key, layer]) => {
      if (!desiredKeys.has(key)) {
        viewer.imageryLayers.remove(layer, false);
        currentLayers.delete(key);
      }
    });

    // Add layers for newly desired tiles
    if (sources) {
      for (const source of sources) {
        const enabledIndices = enabledTiles?.get(source.id);
        if (!enabledIndices) continue;

        Array.from(enabledIndices).forEach(idx => {
          const key = `${source.id}-${idx}`;
          if (currentLayers.has(key)) return;
          if (idx >= source.tiles.length) return;

          try {
            const tile = source.tiles[idx];
            // Cache-bust using source updated_at so re-georeferenced tiles load fresh
            const cacheBust = source.updated_at ? `${tile.url.includes('?') ? '&' : '?'}_t=${encodeURIComponent(source.updated_at)}` : '';
            const provider = new Cesium.UrlTemplateImageryProvider({
              url: tile.url + cacheBust,
              maximumLevel: 18,
              tileWidth: 256,
              tileHeight: 256,
              credit: source.name,
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            layer.alpha = 0.75;
            currentLayers.set(key, layer);
          } catch (err) {
            console.warn(`Failed to add imagery for ${key}:`, err);
          }
        });
      }
    }
  }, [sources, enabledTiles, loaded]);

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
