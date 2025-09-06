
"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

import {
  Leaf,
  Droplets,
  Thermometer,
  Sun,
  Zap,
  Loader2,
  GitBranch,
  Sprout,
  TrendingUp,
  MapPin,
  Square,
  BarChart2,
  TestTube2,
  AreaChart,
  Award,
  Calculator,
  RefreshCw,
  IndianRupee,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getPredictions, getCropPriorities } from "@/app/actions"
import type {
  PredictCropYieldOutput,
} from "@/ai/flows/predict-crop-yield"
import type {
  GenerateCropRecommendationsOutput,
} from "@/ai/flows/generate-crop-recommendations"
import type { 
    GetPrioritizedCropsOutput 
} from "@/ai/flows/get-prioritized-crops"
import { useI18n } from "@/lib/i18n"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { Label } from "./ui/label"


const formSchema = z.object({
  cropType: z.string().min(1, "Crop type is required"),
  region: z.string().min(1, "Region is required"),
  areaBiswa: z.coerce.number().min(1, "Area is required"),
  soilPh: z.coerce.number().min(0).max(14),
  previousCrop: z.string().optional(),
  nitrogen: z.coerce.number().optional(),
  phosphorus: z.coerce.number().optional(),
  potassium: z.coerce.number().optional(),
})

type FormData = z.infer<typeof formSchema>

type WeatherData = {
  temperature: number;
  humidity: number;
  rainfall: number;
}

type PredictionResult = {
  yieldPrediction: PredictCropYieldOutput
  recommendations: GenerateCropRecommendationsOutput,
  weather: WeatherData,
}

const defaultValues: Omit<FormData, 'latitude'| 'longitude'> = {
  cropType: "Wheat",
  region: "Punjab",
  areaBiswa: 20,
  soilPh: 6.5,
  previousCrop: "Rice",
}

const historicalData = [
    { name: "2020", yield: 4.5 },
    { name: "2021", yield: 4.8 },
    { name: "2022", yield: 4.2 },
    { name: "2023", yield: 5.1 },
    { name: "2024", yield: 4.9 },
]

const BISWA_PER_HECTARE = 79;


