// Global variables for storing selected start and end dates and all current markers
var startDate = "2020-01-01"; // default start date
var endDate = "2020-12-31"; // default end date
var allMarkers = [];
let showColors = false;

// At the global level
let currentGraphType = 'category'; // Default to category graph
var activeMetric = 'pm2.5'; // This can be 'pm2.5' or 'pm10'


// store markers by color
var markersByColor = {
    salt_red: [],
    salt_orange: [],
    salt_green: [],
    salt_lightBlue: [],
    web_red: [],
    web_orange: [],
    web_green: [],
    web_lightBlue: [],
    dav_red: [],
    dav_orange: [],
    dav_green: [],
    dav_lightBlue: []
};

let colorStates = {
    red: true,
    orange: true,
    green: true,
    lightBlue: true,
    salt: true, // New
    web: true, // New
    dav: true, // New
};

// Declare geojson layer variable globally
var geojsonLayer;
var centroidData;

var map; // Declare `map` globally
var dateSlider;

let dateArray = [];

const countyColors = {
    "Salt Lake County": "#66cc99",
    "Weber County": "#ff9966",
    "Davis County": "#9999cc"
};


const catColors = {
    "red": "#d62728",
    "orange": "#ff7f0e",
    "green": "#2ca02c",
    "blue": "#33ccff"
};

//--------------END GLOBAL VARIABLES---------------------------------------------


//--------------INITIALIZE MAP-------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    map = initializeMap();
    loadCentroidData(() => {
        loadGeoJSONLayer(map);
    });
    
    updateButtonStyle('red');
    updateButtonStyle('orange');
    updateButtonStyle('green');
    updateButtonStyle('lightBlue');
    updateButtonStyle('salt');
    updateButtonStyle('web');
    updateButtonStyle('dav');
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

// Global variable to store patient count data
let patientCounts = {};

// Function to load patient counts from CSV
function loadPatientCounts() {
    return fetch('./static/data/patient_count.csv')
        .then(response => response.text())
        .then(csvText => {
            // Convert CSV text to array of objects
            const data = d3.csvParse(csvText);
            // Use d3.nest to group data by PRVDR_NUM
            patientCounts = d3.nest()
                .key(d => d.PRVDR_NUM)
                .entries(data)
                .reduce((accumulator, currentValue) => {
                    // The key will be the PRVDR_NUM and the value will be an array of entries
                    accumulator[currentValue.key] = currentValue.values;
                    return accumulator;
                }, {});
        });
}


function getPatientInfo(prvdrNum) {
    // Accessing the entries with bracket notation
    const entries = patientCounts[prvdrNum] || [];

    if (entries.length === 0) {
        return 'No data available';
    }

    // Filter entries for the years 2020, 2021, and 2022
    const filteredEntries = entries.filter(entry =>
        entry.claim_year === "2020" || entry.claim_year === "2021" || entry.claim_year === "2022"
    );

    // Summarize patient counts by year and diagnosis
    var nestedData = d3.nest()
        .key(function(d) { return d.claim_year; })
        .key(function(d) { return d.related_diagnosis; })
        .rollup(function(leaves) { return d3.sum(leaves, d => parseInt(d.patient_count, 10)); })
        .entries(filteredEntries);

    // Create the table
    let infoHtml = '<table class="patient-data-table">';
    infoHtml += '<thead><tr><th>Year</th><th>Diagnosis</th><th>Count</th></tr></thead>';
    nestedData.forEach(function(yearGroup) {
        yearGroup.values.forEach(function(diagGroup) {
            infoHtml += `<tr><td>${yearGroup.key}</td><td>${diagGroup.key}</td><td>${diagGroup.value}</td></tr>`;
        });
    });
    infoHtml += '</table>';

    return infoHtml;
}


function getStyledInfoHtml(censusData, patientInfo) {
    return `
        <div class="sidebar-section">
            <h2><b>US CENSUS INCOME DATA</b></h2>
            <p>
                This service identifies U.S. Census Block Groups by % of households that earn less than 80 percent of the Area Median Income (AMI).
            </p>
            <div class="sidebar-data">
                <b>Census Tract:</b> ${censusData.Tract}<br>
                <b>Low/Mod Percentage:</b> ${(100 * censusData.Lowmod_pct).toFixed(2)}%<br>

            </div>
            <hr class="sidebar-divider">
            <h2><b>AQ RELATED HEALTH DATA</b></h2>
            <b>Nearest Facility:</b> ${censusData.FAC_NAME}<br>
            <div class="patient-info">
                ${patientInfo}
            </div>
            <p class="health-data-note">
                *asthma, acute bronchitis, COPD, dyspnea*
                
            </p>
            <p class="disclaimer">
                Health data provided is from Medicare, representing a five percent sample. Data is for informational purposes only and does not indicate causality.
            </p>
        </div>
    `;
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

    var properties = layer.feature.properties;
    var patientInfo = getPatientInfo(properties.PRVDR_NUM);

    // Only set the innerHTML once with the styled content
    document.getElementById('info').innerHTML = getStyledInfoHtml(properties, patientInfo);
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    document.getElementById('info').innerHTML = 'Hover over a Tract'
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}

