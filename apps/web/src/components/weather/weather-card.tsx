import { CloudDrizzle, CloudSun, Sun, Wind } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { WeatherResponse } from '@/types/domain';

function getWeatherLabel(code: number) {
  if (code <= 1) return { label: 'Ceu limpo', icon: Sun };
  if (code <= 3) return { label: 'Parcialmente nublado', icon: CloudSun };
  if (code <= 67) return { label: 'Chuva em formacao', icon: CloudDrizzle };
  return { label: 'Condicao variavel', icon: Wind };
}

export function WeatherCard({
  weather,
  title,
}: {
  weather: WeatherResponse | null;
  title: string;
}) {
  if (!weather) {
    return (
      <Card className="min-h-[178px] bg-[#fffef8]">
        <p className="text-sm text-[#637866]">Carregando previsao...</p>
      </Card>
    );
  }

  const temperature = Number(weather.current.temperature_2m ?? 0);
  const humidity = Number(weather.current.relative_humidity_2m ?? 0);
  const wind = Number(weather.current.wind_speed_10m ?? 0);
  const weatherCode = Number(weather.current.weather_code ?? 0);
  const { label, icon: Icon } = getWeatherLabel(weatherCode);

  return (
    <Card className="overflow-hidden bg-[#fffef8]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6e7f62]">
            {title}
          </p>
          <h3 className="mt-2 text-[28px] font-semibold text-[#22311d]">
            {formatNumber(temperature, { maximumFractionDigits: 0 })} deg
          </h3>
          <p className="mt-1 text-sm text-[#5d6c53]">{label}</p>
        </div>

        <div className="rounded-[20px] bg-[#eef4db] p-4 text-[#2f8540]">
          <Icon size={30} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[18px] bg-[#f1f5df] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8063]">
            Umidade
          </p>
          <p className="mt-1 text-sm font-semibold text-[#22311d]">
            {humidity}%
          </p>
        </div>
        <div className="rounded-[18px] bg-[#f1f5df] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8063]">
            Vento
          </p>
          <p className="mt-1 text-sm font-semibold text-[#22311d]">
            {formatNumber(wind, { maximumFractionDigits: 0 })} km/h
          </p>
        </div>
      </div>
    </Card>
  );
}
