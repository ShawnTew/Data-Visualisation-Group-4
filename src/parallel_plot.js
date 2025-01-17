document.addEventListener("DOMContentLoaded", () => {
    // Set dimensions and margins
    const margin = { top: 30, right: 150, bottom: 100, left: 40 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Tooltip for Parallel Coordinates
    const tooltip = d3.select("#parallel-plot-container #tooltip");

    // Colors for legend
    const colors = d3.schemeCategory10;

    // Create SVG for the parallel plot
    const parallelSvg = d3.select("#parallel-plot-container #parallel-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a dropdown container for "NAME" filter
    const dropdownContainer = d3.select("#parallel-plot-container")
        .append("div")
        .attr("id", "dropdown-container")
        .style("margin-bottom", "20px");

    // Create dropdown button
    dropdownContainer.append("button")
        .attr("id", "dropdown-button")
        .text("Select Cities")
        .style("display", "none")
        .style("margin-right", "10px")
        .style("padding", "5px 10px");

    // Create the dropdown menu
    const dropdownMenu = dropdownContainer.append("div")
        .attr("id", "dropdown-menu")
        .style("display", "none") // Initially hidden
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("z-index", "1000");

    // Load CSV data for the parallel plot
    d3.csv("../data/combine new cities  - Output.csv").then(function (data) {
        const zScoreCols = Object.keys(data[0]).filter((col) => col.includes("z-score"));
        const cityNames = [...new Set(data.map((d) => d["NAME"]))]; // Unique city names

        // Add checkboxes to dropdown menu
        dropdownMenu.selectAll("label")
            .data(cityNames)
            .enter()
            .append("label")
            .style("display", "block")
            .html((d) => `
                <input type="checkbox" value="${d}" checked> ${d}
            `);

        // Toggle dropdown menu visibility
        d3.select("#dropdown-button").on("click", () => {
            const isVisible = dropdownMenu.style("display") === "block";
            dropdownMenu.style("display", isVisible ? "none" : "block");
        });

        // Set scales for each axis
        const yScales = {};
        zScoreCols.forEach((col) => {
            yScales[col] = d3.scaleLinear()
                .domain([-3, 3]) // Fixed range for z-scores
                .range([height, 0]); // Map to vertical axis
        });

        // Create x-scale for axes
        const xScale = d3.scalePoint()
            .domain(zScoreCols)
            .range([0, width]);

        // Adjust SVG height to accommodate wrapped labels
        const adjustedHeight = height + 100; // Extra space for labels
        d3.select("#parallel-plot-container #parallel-plot")
            .attr("height", adjustedHeight + margin.top + margin.bottom);

        // Draw each axis and wrapped labels below
        zScoreCols.forEach((col) => {
            const axis = d3.axisLeft(yScales[col]).ticks(7);

            // Draw the axis
            parallelSvg.append("g")
                .attr("transform", `translate(${xScale(col)}, 0)`)
                .call(axis);

            // Clean the column name by removing "z-score"
            const cleanLabel = col.replace(/z-score\s*/i, ""); // Clean text

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
                .call(wrap, 70); // Wrap if width exceeds 70px
        });

        // Wrap function for long text
        function wrap(text, width) {
            text.each(function () {
                const textElement = d3.select(this);
                const words = textElement.text().split(/\s+/).reverse(); // Split into words
                let word;
                let line = [];
                let lineNumber = 0;
                const lineHeight = 1.1; // Adjust line height
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

        // Updated updateChart function
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
                .x((d) => xScale(d.axis)) // Map axis position
                .y((d) => yScales[d.axis](+d.value)); // Map value to axis scale

            filteredData.forEach((row, i) => {
                const pathData = zScoreCols.map((col) => ({ axis: col, value: row[col] }));

                parallelSvg.append("path")
                    .datum(pathData)
                    .attr("class", "line")
                    .attr("d", line)
                    .attr("stroke", colors[i % colors.length]) // Assign color for each city
                    .attr("fill", "none")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-opacity", 0.7)
                    .on("mouseover", function (event, d) {
                        // Highlight the line
                        d3.select(this)
                            .attr("stroke-width", 3)
                            .attr("stroke-opacity", 1);

                        // Show tooltip
                        tooltip
                            .style("display", "block")
                            .html(`<strong>${row["NAME"]}</strong>`); // Display city name
                    })
                    .on("mousemove", function (event) {
                        // Move tooltip with cursor
                        tooltip
                            .style("left", `${event.pageX + 10}px`) // Offset from cursor
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
                .attr("transform", `translate(0, ${height + 50})`) // Position below the graph
                .selectAll(".legend-item")
                .data(filteredData)
                .enter()
                .append("g")
                .attr("class", "legend-item")
                .attr("transform", (d, i) => `translate(${i * 150}, 0)`); // Position items horizontally

            legend.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", (d, i) => colors[i % colors.length]);

            legend.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text((d) => d["NAME"]) // Display city names
                .style("font-size", "12px");
        }

        // Attach updateChart function to the "Update Global Rankings" button
        d3.select("#buttons-container")
            .append("button")
            .text("Update Parallel Coordinates Plot")
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