export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPriorityLoading, setIsPriorityLoading] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null)
  const [prioritizedCrops, setPrioritizedCrops] = useState<GetPrioritizedCropsOutput | null>(null);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast()
  const { t, language } = useI18n()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(t('locationError') + ` ${error.message}`);
        }
      );
    } else {
      setLocationError(t('locationNotSupported'));
    }
  }, [t]);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("agriInsightFormData")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        const validatedData = formSchema.safeParse(parsedData)
        if (validatedData.success) {
          form.reset(validatedData.data)
        }
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error)
    }
  }, [form])
  
  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem("agriInsightFormData", JSON.stringify(value))
      } catch (error) {
        console.error("Failed to save data to local storage", error)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (data: FormData) => {
    if (!location) {
      toast({
        variant: "destructive",
        title: t('errorOccurred'),
        description: t('locationError'),
      });
      return;
    }
    setIsLoading(true)
    setResults(null)
    const area = `${data.areaBiswa} biswa`;
    const response = await getPredictions({...data, ...location, language, area});
    if (response.success) {
      setResults({
        yieldPrediction: response.yieldPrediction!,
        recommendations: response.recommendations!,
        weather: response.weather!,
      })
    } else {
      toast({
        variant: "destructive",
        title: t('errorOccurred'),
        description: response.error,
      })
    }
    setIsLoading(false)
  }

  const onGetPriorities = async () => {
    if (!location) {
      toast({
        variant: "destructive",
        title: t('errorOccurred'),
        description: t('locationError'),
      });
      return;
    }
    setIsPriorityLoading(true);
    setPrioritizedCrops(null);
    const formData = form.getValues();
    // @ts-ignore
    const response = await getCropPriorities({...formData, ...location, language });

    if (response.success) {
        setPrioritizedCrops(response.cropPriorities!)
    } else {
        toast({
            variant: "destructive",
            title: t('errorOccurred'),
            description: response.error,
        });
    }
    setIsPriorityLoading(false);
  }

  const currentFormValues = form.watch()
  const areaInBiswa = form.watch("areaBiswa");

  const predictedYieldInBiswa = useMemo(() => {
    if (!results) return null;
    const yieldPerHectare = results.yieldPrediction.predictedYield;
    const yieldPerBiswa = yieldPerHectare / BISWA_PER_HECTARE;
    return yieldPerBiswa * areaInBiswa;
  }, [results, areaInBiswa]);

   const historicalDataWithPrediction = useMemo(() => {
    if (!results) return historicalData;
    const yieldPerHectare = results.yieldPrediction.predictedYield;
    return [
      ...historicalData,
      { name: "2025", yield: yieldPerHectare, predicted: true },
    ]
  }, [results]);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 py-12">
      <section id="prediction" className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-headline">{t('yieldPrediction')}</h2>
        </div>
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
              <DataInputCard form={form} onSubmit={onSubmit} isLoading={isLoading} locationError={locationError} />
          </div>
          <div className="lg:col-span-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                  <CardDescription>{t('predictedYield')}</CardDescription>
                  <CardTitle className="text-4xl">
                      {isLoading ? <Skeleton className="h-10 w-3/4" /> : predictedYieldInBiswa ? `${predictedYieldInBiswa.toFixed(2)} ${t('tons')}` : "-"}
                  </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="text-xs text-muted-foreground">
                      {isLoading ? <Skeleton className="h-4 w-1/2" /> : results ? `${t('forYour')} ${areaInBiswa} ${t('biswaArea')}` : t('enterDataToPredict')}
                  </div>
                  </CardContent>
                </Card>
                <WeatherCard weather={results?.weather} isLoading={isLoading} />
              </div>
              <div className="mt-4">
                <HistoricalChartCard historicalData={historicalDataWithPrediction}/>
              </div>
          </div>
        </div>
      </section>

      <section id="recommendations" className="bg-muted py-12 sm:py-16">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold font-headline">{t('smartFarmingRecommendations')}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">{t('recommendationsSubtitle')}</p>
            </div>
            <RecommendationsCard 
                recommendations={results?.recommendations} 
                isLoading={isLoading} 
                generalRecs={results?.yieldPrediction.recommendations}
                prioritizedCrops={prioritizedCrops}
                onGetPriorities={onGetPriorities}
                isPriorityLoading={isPriorityLoading}
            />
        </div>
      </section>

      <section id="calculator" className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-headline">{t('calculateEstimation')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('estimationSubtitle')}</p>
        </div>
        {results ? (
            <YieldCostCalculatorCard result={results} areaInBiswa={areaInBiswa} />
        ) : (
             <Card className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px] bg-card">
                <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-headline text-lg font-semibold">{t('calculatorAwaits')}</h3>
                <p className="text-sm text-muted-foreground">{t('getPredictionForCalculator')}</p>
            </Card>
        )}
      </section>
      
      <section id="insights" className="container mx-auto px-4 py-12 md:px-6">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-headline">{t('agriculturalDataInsights')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('insightsSubtitle')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('weatherPatterns')}</CardTitle>
                <Sun className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{results?.weather ? `${results.weather.temperature.toFixed(1)}°C` : '-'}</div>
                <p className="text-xs text-muted-foreground">{t('sevenDayAverage')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('soilHealthMetrics')}</CardTitle>
                <TestTube2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{currentFormValues.soilPh} pH</div>
                <p className="text-xs text-muted-foreground">
                    {t('previousCrop')}: {currentFormValues.previousCrop}
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('yieldTrends')}</CardTitle>
                <AreaChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{predictedYieldInBiswa ? `${(predictedYieldInBiswa / areaInBiswa * BISWA_PER_HECTARE).toFixed(2)} t/ha` : '-'}</div>
                <p className="text-xs text-muted-foreground">{t('predictedYieldPerHectare')}</p>
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  )
}

const cropTypes = [
    "Rice", "Wheat", "Corn", "Barley", "Sugarcane", "Cotton", "Soybean", "Potatoes",
    "Mustard", "Sunflower", "Groundnut", "Jute", "Tea", "Coffee", "Rubber", "Coconut",
    "Millet", "Sorghum", "Finger Millet", "Chickpea", "Pigeon Pea", "Lentil",
    "Black Gram", "Green Gram", "Tomato", "Onion", "Brinjal", "Cabbage", "Cauliflower",
    "Okra", "Spinach", "Carrot", "Radish", "Chilli", "Capsicum", "Ginger", "Turmeric",
    "Garlic", "Mango", "Banana", "Guava", "Papaya", "Apple", "Grapes", "Orange", "Lemon",
    "Castor", "Safflower", "Linseed", "Tobacco", "Sesame", "Fallow"
];
const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

