# Weather Widget Setup

## Overview

The homepage now includes a weather widget in the upper right corner that displays current weather conditions for Carson City, NV and links to your Tempest weather station.

## Features

- **Live Weather Data**: Shows current temperature and weather icon
- **Smart Icons**: Displays appropriate weather icons (sun, clouds, rain, snow, etc.)
- **Auto-refresh**: Updates weather data every 10 minutes
- **Click to Details**: Links to your Tempest weather station at https://tempestwx.com/station/188289/
- **Graceful Fallback**: Shows "Homebase" link if weather API is unavailable

## Setup Instructions

### 1. Get OpenWeatherMap API Key (Free)

1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Generate an API key (free tier allows 1,000 calls/day)

### 2. Add API Key to Environment

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your-actual-api-key-here
```

### 3. For Production Deployment

Add the environment variable to your production environment:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your-actual-api-key-here
```

## Weather Icons Used

- ☀️ Clear/Sunny
- ⛅ Partly Cloudy
- ☁️ Cloudy
- 🌧️ Rain/Drizzle
- ⛈️ Thunderstorm
- ❄️ Snow
- 🌫️ Fog/Mist

## Technical Details

- **Location**: Carson City, NV, 89703
- **API**: OpenWeatherMap Current Weather API
- **Units**: Imperial (Fahrenheit)
- **Update Frequency**: Every 10 minutes
- **Fallback**: Direct link to Tempest station if API fails

## Styling

The widget uses a semi-transparent white background with backdrop blur that matches the homepage button styling, positioned absolutely in the upper right corner.
