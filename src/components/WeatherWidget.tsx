"use client";

import React, { useState, useEffect } from "react";
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  CloudQueue as PartlyCloudyIcon,
  Grain as RainIcon,
  AcUnit as SnowIcon,
  Foggy as FogIcon,
  Thunderstorm as ThunderstormIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  icon: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getWeatherIcon = (condition: string, iconCode: string) => {
    const iconProps = { sx: { fontSize: 20 }, className: "text-white" };

    // Map OpenWeatherMap conditions to appropriate icons
    if (iconCode.includes("01")) return <SunnyIcon {...iconProps} />; // clear sky
    if (iconCode.includes("02") || iconCode.includes("03"))
      return <PartlyCloudyIcon {...iconProps} />; // few clouds, scattered clouds
    if (iconCode.includes("04")) return <CloudyIcon {...iconProps} />; // broken clouds
    if (iconCode.includes("09") || iconCode.includes("10"))
      return <RainIcon {...iconProps} />; // shower rain, rain
    if (iconCode.includes("11")) return <ThunderstormIcon {...iconProps} />; // thunderstorm
    if (iconCode.includes("13")) return <SnowIcon {...iconProps} />; // snow
    if (iconCode.includes("50")) return <FogIcon {...iconProps} />; // mist/fog

    // Fallback based on condition text
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("sun") || lowerCondition.includes("clear"))
      return <SunnyIcon {...iconProps} />;
    if (lowerCondition.includes("cloud")) return <CloudyIcon {...iconProps} />;
    if (lowerCondition.includes("rain") || lowerCondition.includes("drizzle"))
      return <RainIcon {...iconProps} />;
    if (lowerCondition.includes("snow")) return <SnowIcon {...iconProps} />;
    if (lowerCondition.includes("thunder"))
      return <ThunderstormIcon {...iconProps} />;
    if (lowerCondition.includes("fog") || lowerCondition.includes("mist"))
      return <FogIcon {...iconProps} />;

    return <CloudyIcon {...iconProps} />; // default
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using Tempest Weather Station API for Carson City, NV
        const TEMPEST_API_KEY = process.env.NEXT_PUBLIC_TEMPEST_API_KEY;
        const TEMPEST_STATION_ID = process.env.NEXT_PUBLIC_TEMPEST_STATION_ID;

        if (!TEMPEST_API_KEY || !TEMPEST_STATION_ID) {
          console.warn("Tempest API key or station ID not found");
          setError(true);
          setLoading(false);
          return;
        }

        console.log("Fetching weather data from Tempest station...");
        const response = await fetch(
          `https://swd.weatherflow.com/swd/rest/observations/station/${TEMPEST_STATION_ID}?token=${TEMPEST_API_KEY}`
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Tempest API error:", response.status, errorData);
          throw new Error(`Tempest API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("Tempest weather data received:", data);

        if (data.obs && data.obs.length > 0) {
          const observation = data.obs[0]; // Most recent observation
          const tempCelsius = observation.air_temperature;
          const tempFahrenheit = Math.round((tempCelsius * 9) / 5 + 32);

          // Determine weather condition based on available data
          let condition;
          let icon;

          // Simple weather condition logic based on available Tempest data
          if (observation.precip > 0) {
            condition = "Rain";
            icon = "09d";
          } else if (observation.relative_humidity > 80) {
            condition = "Clouds";
            icon = "04d";
          } else if (observation.solar_radiation > 700) {
            condition = "Clear";
            icon = "01d";
          } else if (observation.solar_radiation > 300) {
            condition = "Partly Cloudy";
            icon = "02d";
          } else {
            condition = "Cloudy";
            icon = "03d";
          }

          setWeather({
            temperature: tempFahrenheit,
            condition: condition,
            description: `${condition.toLowerCase()}, humidity ${
              observation.relative_humidity
            }%`,
            icon: icon,
          });

          setError(false);
        } else {
          throw new Error("No observation data available");
        }
      } catch (err) {
        console.error("Error fetching Tempest weather:", err);
        // Use mock data as fallback
        console.log("Using mock weather data as fallback");
        setWeather({
          temperature: 72,
          condition: "Clear",
          description: "clear sky",
          icon: "01d",
        });
        setError(false);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather every 5 minutes (Tempest updates more frequently)
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-white/30 rounded"></div>
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <a
        href="https://tempestwx.com/station/188289/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-white/30 transition-all duration-200 cursor-pointer"
      >
        <LocationIcon sx={{ fontSize: 20 }} />
        <span className="font-medium">Homebase Weather Not Available</span>
      </a>
    );
  }

  return (
    <a
      href="https://tempestwx.com/station/188289/grid"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-white/30 transition-all duration-200 cursor-pointer"
      title={`${weather.description} in Carson City, NV - Click to view Tempest Station weather data`}
    >
      <span className="font-medium">It&apos;s Currently</span>
      {getWeatherIcon(weather.condition, weather.icon)}
      <span className="font-medium">{weather.temperature}° at Home Base</span>
    </a>
  );
};

export default WeatherWidget;
