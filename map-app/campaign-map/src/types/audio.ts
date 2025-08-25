import { Howl } from 'howler';

export interface LocationAudioBindings {
  locations: Record<string, LocationAudioConfig>;
  routes: Record<string, RouteAudioConfig>;
  globalEffects: GlobalEffects;
}

export interface AudioConfig {
  globalSettings: GlobalSettings;
  categoryVolumes: CategoryVolumes;
  transitionEffects: Record<string, TransitionEffect>;
  encounterSettings: Record<string, EncounterSettings>;
  timeOfDay: Record<string, TimeOfDaySettings>;
  weatherEffects: Record<string, WeatherEffect>;
  footstepSettings: Record<string, FootstepSettings>;
  audioFilters: Record<string, AudioFilter>;
  performanceSettings: PerformanceSettings;
  accessibilitySettings: AccessibilitySettings;
  debugSettings: DebugSettings;
}

export interface GlobalSettings {
  masterVolume: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  crossfadeDuration: number;
  enableDynamicMixing: boolean;
  defaultAmbientVolume: number;
  defaultMusicVolume: number;
  defaultSfxVolume: number;
  defaultVoiceVolume: number;
}

export interface CategoryVolumes {
  music: number;
  ambient: number;
  sfx: number;
  voice: number;
}

export interface LocationAudioConfig {
  name: string;
  type: string;
  ambient: AmbientConfig;
  music?: MusicConfig;
  effects: Record<string, EffectConfig>;
  environment: EnvironmentConfig;
}

export interface RouteAudioConfig {
  name: string;
  type: string;
  ambient: AmbientConfig;
  effects: Record<string, EffectConfig>;
}

export interface AmbientConfig {
  primary: string;
  layers: string[];
  volume: number;
  crossfadeTime: number;
}

export interface MusicConfig {
  theme: string;
  volume: number;
  loop: boolean;
}

export interface EffectConfig {
  sound: string;
  volume: number;
  fadeOutAmbient?: boolean;
  ambientFadeTime?: number;
  fadeOutMusic?: boolean;
  surface?: string;
}

export interface EnvironmentConfig {
  indoorOutdoor: 'indoors' | 'outdoors' | 'none';
  timeOfDay: 'auto' | 'morning' | 'day' | 'evening' | 'night' | 'none';
  weather: 'auto' | 'clear' | 'rain' | 'wind' | 'storm' | 'none';
}

export interface GlobalEffects {
  weather: Record<string, WeatherEffect>;
  timeOfDay: Record<string, TimeOfDayEffect>;
}

export interface TransitionEffect {
  soundFile: string;
  volume: number;
  fadeOutAmbient: boolean;
  ambientFadeTime: number;
  newAmbientDelay?: number;
  category: string;
}

export interface EncounterSettings {
  musicTransition: string;
  ambientFadeOut: boolean;
  priority: 'low' | 'medium' | 'high';
  crossfadeTime: number;
  volume: number;
}

export interface TimeOfDaySettings {
  ambientModifier: number;
  musicModifier: number;
  volumeModifier: number;
  description: string;
}

export interface WeatherEffect {
  ambientLayer: string | null;
  volume: number;
  affectsFootsteps?: boolean;
  footstepModifier?: number;
  affectsMusic?: boolean;
  musicModifier?: number;
  description: string;
}

export interface TimeOfDayEffect {
  ambientModifier: number;
  musicModifier: number;
  volumeModifier: number;
}

export interface FootstepSettings {
  soundFile: string;
  volume: number;
  pitchVariation: number;
  surfaceType: 'hard' | 'medium' | 'soft' | 'organic';
  description: string;
}

export interface AudioFilter {
  reverb: number;
  lowPass: number;
  highPass: number;
  description: string;
}

export interface PerformanceSettings {
  maxSimultaneousSounds: number;
  streamingEnabled: boolean;
  compressionQuality: string;
  cacheSize: string;
  preloadThreshold: number;
  cleanupInterval: number;
  description: string;
}

export interface AccessibilitySettings {
  enableSubtitles: boolean;
  subtitleStyle: string;
  volumeNormalization: boolean;
  dynamicRangeCompression: boolean;
  description: string;
}

export interface DebugSettings {
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performanceMonitoring: boolean;
  audioVisualization: boolean;
  description: string;
}

export interface ActiveSound {
  id: string;
  howl: Howl;
  category: 'music' | 'ambient' | 'sfx' | 'voice';
  volume: number;
  isLooping: boolean;
}