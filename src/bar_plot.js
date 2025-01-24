// Bar plot logic using D3.js
(function createBarPlot() {
    const container = document.getElementById("bar-plot");

    // Add HTML structure for the bar plot
    container.innerHTML = `
        <h2>Bar Plot: Z-Scores by Attribute</h2>
        <svg id="bar-chart" width="900" height="400"></svg>
    `;

    // Load the CSV data
    d3.csv("../data/data_file.csv").then(data => {
        // Extract relevant columns and z-scores
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
        const margin = { top: 20, right: 300, bottom: 70, left: 50 };
        const width = 1800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Append the SVG element
        const svg = d3.select("#bar-chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const x0 = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .padding(0.3);

        const x1 = d3.scaleBand()
            .domain(series.map(d => d.name))
            .range([0, x0.bandwidth()])
            .padding(0.03);

        const y = d3.scaleLinear()
            .domain([d3.min(series.flatMap(d => d.values)) - 1, d3.max(series.flatMap(d => d.values)) + 1])
            .nice()
            .range([height, 0]);

        // Add axes
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("font-size", "14px")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Add groups for each category
        const categoryGroups = svg.selectAll(".category-group")
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
            .attr("fill", (d, i) => d3.schemeCategory10[i]);

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20},20)`);

        // Add legend title
        legend.append("text")
            .attr("x", 0) 
            .attr("y", 0) 
            .attr("text-anchor", "start")
            .style("font-size", "20px") 
            .style("font-weight", "bold") 
            .text("Legend");
        
        // Add Legend rows
        series.forEach((s, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0,${i * 30})`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("x", 0)
                .attr("y", 30)
                .attr("fill", d3.schemeCategory10[i]);

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 40)
                .attr("text-anchor", "start")
                .style("font-size", "12px")
                .style("text-transform", "capitalize")
                .text(s.name.replace("z-score ", ""));
        });
    });
})();
