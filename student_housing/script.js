// Load the CSV file
d3.csv("student_household_2015.csv").then(data => {
    // Convert percentages to numbers
    data.forEach(d => {
      d["Student households (percent)"] = +d["Student households (percent)"];
    });
  
    // Debug: Log unique municipalities to verify domain
    console.log([...new Set(data.map(d => d.Municipalities))]);
  
    // Set dimensions and margins for the chart
    const width = data.length * 15; // Dynamic width based on number of rows
    const height = 600;
    const margin = { top: 30, right: 30, bottom: 120, left: 100 };
  
    // Create the SVG container with a scrollable div
    const container = d3.select("#chart")
      .style("overflow-x", "scroll") // Enable horizontal scrolling
      .style("white-space", "nowrap"); // Prevent wrapping
  
    const svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Set scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.Municipalities)) // Map all unique municipalities to x-axis
      .range([0, width]) // Set range from 0 to chart width
      .padding(0.2); // Add padding between bars
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d["Student households (percent)"])]) // Scale to max percentage
      .nice()
      .range([height, 0]);
  
    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "10px");
  
    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(10))
      .append("text")
      .attr("fill", "black")
      .attr("x", -margin.left + 10)
      .attr("y", -10)
      .attr("text-anchor", "start")
      .text("Student Households (%)");
  
    // Add bars
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Municipalities)) // Align bars with x-axis
      .attr("y", d => y(d["Student households (percent)"])) // Align with y-axis
      .attr("width", x.bandwidth()) // Use bandwidth for bar width
      .attr("height", d => height - y(d["Student households (percent)"])) // Calculate bar height
      .attr("fill", "steelblue");
  
    // Add labels on top of the bars
    svg.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.Municipalities) + x.bandwidth() / 2) // Center labels on bars
      .attr("y", d => y(d["Student households (percent)"]) - 5) // Position slightly above bars
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text(d => d["Student households (percent)"].toFixed(1));
  });
  