function loadGeoJSONLayer(map) {
    loadPatientCounts().then(() => {
        fetch('./static/data/converted_geojson_data.geojson')
            .then(response => response.json())
            .then(data => {
                geojsonLayer = L.geoJson(data, {
                    style: style,
                    onEachFeature: function(feature, layer) {
                        onEachFeature(feature, layer, map);
                    }
                }).addTo(map);
            });
    }).catch(error => {
        console.error('An error occurred while loading patient counts:', error);
    });
}




//-------------------END INITIALIZE MAP --------------------------------------------

//------------------DATE SLIDER----------------------------------------------
// Function to toggle the sidebar
function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}


function fetchDateRangeAndInitializeSlider(map) {
    fetch('/api/date_range')
        .then(response => response.json())
        .then(data => {
            dateArray = data.map(item => item.date); // Update the global dateArray
            initializeDateSlider(dateArray, map);
            //document.getElementById('updateSensorsButton').click();
        })
        .catch(error => console.error('Error fetching date range:', error));
}

function initializeDateSlider(dateArray, map) {
    dateSlider = document.getElementById('date-slider');
    if (document.getElementById('singleDate').checked) {
        initializeSingleDateSlider(dateArray);
    } else {
        initializeDateRangeSlider(dateArray);
    }
}

function initializeSingleDateSlider(dateArray) {
    noUiSlider.create(dateSlider, {
        range: { 'min': 0, 'max': dateArray.length - 1 },
        start: dateArray.length - 1, // Single value for single date selection
        connect: true,
        tooltips: true,
        step: 1,
        format: {
            to: value => dateArray[Math.round(value)],
            from: value => value
        }
    });
}

function initializeDateRangeSlider(dateArray) {
    noUiSlider.create(dateSlider, {
        range: { 'min': 0, 'max': dateArray.length - 1 },
        start: [0, dateArray.length - 1], // Start and end for range selection
        connect: true,
        tooltips: true,
        step: 1,
        format: {
            to: value => dateArray[Math.round(value)],
            from: value => value
        }
    });
}
//-------------------END SLIDER---------------------------

// ------------------------ UPDATE/ADD SENSORS MARKERS ----------------------------------------

function updateSensors(startDate, endDate, map) {
    clearMarkers();
    clearAllCentroidMarkers();
    
    const url = `/api/summary_sensor?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}&r0=0&r1=0&r2=0&o0=0&o1=0&o2=0&b0=0&b1=0&b2=0&g0=0&g1=0&g2=0`;
    console.log(startDate)
    console.log(endDate)
    fetch(url)
        .then(response => response.json())
        .then(data_sensor => {
            addSensorMarkers(data_sensor, map);
            calculateBarGraph(data_sensor);
            if (document.getElementById('singleDate').checked){
                document.getElementById('sensorTitleFix').innerHTML = `<h4><center>Air Quality for ${formatDateString(endDate)}</center></h4>`;
            }
            else {
                document.getElementById('sensorTitleFix').innerHTML = `<enter><h4>Average Air Quality between ${formatDateString(startDate)} and ${formatDateString(endDate)}</h4></center>`;
            }

        })
        .catch(error => console.error('Error fetching sensor data:', error));
}


