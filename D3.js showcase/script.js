// ============================================
// 🎯 STEP 1: LOADING DATA
// Difference #1 from Chart.js: Direct handling
// ============================================

d3.csv("spotify_sampled.csv").then(data => {
    
    // Numeric parsing and cleaning
    data.forEach(d => {
        d.track_popularity = +d.track_popularity;
        d.artist_popularity = +d.artist_popularity;
        d.artist_followers = +d.artist_followers;
        d.album_total_tracks = +d.album_total_tracks;
        d.track_duration_min = +d.track_duration_min;
        d.explicit = d.explicit === "TRUE";
        
        // Parse release date
        d.album_release_date = new Date(d.album_release_date);
        d.release_year = d.album_release_date.getFullYear();
        d.release_month = d.album_release_date.getMonth() + 1;
        // Add jittered x position
        d.jittered_x = d.release_year + (d.release_month / 12) - 0.5;
    });
    
    // Filter valid data
    data = data.filter(d => {
        return d.track_popularity > 0 && 
               d.artist_followers > 0 &&
               d.track_duration_min > 0 &&
               d.release_year >= 2021;
    })
    // Sort by popularity and take top 300
    .sort((a, b) => b.track_popularity - a.track_popularity)
    .slice(0, 300);
        
    
    // ============================================
    // 🎯 STEP 2: SVG SETUP
    // Difference #2: Total DOM control
    // With Chart.js: predefined canvas
    // With D3: build your SVG from scratch
    // ============================================
    
    const margin = {top: 60, right: 40, bottom: 80, left: 100};
    const width = 1100 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;
    
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add background
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#121212")
        .attr("opacity", 0.3)
        .attr("rx", 8);
    
    
    // ============================================
    // 🎯 STEP 3: SCALES - THE HEART OF D3
    // Difference #3: Customizable scales
    // Scales map data → pixels/colors
    // This is D3's true power!
    // ============================================
    
    // X SCALE: Release Year
    const xScale = d3.scaleLinear()
        .domain([
            d3.min(data, d => d.release_year) - 0.6,
            d3.max(data, d => d.release_year) + 0.6
        ])
        .range([0, width]);
    
    // Y SCALE: Track Popularity (0-100)
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0])
        .nice();
    
    // RADIUS SCALE: Track Duration (minutes)
    const radiusScale = d3.scaleSqrt()
        .domain([
            d3.min(data, d => d.track_duration_min),
            d3.max(data, d => d.track_duration_min)
        ])
        .range([4, 25]);
    
    // COLOR SCALE: Artist Followers (log scale for better distribution)
    const colorScale = d3.scaleLog()
        .domain([
            d3.min(data, d => d.artist_followers),
            d3.max(data, d => d.artist_followers)
        ])
        .range(["#121212", "#1db954"])
        .interpolate(d3.interpolateRgb);
    
    
    // ============================================
    // 🎯 STEP 4: AXES
    // Difference #4: Axes generated from data
    // ============================================
    
    const xAxis = d3.axisBottom(xScale)
        .ticks(8)
        .tickFormat(d => `${Math.round(d)}`);
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(d => `${d}%`);
    
    // X Axis
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("fill", "#b3b3b3");
    
    // Y Axis
    svg.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis)
        .selectAll("text")
        .style("fill", "#b3b3b3");
    
    // X Axis Label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#1db954")
        .style("font-weight", "bold")
        .text("📅 Release Year");
    
    // Y Axis Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -85)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#1db954")
        .style("font-weight", "bold")
        .text("📊 Track Popularity");
    
    
    // ============================================
    // 🎯 STEP 5: DATA BINDING - D3'S MAGIC
    // Difference #5: Join pattern (enter/update/exit)
    // This is IMPOSSIBLE with Chart.js!
    // ============================================
    
    const bubbles = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.jittered_x))
        .attr("cy", d => yScale(d.track_popularity))
        .attr("r", 0)  // Start at 0 for animation
        .attr("fill", d => colorScale(d.artist_followers))
        .attr("opacity", 0.6)
        .attr("stroke", "#b3b3b3")
        .attr("stroke-width", 1.5);
    
    
    // ============================================
    // 🎯 STEP 6: COLOR LEGEND
    // Difference #6: Customizable components
    // ============================================
    
    const legendWidth = 180;
    const legendHeight = 12;
    
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(20, -45)`);
    
    // Gradient for legend
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");
    
    const numStops = 10;
    const colorDomain = colorScale.domain();
    for (let i = 0; i <= numStops; i++) {
        const value = colorDomain[0] * Math.pow(colorDomain[1] / colorDomain[0], i / numStops);
        gradient.append("stop")
            .attr("offset", `${(i / numStops) * 100}%`)
            .attr("stop-color", colorScale(value));
    }
    
    // Gradient rectangle
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .style("stroke", "#535353")
        .style("stroke-width", 1);
    
    // Legend title
    legend.append("text")
        .attr("x", 0)
        .attr("y", -8)
        .style("font-size", "10px")
        .style("fill", "#b3b3b3")
        .style("font-weight", "bold")
        .text("👥 Artist Followers");
    
    // Min-max labels
    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 12)
        .style("font-size", "8px")
        .style("fill", "#535353")
        .text("Few");
    
    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 12)
        .attr("text-anchor", "end")
        .style("font-size", "8px")
        .style("fill", "#535353")
        .text("Many");
    
    
    // ============================================
    // 🎯 STEP 7: ANIMATED TRANSITIONS
    // Difference #7: Smooth and controllable transitions
    // ============================================
    
    bubbles.transition()
        .duration(2000)
        .delay((d, i) => i * 15)
        .ease(d3.easeElasticOut)
        .attr("r", d => radiusScale(d.track_duration_min));
    
    
    // ============================================
    // 🎯 STEP 8: INTERACTIVITY
    // Difference #8: Custom events on each element
    // ============================================
    
    const tooltip = d3.select("#tooltip");
    const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(0)+"K" : n;
    
    bubbles
        .on("mouseover", function(event, d) {
            // Highlight this bubble
            d3.select(this)
                .transition().duration(200)
                .attr("r", radiusScale(d.track_duration_min) * 1.5)
                .attr("stroke", "#1db954")
                .attr("stroke-width", 3)
                .attr("opacity", 1);
            
            // Dim others
            bubbles.filter(b => b !== d)
                .transition().duration(200)
                .attr("opacity", 0.15);
        })
        .on("mouseout", function(event, d) {
            // Reset ALL bubbles to their original state
            bubbles
                .transition().duration(200)
                .attr("r", b => radiusScale(b.track_duration_min))
                .attr("stroke", "#b3b3b3")
                .attr("stroke-width", 1.5)
                .attr("opacity", 0.6);
        })
        .on("click", function(event, d) {
            event.stopPropagation();
            
            tooltip.classed("visible", true)
                .html(`<strong>${d.track_name}</strong><br>by ${d.artist_name}<br>📅 ${d.release_year} • 📊 ${d.track_popularity}%<br>👥 ${fmt(d.artist_followers)} • ⏱️ ${d.track_duration_min.toFixed(1)}min`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        });
    
    // Hide tooltip on outside click
    d3.select(document).on("click", () => tooltip.classed("visible", false));
    
    
    // ============================================
    // 🎯 RECAP: WHY D3.js?
    // ============================================
    /*
    
    📊 WHAT THIS CHART SHOWS:
    - X Axis: Release Year (timeline)
    - Y Axis: Track Popularity (0-100)
    - Circle size: Track duration (minutes)
    - Circle color: Artist Followers (logarithmic)
    
    🖱️ INTERACTION:
    - Hover: highlight bubble + dim others
    - Click: show detailed tooltip
    - Click outside: hide tooltip
    
    Chart.js vs D3.js:
    
    Chart.js:
    ✅ Fast for standard charts
    ✅ Simple configuration
    ❌ Limited to predefined charts
    ❌ Hard to customize
    ❌ Canvas (not SVG)
    ❌ Max 2-3 dimensions realistically
    
    D3.js:
    ✅ Total control
    ✅ Manipulable SVG
    ✅ Powerful data binding
    ✅ Smooth transitions
    ✅ Any imaginable visualization
    ✅ 4+ dimensions easily!
    ⚠️ Steeper learning curve
    
    📚 The 5 key concepts (the 20% that explains 80%):
    
    1. 📊 SELECTIONS: d3.select() / d3.selectAll()
       → Select DOM elements like jQuery
       → Foundation of everything in D3
    
    2. 📈 DATA BINDING: .data().enter().append()
       → Bind data to visual elements
       → Each circle = one song
       → THIS is what differentiates D3
    
    3. 📏 SCALES: xScale, yScale, radiusScale, colorScale
       → Convert data into SVG coordinates
       → 4 scales = 4 visual dimensions!
       → This is THE most powerful concept!
    
    4. 🎬 TRANSITIONS: .transition().duration()
       → Smooth animations on any attribute
       → Automatic 60fps
       → Visual connection between states
    
    5. 🎯 EVENTS: .on("mouseover", ...) 
       → Total interactivity on each element
       → Highlight + dim effect
       → None of this is possible with Canvas!
    
    */
    
}).catch(error => {
    console.error("❌ Data loading error:", error);
    d3.select("#visualization")
        .append("div")
        .style("text-align", "center")
        .style("padding", "50px")
        .style("color", "#b3b3b3")
        .html(`
            <h2 style="color: #1db954;">⚠️ File not found</h2>
            <p>Make sure "spotify_sampled.csv" is in the same folder</p>
            <p style="color: #535353; font-size: 0.9em;">Looking for: spotify_sampled.csv</p>
        `);
});