import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { WeatherData } from "./types";

export const SENSOR_READINGS_COLLECTION = "sensor_readings";
export const STATION_ID = "brac-nursery";







export function describeFirestoreError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? "";

  switch (code) {
    case "permission-denied":
      return "Firestore rejected the request (permission denied). The database security rules are blocking this app — publish rules that allow authenticated access.";
    case "unauthenticated":
      return "Firestore rejected the session. Sign out and sign in again.";
    case "unavailable":
    case "deadline-exceeded":
      return "Firestore is unreachable. Check the network connection and retry.";
    case "failed-precondition":
      return "Firestore needs an index for this query. Open the Firebase console link in the browser console to create it.";
    default:
      break;
  }

  const message = (err as { message?: string } | null)?.message;
  return message ? `Firestore error: ${message}` : "Unknown Firestore error.";
}

export async function saveSensorReading(
  data: WeatherData,
  stationId: string = STATION_ID
): Promise<string> {
  const nowMillis = Date.now();
  const docRef = await addDoc(collection(db, SENSOR_READINGS_COLLECTION), {
    stationId,
    ts: nowMillis,
    timestamp: serverTimestamp(),
    windSpeed: data.windSpeed,
    precipitation: data.precipitation,
    temperature: data.temperature,
    humidity: data.humidity,
    light: data.light,
    pressure: data.pressure,
  });
  return docRef.id;
}

export interface SensorReading {
  id: string;
  stationId: string;
  ts: number;
  timestamp: Timestamp;
  windSpeed: number;
  precipitation: number;
  temperature: number;
  humidity: number;
  light: number;
  pressure: number;
}

export interface ChartPoint {
  time: Date;
  wind: number;
  precipitation: number;
  temp: number;
  humidity: number;
  light: number;
  pressure: number;
}

export function readingToChartPoint(reading: SensorReading): ChartPoint {
  let date: Date;
  try {
    date = reading.timestamp?.toDate ? reading.timestamp.toDate() : new Date(reading.ts);
  } catch {
    date = new Date(reading.ts);
  }
  return {
    time: date,
    wind: reading.windSpeed,
    precipitation: reading.precipitation,
    temp: reading.temperature,
    humidity: reading.humidity,
    light: reading.light,
    pressure: reading.pressure,
  };
}

                                                                        
export const MAX_READINGS_PER_FETCH = 1000;






export async function fetchLatestSensorReading(
  stationId: string = STATION_ID
): Promise<SensorReading | null> {
  const q = query(
    collection(db, SENSOR_READINGS_COLLECTION),
    where("stationId", "==", stationId),
    orderBy("ts", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data();
  const ts = (data.ts as number) ?? Date.now();
  let tsField = data.timestamp as Timestamp | undefined;
  if (!tsField) {
    tsField = Timestamp.fromMillis(ts);
  }
  return {
    id: doc.id,
    stationId: (data.stationId as string) ?? stationId,
    ts,
    timestamp: tsField,
    windSpeed: (data.windSpeed as number) ?? 0,
    precipitation: (data.precipitation as number) ?? 0,
    temperature: (data.temperature as number) ?? 0,
    humidity: (data.humidity as number) ?? 0,
    light: (data.light as number) ?? 0,
    pressure: (data.pressure as number) ?? 0,
  };
}

export async function fetchSensorReadings(hours: number): Promise<SensorReading[]> {
  const safeHours = Math.max(1, Math.floor(hours));
  const cutoffMillis = Date.now() - safeHours * 3600000;
                                                                               
                                                               
  const q = query(
    collection(db, SENSOR_READINGS_COLLECTION),
    where("ts", ">=", cutoffMillis),
    orderBy("ts", "desc"),
    limit(MAX_READINGS_PER_FETCH)
  );
  const snapshot = await getDocs(q);
  const readings: SensorReading[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    const ts = (data.ts as number) ?? Date.now();
    let tsField = data.timestamp as Timestamp | undefined;
    if (!tsField) {
      tsField = Timestamp.fromMillis(ts);
    }
    readings.push({
      id: doc.id,
      stationId: (data.stationId as string) ?? STATION_ID,
      ts,
      timestamp: tsField,
      windSpeed: (data.windSpeed as number) ?? 0,
      precipitation: (data.precipitation as number) ?? 0,
      temperature: (data.temperature as number) ?? 0,
      humidity: (data.humidity as number) ?? 0,
      light: (data.light as number) ?? 0,
      pressure: (data.pressure as number) ?? 0,
    });
  });
  readings.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  return readings;
}
