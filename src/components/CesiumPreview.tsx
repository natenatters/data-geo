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
  sources?: Source[];
  enabledTiles?: Map<number, Set<number>>;
  opacities?: Map<number, number>;
  layerOrder?: number[];
  onViewerReady?: (viewer: unknown) => void;
}

export default function CesiumPreview({ sources, enabledTiles, opacities, layerOrder, onViewerReady }: Props) {
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
        homeButton: false,
        animation: false,
        timeline: false,
        navigationHelpButton: false,
        sceneModePicker: false,
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
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });

      viewerRef.current = viewer;
      if (onViewerReady) onViewerReady(viewer);
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

  // Sync imagery layers with sources + enabledTiles + opacities + layerOrder
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

    // Build ordered list of source IDs for layer stacking
    const order = layerOrder && layerOrder.length > 0
      ? layerOrder
      : (sources || []).map(s => s.id);

    // Add layers for newly desired tiles, in layer order (first = bottom)
    for (const sourceId of order) {
      const source = sources?.find(s => s.id === sourceId);
      if (!source) continue;
      const enabledIndices = enabledTiles?.get(source.id);
      if (!enabledIndices) continue;

      Array.from(enabledIndices).sort().forEach(idx => {
        const key = `${source.id}-${idx}`;
        if (currentLayers.has(key)) return;
        if (idx >= source.tiles.length) return;

        try {
          const tile = source.tiles[idx];
          const cacheBust = source.updated_at ? `${tile.url.includes('?') ? '&' : '?'}_t=${encodeURIComponent(source.updated_at)}` : '';
          const provider = tile.type === 'wms'
            ? new Cesium.WebMapServiceImageryProvider({
                url: tile.url,
                layers: tile.wms_layers || '',
                parameters: { transparent: true, format: 'image/png' },
                credit: source.name,
              })
            : new Cesium.UrlTemplateImageryProvider({
                url: tile.url + cacheBust,
                maximumLevel: 18,
                tileWidth: 256,
                tileHeight: 256,
                credit: source.name,
              });
          const layer = viewer.imageryLayers.addImageryProvider(provider);
          layer.alpha = opacities?.get(source.id) ?? 0.75;
          currentLayers.set(key, layer);
        } catch (err) {
          console.warn(`Failed to add imagery for ${key}:`, err);
        }
      });
    }

    // Update opacity for all existing layers
    Array.from(currentLayers.entries()).forEach(([key, layer]) => {
      const sourceId = parseInt(key.split('-')[0]);
      layer.alpha = opacities?.get(sourceId) ?? 0.75;
    });

    // Re-order layers in the viewer to match layerOrder
    // Index 0 in imageryLayers is the base layer, overlay layers start at 1
    const baseOffset = 1; // skip base map layer
    const orderedKeys: string[] = [];
    for (const sourceId of order) {
      const source = sources?.find(s => s.id === sourceId);
      if (!source) continue;
      const enabledIndices = enabledTiles?.get(source.id);
      if (!enabledIndices) continue;
      Array.from(enabledIndices).sort().forEach(idx => {
        const key = `${source.id}-${idx}`;
        if (currentLayers.has(key)) orderedKeys.push(key);
      });
    }

    // Move each layer to its correct position
    orderedKeys.forEach((key, targetIdx) => {
      const layer = currentLayers.get(key);
      if (!layer) return;
      const desiredIndex = baseOffset + targetIdx;
      const currentIndex = viewer.imageryLayers.indexOf(layer);
      if (currentIndex >= 0 && currentIndex !== desiredIndex) {
        const diff = desiredIndex - currentIndex;
        if (diff > 0) {
          for (let i = 0; i < diff; i++) viewer.imageryLayers.raise(layer);
        } else {
          for (let i = 0; i < -diff; i++) viewer.imageryLayers.lower(layer);
        }
      }
    });
  }, [sources, enabledTiles, opacities, layerOrder, loaded]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400 text-sm">
          Loading CesiumJS...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
