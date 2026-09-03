export type UnitSystem = "metric" | "imperial";

export interface OperatorProfile {
  name: string;
  role: string;
  contact: string;
  upazilla: string;
  zila: string;
  address: string;
  email: string;
  avatar: string;
}

export interface NotificationSettings {
  smsAlerts: boolean;
  emailReports: boolean;
  maintenanceReminders: boolean;
}

export interface CalibrationOffsets {
  anemometerBaseline: number;
  barometerOffset: number;
  hygrometerDrift: number;
}

export interface SystemSettings {
  unitSystem: UnitSystem;
  timezone: string;
  pollingRate: number;              
  theme: "dark" | "light";
  notifications: NotificationSettings;
  calibration: CalibrationOffsets;
  calibrationStatus: {
    anemometer: "optimal" | "recalibrating";
    barometer: "optimal" | "recalibrating";
    hygrometer: "requires_attention" | "recalibrating" | "optimal";
  };
}

export interface WeatherData {
  windSpeed: number;       
  precipitation: number;      
  temperature: number;      
  humidity: number;     
  light: number;        
  pressure: number;       
  cloudCover: number;                                                         
  windDirection?: number;           
  solarIrradiance?: number;        
  condition?: string;                                  
  timestamp?: number;           
}

export interface Crop {
  id: string;
  name: string;
  matchScore: number;
  details: string;
  description: string;
  suitabilityBullets: string[];
}
