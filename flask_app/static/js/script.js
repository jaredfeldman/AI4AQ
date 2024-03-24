// global variables for storing selected start and end dates and all current markers
var startDate = "2020-01-01"; // default start date
var endDate = "2020-12-31"; // default end date
var allMarkers = [];
let showColors = true;

// store markers by color
var markersByColor = {
    red: [],
    orange: [],
    green: [],
    lightBlue: []
};

let colorStates = {
    red: true,
    orange: true,
    green: true,
    lightBlue: true
};
// Declare geojson layer variable globally
var geojsonLayer;
var centroidData;

var map; // Declare `map` globally
var dateSlider;

document.addEventListener('DOMContentLoaded', function() {
    map = initializeMap();
    loadCentroidData(() => {
        loadGeoJSONLayer(map);
    });
    fetchDateRangeAndInitializeSlider(map);
    updateButtonStyle('red');
    updateButtonStyle('orange');
    updateButtonStyle('green');
     updateButtonStyle('lightBlue');
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
    // Initialize the dateSlider inside this function but use the global variable
    dateSlider = document.getElementById('date-slider');
    noUiSlider.create(dateSlider, {
        range: { 'min': 0, 'max': dateArray.length - 1 },
        start: [0, dateArray.length - 1],
        connect: true,
        step: 1,
        tooltips: true,
        format: {
            to: value => dateArray[Math.round(value)],
            from: value => value
        }
    });
}

function updateSensors(startDate, endDate, map) {
    clearMarkers();
    console.log("Formatted Dates:", startDate, endDate);
    const url = `/api/summary_sensor?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}`;

    fetch(url)
        .then(response => response.json())
        .then(data_sensor => {
            addSensorMarkers(data_sensor, map);
            calculateBarGraph(data_sensor);
            document.getElementById('sensorTitle').innerHTML = `<h2>${startDate} to ${endDate}</h2>`;
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}



function addSensorMarkers(data_sensor, map) {
    data_sensor.forEach(sensor => {
        var color; // Determine color for sensor base

        // Assign color based on criteria
        if (sensor.category === 'red') {
            color = 'red';
        } else if (sensor.category === 'green') {
            color = 'green';
        } else if (sensor.category === 'orange') {
            color = 'orange';
        } else if (sensor.category === 'blue') {
            color = 'lightBlue';
        }

        // Construct the HTML for the marker
        var htmlContent = `<div class='custom-icon'>` +
                          `<img src="static/js/pin.png" style="width:46.2.5px; height:53.2px;">` +
                          `<span class='sensor-value'>${Math.round(sensor.avg_pm2)}</span>` +
                          `</div>`;

        // Create a divIcon with the HTML content
        var customIcon = L.divIcon({
            html: htmlContent,
            className: '', // This is important to override default Leaflet icon styles
            iconSize: [46.2, 53.2],
            iconAnchor: [16.5, 37], // Adjust on the size of icon
            popupAnchor: [0, -38] // Adjust to position the popup
        });

        // Create the marker with the custom icon and add to map
        var marker = L.marker([sensor.latitude, sensor.longitude], {icon: customIcon});
        marker.bindPopup(`<b>Sensor ID:</b> ${sensor.sensor_id}<br><b>PM2.5 Value:</b> ${Math.round(sensor.avg_pm2)}`);
        if (color) {
            markersByColor[color].push(marker); // Add marker to appropriate color category
            if (colorStates[color]) { // Check if markers for this color should be displayed
                marker.addTo(map);
            }
        }
    });
}




function clearMarkers() {
    // Clear markers from each category
    Object.values(markersByColor).forEach(markersArray => {
        markersArray.forEach(marker => marker.remove());
        markersArray.length = 0; // Clear the array
    });
    // Optionally clear the allMarkers array if it's still in use for other purposes
    allMarkers.forEach(marker => marker.remove());
    allMarkers.length = 0;
}



// Function to get color based on lowmod_pct
    
function getColor(lowmod_pct) {
    if (!showColors) {
        return 'gray';
    }
    
    if (lowmod_pct > 0.75) {
        return 'red';
    } else if (lowmod_pct > 0.5) {
        return 'orange';
    } else if (lowmod_pct > 0.25) {
        return 'green';
    } else {
        return '#33ccff'; // Light blue
    }
}



function style(feature) {
    return {
        fillColor: getColor(feature.properties.Lowmod_pct),
        weight: 4,
        opacity: 1,
        color: 'white',  // Default border color
        dashArray: '3',
        fillOpacity: showColors ? 0.6 : 0.4
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: 'green',
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
                onEachFeature: function(feature, layer) {
                    // Now pass `map` as the third argument
                    onEachFeature(feature, layer, map);
                }
            }).addTo(map);
        });
}

    
// Overlay box
//document.addEventListener('DOMContentLoaded', function() {
//    // After map initialization code
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
//// Updating text when the button in the overlay box is clicked
//document.getElementById('overlay-button').addEventListener('click', function() {
//    updateDynamicText("Button clicked!");
//});

