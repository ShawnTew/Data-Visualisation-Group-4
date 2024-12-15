const dataFile = "../data/Combination - amenities.csv";

const columns = ["z-score AMENITIES", "z-score CRIME", "z-score GREEN", "z-score HOUSEHOLDS", "z-score ADDITIONAL_HOUSING_COST", "z-score NET_HOUSING_COST", "z-score TOTAL_HOUSING_COST", "z-score HOUSING RATIO", "z-score NUMBER OF STUDENTS"];

d3.csv(dataFile).then(data => {
    data.forEach(d => {
        columns.forEach(column => {
            d[column] = +d[column]; // Convert to number
            if (isNaN(d[column])) {
                d[column] = -5; // Handle missing or invalid values
            }
        });
    });

    const width = 350; // Adjust the width as needed
    const height = width;
    const margin = 10;
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

    data.forEach(d => {
        const svg = d3.select("#chart").append("svg")
            .attr("viewBox", `0 0 ${width * 2} ${height * 2}`) // Increase viewBox size
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("style", "width: 100%; height: auto; max-width: 300px; max-height: 300px; display: block; margin: auto; font: 10px sans-serif;")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round");

        const g = svg.append("g")
            .attr("transform", `translate(${width}, ${height}) scale(1.5)`); // Scale down the glyph

        const path = g.append("path")
            .datum(d) // Bind data to the path
            .attr("d", radarLine(columns.map((col, i) => ({ axis: col, value: d[col] }))))
            .style("fill", "steelblue")
            .style("fill-opacity", 0.5)
            .style("stroke", "steelblue")
            .style("stroke-width", 2);

        g.selectAll(".axis")
            .data(columns)
            .enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", (d, i) => `rotate(${(i * 360 / columns.length)})`)
            .each(function(d, i) {
                d3.select(this).append("line")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", -outerRadius)
                    .style("stroke", "black")
                    .style("stroke-width", 1);
            });

        g.selectAll(".label")
            .data(columns)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", (d, i) => outerRadius * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => outerRadius * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .text(d => d.replace("z-score ", ""));

        // Add hover interaction
        path.on("mouseover", function(event, d) {
            const labels = g.selectAll(".axis-label")
                .data(columns.map((col, i) => ({ axis: col, value: d[col] })))
                .enter()
                .append("g")
                .attr("class", "axis-label")
                .attr("transform", (d, i) => `translate(${rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2)}, ${rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)})`);

            labels.append("rect")
                .attr("x", -15)
                .attr("y", -10)
                .attr("width", 30)
                .attr("height", 20)
                .attr("fill", "white");

            labels.append("text")
                .attr("dy", "0.35em")
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .text(d => d.value === -5 ? "NaN" : d.value);
        }).on("mouseout", function() {
            g.selectAll(".axis-label").remove();
        });
    });
}).catch(error => {
    console.error('Error loading or processing data:', error);
});