function DataInputCard({ form, onSubmit, isLoading, locationError }: { form: any, onSubmit: (data: FormData) => void, isLoading: boolean, locationError: string | null }) {
    const { t } = useI18n()
    return (
        <Card className="shadow-lg">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                <CardTitle className="font-headline text-xl text-center">{t('farmDataInput')}</CardTitle>
                <CardDescription className="text-center">{t('enterFarmData')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {locationError && (
                        <Alert variant="destructive">
                            <MapPin className="h-4 w-4" />
                            <AlertTitle>{t('locationErrorTitle')}</AlertTitle>
                            <AlertDescription>
                                {locationError}
                            </AlertDescription>
                        </Alert>
                    )}
                    <FormField
                        control={form.control}
                        name="cropType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('cropType')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectCropType')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {cropTypes.map(crop => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="areaBiswa"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('areaInBiswa')}</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 20" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('region')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectRegion')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {indianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>{t('soilMetrics')} (Optional)</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <FormField control={form.control} name="nitrogen" render={({ field }) => ( <FormItem><FormLabel>{t('nitrogen')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} placeholder="Optional" /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="phosphorus" render={({ field }) => ( <FormItem><FormLabel>{t('phosphorus')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} placeholder="Optional" /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="potassium" render={({ field }) => ( <FormItem><FormLabel>{t('potassium')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} placeholder="Optional" /></FormControl><FormMessage /></FormItem> )}/>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    
                    <FormField control={form.control} name="soilPh" render={({ field }) => ( <FormItem><FormLabel>{t('ph')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem> )}/>

                    <FormField
                        control={form.control}
                        name="previousCrop"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('previousCrop')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectPreviousCrop')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {cropTypes.map(crop => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || !!locationError}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('predictAndRecommend')}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
    )
}

function WeatherCard({ weather, isLoading }: { weather: WeatherData | undefined, isLoading: boolean }) {
    const { t } = useI18n();
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{t('weatherForecast')}</CardDescription>
                <CardTitle className="text-4xl">
                    {isLoading ? <Skeleton className="h-10 w-24" /> : weather ? `${weather.temperature.toFixed(1)}°C` : "-"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ) : weather ? (
                     <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Droplets className="h-4 w-4"/>{t('humidity')}: {weather.humidity.toFixed(1)}%</div>
                        <div className="flex items-center gap-2"><Sun className="h-4 w-4" />{t('rain')}: {weather.rainfall.toFixed(1)}mm ({t('totalIn7Days')})</div>
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">{t('weatherWillBeFetched')}</div>
                )}
            </CardContent>
        </Card>
    )
}


