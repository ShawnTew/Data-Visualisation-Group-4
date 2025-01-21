let projection;
let gemeentePoints = [];

// Load the GeoJSON file and render the map
d3.json("../data/nl.json") // Replace with the path to your new map
    .then(function(geojsonNew) {
        // Set up the SVG element
        const width = window.innerWidth * 0.5; // 75% of the screen width
        const height = 1.5 * width;
        const svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height);

        // Set up the projection and path generator
        const projection = d3.geoMercator()
            .center([5.5, 52.2]) // Center the map on the Netherlands
            .scale(5000) // Adjust the scale as needed
            .translate([width / 2, height / 2]); // Center the map in the SVG element
        const path = d3.geoPath().projection(projection);

        // Create a group for the map elements
        const mapGroup = svg.append("g");

        // Render the new map
        mapGroup.selectAll(".geojson-path")
            .data(geojsonNew.features)
            .enter().append("path")
            .attr("class", "geojson-path")
            .attr("d", function(d) {
                const pathData = path(d);
                if (!pathData) {
                    console.error("Invalid path data for feature:", d);
                    console.log("Feature coordinates:", d.geometry.coordinates);
                }
                return pathData;
            })
            .attr("fill", "#f0f0f0")
            .attr("stroke", "darkgrey")
            .attr("stroke-width", 0.5);

        // Load the GeoJSON file containing the points
        d3.json("../data/gemeente_locations.geojson") 
            .then(function(pointsGeojson) {
                // Load the CSV file containing the data
                d3.csv("../data/data_file.csv").then(function(data) {

                    // Append points to represent the locations
                    const points = mapGroup.selectAll(".gemeente-point")
                        .data(pointsGeojson.features)
                        .enter().append("circle")
                        .attr("class", "gemeente-point")
                        .attr("cx", d => projection(d.geometry.coordinates)[0])
                        .attr("cy", d => projection(d.geometry.coordinates)[1])
                        .attr("r", 3);

                   // Append glyphs to represent the points at the specified locations
                    const glyphs = mapGroup.selectAll(".glyph")
                        .data(pointsGeojson.features)
                        .enter().append("g")
                        .attr("class", "glyph")
                        .attr("transform", function(d) {
                            const coords = projection(d.geometry.coordinates);
                            return `translate(${coords[0]}, ${coords[1]})`;
                        })
                        .each(function(d) {
                            // Find the corresponding city data from the CSV file
                            const cityData = data.find(city => city.NAME === d.properties.naam);
                            if (cityData) {
                                createGlyph(d3.select(this), cityData);
                            }
                        })
                        .style("display", "none"); // Initially hide the glyphs

                    // Add a text element to display the city name
                    const cityNameText = mapGroup.append("text")
                    .attr("class", "city-name")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("text-anchor", "middle") // Anchor the text to the middle
                    .style("font-size", "12px")
                    .style("display", "none");

                    // Add zoom functionality
                    const zoom = d3.zoom()
                        .scaleExtent([1, 20])
                        .on("zoom", (event) => {
                            const currentZoom = event.transform.k;
                            mapGroup.attr("transform", event.transform);

                            // Adjust the stroke width based on the zoom level
                            mapGroup.selectAll(".new-path")
                                .attr("stroke-width", 0.5 / currentZoom); // Adjust the divisor as needed

                            // Adjust the radius of the points based on the zoom level
                            mapGroup.selectAll(".point")
                                .attr("r", 3 / currentZoom) ;// Adjust the divisor as needed

                            if (currentZoom > 12) { // Adjust the zoom threshold as needed
                                points.style("display", "none");
                                glyphs.style("display", "block");
                            } else {
                                points.style("display", "block");
                                glyphs.style("display", "none");
                            }

                            // Adjust the font size of the city name based on the zoom level
                            mapGroup.selectAll(".city-name")
                                .style("font-size", `${12 / currentZoom}px`); // Adjust the divisor as needed
                        });

                    svg.call(zoom);

                    // Add hover interaction for points
                    points.on("mouseover", function(event, d) {
                        d3.select(this).style("opacity", 1); // Keep the hovered point fully opaque
                        cityNameText
                            .attr("x", projection(d.geometry.coordinates)[0])
                            .attr("y", projection(d.geometry.coordinates)[1] - 2) // Position above the point
                            .text(d.properties.naam)
                            .style("display", "block");
                    }).on("mouseout", function() {
                        d3.select(this).style("opacity", 0.5); // Reset opacity of the point
                        cityNameText.style("display", "none");
                    });

                    // Add hover interaction for glyphs
                    glyphs.on("mouseover", function(event, d) {
                        d3.selectAll(".glyph").style("opacity", 0.5); // Make other glyphs 50% see-through
                        d3.select(this).style("opacity", 1); // Keep the hovered glyph fully opaque
                        d3.select(this).selectAll(".label").style("display", "block"); // Show the labels of the hovered glyph
                        cityNameText
                            .attr("x", projection(d.geometry.coordinates)[0])
                            .attr("y", projection(d.geometry.coordinates)[1] - 2) // Position above the glyph
                            .text(d.properties.naam)
                            .style("display", "block");
                    }).on("mouseout", function() {
                        d3.selectAll(".glyph").style("opacity", 1); // Reset opacity of all glyphs
                        d3.select(this).selectAll(".label").style("display", "none"); // Hide the labels of the hovered glyph
                        cityNameText.style("display", "none");
                    });

                    data.forEach(function(row) {
                        const point = pointsGeojson.features.find(d => d.properties.naam.toLowerCase() === row.NAME.toLowerCase());
                        if (point) {
                            gemeentePoints.push({
                                name: row.NAME.toLowerCase(),
                                coordinates: point.geometry.coordinates
                            });
                        }
                    });

                    console.log("Gemeente Points:", gemeentePoints);

                }).catch(function(error) {
                    console.error('Error loading or processing CSV data:', error);
                });
            })
            .catch(function(error) {
                console.error('Error loading or processing points GeoJSON data:', error);
            });
    })
    .catch(function(error) {
        console.error('Error loading or processing GeoJSON data:', error);
    });

