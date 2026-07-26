import { TileProviderConfig } from "./config";

export class MapEngine {
  private map: any = null;
  private marker: any = null;
  private resizeObserver: any = null;
  private onCoordsChangeCallback: ((lat: number, lng: number) => void) | null =
    null;

  constructor(
    private container: HTMLElement,
    private initialLat: number,
    private initialLng: number,
    private zoom: number,
    private tileConfig: TileProviderConfig,
  ) {}

  /**
   * تهيئة الخريطة والعلامة وربط الأحداث
   */
  public init(L: any): void {
    if (this.map) return;

    // إنشاء كائن الخريطة
    this.map = L.map(this.container, {
      center: [this.initialLat, this.initialLng],
      zoom: this.zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // خيارات طبقة الخريطة
    const tileLayerOptions: any = {
      maxZoom: this.tileConfig.maxZoom,
      attribution: this.tileConfig.attribution,
    };
    if (this.tileConfig.subdomains) {
      tileLayerOptions.subdomains = this.tileConfig.subdomains;
    }

    // إضافة طبقة الخرائط
    L.tileLayer(this.tileConfig.url, tileLayerOptions).addTo(this.map);

    // إضافة العلامة (Marker) قابلة للسحب
    this.marker = L.marker([this.initialLat, this.initialLng], {
      draggable: true,
    }).addTo(this.map);

    // الاستماع لحدث سحب العلامة
    this.marker.on("dragend", () => {
      const pos = this.marker.getLatLng();
      if (this.onCoordsChangeCallback) {
        this.onCoordsChangeCallback(pos.lat, pos.lng);
      }
      this.map.panTo(pos);
    });

    // الاستماع لحدث النقر على الخريطة لتغيير موقع العلامة
    this.map.on("click", (e: any) => {
      this.marker.setLatLng(e.latlng);
      if (this.onCoordsChangeCallback) {
        this.onCoordsChangeCallback(e.latlng.lat, e.latlng.lng);
      }
      this.map.panTo(e.latlng);
    });

    // مراقبة حجم الحاوية تلقائياً لمنع ظهور مساحات رمادية
    if (typeof window !== "undefined" && window.ResizeObserver) {
      this.resizeObserver = new window.ResizeObserver(() => {
        this.invalidateSize();
      });
      this.resizeObserver.observe(this.container);
    }

    // سلسلة تحديثات متدرجة للأبعاد لضمان رسم الخريطة بدقة بعد اكتمال فتح النافذة
    const delays = [50, 150, 300, 500, 1000, 2000];
    delays.forEach((delay) => {
      setTimeout(() => this.invalidateSize(), delay);
    });
  }

  /**
   * تسجيل مستمع لتغير الإحداثيات
   */
  public onCoordsChange(callback: (lat: number, lng: number) => void): void {
    this.onCoordsChangeCallback = callback;
  }

  /**
   * تغيير إحداثيات مركز الخريطة وزاوية التقريب
   */
  public setView(lat: number, lng: number, zoom?: number): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom ?? this.map.getZoom());
    }
  }

  /**
   * تحديث موقع العلامة والتحريك إليها
   */
  public updateMarkerPosition(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    }
    if (this.map) {
      this.map.panTo([lat, lng]);
    }
  }

  /**
   * تصحيح أبعاد الخريطة في المتصفح
   */
  public invalidateSize(): void {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * تفكيك الخريطة والمراقبين وتنظيف الذاكرة
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
    this.onCoordsChangeCallback = null;
  }
}
