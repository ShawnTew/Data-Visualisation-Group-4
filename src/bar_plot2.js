(function createBarPlot() {
    const container = document.getElementById("bar-plot");

    // Add HTML structure for the bar plot
    container.innerHTML = `
        <h2>Bar Plot: Z-Scores by Attribute</h2>
        <div style="display: flex; align-items: flex-start;">
            <svg id="bar-chart" width="100%" height="400"></svg>
            <div id="legend-container" style="margin-left: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"></div>
        </div>
    `;

    const tooltip = document.getElementById("tooltip");

    // Map for the attribute names to display in the legend and tooltip
    const attributeNameMap = {
        "z-score AMENITIES": "No. of Amenities",
        "z-score CRIME": "No. of Registered Crime",
        "z-score GREEN": "Percentage of Green Areas",
        "z-score HOUSEHOLDS": "No. of Households",
        "z-score ADDITIONAL_HOUSING_COST": "Additional Housing Cost",
        "z-score NET_HOUSING_COST": "Net Housing Cost",
        "z-score TOTAL_HOUSING_COST": "Total Housing Cost",
        "z-score HOUSING RATIO": "Student Housing Ratio",
        "z-score NUMBER OF STUDENTS": "No. of Students"
    };

    // Load the CSV data
    d3.csv("../data/data_file.csv").then(data => {
        const attributes = [
            "z-score AMENITIES",
            "z-score CRIME",
            "z-score GREEN",
            "z-score HOUSEHOLDS",
            "z-score ADDITIONAL_HOUSING_COST",
            "z-score NET_HOUSING_COST",
            "z-score TOTAL_HOUSING_COST",
            "z-score HOUSING RATIO",
            "z-score NUMBER OF STUDENTS"
        ];

        const categories = data.map(d => d.NAME);
        const series = attributes.map(attr => ({
            name: attr,
            values: data.map(d => +d[attr])
        }));

        // Dimensions and margins
        const margin = { top: 20, right: 20, bottom: 100, left: 50 };
        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Append the SVG element
        const svg = d3.select("#bar-chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Add a group for zoom and pan
        const zoomGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const chartGroup = zoomGroup.append("g");

        // Set up scales
        const x0 = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .padding(0.3);

        const x1 = d3.scaleBand()
            .domain(series.map(d => d.name))
            .range([0, x0.bandwidth()])
            .padding(0.01);

        const y = d3.scaleLinear()
            .domain([d3.min(series.flatMap(d => d.values)) - 1, d3.max(series.flatMap(d => d.values)) + 1])
            .nice()
            .range([height, 0]);

        // Add axes
        chartGroup.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-30)") // Rotate x-axis labels
            .attr("dy", "0.7em") // Move label slightly down
            .style("font-size", "14px")
            .style("text-anchor", "end");

        chartGroup.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Add axis labels
        svg.append("text")             
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Z-Scores");

        svg.append("text")             
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Cities");

        // Add dashed line at y=0
        chartGroup.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 4");

        // Add gridlines
        chartGroup.append("g")
            .attr("class", "grid")
            .call(
                d3.axisLeft(y)
                    .tickSize(-width) // Extend gridlines across the chart
                    .tickFormat("") // Hide tick labels
            )
            .selectAll("line")
            .attr("stroke", "#ddd")
            .attr("stroke-dasharray", "4 4");

        // Add groups for each category
        const categoryGroups = chartGroup.selectAll(".category-group")
            .data(data)
            .enter().append("g")
            .attr("class", "category-group")
            .attr("transform", d => `translate(${x0(d.NAME)},0)`);

        // Add bars
        categoryGroups.selectAll("rect")
            .data(d => series.map(s => ({ name: s.name, value: +d[s.name] })))
            .enter().append("rect")
            .attr("x", d => x1(d.name))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", (d, i) => d3.schemeTableau10[i])
            .on("mouseover", function (event, d) {
                const formattedName = attributeNameMap[d.name] || d.name;  // Use map to format the name
                tooltip.style.display = "block";
                tooltip.innerHTML = `${formattedName}: ${d.value}`;
                d3.select(this).style("opacity", 0.7);

                // Dim other bars
                chartGroup.selectAll("rect")
                    .filter(bar => bar.name !== d.name)
                    .style("opacity", 0.2);
            })
            .on("mousemove", function (event) {
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;
                const offsetX = event.pageX + 10 + tooltipWidth > window.innerWidth ? -tooltipWidth - 20 : 10;
                const offsetY = event.pageY - 20 + tooltipHeight > window.innerHeight ? -tooltipHeight - 20 : -20;
                tooltip.style.left = event.pageX + offsetX + "px";
                tooltip.style.top = event.pageY + offsetY + "px";
            })
            .on("mouseout", function () {
                tooltip.style.display = "none";
                d3.select(this).style("opacity", 1);

                // Restore bar opacities
                chartGroup.selectAll("rect").style("opacity", 1);
            });

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 5])
            .translateExtent([[-500, -200], [width + 500, height + 200]])
            .on("zoom", (event) => {
                chartGroup.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Add legend to a separate container
        const legendContainer = d3.select("#legend-container");

        // Add legend title
        legendContainer.append("div")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text("Legend");

        // Add Legend rows
        series.forEach((s, i) => {
            const legendRow = legendContainer.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("cursor", "pointer")
                .on("mouseover", () => {
                    chartGroup.selectAll("rect")
                        .style("opacity", d => d.name === s.name ? 1 : 0.2);
                })
                .on("mouseout", () => {
                    chartGroup.selectAll("rect")
                        .style("opacity", 1)
                });

            legendRow.append("div")
                .style("width", "12px")
                .style("height", "12px")
                .style("margin-right", "8px")
                .style("background-color", d3.schemeTableau10[i]);

            legendRow.append("span")
                .style("font-size", "12px")
                .text(attributeNameMap[s.name] || s.name);  // Use map to format the name
        });
    });
})();

