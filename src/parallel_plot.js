document.addEventListener("DOMContentLoaded", () => {
    // Set dimensions and margins
    const containerWidth = d3.select("#parallel-plot-container").node().getBoundingClientRect().width;
    const containerHeight = d3.select("#parallel-plot-container").node().getBoundingClientRect().height;

    // Set dynamic margins based on container size
    const margin = {
        top: containerHeight * 0.1,    
        right: containerWidth * 0.05,  
        bottom: containerHeight * 0.2, 
        left: containerWidth * 0.05    
    };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Adjust SVG height to accommodate space for the legend
    const adjustedHeight = height + 150; 
    d3.select("#parallel-plot-container #parallel-plot")
        .attr("height", adjustedHeight + margin.top + margin.bottom);

    // Tooltip for Parallel Coordinates
    const tooltip = d3.select("#parallel-plot-container #tooltip");

    // Colors for legend
    const colors = d3.schemeCategory10;

    // Create SVG for the parallel plot
    const parallelSvg = d3.select("#parallel-plot-container #parallel-plot")
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Manually map z-score columns to user-friendly names
    const attributeNameMap = {
        "z-score AMENITIES": "No. of Amenities",
        "z-score CRIME": "No. of Registered Crime",
        "z-score GREEN": "Percentage of Green Areas",
        "z-score HOUSEHOLDS": "No. of Households",
        "z-score ADDITIONAL_HOUSING_COST": "Additional Housing Cost",
        "z-score NET_HOUSING_COST": "Net Housing Cost",
        "z-score TOTAL_HOUSING_COST": "Total Housing Cost",
        "z-score HOUSING RATIO": "Housing Ratio",
        "z-score NUMBER OF STUDENTS": "No. of Students"
    };

    // Load CSV data for the parallel plot
    d3.csv("../data/combine new cities  - Output.csv").then(function (data) {
        const zScoreCols = Object.keys(data[0]).filter((col) => col.includes("z-score"));
        const cityNames = [...new Set(data.map((d) => d["NAME"]))]; 

        // Set scales for each axis
        const yScales = {};
        zScoreCols.forEach((col) => {
            yScales[col] = d3.scaleLinear()
                .domain([-4, 4]) 
                .range([height, 0]); 
        });



        // Create x-scale for axes
        const xScale = d3.scalePoint()
            .domain(zScoreCols)
            .range([0, width]);

        // Adjust SVG height to accommodate wrapped labels
        const adjustedHeight = height + 100; 
        d3.select("#parallel-plot-container #parallel-plot")
            .attr("height", adjustedHeight + margin.top + margin.bottom);

        // Draw each axis and wrapped labels below
        zScoreCols.forEach((col) => {
            const axis = d3.axisLeft(yScales[col]).ticks(7);

            // Draw the axis
            parallelSvg.append("g")
                .attr("transform", `translate(${xScale(col)}, 0)`)
                .call(axis);

            // Use the manual names for the labels
            const cleanLabel = attributeNameMap[col] || col.replace(/z-score\s*/i, ""); 

            // Add group for axis label
            const labelGroup = parallelSvg.append("g")
                .attr("transform", `translate(${xScale(col)}, ${height + 30})`);

            // Add wrapped text below the axis
            labelGroup.append("text")
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "black")
                .style("font-weight", "bold")
                .text(cleanLabel)  
                .call(wrap, 70); 
        });

        // Wrap function for long text
        function wrap(text, width) {
            text.each(function () {
                const textElement = d3.select(this);
                const words = textElement.text().split(/\s+/).reverse(); // Split into words
                let word;
                let line = [];
                let lineNumber = 0;
                const lineHeight = 1.1; // Adjusting line height
                const x = textElement.attr("x") || 0;
                const y = textElement.attr("y") || 0;

                let tspan = textElement.text(null)
                    .append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", "0em");

                while ((word = words.pop())) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = textElement.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", `${++lineNumber * lineHeight}em`)
                            .text(word);
                    }
                }
            });
        }

        // Function to update the chart based on selected cities and rankings
        function updateChart() {
            // Ensure global rankings are available
            if (typeof globalRankings === "undefined" || globalRankings.length === 0) {
                console.error("Global rankings are not calculated yet.");
                return;
            }

            // Get the top 5 cities from globalRankings
            const topCities = globalRankings.slice(0, 5).map(d => d.city);

            // Filter data based on top 5 cities
            const filteredData = data.filter(d => topCities.includes(d["NAME"]));

            // Clear existing paths and legend
            parallelSvg.selectAll(".line").remove();
            parallelSvg.selectAll(".legend-item").remove();

            // Draw filtered paths
            const line = d3.line()
                .defined(d => !isNaN(d.value))
                .x((d) => xScale(d.axis))
                .y((d) => yScales[d.axis](+d.value));

            filteredData.forEach((row, i) => {
                const pathData = zScoreCols.map((col) => ({ axis: col, value: row[col] }));

                parallelSvg.append("path")
                    .datum(pathData)
                    .attr("class", "line")
                    .attr("d", line)
                    .attr("stroke", colors[i % colors.length])
                    .attr("fill", "none")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-opacity", d => pathData.some(p => isNaN(p.value)) ? 0.3 : 0.7)  
                    .attr("stroke-dasharray", d => pathData.some(p => isNaN(p.value)) ? "4 4" : "none")  

                    .on("mouseover", function (event, d) {
                        // Highlight the line
                        d3.select(this)
                            .attr("stroke-width", 3)
                            .attr("stroke-opacity", 1);

                        // Show tooltip
                        tooltip
                            .style("display", "block")
                            .html(`<strong>${row["NAME"]}</strong><br>
                                ${zScoreCols.map(col => 
                                    `${attributeNameMap[col]}: ${isNaN(row[col]) ? "No Data" : row[col]}`
                                ).join("<br>")}`);
                    })
                    .on("mousemove", function (event) {
                        // Move tooltip with cursor
                        tooltip
                            .style("left", `${event.pageX + 10}px`) 
                            .style("top", `${event.pageY}px`);
                    })
                    .on("mouseout", function () {
                        // Reset line style
                        d3.select(this)
                            .attr("stroke-width", 1.5)
                            .attr("stroke-opacity", 0.7);

                        // Hide tooltip
                        tooltip.style("display", "none");
                    });
            });

            // Update legend with filtered city names
            const legend = parallelSvg.append("g")
                .attr("transform", `translate(0, ${height + 50})`) 
                .selectAll(".legend-item")
                .data(filteredData)
                .enter()
                .append("g")
                .attr("class", "legend-item")
                .attr("transform", (d, i) => `translate(${i * 150}, 0)`); 

            legend.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", (d, i) => colors[i % colors.length]);

            legend.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text((d) => d["NAME"]) 
                .style("font-size", "12px");
            const legendMissing = parallelSvg.append("g")
                .attr("transform", `translate(0, ${height + 80})`);

            legendMissing.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", "lightgray")
                .style("stroke-dasharray", "4 4");  

            legendMissing.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text("Missing Data")
                .style("font-size", "12px");

        }

        // Attach updateChart function to the "Update Global Rankings" button
        d3.select("#buttons-container")
            .append("button")
            .text("Filter")
            .style("margin", "20px")
            .style("padding", "10px")
            .style("background", "#007BFF")
            .style("color", "white")
            .style("border", "none")
            .style("border-radius", "5px")
            .style("cursor", "pointer")
            .on("click", () => {
                updateChart();
            });
    });
});
