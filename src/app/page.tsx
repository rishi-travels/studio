"use client"

import {
  Home,
  LineChart,
  Package,
  Settings,
  Leaf,
  PanelLeft,
  ChevronRight,
} from "lucide-react"

import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardPage } from "@/components/dashboard-page"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useI18n } from "@/lib/i18n"
import Image from 'next/image';
import { cn } from "@/lib/utils"


export default function HomePage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main>
        <HeroSection />
        <DashboardPage />
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  const { t, language, setLanguage, languages } = useI18n();

  return (
    <header className={cn(
      "sticky top-0 z-50 flex h-16 items-center justify-between px-4 md:px-6 bg-primary text-primary-foreground"
    )}>
      <a href="#" className="flex items-center gap-2 font-semibold">
        <Leaf className={cn("h-6 w-6")} />
        <span className={cn(
          "font-headline text-lg"
        )}>{t('agriPredict')}</span>
      </a>
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <a href="#" className={cn("hover:underline")}>{t('home')}</a>
        <a href="#prediction" className={cn("hover:underline opacity-80")}>{t('prediction')}</a>
        <a href="#recommendations" className={cn("hover:underline opacity-80")}>{t('recommendations')}</a>
        <a href="#insights" className={cn("hover:underline opacity-80")}>{t('insights')}</a>
      </nav>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-primary-foreground">{languages.find(l => l.code === language)?.name || 'English'}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
              {languages.map(lang => (
                <DropdownMenuRadioItem key={lang.code} value={lang.code}>{lang.name}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="md:hidden hover:bg-primary-foreground/20">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">{t('toggleMenu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs bg-primary text-primary-foreground">
            <nav className="grid gap-6 p-6 text-lg font-medium">
                <a href="#" className="flex items-center gap-2 font-semibold">
                  <Leaf className="h-6 w-6" />
                  <span className="font-headline text-lg">{t('agriPredict')}</span>
                </a>
                <a href="#" className="hover:underline">{t('home')}</a>
                <a href="#prediction" className="opacity-80 hover:underline">{t('prediction')}</a>
                <a href="#recommendations" className="opacity-80 hover:underline">{t('recommendations')}</a>
                <a href="#insights" className="opacity-80 hover:underline">{t('insights')}</a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function HeroSection() {
  const { t } = useI18n();
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-20 text-primary-foreground"
      style={{ backgroundImage: "url('https://picsum.photos/seed/farm/1920/1080')" }}
      data-ai-hint="agriculture farming"
    >
      <div className="absolute inset-0 bg-primary/70" />
      <div className="relative container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg opacity-80 md:text-xl">
          {t('heroSubtitle')}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <a href="#prediction" className="w-full max-w-xs">
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg rounded-full px-10 py-6">
              {t('startPredicting')}
            </Button>
          </a>
          <a href="#calculator" className="w-full max-w-xs">
            <Button variant="outline" size="lg" className="w-full bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-primary-foreground font-bold text-lg rounded-full px-10 py-6">
              {t('calculateEstimation')}
            </Button>
          </a>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl font-bold">10%+</p>
            <p className="text-sm opacity-80">{t('productivityIncrease')}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl font-bold">50+</p>
            <p className="text-sm opacity-80">{t('supportedCrops')}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl font-bold">24/7</p>
            <p className="text-sm opacity-80">{t('realTimeMonitoring')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}


function Footer() {
  const {t} = useI18n();
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="flex flex-col gap-4 md:col-span-2">
           <a href="#" className="flex items-center gap-2 font-semibold">
              <Leaf className="h-6 w-6" />
              <span className="font-headline text-lg">{t('agriPredict')}</span>
            </a>
            <p className="text-sm opacity-80">{t('footerDescription')}</p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold font-headline">{t('features')}</h4>
          <nav className="flex flex-col gap-2 text-sm">
            <a href="#prediction" className="opacity-80 hover:opacity-100">{t('yieldPrediction')}</a>
            <a href="#recommendations" className="opacity-80 hover:opacity-100">{t('smartRecommendations')}</a>
            <a href="#insights" className="opacity-80 hover:opacity-100">{t('dataInsights')}</a>
          </nav>
        </div>
        <div>
          <h4 className="mb-4 font-semibold font-headline">{t('contact')}</h4>
          <nav className="flex flex-col gap-2 text-sm">
            <a href="https://wa.me/9415685762" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">{t('helpCenter')}</a>
            <a href="https://www.google.com/maps/search/soil+testing+lab/" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">{t('contactUs')}</a>
            <a href="#" className="opacity-80 hover:opacity-100">{t('documentation')}</a>
          </nav>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 text-sm md:px-6">
          <p className="opacity-60">{t('copyright')}</p>
          <div className="flex gap-4">
             <a href="#" className="opacity-60 hover:opacity-100">{t('privacyPolicy')}</a>
             <a href="#" className="opacity-60 hover:opacity-100">{t('termsOfService')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
