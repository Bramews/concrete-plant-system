export interface TileProviderConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export const MAP_CONFIG = {
  // مزود البلاطات الافتراضي النشط بالنظام (يمكن تغييره من هنا مباشرة دون تعديل أي كود)
  ACTIVE_PROVIDER_ID: "carto-light",

  // قائمة المزودين المعتمدين والمجانيين
  providers: {
    "carto-light": {
      id: "carto-light",
      name: "خرائط كارتو المضيئة (مجانية ورسمية)",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      subdomains: ["a", "b", "c", "d"],
    } as TileProviderConfig,

    "carto-dark": {
      id: "carto-dark",
      name: "خرائط كارتو الداكنة (مجانية ورسمية)",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      subdomains: ["a", "b", "c", "d"],
    } as TileProviderConfig,

    osm: {
      id: "osm",
      name: "خريطة الشارع المفتوحة العامة (OpenStreetMap)",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    } as TileProviderConfig,

    "local-cache": {
      id: "local-cache",
      name: "الكاش المحلي (أوفلاين بالكامل)",
      url: "/api/map/tiles?x={x}&y={y}&z={z}&lyrs=m",
      attribution: "&copy; Local Map Cache",
      maxZoom: 20,
    } as TileProviderConfig,
  } as Record<string, TileProviderConfig>,

  // إحداثيات مركز الخريطة الافتراضي (البصرة) في حال عدم توفر أي إحداثيات أخرى
  defaultCenter: {
    lat: 30.5012,
    lng: 47.8123,
  },

  // مستوى التقريب الافتراضي
  defaultZoom: 13,
};

// دالة لاسترجاع إعدادات المزود الفعال حالياً
export function getActiveTileProvider(): TileProviderConfig {
  const provider = MAP_CONFIG.providers[MAP_CONFIG.ACTIVE_PROVIDER_ID];
  return provider || MAP_CONFIG.providers["carto-light"];
}
