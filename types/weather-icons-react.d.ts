declare module "weather-icons-react" {
  import { ComponentType } from "react";

  interface WeatherIconProps {
    size?: number | string;
    color?: string;
    className?: string;
  }

  export const WiDaySunny: ComponentType<WeatherIconProps>;
  export const WiNightClear: ComponentType<WeatherIconProps>;
  export const WiDayCloudy: ComponentType<WeatherIconProps>;
  export const WiNightAltCloudy: ComponentType<WeatherIconProps>;
  export const WiCloudy: ComponentType<WeatherIconProps>;
  export const WiDayRain: ComponentType<WeatherIconProps>;
  export const WiNightAltRain: ComponentType<WeatherIconProps>;
  export const WiRain: ComponentType<WeatherIconProps>;
  export const WiThunderstorm: ComponentType<WeatherIconProps>;
  export const WiSnow: ComponentType<WeatherIconProps>;
  export const WiFog: ComponentType<WeatherIconProps>;
  export const WiDayHaze: ComponentType<WeatherIconProps>;
  export const WiNightFog: ComponentType<WeatherIconProps>;

  // Add more weather icon exports as needed
  export const WiDaySnow: ComponentType<WeatherIconProps>;
  export const WiNightSnow: ComponentType<WeatherIconProps>;
  export const WiDayThunderstorm: ComponentType<WeatherIconProps>;
  export const WiNightThunderstorm: ComponentType<WeatherIconProps>;
  export const WiShowers: ComponentType<WeatherIconProps>;
  export const WiDayShowers: ComponentType<WeatherIconProps>;
  export const WiNightShowers: ComponentType<WeatherIconProps>;
}
