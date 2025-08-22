import { useState } from "react";

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

interface GeoCodingResult {
  name: string;
  latitude: number;
  longitude: number;
}

interface GeoCodingResponse {
  results?: GeoCodingResult[];
}

interface ForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
  };
}

export default function App() {
  const [city, setCity] = useState<string>("");
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const clearSearch = () => {
    setCity("");
    setForecast([]);
    setError("");
    setLoading(false);
  };

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError("");

      // Step 1: Geocode city name
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=de&format=json`
      );
      const geoData: GeoCodingResponse = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("Ort nicht gefunden");
      }

      const { latitude, longitude, name } = geoData.results[0];

      // Step 2: Fetch weather forecast
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Europe%2FBerlin`
      );
      const weatherData: ForecastResponse = await weatherRes.json();

      const days: WeatherDay[] = weatherData.daily.time.map((date, idx) => ({
        date,
        tempMax: weatherData.daily.temperature_2m_max[idx],
        tempMin: weatherData.daily.temperature_2m_min[idx],
        precipitation: weatherData.daily.precipitation_sum[idx],
        windSpeed: weatherData.daily.windspeed_10m_max[idx],
      }));

      setForecast(days);
      setCity(name);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Fehler beim Laden");
      }
      setForecast([]);
      setCity("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6 text-gray-900'>
      <h1 className='text-3xl font-bold text-center mb-6'>
        🌤 Wetter für Deutschland 🌤
      </h1>

      <div className='flex justify-center gap-2 mb-6'>
        <input
          type='text'
          placeholder='Stadt eingeben...'
          value={city}
          className='px-4 py-2 rounded-lg border focus:outline-none w-64'
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && city) {
              fetchWeather();
            }
          }}
        />
        <button
          onClick={fetchWeather}
          disabled={!city}
          className={`px-4 py-2 rounded-lg font-medium shadow transition-colors focus:outline-none ${
            !city
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Suchen
        </button>
        <button
          onClick={clearSearch}
          className='px-4 py-2 rounded-lg font-medium shadow bg-gray-200 text-gray-900 hover:bg-gray-300'
        >
          Löschen
        </button>
      </div>

      {loading && <p className='text-center'>Lade Wetterdaten...</p>}
      {error && <p className='text-center text-red-600'>{error}</p>}

      <div className='grid md:grid-cols-3 gap-4'>
        {forecast.map((day) => (
          <div
            key={day.date}
            className='bg-white rounded-2xl shadow p-4 text-center'
          >
            <h2 className='font-semibold'>
              {new Date(day.date).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </h2>
            <p className='text-xl font-bold'>
              {day.tempMax}° / {day.tempMin}°
            </p>
            <p>🌧 {day.precipitation} mm</p>
            <p>💨 {day.windSpeed} km/h</p>
          </div>
        ))}
      </div>
    </div>
  );
}
