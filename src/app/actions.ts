'use server';

import { z } from 'zod';
import { predictCropYield } from '@/ai/flows/predict-crop-yield';
import { generateCropRecommendations } from '@/ai/flows/generate-crop-recommendations';
import { getPrioritizedCrops } from '@/ai/flows/get-prioritized-crops';


const FormDataSchema = z.object({
  cropType: z.string().min(1, "Crop type is required"),
  region: z.string().min(1, "Region is required"),
  soilPh: z.coerce.number().min(0).max(14),
  previousCrop: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  language: z.string(),
  area: z.string(),
  nitrogen: z.coerce.number().optional(),
  phosphorus: z.coerce.number().optional(),
  potassium: z.coerce.number().optional(),
});

const PriorityFormDataSchema = z.object({
  region: z.string().min(1, "Region is required"),
  soilPh: z.coerce.number().min(0).max(14),
  previousCrop: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  language: z.string(),
});

async function getWeatherData(latitude: number, longitude: number) {
  const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_mean,relative_humidity_2m_mean,rain_sum&forecast_days=7`);
  if (!weatherResponse.ok) {
    throw new Error('Failed to fetch weather data.');
  }
  const weatherData = await weatherResponse.json();

  const avgTemp = weatherData.daily.temperature_2m_mean.reduce((acc: number, val: number) => acc + val, 0) / weatherData.daily.temperature_2m_mean.length;
  const avgHumidity = weatherData.daily.relative_humidity_2m_mean.reduce((acc: number, val: number) => acc + val, 0) / weatherData.daily.relative_humidity_2m_mean.length;
  const totalRainfall = weatherData.daily.rain_sum.reduce((acc: number, val: number) => acc + val, 0);

  const temperature = parseFloat(avgTemp.toFixed(1));
  const humidity = parseFloat(avgHumidity.toFixed(1));
  const rainfall = parseFloat(totalRainfall.toFixed(1));

  return { temperature, humidity, rainfall };
}

function prepareAiInputs(data: z.infer<typeof FormDataSchema> | z.infer<typeof PriorityFormDataSchema>, weather: { temperature: number; humidity: number; rainfall: number; }) {
    const weatherPatterns = JSON.stringify({
      temperature: `~${weather.temperature.toFixed(1)}°C (7-day avg)`,
      humidity: `~${weather.humidity.toFixed(1)}% (7-day avg)`,
      rainfall: `${weather.rainfall.toFixed(1)}mm (7-day total)`,
    });

    const soilMetricsData: {ph: number, nitrogen?: number, phosphorus?: number, potassium?: number} = {
      ph: data.soilPh,
    };
    if ('nitrogen' in data && data.nitrogen) soilMetricsData.nitrogen = data.nitrogen;
    if ('phosphorus' in data && data.phosphorus) soilMetricsData.phosphorus = data.phosphorus;
    if ('potassium' in data && data.potassium) soilMetricsData.potassium = data.potassium;


    const soilMetrics = JSON.stringify(soilMetricsData);

    const historicalData = 'cropType' in data ? JSON.stringify([
      { year: 2020, yield: weather.rainfall * 0.01 + Math.random() * 2 + 2, crop: data.cropType },
      { year: 2021, yield: weather.rainfall * 0.011 + Math.random() * 2 + 2, crop: data.cropType },
      { year: 2022, yield: weather.rainfall * 0.009 + Math.random() * 2 + 2, crop: data.cropType },
      { year: 2023, yield: weather.rainfall * 0.012 + Math.random() * 2 + 2.5, crop: data.cropType },
    ]) : '';

    return { weatherPatterns, soilMetrics, historicalData };
}

export async function getPredictions(data: z.infer<typeof FormDataSchema>) {
  try {
    const validatedData = FormDataSchema.parse(data);
    const weather = await getWeatherData(validatedData.latitude, validatedData.longitude);
    const { weatherPatterns, soilMetrics, historicalData } = prepareAiInputs(validatedData, weather);

    const [yieldPrediction, recommendations] = await Promise.all([
      predictCropYield({
        cropType: validatedData.cropType,
        region: validatedData.region,
        historicalData,
        weatherPatterns,
        soilMetrics,
        previousCrop: validatedData.previousCrop || 'Fallow',
        language: validatedData.language,
        area: validatedData.area,
      }),
      generateCropRecommendations({
        cropType: validatedData.cropType,
        region: validatedData.region,
        predictedWeatherConditions: weatherPatterns,
        soilMetrics,
        historicalData,
        language: validatedData.language,
        area: validatedData.area,
      }),
    ]);

    return { success: true, yieldPrediction, recommendations, weather };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to get predictions: ${errorMessage}` };
  }
}

export async function getCropPriorities(data: z.infer<typeof PriorityFormDataSchema>) {
  try {
    const validatedData = PriorityFormDataSchema.parse(data);
    const weather = await getWeatherData(validatedData.latitude, validatedData.longitude);
    const { weatherPatterns, soilMetrics } = prepareAiInputs(validatedData, weather);
    
    const cropPriorities = await getPrioritizedCrops({
      region: validatedData.region,
      predictedWeatherConditions: weatherPatterns,
      soilMetrics,
      language: validatedData.language,
    });

    return { success: true, cropPriorities };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to get crop priorities: ${errorMessage}` };
  }
}
