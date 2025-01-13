const container = document.getElementById("map-container");
const width = container.offsetWidth || 800; 
const height = 500;

const mapSvg = d3.select("#map-plot")
    .attr("width", width)
    .attr("height", height);

const mapGroup = mapSvg.append("g");

fetch('../data/province_map_simplified10m.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        const projection = d3.geoIdentity()
            .reflectY(true)
            .fitSize([width, height], geojsonData);

        const pathGenerator = d3.geoPath().projection(projection);

        mapGroup.selectAll(".geojson-path")
            .data(geojsonData.features)
            .enter()
            .append("path")
            .attr("class", "geojson-path")
            .attr("d", pathGenerator)
            .append("title")
            .text(d => d.properties.statnaam);
    })
    .catch(error => console.error("Error loading GeoJSON:", error));

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
    });

mapSvg.call(zoom);