function RecommendationsCard({ 
    recommendations, 
    isLoading, 
    generalRecs,
    prioritizedCrops,
    onGetPriorities,
    isPriorityLoading,
}: { 
    recommendations: GenerateCropRecommendationsOutput | null, 
    isLoading: boolean, 
    generalRecs: string | undefined,
    prioritizedCrops: GetPrioritizedCropsOutput | null,
    onGetPriorities: () => void,
    isPriorityLoading: boolean,
}) {
    const { t } = useI18n();

    const renderSkeletons = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return renderSkeletons();
    }

    if (!recommendations) {
        return (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px] bg-card">
                <Sprout className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-headline text-lg font-semibold">{t('recommendationsAwait')}</h3>
                <p className="text-sm text-muted-foreground">{t('inputDataForAdvice')}</p>
            </Card>
        )
    }

    return (
        <Tabs defaultValue="crop-priority" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted">
                <TabsTrigger value="crop-priority">{t('cropPriority')}</TabsTrigger>
                <TabsTrigger value="general">{t('general')}</TabsTrigger>
                <TabsTrigger value="irrigation">{t('irrigation')}</TabsTrigger>
                <TabsTrigger value="fertilization">{t('fertilization')}</TabsTrigger>
                <TabsTrigger value="pest-control">{t('pestControl')}</TabsTrigger>
            </TabsList>
            <TabsContent value="crop-priority">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="text-primary" /> {t('cropPriority')}
                            </div>
                            <Button onClick={onGetPriorities} disabled={isPriorityLoading}>
                                {isPriorityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('getCropPriorities')}
                            </Button>
                        </CardTitle>
                        <CardDescription>{t('cropPriorityDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4">
                        {isPriorityLoading ? (
                           Array.from({ length: 3 }).map((_, i) => (
                               <div key={i} className="p-2">
                                   <Skeleton className="h-5 w-1/4 mb-2" />
                                   <Skeleton className="h-4 w-full" />
                               </div>
                           ))
                        ) : prioritizedCrops ? (
                            prioritizedCrops.crops.map((crop) => (
                                <div key={crop.cropName} className="p-2 border-b last:border-b-0">
                                    <div className="flex items-center gap-4">
                                        <Badge variant={crop.priority <= 2 ? "default" : "secondary"} className="text-lg">{crop.priority}</Badge>
                                        <h4 className="font-semibold text-base">{crop.cropName}</h4>
                                    </div>
                                    <p className="mt-1 ml-10 text-muted-foreground">{crop.reason}</p>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[200px]">
                                <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="font-headline text-lg font-semibold">{t('getPriorityCrops')}</h3>
                                <p className="text-sm text-muted-foreground">{t('getPriorityCropsDescription')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="general">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><GitBranch className="text-primary" /> {t('generalAdvice')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>{generalRecs}</p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="irrigation">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Droplets className="text-primary"/> {t('irrigation')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>{recommendations.irrigationRecommendations}</p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="fertilization">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Zap className="text-primary" /> {t('fertilization')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                       <p>{recommendations.fertilizationRecommendations}</p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="pest-control">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Leaf className="text-primary" /> {t('pestControl')}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>{recommendations.pestControlRecommendations}</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}

function HistoricalChartCard({ historicalData }: { historicalData: any[] }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <TrendingUp /> {t('historicalYield')}
        </CardTitle>
        <CardDescription>{t('historicalYieldDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalData}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} ${t('tPerHa')}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Bar dataKey="yield" radius={[4, 4, 0, 0]}>
                {historicalData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.predicted
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--primary))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const BIGHAS_PER_HECTARE = 4;
const QUINTALS_PER_TON = 10;

function YieldCostCalculatorCard({ result, areaInBiswa }: { result: PredictionResult, areaInBiswa: number }) {
  const { t } = useI18n();
  const [unit, setUnit] = useState<'t/ha' | 'q/bigha'>('t/ha');
  const [price, setPrice] = useState('');

  const yieldPerHectare = result.yieldPrediction.predictedYield;
  
  const { convertedYield, unitLabel, pricePerUnitLabel } = useMemo(() => {
    if (unit === 't/ha') {
      const yieldPerBiswa = yieldPerHectare / BISWA_PER_HECTARE;
      const totalTons = yieldPerBiswa * areaInBiswa;
      return { convertedYield: totalTons, unitLabel: t('tons'), pricePerUnitLabel: t('pricePerTon') };
    } else {
      const yieldInQuintalsPerHectare = yieldPerHectare * QUINTALS_PER_TON;
      const bighas = areaInBiswa / (BISWA_PER_HECTARE / BIGHAS_PER_HECTARE)
      const yieldPerBigha = yieldInQuintalsPerHectare / BIGHAS_PER_HECTARE;
      const totalQuintals = yieldPerBigha * bighas;
      return { convertedYield: totalQuintals, unitLabel: t('quintals'), pricePerUnitLabel: t('pricePerQuintal') };
    }
  }, [unit, yieldPerHectare, areaInBiswa, t]);

  const totalRevenue = useMemo(() => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) return 0;
    return convertedYield * numericPrice;
  }, [price, convertedYield]);

  return (
    <Card className="max-w-2xl mx-auto w-full">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Calculator /> {t('yieldAndCostCalculator')}
        </CardTitle>
        <CardDescription>{t('calculatorDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted">
           <div>
             <p className="text-sm text-muted-foreground">{t('predictedYieldForYourArea')}</p>
             <p className="text-3xl font-bold">{convertedYield.toFixed(2)} {unitLabel}</p>
           </div>
           <Button variant="outline" onClick={() => setUnit(u => u === 't/ha' ? 'q/bigha' : 't/ha')}>
             <RefreshCw className="mr-2 h-4 w-4" />
             {t('convertTo')} {unit === 't/ha' ? t('qPerBigha') : t('tPerHa')}
           </Button>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="marketPrice">{t('marketPrice')}</Label>
            <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="marketPrice"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={pricePerUnitLabel}
                    className="pl-10"
                />
            </div>
        </div>

        <div className="text-center p-4 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-sm text-primary/80">{t('estimatedRevenue')}</p>
            <p className="text-4xl font-bold text-primary">
                <IndianRupee className="inline-block h-8 w-8 -mt-2" />
                {totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
        </div>
      </CardContent>
    </Card>
  )
}
