export class NavigationEngine {
  /**
   * إنشاء رابط خرائط جوجل الخارجي
   */
  public static getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  /**
   * إنشاء رابط خرائط آبل الخارجي
   */
  public static getAppleMapsUrl(lat: number, lng: number): string {
    return `https://maps.apple.com/?q=${lat},${lng}`;
  }

  /**
   * إنشاء رابط تطبيق Waze الملاحي الخارجي
   */
  public static getWazeUrl(lat: number, lng: number): string {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }

  /**
   * إنشاء رابط خريطة الشارع المفتوحة الخارجي
   */
  public static getOpenStreetMapUrl(
    lat: number,
    lng: number,
    zoom: number = 15,
  ): string {
    return `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`;
  }
}
