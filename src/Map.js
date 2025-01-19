// Load the GeoJSON file and render the map
d3.json("../data/map_NL.geojson").then(function(geojson) {
    // Set up the SVG element
    const width = 800;
    const height = 600;
    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Set up the projection and path generator
    const projection = d3.geoMercator()
        .fitSize([width, height], geojson);
    const path = d3.geoPath().projection(projection);

    // Render the map
    svg.selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "lightgray")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);
}).catch(function(error) {
    console.error('Error loading or processing GeoJSON data:', error);
});
console.log("Map.js loaded");