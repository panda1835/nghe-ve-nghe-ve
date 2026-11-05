export type GesturePoint = [number, number];
export type MapView = { zoom: number; pan: GesturePoint };
export type PinchGesture = { midpoint: GesturePoint; distance: number; view: MapView };
export const MIN_MAP_ZOOM = 0.65;
export const MAX_MAP_ZOOM = 4;
const ORIGIN: GesturePoint = [360, 400];

export function startPinch(a: GesturePoint, b: GesturePoint, view: MapView): PinchGesture {
  return {
    midpoint: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    distance: Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1])),
    view: { zoom: view.zoom, pan: [...view.pan] },
  };
}

/** Keep the map point under the original midpoint beneath the new midpoint.
 * Inputs are in the root SVG coordinate space, independent of responsive size.
 */
export function movePinch(gesture: PinchGesture, a: GesturePoint, b: GesturePoint): MapView {
  const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const zoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, gesture.view.zoom * distance / gesture.distance));
  const ratio = zoom / gesture.view.zoom;
  const midpoint: GesturePoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return {
    zoom,
    pan: [
      midpoint[0] - ORIGIN[0] - (gesture.midpoint[0] - ORIGIN[0] - gesture.view.pan[0]) * ratio,
      midpoint[1] - ORIGIN[1] - (gesture.midpoint[1] - ORIGIN[1] - gesture.view.pan[1]) * ratio,
    ],
  };
}