function addSensorMarkers(data_sensor, map) {
    data_sensor.forEach(sensor => {
        var color; // Determine color for sensor base

        // Assign color based on criteria
        if (sensor.county === 'Salt Lake County') {
            county = 'salt';
        } else if (sensor.county === 'Weber County') {
            county = 'web';
        } else if (sensor.county === 'Davis County') {
            county = 'dav';
        }
        
        if (sensor.category === 'red') {
            color = county + '_red';
        } else if (sensor.category === 'green') {
            color = county + '_green';
        } else if (sensor.category === 'orange') {
            color = county + '_orange';
        } else if (sensor.category === 'blue') {
            color = county + '_lightBlue';
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
        marker.sensorData = sensor;
        if (color) {
            
            markersByColor[color].push(marker); // Add marker to appropriate color category
            let theIncomeColor = sensor.category;
            if (sensor.category == "blue") {
                theIncomeColor = "lightBlue"
            }
            if (colorStates[county]==true & colorStates[theIncomeColor] ==true) {
                console.log(color)// Check if markers for this color should be displayed
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
    // clear the allMarkers array if it's still in use for other purposes
    allMarkers.forEach(marker => marker.remove());
    allMarkers.length = 0;
}

function toggleMarkersByColor(color, show,theSplitType) {
    
    
    if(theSplitType == 'color'){
        if (colorStates['salt'] == true){
            markersByColor['salt_' + color].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
                                                    
        if (colorStates['web'] == true){
            markersByColor['web_' + color].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
                                                   
       if (colorStates['dav'] == true){
           markersByColor['dav_' + color].forEach(marker => {
               if (show) {
                   marker.addTo(map);
               } else {
                   marker.remove();
               }
           })
       }
    }
    
    else {
        if (colorStates['red'] == true){
            markersByColor[color + '_red'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        if (colorStates['lightBlue'] == true){
            markersByColor[color + '_lightBlue'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        if (colorStates['green'] == true){
            markersByColor[color + '_green'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        if (colorStates['orange'] == true){
            markersByColor[color + '_orange'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        
    }
}

function updateAllMarkerContents() {
    Object.keys(markersByColor).forEach(colorKey => {
        markersByColor[colorKey].forEach(marker => {
            let sensor = marker.sensorData; // Retrieve the stored sensor data
            let displayValue = activeMetric === 'pm2.5' ? sensor.avg_pm2 : sensor.avg_pm10;
            let displayValueRounded = Math.round(displayValue);
            // Construct the new HTML content for the marker
            var htmlContent = `<div class='custom-icon'>` +
                              `<img src="static/js/pin.png" style="width:46.2px; height:53.2px;">` +
                              `<span class='sensor-value'>${displayValueRounded}</span>` +
                              `</div>`;

            // Update the marker's icon
            var customIcon = L.divIcon({
                html: htmlContent,
                className: '',
                iconSize: [46.2, 53.2],
                iconAnchor: [16.5, 37],
                popupAnchor: [0, -38]
            });

            marker.setIcon(customIcon);

            // update the popup content as well
            marker.bindPopup(`<b>Sensor ID:</b> ${sensor.sensor_id}<br><b>${activeMetric.toUpperCase()} Value:</b> ${displayValueRounded}`);
        });
    });
}



//------------------------------- ENDish ADD SENSORS -----------------------------



// ------------ CENTROIDS ---------------------------------------


// Global array to store all centroid markers for easy access
var centroidMarkers = [];
// store markers by color
var centroidByColor = {
    salt_red: [],
    salt_orange: [],
    salt_green: [],
    salt_lightBlue: [],
    web_red: [],
    web_orange: [],
    web_green: [],
    web_lightBlue: [],
    dav_red: [],
    dav_orange: [],
    dav_green: [],
    dav_lightBlue: []
};

function toggleCentroidsByColor(color, show,theSplitType) {
    
    
    if(theSplitType == 'color'){
        if (colorStates['salt'] == true){
            centroidByColor['salt_' + color].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
                                                    
        if (colorStates['web'] == true){
            centroidByColor['web_' + color].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
                                                   
       if (colorStates['dav'] == true){
           centroidByColor['dav_' + color].forEach(marker => {
               if (show) {
                   marker.addTo(map);
               } else {
                   marker.remove();
               }
           })
       }
    }
    
    else {
        if (colorStates['red'] == true){
            centroidByColor[color + '_red'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        if (colorStates['lightBlue'] == true){
            centroidByColor[color + '_lightBlue'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        if (colorStates['green'] == true){
            centroidByColor[color + '_green'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        if (colorStates['orange'] == true){
            centroidByColor[color + '_orange'].forEach(marker => {
                if (show) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }
            })
        }
        
    }
}

function updateAllCentroidContents() {

    Object.keys(centroidByColor).forEach(colorKey => {
        centroidByColor[colorKey].forEach(marker => {

            let sensor = marker.sensorData; // Retrieve the stored sensor data
            let displayValue = activeMetric === 'pm2.5' ? sensor.pm25 : sensor.pm10;
            let displayValueRounded = Math.round(displayValue);
            // Construct the new HTML content for the marker
            var htmlContent = `<div class='custom-icon'>` +
                              `<img src="static/js/pinAdded.png" style="width:46.2px; height:53.2px;">` +
                              `<span class='sensor-value'>${displayValue}</span>` +
                              `</div>`;

            var customIcon = L.divIcon({
                html: htmlContent,
                className: '',
                iconSize: [46.2, 53.2],
                iconAnchor: [16.5, 37],
                popupAnchor: [0, -38]
            });

            marker.setIcon(customIcon);

            // update the popup content as well
            marker.bindPopup(`<b>Sensor ID:</b> ${sensor.sensor_id}<br><b>${activeMetric.toUpperCase()} Value:</b> ${displayValueRounded}`);
        });
    });
}

var greenIcon = L.icon({
    iconUrl: 'static/js/pinAdded.png',
    //shadowUrl: 'static/js/shadow.png',

    iconSize: [46.2, 53.2],
    iconAnchor: [16.5, 37], // Adjust on the size of icon
    popupAnchor: [0, -38] // Adjust to position the popup
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
    
    const feature = centroidData.features.find(f => f.properties.OBJECTID === objectID);

    if (feature && feature.geometry && feature.geometry.coordinates) {
        console.log('Geometry Coordinates:', feature.geometry.coordinates);
        // Since geometry.coordinates is an array [lng, lat]
        const coords = feature.geometry.coordinates;
        console.log(feature.properties.cluster_labels)

        return {
            coords: coords.length === 2 ? coords : null, // Ensure coords is an array with two elements
            cluster_labels: feature.properties.cluster_labels
        };
    }
    return null;
}


function onEachFeature(feature, layer, map) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: function(e) {
            const result = getCentroidForObjectID(feature.properties.OBJECTID);

            // You can now access coords and cluster_labels from the result
            const centroid = result.coords;
            const cluster_labels = result.cluster_labels;

            if (centroid && document.getElementById('singleDate').checked) {
                // Determine the county and color based on feature properties
                let county, color;
                if (feature.properties.Countyname === 'Salt Lake County') {
                    county = 'salt';
                } else if (feature.properties.Countyname === 'Weber County') {
                    county = 'web';
                } else if (feature.properties.Countyname === 'Davis County') {
                    county = 'dav';
                }
                
                if (feature.properties.category === 'red') {
                    color = county + '_red';
                } else if (feature.properties.category === 'green') {
                    color = county + '_green';
                } else if (feature.properties.category === 'orange') {
                    color = county + '_orange';
                } else if (feature.properties.category === 'blue') {
                    color = county + '_lightBlue';
                }

                // Check if a marker for this objectID already exists in the specific category
                const existingMarkerIndex = centroidByColor[color].findIndex(marker => marker.sensorData && marker.sensorData.objectID === feature.properties.OBJECTID);

                if (existingMarkerIndex !== -1) {
                    // Marker exists, remove it from the map and the category array
                    map.removeLayer(centroidByColor[color][existingMarkerIndex]);
                    centroidByColor[color].splice(existingMarkerIndex, 1);
                    console.log("Existing marker removed.");
                    updateJustGraph();
                    return; // Stop execution to not add a new marker
                }

                // Fetch data and add new marker
                fetch(`/api/predict?lat=${centroid[1]}&lng=${centroid[0]}&theDate=${startDate}&mapCat=${cluster_labels}`)
                .then(response => response.json())
                .then(data => {
// added
                    document.getElementById('spinning-loader').style.display = 'flex';
// end added
                    const pm25Value = data[0];
                    const pm10Value = data[1];
                    const displayValue = activeMetric === 'pm2.5' ? pm25Value : pm10Value;

                    var htmlContent = `<div class='custom-icon'>` +
                                      `<img src="static/js/pinAdded.png" style="width:46.2px; height:53.2px;">` +
                                      `<span class='sensor-value'>${displayValue}</span>` +
                                      `</div>`;

                    var customIcon = L.divIcon({
                        html: htmlContent,
                        className: '',
                        iconSize: [46.2, 53.2],
                        iconAnchor: [16.5, 37],
                        popupAnchor: [0, -38]
                    });

                    const newMarker = L.marker([centroid[1], centroid[0]], {icon: customIcon});
                    newMarker.bindPopup(`<b>Sensor ID:</b> ${feature.properties.OBJECTID}<br>` +
                                     `<b>PM2.5 Value:</b> ${pm25Value}<br>` +
                                     `<b>PM10 Value:</b> ${pm10Value}`);
                                     
                    newMarker.sensorData = {
                        objectID: feature.properties.OBJECTID,
                        pm25: pm25Value,
                        pm10: pm10Value,
                        county: county,
                        category: feature.properties.category
                    };
// changed
                    setTimeout(() => {
                        document.getElementById('spinning-loader').style.display = 'none';
                        
                        
                        // Add the new marker to the appropriate category array
                        centroidByColor[color].push(newMarker);
                        theColor = feature.properties.category;
                        if (theColor=='blue'){
                            theColor='lightBlue'
                        }
                        if (colorStates[county] == true && colorStates[theColor] == true) {
                            newMarker.addTo(map);
                        }
                    }, 2000);
                    
// end changed
                    updateJustGraph();

                })
                .catch(error => console.error('Error fetching prediction data:', error));
            }
        }
    });
}



function getCentroidsSummary() {
    let summary = {
        totalCentroids: 0,
        totalPM25: 0,
        totalPM10: 0,
        county: {
            salt: {count: 0, pm25: 0, pm10: 0},
            web: {count: 0, pm25: 0, pm10: 0},
            dav: {count: 0, pm25: 0, pm10: 0}
        },
        color: {
            red: {count: 0, pm25: 0, pm10: 0},
            orange: {count: 0, pm25: 0, pm10: 0},
            green: {count: 0, pm25: 0, pm10: 0},
            lightBlue: {count: 0, pm25: 0, pm10: 0}
        }
    };

    Object.entries(centroidByColor).forEach(([key, markers]) => {
        let [county, color] = key.split('_');

        if (colorStates[county] && colorStates[color]) {
            markers.forEach(marker => {
                if (marker.sensorData) {
                    // Update total counts and sums
                    summary.totalCentroids += 1;
                    summary.totalPM25 += marker.sensorData.pm25;
                    summary.totalPM10 += marker.sensorData.pm10;

                    // Update county-specific counts and sums
                    summary.county[county].count += 1;
                    summary.county[county].pm25 += marker.sensorData.pm25;
                    summary.county[county].pm10 += marker.sensorData.pm10;

                    // Update color-specific counts and sums
                    summary.color[color].count += 1;
                    summary.color[color].pm25 += marker.sensorData.pm25;
                    summary.color[color].pm10 += marker.sensorData.pm10;
                }
            });
        }
    });

    return summary;
}




// clear all markers
function clearAllCentroidMarkers(map) {

    // Clear markers from each category
    Object.values(centroidByColor).forEach(markersArray => {
        markersArray.forEach(marker => marker.remove());
        markersArray.length = 0; // Clear the array
    });

}

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'block';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}





// ------------ END CENTROIDS --------------------------------

// ----------- STYLE UPDATES --------------------------

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

    }
}


function toggleColorStateAndRefreshMap(color,theSplitType) {
    colorStates[color] = !colorStates[color]; // Toggle the state
    updateButtonStyle(color); // Update the button appearance

    // refresh the map or markers based on this new state, call those functions here
    toggleMarkersByColor(color, colorStates[color],theSplitType);
    toggleCentroidsByColor(color, colorStates[color],theSplitType)
}


// Function to update dates globally
function updateDatesFromSlider() {

    let values = dateSlider.noUiSlider.get();
    startDate = values[0];
    endDate = values[1];
    console.log(values[0])
    
    if (startDate == 2){
        startDate = values
        endDate = values
    };
}

function formatDateString(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Add one day to the date
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is zero-based
    let day = date.getDate().toString().padStart(2, '0');
    let year = date.getFullYear();
    return `${month}-${day}-${year}`;
}

// Call this function after loading new sensor data:
document.getElementById('updateSensorsButton').addEventListener('click', function() {
    resetButtonStates(); // Ensure this is called to reset states as needed
    refreshSensorData(); // Load new data and refresh UI accordingly
    document.getElementById('categoryGraphButton').click();

    
    
});

function resetButtonStates() {
    Object.keys(colorStates).forEach(color => {
        colorStates[color] = true; // Set each color state to true initially
        updateButtonStyle(color);
        
    });

    currentGraphType = 'category';

}

// Update sensor data based on current dates and map state
function refreshSensorData() {
    // Reset all color buttons to true/pushed state
    Object.keys(colorStates).forEach(color => {
        colorStates[color] = true; // Set each color state to true
        updateButtonStyle(color); // Update button styles to reflect the pushed state
    });

    updateDatesFromSlider();
    clearMarkers(); // Clear existing markers before fetching new data
    clearAllCentroidMarkers();
    updateSensors(startDate, endDate, map); // Fetch and display new sensor data
    //document.getElementById('updateSensorsButton').click();
    
}

// -------------END STYLE -----------------------------------


// BAR GRAPHS ----------------------------------------------

function updateJustGraph() {
    console.log('graphB')
    let url;
    
    // county ai sensors
    c = getCentroidsSummary();
    s = c.county.salt
    s0 = s.count
    s1 = s.pm25
    s2 = s.pm10

    w = c.county.web
    w0 = w.count
    w1 = w.pm25
    w2 = w.pm10
    
    d = c.county.dav
    d0 = d.count
    d1 = d.pm25
    d2 = d.pm10
    
    // category ai sensors
    r = c.color.red
    r0 = r.count
    r1 = r.pm25
    r2 = r.pm10
    
    o = c.color.orange
    o0 = o.count
    o1 = o.pm25
    o2 = o.pm10

    b = c.color.lightBlue
    b0 = b.count
    b1 = b.pm25
    b2 = b.pm10
    
    g = c.color.green
    g0 = g.count
    g1 = g.pm25
    g2 = g.pm10



    if (currentGraphType === 'category') {
        url = `/api/summary_sensor?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}&r0=${r0}&r1=${r1}&r2=${r2}&o0=${o0}&o1=${o1}&o2=${o2}&b0=${b0}&b1=${b1}&b2=${b2}&g0=${g0}&g1=${g1}&g2=${g2}`;
    } else if (currentGraphType === 'county') {
        //getCentroidsSummary() banana

        url =
            `/api/county_avg?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}&s0=${s0}&s1=${s1}&s2=${s2}&w0=${w0}&w1=${w1}&w2=${w2}&d0=${d0}&d1=${d1}&d2=${d2}`;
    } else {
        console.error('Unknown graph type');
        return;
    }

    
    fetch(url)
        .then(response => response.json())
        .then(data_sensor => {
            if (currentGraphType === 'category') {
                calculateBarGraph(data_sensor);
            } else if (currentGraphType === 'county') {
                calculateCountyGraph(data_sensor);

            }
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

function calculateBarGraph(data_sensor) {
    // Clear existing SVG content
    d3.select("#my_dataviz svg").remove();

    // Predefined order of categories from low to high
    const categoryOrder = ['red', 'orange', 'green', 'blue'];

    // Mapping of category to labels
    const categoryLabels = {
        red: 'Low',
        orange: 'Low/Med',
        green: 'Med',
        blue: 'High',
    };

    let categories = [...new Set(data_sensor.map(item => item.category))];
    let firstCatAvgs = categories.map(category => {
        let firstEntry = data_sensor.find(item => item.category === category);
        return {
            category: category,
            cat_avg_pm2: firstEntry.cat_avg_pm2,
            cat_avg_pm10: firstEntry.cat_avg_pm10
        };
    });

    // Sort data based on the predefined category order
    firstCatAvgs.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

    var data = firstCatAvgs;

    var margin = {top: 40, right: 30, bottom: 50, left: 40},
        width = 320 - margin.left - margin.right,
        height = 320 - margin.top - margin.bottom;

    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`${activeMetric} Average`);

    var x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => categoryLabels[d.category]))
      .padding(0.2);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "translate(10,0)rotate(0)")
        .style("text-anchor", "end");

    var yDomain = activeMetric === 'pm2.5' ? d3.max(data, d => d.cat_avg_pm2) : d3.max(data, d => d.cat_avg_pm10);
    var y = d3.scaleLinear()
      .domain([0, yDomain])
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
        .attr("x", d => x(categoryLabels[d.category]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(activeMetric === 'pm2.5' ? d.cat_avg_pm2 : d.cat_avg_pm10))
        .attr("height", d => height - y(activeMetric === 'pm2.5' ? d.cat_avg_pm2 : d.cat_avg_pm10))
        .attr("fill", d => {
            switch(d.category) {
                case "red": return "#d62728";
                case "orange": return "#ff7f0e";
                case "green": return "#2ca02c";
                default: return "#33ccff"; // Default color
            }
        });
    fetchSensorDataAndShowGraph()
}



// County Graph
function calculateCountyGraph(data_sensor) {
    // Clear existing SVG content
    d3.select("#my_dataviz svg").remove();

    let uniqueCountyData = Array.from(new Set(data_sensor.map(item => item.county)))
        .map(county => {
            let firstEntryInCounty = data_sensor.find(item => item.county === county);
            return {
                county: county,
                county_avg_pm2: firstEntryInCounty.cat_avg_pm2,
                county_avg_pm10: firstEntryInCounty.cat_avg_pm10
            };
        });
    
    var data = uniqueCountyData;

    var margin = {top: 40, right: 40, bottom: 50, left: 40},
        width = 320 - margin.left - margin.right,
        height = 320 - margin.top - margin.bottom;

    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`${activeMetric} Average`);

    var x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.county))
      .padding(0.2);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "translate(14,0)rotate(0)")
        .style("text-anchor", "end");

    var yDomain = activeMetric === 'pm2.5' ? d3.max(data, d => d.county_avg_pm2) : d3.max(data, d => d.county_avg_pm10);
    var y = d3.scaleLinear()
      .domain([0, yDomain])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    var color = d3.scaleOrdinal()
      .domain(uniqueCountyData.map(d => d.county))
      .range(d3.schemeSet2);
    console.log(activeMetric)
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.county))
        .attr("width", x.bandwidth())
        .attr("y", d => y(activeMetric === 'pm2.5' ? d.county_avg_pm2 : d.county_avg_pm10))
        .attr("height", d => height - y(activeMetric === 'pm2.5' ? d.county_avg_pm2 : d.county_avg_pm10))
        .attr("fill", (d) => {
            switch(d.county) {
                case "Salt Lake County": return "#66cc99";
                case "Weber County": return "#ff9966";
                default: return "#9999cc";
            }
        });
    fetchSensorDataAndShowGraph()
}

// Function to fetch sensor data and show graph
function fetchSensorDataAndShowGraph() {
    console.log(currentGraphType)
    let url;
    if (currentGraphType === 'county') {
        
        url =             `/api/sensor_linear?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}`;
        
    }
    
    
    else {
        url =             `/api/sensor_linear_cat?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}`;
    }
    fetch(url)
        .then(response => response.json())
        .then(data => {

            // Call function to create and show the D3 graph
            createD3Visualization(data);
        })
        .catch(error => console.error('Error fetching sensor linear data:', error));
}

// Function to create and display the D3 visualization
function createD3Visualization(data) {

    //console.log(data)
    // Define dimensions and margins for the graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 900 - margin.left - margin.right,
        height = 320 - margin.top - margin.bottom;

    // Parse the date / time
    var parseDate = d3.timeParse("%Y-%m-%d");

    // Set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.pm2); });

    // Append the svg object to the body of the page
    d3.select("#my_dataviz_linear").selectAll("*").remove(); // Clear existing SVG to redraw
    var svg = d3.select("#my_dataviz_linear").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Format the data
    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.pm2 = +d.pm2;
    });

    // Scale the range of the data
    if (activeMetric == 'pm2.5'){
        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.pm2; })]);
    }
    else {
        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.pm10; })]);
    }


    // Group the data: I want to draw one line per group
    
    if (currentGraphType === 'category') {
        
        var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
        .key(function(d) { return d.category;})
        .entries(data);
        
        // set the color scale
        var res = sumstat.map(function(d){ return d.key }) // list of group names
        var color = d3.scaleOrdinal()
          .domain(res)
          .range(['"#d62728','#ff7f0e','#2ca02c','#33ccff'])
        
    }
        
    else if (currentGraphType === 'county') {
        var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
        .key(function(d) { return d.county;})
        .entries(data);
        
        // set the color scale
        var res = sumstat.map(function(d){ return d.key }) // list of group names
        var color = d3.scaleOrdinal()
          .domain(res)
          .range(['#e41a1c','#377eb8','#4daf4a'])
    }


    if (currentGraphType === 'category') {
        // Draw the line
        svg.selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return catColors[d.key]; })
        .attr("stroke-width", 3)
        .attr("d", function(d){
            return d3.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.pm2); })
            (d.values)
        })
        if (startDate==endDate){
            svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${activeMetric} Daily Average for the past 3 months from ${endDate}`);
        }
        else{
            svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${activeMetric} Daily Average between ${startDate} and ${endDate}`);
        }
    }
        
    else if (currentGraphType === 'county') {
        // Draw the line
        svg.selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return countyColors[d.key]; })
        .attr("stroke-width", 3)
        .attr("d", function(d){
            return d3.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.pm2); })
            (d.values)
        })
        
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${activeMetric} Average by County between ${startDate} and ${endDate}`);
    }

    // Add the X Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
      .call(d3.axisLeft(y));

}


function updateGraph(graphType) {
    console.log('graphA')
    // Determine the URL based on graph type
    let url;
    c = getCentroidsSummary();
    s = c.county.salt
    s0 = s.count
    s1 = s.pm25
    s2 = s.pm10

    w = c.county.web
    w0 = w.count
    w1 = w.pm25
    w2 = w.pm10
    
    d = c.county.dav
    d0 = d.count
    d1 = d.pm25
    d2 = d.pm10
    
    // category ai sensors
    r = c.color.red
    r0 = r.count
    r1 = r.pm25
    r2 = r.pm10
    
    o = c.color.orange
    o0 = o.count
    o1 = o.pm25
    o2 = o.pm10

    b = c.color.lightBlue
    b0 = b.count
    b1 = b.pm25
    b2 = b.pm10
    
    g = c.color.green
    g0 = g.count
    g1 = g.pm25
    g2 = g.pm10

    
    if (graphType === 'category') {
        url = `/api/summary_sensor?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}&r0=${r0}&r1=${r1}&r2=${r2}&o0=${o0}&o1=${o1}&o2=${o2}&b0=${b0}&b1=${b1}&b2=${b2}&g0=${g0}&g1=${g1}&g2=${g2}`;
    } else if (graphType === 'county') {
        url =
            `/api/county_avg?begin_date=${startDate}&end_date=${endDate}&red=${colorStates.red}&orange=${colorStates.orange}&green=${colorStates.green}&lightBlue=${colorStates.lightBlue}&salt=${colorStates.salt}&web=${colorStates.web}&dav=${colorStates.dav}&s0=${s0}&s1=${s1}&s2=${s2}&w0=${w0}&w1=${w1}&w2=${w2}&d0=${d0}&d1=${d1}&d2=${d2}`;
    } else {
        console.error('Invalid graph type specified');
        return;
    }

    // Fetch data and update the graph
    fetch(url)
        .then(response => response.json())
        .then(data_sensor => {
            if (graphType === 'category') {
                calculateBarGraph(data_sensor);
            } else if (graphType === 'county') {
                calculateCountyGraph(data_sensor); //county graph function
            }
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

document.getElementById('toggleDatavizBtn').addEventListener('click', function() {
    var datavizContainer = document.getElementById('dataviz-container');
    datavizContainer.classList.toggle('active'); // Toggle the active class to show/hide
    toggleButtonPM3.classList.toggle('active')
    income_buttons.classList.toggle('active')
    colorToggle.classList.toggle('active')
});



//---------------------- END GRAPHS ------------------------

// Function to update button appearance based on active graph type
function updateButtonAppearance() {
    const categoryBtn = document.getElementById('categoryGraphButton');
    const countyBtn = document.getElementById('countyGraphButton');

    if (currentGraphType === 'category') {
        categoryBtn.classList.add('active-button');
        categoryBtn.classList.remove('inactive-button');
        countyBtn.classList.remove('active-button');
        countyBtn.classList.add('inactive-button');
    } else if (currentGraphType === 'county') {
        countyBtn.classList.add('active-button');
        countyBtn.classList.remove('inactive-button');
        categoryBtn.classList.remove('active-button');
        categoryBtn.classList.add('inactive-button');
    }
}

document.getElementById('categoryGraphButton').addEventListener('click', function() {
    currentGraphType = 'category';
    updateGraph('category');
    updateButtonAppearance();
});

document.getElementById('countyGraphButton').addEventListener('click', function() {
    currentGraphType = 'county';
    updateGraph('county');
    updateButtonAppearance();
});


document.addEventListener('DOMContentLoaded', function() {
    // Function to toggle button states
    function toggleButtonStates(buttonId) {
        const button1 = document.getElementById('toggleButton1');
        const button2 = document.getElementById('toggleButton2');
        
        if (buttonId === 'toggleButton1') {
            button1.classList.add('btn-primary'); // Turn this button on
            button2.classList.remove('btn-primary'); // Turn the other button off
            button1.classList.remove('btn-info');
            button2.classList.add('btn-info');
        } else if (buttonId === 'toggleButton2') {
            button2.classList.add('btn-primary'); // Turn this button on
            button1.classList.remove('btn-primary'); // Turn the other button off
            button2.classList.remove('btn-info');
            button1.classList.add('btn-info');
        }
    }

    // Add event listeners to the buttons
    
    document.getElementById('toggleButton1').addEventListener('click', function() {
        activeMetric = 'pm2.5';
        toggleButtonStates('toggleButton1');
        
        updateGraph(currentGraphType);
        updateAllMarkerContents();
        updateAllCentroidContents();
        
        if (document.getElementById('singleDate').checked){
            document.getElementById('sensorTitle').innerHTML = `<h4>Daily Average ${activeMetric} Levels <span style="font-size: smaller;">(${formatDateString(endDate)}</span>)</h4>`;
        }
        else {
            document.getElementById('sensorTitle').innerHTML = `<h4>Average ${activeMetric} Levels <span style="font-size: smaller;">(${formatDateString(startDate)} to ${formatDateString(endDate)}</span>)</h4>`;
        }
       
    });

    document.getElementById('toggleButton2').addEventListener('click', function() {
        activeMetric = 'pm10';
        toggleButtonStates('toggleButton2');
        updateGraph(currentGraphType);
        updateAllMarkerContents();
        updateAllCentroidContents();
        
        if (document.getElementById('singleDate').checked){
            document.getElementById('sensorTitle').innerHTML = `<h4>Daily Average ${activeMetric} Levels <span style="font-size: smaller;">(${formatDateString(endDate)}</span>)</h4>`;
        }
        else {
            document.getElementById('sensorTitle').innerHTML = `<h4>Average ${activeMetric} Levels <span style="font-size: smaller;">(${formatDateString(startDate)} to ${formatDateString(endDate)}</span>)</h4>`;
        }
       
    });
});


// On Load
document.addEventListener('DOMContentLoaded', function() {
    // Trigger click event on the first toggle button to activate PM2.5 on page load
    document.getElementById('toggleButton1').click();
});


document.getElementById('singleDate').addEventListener('change', function() {
    if (this.checked) {
        dateSlider.noUiSlider.destroy(); // Destroy current slider instance
        initializeSingleDateSlider(dateArray);
    }
});

document.getElementById('dateRange').addEventListener('change', function() {
    if (this.checked) {
        dateSlider.noUiSlider.destroy(); // Destroy current slider instance
        initializeDateRangeSlider(dateArray);
    }
});

document.getElementById('toggleRed').addEventListener('click', () => {
    toggleColorStateAndRefreshMap('red','color')
    
    updateJustGraph();
});
document.getElementById('toggleOrange').addEventListener('click', () => {
    toggleColorStateAndRefreshMap('orange','color')
    updateJustGraph();
});
document.getElementById('toggleGreen').addEventListener('click', () => {
    toggleColorStateAndRefreshMap('green','color')
    updateJustGraph();
});
document.getElementById('toggleLightBlue').addEventListener('click', () => {
    toggleColorStateAndRefreshMap('lightBlue','color')
    updateJustGraph();
});

// Example for one button, repeat for others
document.getElementById('toggleSalt').addEventListener('click', () => {
    // Toggle state
    toggleColorStateAndRefreshMap('salt','county')
    // Refresh graph based on current graph type
    updateJustGraph();
});

// Example for one button, repeat for others
document.getElementById('toggleWeb').addEventListener('click', () => {
    // Update button appearance
    toggleColorStateAndRefreshMap('web','county')
    // Refresh graph based on current graph type
    updateJustGraph();
    
});

//
document.getElementById('toggleDav').addEventListener('click', () => {
    // Update button appearance
    toggleColorStateAndRefreshMap('dav','county')
    // Refresh graph based on current graph type
    updateJustGraph();
});


