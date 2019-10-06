const formSend = document.getElementById('formSend');
formSend.addEventListener('submit', e => {
  e.preventDefault();
  e.stopPropagation();
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const [lat1, lon1] = from.split(',');
  const [lat2, lon2] = to.split(',');
  const time = document.getElementById('time').value;
  const queryStr = `/items?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}&time=${time}`;
  let promise = fetch(queryStr);
  promise
    .then(response => response.json())
    .then(data => {
      // console.log(getBoundingCoordinates(data), data);
      document.getElementById('mapContainer').innerHTML = '';
      renderMap(data, getBoundingCoordinates(data), { start: from, end: to });
    });
});

getBoundingCoordinates = points => {
  let str = '';
  points.forEach(point => {
    const earth_radius = 6371; // km
    const delta = 0.2; // km (200 m)
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

function setUpClickListener(map) {
  // Attach an event listener to map display
  // obtain the coordinates and display in an alert box.
  map.addEventListener('tap', function(evt) {
    var coord = map.screenToGeo(
      evt.currentPointer.viewportX,
      evt.currentPointer.viewportY,
    );
    // console.log(
    //   'Clicked at ' +
    //     Math.abs(coord.lat.toFixed(4)) +
    //     (coord.lat > 0 ? 'N' : 'S') +
    //     ' ' +
    //     Math.abs(coord.lng.toFixed(4)) +
    //     (coord.lng > 0 ? 'E' : 'W'),
    // );
  });
}

function addDraggableMarker(map, behavior) {
  var marker = new H.map.Marker(
    { lat: 42.35805, lng: -71.0636 },
    {
      // mark the object as volatile for the smooth dragging
      volatility: true,
    },
  );
  // Ensure that the marker can receive drag events
  marker.draggable = true;
  map.addObject(marker);

  // disable the default draggability of the underlying map
  // and calculate the offset between mouse and target's position
  // when starting to drag a marker object:
  map.addEventListener(
    'dragstart',
    function(ev) {
      var target = ev.target,
        pointer = ev.currentPointer;
      if (target instanceof H.map.Marker) {
        var targetPosition = map.geoToScreen(target.getGeometry());
        target['offset'] = new H.math.Point(
          pointer.viewportX - targetPosition.x,
          pointer.viewportY - targetPosition.y,
        );
        behavior.disable();
      }
    },
    false,
  );

  // re-enable the default draggability of the underlying map
  // when dragging has completed
  map.addEventListener(
    'dragend',
    function(ev) {
      // console.log(ev, map.getObjects());
      const cords = map.screenToGeo(
        ev.currentPointer.viewportX,
        ev.currentPointer.viewportY,
      );

      const target = ev.target;
      if (target instanceof H.map.Marker) {
        if (target.name === 'A') {
          document.getElementById('from').value = cords.lat + ',' + cords.lng;
        }
        if (target.name === 'B') {
          document.getElementById('to').value = cords.lat + ',' + cords.lng;
        }
        behavior.enable();
      }
    },
    false,
  );

  // Listen to the drag event and move the position of the marker
  // as necessary
  map.addEventListener(
    'drag',
    function(ev) {
      var target = ev.target,
        pointer = ev.currentPointer;
      if (target instanceof H.map.Marker) {
        target.setGeometry(
          map.screenToGeo(
            pointer.viewportX - target['offset'].x,
            pointer.viewportY - target['offset'].y,
          ),
        );
      }
    },
    false,
  );
}

const defaultStart = '43.238562,76.897931';
const defaultEnd = '43.262367,76.950409';
const [startLat, startLon] = defaultStart;
const [endLat, endLon] = defaultEnd;

let promise = fetch(
  `/items?lat1=${startLat}&lon1=${startLon}&lat2=${endLat}&lon2=${endLon}&time=00:10`,
)
  .then(response => response.json())
  .then(data => {
    // console.log(getBoundingCoordinates(data));
    renderMap(data, getBoundingCoordinates(data), {
      start: defaultStart,
      end: defaultEnd,
    });
  });

function addMarkerToGroup(group, name, coordinate) {
  var marker = new H.map.Marker(coordinate);
  // add custom data to the marker
  marker.setData(name);
  marker.name = name;
  marker.draggable = true;
  group.addObject(marker);
}

const renderMap = (data, coordinates, direction) => {
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

  // Add event listeners:
  map.addEventListener('tap', function(evt) {
    // Log 'tap' and 'mouse' events:
    // console.log(evt);
  });

  setUpClickListener(map);

  var svgMarkup =
    '<svg width="24" height="24" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
    '<rect stroke="white" fill="red" x="1" y="1" width="22" ' +
    'height="22" /><text x="12" y="18" font-size="12pt" ' +
    'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
    'fill="white">!</text></svg>';

  // Create the parameters for the routing request:
  var routingParameters = {
    // The routing mode:
    mode: 'fastest;pedestrian;traffic:disabled',
    // The start point of the route:
    waypoint0: `geo!${direction.start}`, // 43.238562, 76.897931
    // The end point of the route:
    waypoint1: `geo!${direction.end}`, // 43.262367, 76.950409
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

      var group = new H.map.Group();
      group.addEventListener(
        'tap',
        function(evt) {
          // event target is the marker itself, group is a parent event target
          // for all objects that it contains
          var bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
            // read custom data
            content: evt.target.getData(),
          });
          // show info bubble
          ui.addBubble(bubble);
        },
        false,
      );

      addMarkerToGroup(group, 'A', {
        lat: startPoint.latitude,
        lng: startPoint.longitude,
      });

      addMarkerToGroup(group, 'B', {
        lat: endPoint.latitude,
        lng: endPoint.longitude,
      });

      // // Create a marker for the start point:
      // var startMarker = new H.map.Marker({
      //   lat: startPoint.latitude,
      //   lng: startPoint.longitude,
      // });
      // startMarker.name = 'A';
      // startMarker.draggable = true;

      // // Create a marker for the end point:
      // var endMarker = new H.map.Marker({
      //   lat: endPoint.latitude,
      //   lng: endPoint.longitude,
      // });
      // endMarker.name = 'B';
      // endMarker.draggable = true;

      const markers = [];
      data.forEach(item => {
        let icon = new H.map.Icon(svgMarkup);
        let coords = { lat: item.latitude, lng: item.longitude };
        markers.push(new H.map.Marker(coords, { icon: icon }));
      });

      // Add the route polyline and the two markers to the map:
      map.addObjects([routeLine, group, ...markers]);

      // Set the map's viewport to make the whole route visible:
      map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
    }
  };

  addDraggableMarker(map, behavior);

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

const time = document.getElementById('time');
function appendLeadingZeroes(n) {
  if (n <= 9) {
    return '0' + n;
  }
  return n;
}
let current_datetime = new Date();
let formatted_date =
  appendLeadingZeroes(current_datetime.getHours()) +
  ':' +
  appendLeadingZeroes(current_datetime.getMinutes());
time.value = formatted_date;