function calculateBarGraph(data_sensor) {
    // Clear existing SVG content
    d3.select("#my_dataviz svg").remove();

    let categories = [...new Set(data_sensor.map(item => item.category))];
    let firstCatAvgs = [];

    categories.forEach(category => {
        let firstEntry = data_sensor.find(item => item.category === category);
        if (firstEntry) {
            firstCatAvgs.push({
                category: category,
                cat_avg_pm2: firstEntry.cat_avg_pm2,
                cat_avg_pm10: firstEntry.cat_avg_pm10
            });
        }
    });

    var data = firstCatAvgs;
    console.log(firstCatAvgs);

    var margin = {top: 10, right: 30, bottom: 30, left: 40},
        width = 300 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // X axis
    var x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(function(d) { return d.category; })) // Use 'category' instead of 'Country'
      .padding(0.2);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return d.cat_avg_pm2; })]) // Use 'cat_avg_pm2'
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    var color = d3.scaleOrdinal()
      .domain(categories)
      .range(d3.schemeSet2);

    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.category)) // Position based on category
        .attr("width", x.bandwidth()) // Width as determined by scaleBand
        .attr("y", d => y(d.cat_avg_pm2)) // Y position based on cat_avg_pm2
        .attr("height", d => height - y(d.cat_avg_pm2)) // Height based on scale
        .attr("fill", function(d, i) {
            // Set fill color based on category
            // replace colors or a color scale function
            switch(d.category) {
                case "red": return "#d62728";
                case "orange": return "#ff7f0e";
                case "green": return "#2ca02c";
                default: return "#33ccff"; // Default color
            }
        });
}

// Function to toggle the sidebar
function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}

var greenIcon = L.icon({
    iconUrl: 'static/js/pin.png',
    //shadowUrl: 'static/js/shadow.png',

    iconSize:     [8, 8], // size of the icon
    //shadowSize:   [100, 100], // size of the shadow
    iconAnchor:   [4, 8], // point of the icon which will correspond to marker's location
    //shadowAnchor: [50, 96],  // the same for the shadow
    popupAnchor:  [-3, -96] // point from which the popup should open relative to the iconAnchor
});



// Function to load centroids
function loadCentroidData(callback) {
    fetch('/static/data/centroids_data.geojson')
    .then(response => response.json())
    .then(data => {
        centroidData = data;
        if (typeof callback === "function") {
            callback(); // Call the callback function if it's provided
        }
    });
}

function getCentroidForObjectID(objectID) {
    console.log('apple');
    console.log(objectID);
    console.log('banana');
    console.log("Searching centroid for OBJECTID:", objectID); // Log the OBJECTID being searched for
    const feature = centroidData.features.find(f => f.properties.OBJECTID === objectID);
    console.log("Matching feature:", feature); // Check if a matching feature is found
    console.log('candy');
    if (feature && feature.geometry && feature.geometry.coordinates) {
        console.log('Geometry Coordinates:', feature.geometry.coordinates);
        // Since geometry.coordinates is an array [lng, lat]
        const coords = feature.geometry.coordinates;
        console.log('rock and roll');
        return coords.length === 2 ? coords : null; // This check ensures that coords is an array with two elements.
    }
    return null;
}


