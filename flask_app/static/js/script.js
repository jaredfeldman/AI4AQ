// global variables for storing selected start and end dates and all current markers
var startDate;
var endDate;
var allMarkers = [];
// Declare geojson layer variable globally
var geojsonLayer;

document.addEventListener('DOMContentLoaded', function() {
    var map = initializeMap();
    loadGeoJSONLayer(map);
    fetchDateRangeAndInitializeSlider(map);
});

function initializeMap() {
    var map = L.map('mapid').setView([40.7608, -111.8910], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    map.createPane('markerPane').style.zIndex = 650;
    return map;
}

function fetchDateRangeAndInitializeSlider(map) {
    fetch('/api/date_range')
        .then(response => response.json())
        .then(data => {
            var dateArray = data.map(item => item.date);
            initializeDateSlider(dateArray, map);
        })
        .catch(error => console.error('Error fetching date range:', error));
}

function initializeDateSlider(dateArray, map) {
    var dateSlider = document.getElementById('date-slider');
    noUiSlider.create(dateSlider, {
        range: {'min': 0, 'max': dateArray.length - 1},
        start: [0, dateArray.length - 1],
        connect: true,
        step: 1,
        tooltips: true,
        format: {
            to: value => dateArray[Math.round(value)],
            from: value => value
        }
    });

    document.getElementById('updateSensorsButton').addEventListener('click', () => {
        let values = dateSlider.noUiSlider.get();
        let startDate = values[0];
        let endDate = values[1];
        updateSensors(startDate, endDate, map);
    });
}

function updateSensors(startDate, endDate, map) {
    clearMarkers();
    console.log("Formatted Dates:", startDate, endDate);
    fetch(`/api/summary_sensor?begin_date=${startDate}&end_date=${endDate}`)
        .then(response => response.json())
        .then(data_sensor => {
            console.log(data_sensor)
            addSensorMarkers(data_sensor, map);
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

function addSensorMarkers(data_sensor, map) {
    // Debug: Log the data to ensure it's the updated sensor information
    console.log("Adding sensor markers with the following data:", data_sensor);

    data_sensor.forEach(sensor => {
        // Ensure the sensor data used here is updated
        var marker = L.marker([sensor.latitude, sensor.longitude], {pane: 'markerPane'}).addTo(map);
        marker.bindPopup(`<b>Sensor ID:</b> ${sensor.sensor_id}<br><b>PM2.5 Value:</b> ${Math.round(sensor.avg_pm2)}`);

        allMarkers.push(marker);
    });
}


function clearMarkers() {
    allMarkers.forEach(marker => marker.remove());
    allMarkers = [];
}



// Function to get color based on lowmod_pct
    
function getColor(lowmod_pct) {
    if (lowmod_pct > 0.75) {
        return 'red';
    } else if (lowmod_pct > 0.5) {
        return 'orange';
    } else if (lowmod_pct > 0.25) {
        return 'green';
    } else {
        return '#ADD8E6';
    }
}


function style(feature) {
    return {
        fillColor: getColor(feature.properties.Lowmod_pct),
        weight: 2,
        opacity: 1,
        color: 'white',  // Default border color
        dashArray: '3',
        fillOpacity: 0.6
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    // Update info panel with properties
    var properties = layer.feature.properties;
    document.getElementById('info').innerHTML = 'Tract: ' + properties.Tract + '<br>Low Income: ' + properties.Low + '<br>Low/Moderate Income: ' + properties.Lowmod + '<br>Low/Mod Percentage: ' + properties.Lowmod_pct;
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    document.getElementById('info').innerHTML = 'Tract: ' + '<br>Low Income: ' + '<br>Low/Moderate Income: ' +  '<br>Low/Mod Percentage: '
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}

function loadGeoJSONLayer(map) {
    fetch('/static/data/converted_geojson_data.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    });
}
    
// Overlay box
//document.addEventListener('DOMContentLoaded', function() {
//    // After your map initialization code
//    showOverlayBox();
//    updateDynamicText("Average AQ between 2020-01-07 and 2022-02-01 ");
//});
//
//function showOverlayBox() {
//    document.getElementById('overlay-box').style.display = 'block';
//}
//
//function updateDynamicText(text) {
//    document.getElementById('dynamic-text').innerText = text;
//}
//
//// Example: Updating text when the button in the overlay box is clicked
//document.getElementById('overlay-button').addEventListener('click', function() {
//    updateDynamicText("Button clicked!");
//});






