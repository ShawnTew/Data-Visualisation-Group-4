let projection;
let gemeentePoints = [];
let svg; // Global SVG for reuse
let mapGroup; // Global map group for reuse

// Load the GeoJSON file and render the map
d3.json("../data/nl.json")
    .then(function (geojsonNew) {
        // Set up the SVG element
        const width = window.innerWidth * 0.5; // 75% of the screen width
        const height = 1.2 * width;

        svg = d3.select("#map").append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet") // Ensure responsive scaling
        .style("width", "auto")
        .style("height", "auto");

        // Set up the projection and path generator
        projection = d3.geoMercator()
            .center([5.5, 52.2]) // Center the map on the Netherlands
            .scale(6000) // Adjust the scale as needed
            .translate([width / 2, height / 2]); // Center the map in the SVG element

        const path = d3.geoPath().projection(projection);

        // Create a group for the map elements
        mapGroup = svg.append("g");

        // Render the new map
        mapGroup.selectAll(".geojson-path")
            .data(geojsonNew.features)
            .enter().append("path")
            .attr("class", "geojson-path")
            .attr("d", function (d) {
                const pathData = path(d);
                if (!pathData) {
                    console.error("Invalid path data for feature:", d);
                }
                return pathData;
            })
            .attr("fill", "#f0f0f0")
            .attr("stroke", "darkgrey")
            .attr("stroke-width", 0.5);

        // Load the GeoJSON file containing the points
        d3.json("../data/gemeente_locations.geojson")
            .then(function (pointsGeojson) {
                // Load the CSV file containing the data
                d3.csv("../data/data_file.csv").then(function (data) {
                    // Append points to represent the locations
                    const points = mapGroup.selectAll(".gemeente-point")
                        .data(pointsGeojson.features)
                        .enter().append("circle")
                        .attr("class", "gemeente-point")
                        .attr("cx", d => projection(d.geometry.coordinates)[0])
                        .attr("cy", d => projection(d.geometry.coordinates)[1])
                        .attr("r", 3)
                        .attr("fill", "red");

                    // Append glyphs to represent the points at the specified locations
                    const glyphs = mapGroup.selectAll(".glyph")
                        .data(pointsGeojson.features)
                        .enter().append("g")
                        .attr("class", "glyph")
                        .attr("transform", function (d) {
                            const coords = projection(d.geometry.coordinates);
                            return `translate(${coords[0]}, ${coords[1]})`;
                        })
                        .each(function (d) {
                            const cityData = data.find(city => city.NAME === d.properties.naam);
                            if (cityData) {
                                createGlyph(d3.select(this), cityData);
                            }
                        })
                        .style("display", "none"); // Initially hide the glyphs

                    // Add zoom functionality
                    const zoom = d3.zoom()
                    .scaleExtent([1, 20]) // Min and max zoom levels
                    .translateExtent([[0, 0], [width, height]]) // Prevent panning outside map
                    .on("zoom", (event) => {
                        const currentZoom = event.transform.k;
                        mapGroup.attr("transform", event.transform);
                
                        // Show glyphs and hide points when zoomed in
                        if (currentZoom > 5) {
                            points.style("display", "none");
                            glyphs.style("display", "block");
                        } else {
                            points.style("display", "block");
                            glyphs.style("display", "none");
                        }
                    });
                
                svg.call(zoom);

                    // Add hover interaction for points
                    points.on("mouseover", function (event, d) {
                        d3.select(this).style("opacity", 1);

                        // Append a text element near the point to display its name
                        mapGroup.append("text")
                        .attr("class", "point-name")
                        .attr("x", projection(d.geometry.coordinates)[0])
                        .attr("y", projection(d.geometry.coordinates)[1] - 10) // Position above the point
                        .attr("text-anchor", "middle")
                        .style("font-size", `${12 / d3.zoomTransform(svg.node()).k}px`) // Dynamic font size based on zoom level
                        .style("fill", "black")
                        .text(d.properties.naam); // Use the point's name

                    }).on("mouseout", function () {
                        d3.select(this).style("opacity", 0.5);
                        mapGroup.select(".point-name").remove();

                    });

                    // Add hover interaction for glyphs
                    glyphs.on("mouseover", function (event, d) {
                        d3.selectAll(".glyph").style("opacity", 0.3);
                        d3.select(this).style("opacity", 1);
                    }).on("mouseout", function () {
                        d3.selectAll(".glyph").style("opacity", 1);
                    });

                    // Store municipality points
                    data.forEach(function (row) {
                        const point = pointsGeojson.features.find(d => d.properties.naam.toLowerCase() === row.NAME.toLowerCase());
                        if (point) {
                            gemeentePoints.push({
                                name: row.NAME.toLowerCase(),
                                coordinates: point.geometry.coordinates
                            });
                        }
                    });

                    console.log("Gemeente Points:", gemeentePoints);

                    // Apply Filter and Highlight Municipality
                    document.getElementById("applyFilter").addEventListener("click", () => {
                        const preferredCity = document.getElementById("preferredCity").value.trim().toLowerCase();
                    
                        // Reset any previous highlights
                        d3.selectAll(".gemeente-point").classed("highlight", false);
                    
                        // Find the municipality and highlight it
                        const selectedPoint = d3.selectAll(".gemeente-point")
                            .filter(d => d.properties.naam.toLowerCase() === preferredCity);
                    
                        if (!selectedPoint.empty()) {
                            selectedPoint
                                .classed("highlight", true)
                                .attr("stroke", "yellow")
                                .attr("stroke-width", 2);
                    
                            // Get the coordinates of the selected municipality
                            const [x, y] = projection(selectedPoint.datum().geometry.coordinates);
                    
                            // Set the desired zoom level
                            const zoomLevel = 7;
                    
                            // Programmatically zoom and center on the selected municipality
                            svg.transition()
                                .duration(750) // Animation duration in ms
                                .call(
                                    zoom.transform,
                                    d3.zoomIdentity
                                        .translate(width / 2, height / 2) // Center the map
                                        .scale(zoomLevel) // Set zoom level
                                        .translate(-x, -y) // Translate to center the municipality
                                );
                        } else {
                            console.error("Municipality not found:", preferredCity);
                        }
                    });
                });
            });
    });

    function createGlyph(selection, cityData) {
        const columns = ["z-score AMENITIES", "z-score CRIME", "z-score GREEN", "z-score HOUSEHOLDS", "z-score ADDITIONAL_HOUSING_COST", "z-score NET_HOUSING_COST", "z-score TOTAL_HOUSING_COST", "z-score HOUSING RATIO", "z-score NUMBER OF STUDENTS"];
        const shortNames = ["Amenities", "Crime", "Green", "Household", "Add. Housing Cost", "Net Housing Cost", "Total Housing Cost", "Housing Ratio", "Students"];
    
        const width = 10; // Adjust the width of the glyph
        const outerRadius = width / 2;
        const angleSlice = (2 * Math.PI) / columns.length;
    
        const rScale = d3.scaleLinear()
            .range([0, outerRadius])
            .domain([-5, 3]);
    
        const radarLine = d3.lineRadial()
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);
    
        const g = selection.append("g");
    
        // Radar chart path
        g.append("path")
            .datum(columns.map(col => ({ axis: col, value: cityData[col] })))
            .attr("d", radarLine)
            .style("fill", "steelblue")
            .style("fill-opacity", 0.5)
            .style("stroke", "steelblue")
            .style("stroke-width", 0.5); // Reduced stroke width
    
        // Axes for the radar chart
        g.selectAll(".axis")
            .data(columns)
            .enter()
            .append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => outerRadius * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => outerRadius * Math.sin(angleSlice * i - Math.PI / 2))
            .style("stroke", "black")
            .style("stroke-width", 0.1); // Reduced stroke width
    
        // Labels for axes
        g.selectAll(".label")
            .data(columns)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", (d, i) => (outerRadius + 0.1) * Math.cos(angleSlice * i - Math.PI / 2)) // Reduced distance from axes
            .attr("y", (d, i) => (outerRadius + 0.1) * Math.sin(angleSlice * i - Math.PI / 2)) // Reduced distance from axes
            .style("font-size", "0.8px") // Smaller font size
            .style("text-anchor", (d, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                if (Math.abs(angle) < Math.PI / 2) return "start"; // Right side
                else if (Math.abs(angle) > Math.PI / 2) return "end"; // Left side
                return "middle"; // Center
            })
            .text((d, i) => shortNames[i]);
    }
    