console.log("Map.js loaded");

// Function to create a glyph
function createGlyph(selection, cityData) {
    const columns = ["z-score AMENITIES", "z-score CRIME", "z-score GREEN", "z-score HOUSEHOLDS", "z-score ADDITIONAL_HOUSING_COST", "z-score NET_HOUSING_COST", "z-score TOTAL_HOUSING_COST", "z-score HOUSING RATIO", "z-score NUMBER OF STUDENTS"];
    const shortNames = ["Amenities", "Crime", "Green", "Household", "Add. Housing Cost", "Net Housing Cost", "Total Housing Cost", "Housing Ratio", "Students"];

    const width = 20; // Adjust the width to make the glyphs smaller
    const height = width;
    const margin = 2;
    const outerRadius = width / 2 - margin;
    const angleSlice = (2 * Math.PI) / columns.length;

    // Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, outerRadius])
        .domain([-5, 3]);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    const g = selection.append("g")
        .attr("transform", `translate(0, 0)`); // Center the glyph at the point location

    const path = g.append("path")
        .datum(columns.map(col => ({ axis: col, value: cityData[col] })))
        .attr("d", radarLine)
        .style("fill", "steelblue")
        .style("fill-opacity", 0.5)
        .style("stroke", "steelblue")
        .style("stroke-width", 0.11); // Adjust the stroke width if needed

    const axes = g.selectAll(".axis")
        .data(columns)
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", (d, i) => `rotate(${(i * 360 / columns.length)})`)
        .each(function (d, i) {
            d3.select(this).append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", -outerRadius)
                .style("stroke", "black")
                .style("stroke-width", 0.1); // Adjust the stroke width if needed
        });

    const labels = g.selectAll(".label")
        .data(columns)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d, i) => (outerRadius + 2) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => {
            const angle = angleSlice * i;
            const offset = angle > Math.PI / 4 && angle < 3 * Math.PI / 4 || angle > 5 * Math.PI / 4 && angle < 7 * Math.PI / 4 ? 0.1 : 1;
            return (outerRadius + offset) * Math.sin(angle - Math.PI / 2);
        })
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .style("font-size", "0.7px") // Adjust the font size if needed
        .text((d, i) => shortNames[i])
        .style("display", "none"); // Initially hide the labels

        // Add hover interaction
        g.on("mouseover", function () {
            d3.selectAll(".glyph").style("opacity", 0.5); // Make other glyphs 50% see-through
            d3.select(this).style("opacity", 1); // Keep the hovered glyph fully opaque
            d3.select(this).selectAll(".label").style("display", "block"); // Show the labels of the hovered glyph
        }).on("mouseout", function () {
            d3.selectAll(".glyph").style("opacity", 1); // Reset opacity of all glyphs
            d3.select(this).selectAll(".label").style("display", "none"); // Hide the labels of the hovered glyph
        });
}

function zoomToMunicipality(cityName, projection) {
    const gemeente = gemeentePoints.find(g => g.name === cityName.toLowerCase());

    if (gemeente) {
        const [longitude, latitude] = gemeente.coordinates;
        const [x, y] = projection([longitude, latitude]);

        d3.selectAll(".gemeente-point").classed("highlight", false);

        d3.selectAll(".gemeente-point")
            .filter(d => d.properties.naam.toLowerCase() === cityName.toLowerCase())
            .classed("highlight", true);

        svg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(4)
                    .translate(-x, -y)
            );
    } else {
        console.error("Municipality not found:", cityName);
    }
}
