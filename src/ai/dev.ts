import { config } from 'dotenv';
config();

import '@/ai/flows/predict-crop-yield.ts';
import '@/ai/flows/generate-crop-recommendations.ts';
import '@/ai/flows/get-prioritized-crops.ts';
