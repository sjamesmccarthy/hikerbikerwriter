# OpenWeatherMap API Key Troubleshooting

## Current Issue

Your API key is returning a 401 "Invalid API key" error. This is common with new OpenWeatherMap accounts.

## Solutions to Try

### 1. Wait for Activation

- **New API keys can take up to 2 hours to activate**
- Check back in a few hours and the weather should work automatically

### 2. Verify API Key

1. Log into your OpenWeatherMap account at https://openweathermap.org/api_keys
2. Copy the exact API key (no extra spaces)
3. Update your `.env.local` file:
   ```
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your-exact-api-key-here
   ```
4. Restart the development server: `npm run dev`

### 3. Check Account Status

- Make sure your OpenWeatherMap account is verified (check email)
- Ensure you're on the free plan (1,000 calls/day)

### 4. Test Direct API Call

```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=Carson%20City,NV,US&appid=YOUR_API_KEY&units=imperial"
```

## Current Fallback

The weather widget now shows mock data (72°F, Clear) when the API fails, so you'll see a working weather display while troubleshooting.

## When Working

Once the API key is activated, you'll see:

- Real-time temperature for Carson City, NV
- Appropriate weather icons (sun, clouds, rain, etc.)
- Updates every 10 minutes
- Click to view your Tempest weather station
