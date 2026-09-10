"use client";
import { useEffect, useState } from "react";
import { WeatherData } from "@/types/user";
import { api } from "@/types/api";

const UseWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await api.get<WeatherData>(
          "/forecast?latitude=6.52&longitude=3.37&hourly=temperature_2m&forecast_days=1"
          // {
          //   latitude: 6.52,
          //   longitude: 3.37,
          //   hourly: "temperature_2m",
          //   forecast_days: 1,
          // },

          // {
          //   options: {
          //     headers: {
          //       "x-userId": "USER-001",
          //       "x-loanId": "LOAN-2026-900",
          //     },
          //   },
          // }
        );
        setWeather(res);
      } catch (err) {
        setError("Failed to fetch weather");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) return <p>Loading weather...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-4 border rounded">
      <h2>Weather Data</h2>

      {weather && (
        <>
          <p>First Temperature: {weather.hourly.temperature_2m[0]}°C</p>
          <p>Time: {weather.hourly.time[0]}</p>
        </>
      )}
    </div>
  );
};

export default UseWeather;
