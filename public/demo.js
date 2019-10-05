getBoundingCoordinates = points => {
  let str = '';
  points.forEach(point => {
    const earth_radius = 6371; // km
    const delta = 0.05; // km (50 m)
    const lng = +point.longitude;
    const lat = +point.latitude;
    const lng1 =
      lng +
      ((delta / earth_radius) * (180 / Math.PI)) /
        Math.cos((lat * Math.PI) / 180);
    const lat1 = lat + (delta / earth_radius) * (180 / Math.PI);
    const lng2 = 2 * lng - Math.floor(lng1);
    const lat2 = 2 * lat - lat1;
    str += lat1 + ',' + lng1 + ';' + lat2 + ',' + lng2 + '!';
  });
  return str.slice(0, str.length - 1);
};

const startLat = '43.238562';
const startLon = '76.897931';

const endLat = '43.262367';
const endLon = '76.950409';

let promise = fetch(
  `/items?lat1=${startLat}&lon1=${startLon}&lat2=${endLat}&lon2=${endLon}&time=00:10`,
);
promise
  .then(response => response.json())
  .then(data => {
    console.log(getBoundingCoordinates(data));
    renderMap(data, getBoundingCoordinates(data));
  });

const renderMap = (data, coordinates) => {
  // Instantiate a map and platform object:
  var platform = new H.service.Platform({
    apikey: 'wdVmvJvVShliZkN7rkRKxl4nHCsHgWc-YN5kwYTIXL8',
  });

  var mainCoordinate = { lat: 43.222, lng: 76.8512 }; // 52.5184443440238,13.383906494396967

  // Get the default map types from the platform object:
  var defaultLayers = platform.createDefaultLayers();

  // Instantiate the map:
  var map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
      zoom: 14,
      center: mainCoordinate,
    },
  );
  window.addEventListener('resize', () => map.getViewPort().resize());
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  var ui = H.ui.UI.createDefault(map, defaultLayers);

  var svgMarkup =
    '<svg width="24" height="24" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
    '<rect stroke="white" fill="#1b468d" x="1" y="1" width="22" ' +
    'height="22" /><text x="12" y="18" font-size="12pt" ' +
    'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
    'fill="white">H</text></svg>';

  // Create the parameters for the routing request:
  var routingParameters = {
    // The routing mode:
    mode: 'fastest;pedestrian;traffic:disabled',
    // The start point of the route:
    waypoint0: `geo!${startLat},${startLon}`, // 43.238562, 76.897931
    // The end point of the route:
    waypoint1: `geo!${endLat},${endLon}`, // 43.262367, 76.950409
    // To retrieve the shape of the route we choose the route
    // representation mode 'display'
    avoidareas: coordinates,
    representation: 'display',
  };

  // Define a callback function to process the routing response:
  var onResult = function(result) {
    var route, routeShape, startPoint, endPoint, linestring;
    if (result.response.route) {
      // Pick the first route from the response:
      route = result.response.route[0];
      // Pick the route's shape:
      routeShape = route.shape;

      // Create a linestring to use as a point source for the route line
      linestring = new H.geo.LineString();

      // Push all the points in the shape into the linestring:
      routeShape.forEach(function(point) {
        var parts = point.split(',');
        linestring.pushLatLngAlt(parts[0], parts[1]);
      });

      // Retrieve the mapped positions of the requested waypoints:
      startPoint = route.waypoint[0].mappedPosition;
      endPoint = route.waypoint[1].mappedPosition;

      // Create a polyline to display the route:
      var routeLine = new H.map.Polyline(linestring, {
        style: { strokeColor: 'blue', lineWidth: 3 },
      });

      // Create a marker for the start point:
      var startMarker = new H.map.Marker({
        lat: startPoint.latitude,
        lng: startPoint.longitude,
      });

      // Create a marker for the end point:
      var endMarker = new H.map.Marker({
        lat: endPoint.latitude,
        lng: endPoint.longitude,
      });

      const markers = [];
      data.forEach(item => {
        let icon = new H.map.Icon(svgMarkup);
        let coords = { lat: item.latitude, lng: item.longitude };
        markers.push(new H.map.Marker(coords, { icon: icon }));
      });

      // Add the route polyline and the two markers to the map:
      map.addObjects([routeLine, startMarker, endMarker, ...markers]);

      // Set the map's viewport to make the whole route visible:
      map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
    }
  };

  // Get an instance of the routing service:
  var router = platform.getRoutingService();

  // Call calculateRoute() with the routing parameters,
  // the callback and an error callback function (called if a
  // communication error occurs):
  router.calculateRoute(routingParameters, onResult, function(error) {
    alert(error.message);
  });

  function moveMapToAlmaty(map) {
    map.setCenter(mainCoordinate);
    map.setZoom(14);
  }

  window.onload = function() {
    moveMapToAlmaty(map);
  };
};
