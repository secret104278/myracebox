/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import track from "./longtan.json";
import { GmapsCubicBezier } from "./bezier";
import { zip, range } from "lodash";
console.log(track);

let map: google.maps.Map;

const arrToLatLongBound = (arr) => ({
  north: arr[0],
  south: arr[2],
  west: arr[3],
  east: arr[1],
});

const arrToLatLong = (arr) => ({ lat: arr[0], lng: arr[1] });

function initMap(): void {
  const center = arrToLatLong(track.center);
  const bounds = arrToLatLongBound(track.bounds);

  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center: center,
    zoom: 1,
    restriction: {
      latLngBounds: bounds,
      strictBounds: false,
    },
    mapTypeId: "satellite",
  });
  map.fitBounds(bounds);

  new google.maps.Rectangle({
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    map,
    editable: true,
    draggable: true,
    bounds: arrToLatLongBound(track.configurations[0].startLine),
  });

  track.configurations[0].splitLines.forEach((splitLine) => {
    new google.maps.Rectangle({
      strokeColor: "#00FF00",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#00FF00",
      fillOpacity: 0.35,
      map,
      editable: true,
      draggable: true,
      bounds: arrToLatLongBound(splitLine),
    });
  });

  track.configurations[0].corners.forEach((corner, i) => {
    new google.maps.Marker({
      map,
      position: arrToLatLong(corner),
      label: `C${i}`,
    });
  });

  track.outlines[0].edges.forEach((edge) => {
    if (edge.type == 2 || edge.type == undefined) {
      // flattenEdge(edge);
      const anchorPoints: google.maps.Circle[] = edge.points.map(
        (p) =>
          new google.maps.Circle({
            center: p,
            radius: 1,
            draggable: true,
            // strokeColor: "#FF0000",
            // strokeOpacity: 0.4,
            // strokeWeight: 3,
            // fillOpacity: 0,
            map,
          })
      );

      const adjustPoints: [google.maps.Circle, google.maps.Circle][] =
        edge.points.map((p) => [
          new google.maps.Circle({
            center: p.prev,
            radius: 0.6,
            draggable: true,
            strokeColor: "#FF00FF",
            // strokeOpacity: 0.4,
            // strokeWeight: 3,
            // fillOpacity: 0,
            map,
          }),
          new google.maps.Circle({
            center: p.next,
            radius: 0.6,
            draggable: true,
            strokeColor: "#FF00FF",
            // strokeOpacity: 0.4,
            // strokeWeight: 3,
            // fillOpacity: 0,
            map,
          }),
        ]);

      for (const i of range(0, edge.points.length)) {
        const a = adjustPoints[i][0].getCenter();
        const b = anchorPoints[i].getCenter();
        const c = adjustPoints[i][1].getCenter();
        if (a === null || b === null || c === null) {
          continue;
        }

        const m = new google.maps.Polyline({
          path: [a, b],
          strokeOpacity: 0.4,
          strokeColor: "black",
          zIndex: -1,
          map,
        });
        const n = new google.maps.Polyline({
          path: [b, c],
          strokeOpacity: 0.4,
          strokeColor: "black",
          zIndex: -1,
          map,
        });

        adjustPoints[i][0].addListener("center_changed", () => {
          const a = adjustPoints[i][0].getCenter();
          const b = anchorPoints[i].getCenter();
          if (a === null || b === null) {
            return;
          }

          m.setPath([a, b]);
        });

        anchorPoints[i].addListener("center_changed", () => {
          const a = adjustPoints[i][0].getCenter();
          const b = anchorPoints[i].getCenter();
          const c = adjustPoints[i][1].getCenter();
          if (a === null || b === null || c === null) {
            return;
          }

          m.setPath([a, b]);
          n.setPath([b, c]);
        });

        adjustPoints[i][1].addListener("center_changed", () => {
          const b = anchorPoints[i].getCenter();
          const c = adjustPoints[i][1].getCenter();
          if (b === null || c === null) {
            return;
          }

          n.setPath([b, c]);
        });
      }

      for (const [i, j] of zip(range(0, edge.points.length), [
        ...range(1, edge.points.length),
        0,
      ])) {
        if (i === undefined || j === undefined) {
          continue;
        }
        const b = new GmapsCubicBezier(
          [
            anchorPoints[i].getCenter()?.lat() || 0,
            anchorPoints[i].getCenter()?.lng() || 0,
            adjustPoints[i][1].getCenter()?.lat() || 0,
            adjustPoints[i][1].getCenter()?.lng() || 0,
            adjustPoints[j][0].getCenter()?.lat() || 0,
            adjustPoints[j][0].getCenter()?.lng() || 0,
            anchorPoints[j].getCenter()?.lat() || 0,
            anchorPoints[j].getCenter()?.lng() || 0,
          ],
          0.01,
          { map }
        );

        const updatePoints = () => {
          b.updateAnchors([
            anchorPoints[i].getCenter()?.lat() || 0,
            anchorPoints[i].getCenter()?.lng() || 0,
            adjustPoints[i][1].getCenter()?.lat() || 0,
            adjustPoints[i][1].getCenter()?.lng() || 0,
            adjustPoints[j][0].getCenter()?.lat() || 0,
            adjustPoints[j][0].getCenter()?.lng() || 0,
            anchorPoints[j].getCenter()?.lat() || 0,
            anchorPoints[j].getCenter()?.lng() || 0,
          ]);
        };

        anchorPoints[i].addListener("center_changed", () => {
          updatePoints();
        });
        anchorPoints[j].addListener("center_changed", () => {
          updatePoints();
        });
        adjustPoints[i][1].addListener("center_changed", () => {
          updatePoints();
        });
        adjustPoints[j][0].addListener("center_changed", () => {
          updatePoints();
        });
      }
    }
  });
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
export {};