function onEachFeature(feature, layer, map) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: function(e) {

            // Find the centroid for the clicked tract
            const centroid = getCentroidForObjectID(feature.properties.OBJECTID);

            // Inside click event handler
            if (centroid) {
                const latLng = new L.LatLng(centroid[1], centroid[0]); // Use the coordinates directly
                // Create and add the marker
                L.marker(latLng, {icon: greenIcon}).addTo(map)
                  .bindPopup(`<b>Sensor ID:</b> ${feature.properties.OBJECTID}<br><b>Info:</b> Additional info here`);
            }

        }
    });
}

document.getElementById('colorToggle').addEventListener('click', function() {
    showColors = !showColors; // Toggle the state

    updateMapColors();
});

function updateMapColors() {
    if (geojsonLayer) {
        geojsonLayer.eachLayer(function(layer) {
            var lowmod_pct = layer.feature.properties.Lowmod_pct; // Ensure this matches actual property name
            var newColor = showColors ? getColor(lowmod_pct) : 'gray'; // Use transparent color if showColors is false
            layer.setStyle({
                fillColor: newColor,
                fillOpacity: showColors ? 0.6 : 0.4,
                color: 'white', // This is outline color
                weight: 4, // This is the outline weight
                opacity: 1, // This controls the opacity of the outline
                // Keep other styles as they are or adjust as needed
            });
        });
    }
}


function updateButtonStyle(color) {
    const buttonId = `toggle${color.charAt(0).toUpperCase() + color.slice(1)}`;
    const button = document.getElementById(buttonId);

    if (colorStates[color]) {
        button.classList.add("active");
        button.classList.remove("inactive"); // Ensure this class is removed if it's used
        // Set button color based on the active state if needed
    } else {
        button.classList.remove("active");
        button.classList.add("inactive"); // Add this class if using it to style inactive buttons
        // Optionally, set button color for inactive state if needed
    }
}



function toggleColorStateAndRefreshMap(color) {
    colorStates[color] = !colorStates[color]; // Toggle the state
    updateButtonStyle(color); // Update the button appearance

    // If need to refresh the map or markers based on this new state, call those functions here
    toggleMarkersByColor(color, colorStates[color]);
}



// Function to update dates globally
function updateDatesFromSlider() {
    let values = dateSlider.noUiSlider.get();
    startDate = values[0]; // Make sure these are correctly formatted as your API expects
    endDate = values[1];
}

// Update sensor data based on current dates and map state
function refreshSensorData() {
    // Reset all color buttons to true/pushed state
    Object.keys(colorStates).forEach(color => {
        colorStates[color] = true; // Set each color state to true
        updateButtonStyle(color); // Update button styles to reflect the pushed state
    });

    updateDatesFromSlider(); // Make sure dates are up-to-date
    clearMarkers(); // Clear existing markers before fetching new data
    updateSensors(startDate, endDate, map); // Fetch and display new sensor data
}

// Call this function where appropriate, such as after loading new sensor data:
document.getElementById('updateSensorsButton').addEventListener('click', function() {
    resetButtonStates(); // Ensure this is called to reset states as needed
    refreshSensorData(); // Load new data and refresh UI accordingly
});


function toggleMarkersByColor(color, show) {
    markersByColor[color].forEach(marker => {
        if (show) {
            marker.addTo(map);
        } else {
            marker.remove();
        }
    });
}


document.getElementById('toggleRed').addEventListener('click', () => toggleColorStateAndRefreshMap('red'));
document.getElementById('toggleOrange').addEventListener('click', () => toggleColorStateAndRefreshMap('orange'));
document.getElementById('toggleGreen').addEventListener('click', () => toggleColorStateAndRefreshMap('green'));
document.getElementById('toggleLightBlue').addEventListener('click', () => toggleColorStateAndRefreshMap('lightBlue'));



function resetButtonStates() {
    Object.keys(colorStates).forEach(color => {
        colorStates[color] = true; // Set each color state to true initially
        updateButtonStyle(color); // Apply the correct button style
    });
}
