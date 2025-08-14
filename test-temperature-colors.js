// Test script to verify temperature color calculations
// Run with: node test-temperature-colors.js

const getTemperatureBackground = (temp) => {
  if (temp <= 45) {
    // -60 to 45: gradient from #0D47A1 to white
    const ratio = Math.max(0, Math.min(1, (temp + 60) / 105)); // normalize to 0-1
    const blue = Math.round(13 + (255 - 13) * ratio);
    const green = Math.round(71 + (255 - 71) * ratio);
    const redBlue = Math.round(161 + (255 - 161) * ratio);
    return `linear-gradient(135deg, rgb(${blue}, ${green}, ${redBlue}), rgb(255, 255, 255))`;
  } else if (temp <= 85) {
    // 46-85: gradient from #EF6C00 to #0D47A1
    const ratio = (temp - 46) / 39; // normalize to 0-1
    const red = Math.round(239 - (239 - 13) * ratio);
    const green = Math.round(108 - (108 - 71) * ratio);
    const blue = Math.round(0 + (161 - 0) * ratio);
    return `linear-gradient(135deg, rgb(${red}, ${green}, ${blue}), rgb(13, 71, 161))`;
  } else {
    // 86-120: gradient from #B71C1C to #EF6C00
    const ratio = Math.min(1, (temp - 86) / 34); // normalize to 0-1
    const red = Math.round(183 + (239 - 183) * ratio);
    const green = Math.round(28 + (108 - 28) * ratio);
    const blue = Math.round(28 + (0 - 28) * ratio);
    return `linear-gradient(135deg, rgb(${red}, ${green}, ${blue}), rgb(239, 108, 0))`;
  }
};

// Test various temperatures
const testTemps = [-60, -30, 0, 20, 45, 46, 65, 85, 86, 100, 120];

console.log("Temperature Background Color Tests:");
console.log("===================================");

testTemps.forEach((temp) => {
  const background = getTemperatureBackground(temp);
  console.log(`${temp}°F: ${background}`);
});

console.log("\nColor Range Boundaries:");
console.log("======================");
console.log("Cold Range (-60 to 45°F): #0D47A1 → white");
console.log("Medium Range (46 to 85°F): #EF6C00 → #0D47A1");
console.log("Hot Range (86 to 120°F): #B71C1C → #EF6C00");
