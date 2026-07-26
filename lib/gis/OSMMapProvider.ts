import {
  IMapProvider,
  IGeocodingProvider,
  ILocationProvider,
} from "./interfaces";
import { MapEngine } from "../map/MapEngine";
import { SearchEngine } from "../map/SearchEngine";
import { LocationEngine } from "../map/LocationEngine";
import { TileProviderConfig } from "../map/config";

export class OSMMapProvider implements IMapProvider {
  private engine: MapEngine | null = null;

  constructor(
    container: HTMLElement,
    initialLat: number,
    initialLng: number,
    zoom: number,
    tileConfig: TileProviderConfig,
  ) {
    // تفويض الإنشاء لمحرك الخرائط الحالي
    this.engine = new MapEngine(
      container,
      initialLat,
      initialLng,
      zoom,
      tileConfig,
    );
  }

  public init(L: any): void {
    this.engine?.init(L);
  }

  public onCoordsChange(callback: (lat: number, lng: number) => void): void {
    this.engine?.onCoordsChange(callback);
  }

  public setView(lat: number, lng: number, zoom?: number): void {
    this.engine?.setView(lat, lng, zoom);
  }

  public updateMarkerPosition(lat: number, lng: number): void {
    this.engine?.updateMarkerPosition(lat, lng);
  }

  public invalidateSize(): void {
    this.engine?.invalidateSize();
  }

  public destroy(): void {
    this.engine?.destroy();
    this.engine = null;
  }
}

export class OSMGeocodingProvider implements IGeocodingProvider {
  public async searchAddress(query: string, isAr?: boolean): Promise<any[]> {
    // تفويض البحث لمحرك البحث الحالي
    return SearchEngine.searchAddress(query, isAr);
  }

  public async reverseGeocode(
    lat: number,
    lng: number,
    isAr?: boolean,
  ): Promise<any> {
    // تفويض العنونة العكسية لمحرك البحث الحالي
    return SearchEngine.reverseGeocode(lat, lng, isAr);
  }
}

export class OSMLocationProvider implements ILocationProvider {
  public async getCurrentLocation(
    fallbackLat: number,
    fallbackLng: number,
    onPermissionDenied?: () => void,
  ): Promise<any> {
    // تفويض تحديد الموقع لمحرك تحديد الموقع الحالي
    return LocationEngine.getCurrentLocation(
      fallbackLat,
      fallbackLng,
      onPermissionDenied,
    );
  }
}
