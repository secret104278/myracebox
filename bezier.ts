type CubicBezierAnchor = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

class GmapsCubicBezier {
  private polyline: google.maps.Polyline[] = [];
  private resolution: number = 0.1;

  constructor(
    anchors: CubicBezierAnchor,
    resolution: number,
    polylineOptions: google.maps.PolylineOptions = {},
    lineColor: string = "yellow"
  ) {
    this.resolution = resolution;

    const points = GmapsCubicBezier.getBezierPoints(anchors, this.resolution);
    for (let i = 0; i < points.length - 1; i++) {
      this.polyline[i] = new google.maps.Polyline({
        ...polylineOptions,
        path: [
          { lat: points[i][0], lng: points[i][1] },
          { lat: points[i + 1][0], lng: points[i + 1][1] },
        ],
        geodesic: true,
        strokeOpacity: 0,
        icons: [
          {
            icon: {
              path: "M 0,-2 0,2",
              strokeColor: lineColor,
              strokeOpacity: 1,
              strokeWeight: 2,
            },
            repeat: "36px",
          },
        ],
        zIndex: -1,
      });
    }
  }

  public updateAnchors(anchors: CubicBezierAnchor) {
    const points = GmapsCubicBezier.getBezierPoints(anchors, this.resolution);
    for (let i = 0; i < points.length - 1; i++) {
      this.polyline[i].setPath([
        { lat: points[i][0], lng: points[i][1] },
        { lat: points[i + 1][0], lng: points[i + 1][1] },
      ]);
    }
  }

  private static getBezierPoints(
    anchors: CubicBezierAnchor,
    resolution: number
  ): [number, number][] {
    const [lat1, long1, lat2, long2, lat3, long3, lat4, long4] = anchors;
    const points: [number, number][] = [];
    for (let it = 0; it <= 1; it += resolution) {
      points.push(
        GmapsCubicBezier.getBezier(
          [lat1, long1],
          [lat2, long2],
          [lat3, long3],
          [lat4, long4],
          it
        )
      );
    }
    return points;
  }

  private static B1(t: number): number {
    return t * t * t;
  }
  private static B2(t: number): number {
    return 3 * t * t * (1 - t);
  }
  private static B3(t: number): number {
    return 3 * t * (1 - t) * (1 - t);
  }
  private static B4(t: number): number {
    return (1 - t) * (1 - t) * (1 - t);
  }
  private static getBezier(
    C1: [number, number],
    C2: [number, number],
    C3: [number, number],
    C4: [number, number],
    percent: number
  ): [number, number] {
    return [
      C1[0] * GmapsCubicBezier.B1(percent) +
        C2[0] * this.B2(percent) +
        C3[0] * this.B3(percent) +
        C4[0] * this.B4(percent),
      C1[1] * this.B1(percent) +
        C2[1] * this.B2(percent) +
        C3[1] * this.B3(percent) +
        C4[1] * this.B4(percent),
    ];
  }
}

export {
    GmapsCubicBezier
}