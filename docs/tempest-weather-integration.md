# Tempest Weather Station Integration

## Overview

The weather widget now uses your personal Tempest Weather Station (ID: 188289) located in Carson City, NV for real-time weather data.

## Features

- **Direct Station Data**: Live readings from your Tempest weather station
- **Temperature Display**: Shows "Homebase (86°F)" format with current temperature
- **Celsius to Fahrenheit**: Automatically converts from Celsius to Fahrenheit
- **Smart Weather Icons**: Based on precipitation, humidity, and solar radiation
- **5-minute Updates**: Refreshes every 5 minutes (more frequent than OpenWeatherMap)
- **Click to Details**: Links directly to your Tempest station dashboard

## API Details

- **Endpoint**: `https://swd.weatherflow.com/swd/rest/observations/station/188289`
- **Authentication**: Token-based using `NEXT_PUBLIC_TEMPEST_API_KEY`
- **Data Source**: `obs[0].air_temperature` (most recent observation)
- **Conversion**: `(celsius * 9/5) + 32` for Fahrenheit display

## Weather Condition Logic

The widget determines weather conditions based on Tempest sensor data:

- **Rain**: precipitation > 0
- **Cloudy**: humidity > 80%
- **Clear**: solar radiation > 700
- **Partly Cloudy**: solar radiation > 300
- **Cloudy**: solar radiation ≤ 300

## Environment Variables Required

```env
NEXT_PUBLIC_TEMPEST_API_KEY=1d479539-9a1f-4826-8c9d-bc2f3cea714c
NEXT_PUBLIC_TEMPEST_STATION_ID=188289
```

## Benefits Over OpenWeatherMap

1. **Your Own Data**: Direct access to your personal weather station
2. **More Accurate**: Hyper-local readings from your exact location
3. **Real-time**: Live sensor data vs. interpolated regional data
4. **Reliable**: No API key activation delays or rate limits
5. **Consistent**: Always works as long as your station is online

## Current Reading

Based on the test API call, your station is currently reading:

- **Temperature**: 30°C (86°F)
- **Humidity**: 15%
- **Solar Radiation**: 903 W/m²
- **Condition**: Clear/Sunny (high solar radiation, low humidity)

The widget will automatically update every 5 minutes with fresh readings from your Tempest station!
