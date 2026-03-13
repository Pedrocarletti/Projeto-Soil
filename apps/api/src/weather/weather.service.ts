import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: Record<string, number | string | null>;
  daily: Record<string, Array<number | string | null>>;
}

@Injectable()
export class WeatherService {
  constructor(private readonly configService: ConfigService) {}

  async getForecast(latitude: number, longitude: number) {
    const baseUrl =
      this.configService.get<string>('WEATHER_BASE_URL') ??
      'https://api.open-meteo.com/v1/forecast';

    const { data } = await axios.get<ForecastResponse>(baseUrl, {
      params: {
        latitude,
        longitude,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'precipitation',
          'weather_code',
          'wind_speed_10m',
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
        ].join(','),
        timezone: 'auto',
        forecast_days: 5,
      },
    });

    return data;
  }
}
