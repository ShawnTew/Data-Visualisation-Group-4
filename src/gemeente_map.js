const container = document.getElementById("map-container");
const width = container.offsetWidth || 800;
const height = 500;

const mapSvg = d3.select("#map-plot")
    .attr("width", width)
    .attr("height", height);

const mapGroup = mapSvg.append("g");

let projection;
let gemeentePoints = [];

fetch('../data/province_map_simplified10m.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        projection = d3.geoIdentity()
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

        fetch('../data/gemeente_points.geojson')
            .then(response => response.json())
            .then(gemeentePointsData => {
                gemeentePoints = gemeentePointsData.features.map(feature => ({
                    name: feature.properties.statnaam.toLowerCase(),
                    coordinates: feature.geometry.coordinates
                }));

                mapGroup.selectAll(".gemeente-point")
                    .data(gemeentePointsData.features)
                    .enter()
                    .append("circle")
                    .attr("class", "gemeente-point")
                    .attr("cx", d => projection(d.geometry.coordinates)[0])
                    .attr("cy", d => projection(d.geometry.coordinates)[1])
                    .attr("r", 3)
                    .append("title")
                    .text(d => d.properties.statnaam);
            })
            .catch(error => console.error("Error loading Gemeente Points GeoJSON:", error));
    })
    .catch(error => console.error("Error loading Province GeoJSON:", error));

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
    });

mapSvg.call(zoom);

function zoomToMunicipality(cityName) {
    const gemeente = gemeentePoints.find(g => g.name === cityName.toLowerCase());

    if (gemeente) {
        const [x, y] = gemeente.coordinates;

        // Reset all points to their default color
        d3.selectAll(".gemeente-point").classed("highlight", false);

        d3.selectAll(".gemeente-point")
        .filter(d => d.properties.statnaam.toLowerCase() === cityName.toLowerCase())
        .classed("highlight", true); 

        mapSvg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(4) // Adjust the zoom scale as needed
                    .translate(-projection([x, y])[0], -projection([x, y])[1])
            );
    } else {
        console.error("Municipality not found:", cityName);
    }
}
