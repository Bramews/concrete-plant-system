export interface IMapProvider {
  init(L: any): void;
  onCoordsChange(callback: (lat: number, lng: number) => void): void;
  setView(lat: number, lng: number, zoom?: number): void;
  updateMarkerPosition(lat: number, lng: number): void;
  invalidateSize(): void;
  destroy(): void;
}

export interface IGeocodingProvider {
  searchAddress(query: string, isAr?: boolean): Promise<any[]>;
  reverseGeocode(lat: number, lng: number, isAr?: boolean): Promise<any>;
}

export interface ILocationProvider {
  getCurrentLocation(
    fallbackLat: number,
    fallbackLng: number,
    onPermissionDenied?: () => void,
  ): Promise<any>;
}
