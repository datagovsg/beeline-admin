
export function makeRoutePath() {
  return (routePath) => {
    return routePath ? routePath.map((point) => ({
      latitude: point.lat,
      longitude: point.lon,
    })) : []
  }
}
