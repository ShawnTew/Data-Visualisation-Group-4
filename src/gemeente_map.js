const container = document.getElementById("map-container");
const width = container.offsetWidth || 800; 
const height = 500;

const svg = d3.select("#map-plot")
    .attr("width", width)
    .attr("height", height)

const g = svg.append("g");

// Fetch the GeoJSON File
fetch('../data/gemeente_map_simplified10m.geojson')
    .then(response => response.json())
    .then(geojsonData => {

        const projection = d3.geoIdentity()
            .reflectY(true)
            .fitSize([width, height], geojsonData);

        const pathGenerator = d3.geoPath().projection(projection);

        // Step 4: Render GeoJSON
        g.selectAll(".geojson-path")
            .data(geojsonData.features)
            .enter()
            .append("path")
            .attr("class", "geojson-path")
            .attr("d", pathGenerator)
            .append("title")
            .text(d => d.properties.statnaam);
    })
    .catch(error => console.error("Error loading GeoJSON:", error));

// Add Zoom Behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

// Apply zoom behavior to the SVG
svg.call(zoom);
