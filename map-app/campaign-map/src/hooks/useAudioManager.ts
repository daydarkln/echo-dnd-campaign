import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { message } from 'antd';
import { LocationAudioBindings, LocationAudioConfig, RouteAudioConfig, ActiveSound, AudioConfig } from '../types/audio';

export const useAudioManager = () => {
  const [bindings, setBindings] = useState<LocationAudioBindings | null>(null);
  const [audioConfig, setAudioConfig] = useState<AudioConfig | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentRoute, setCurrentRoute] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<string>('day');
  const [currentWeather, setCurrentWeather] = useState<string>('clear');
  
  const activeSounds = useRef<Map<string, ActiveSound>>(new Map());
  const audioContext = useRef<AudioContext | null>(null);

  // Функции для работы с localStorage
  const saveCurrentLocation = useCallback((locationId: string) => {
    try {
      localStorage.setItem('dnd_currentLocation', locationId);
      console.log(`Saved current location to localStorage: ${locationId}`);
    } catch (error) {
      console.error('Failed to save current location to localStorage:', error);
    }
  }, []);

  const loadCurrentLocation = useCallback((): string => {
    try {
      const savedLocation = localStorage.getItem('dnd_currentLocation');
      if (savedLocation) {
        console.log(`Loaded current location from localStorage: ${savedLocation}`);
        return savedLocation;
      }
    } catch (error) {
      console.error('Failed to load current location from localStorage:', error);
    }
    return '';
  }, []);

  const saveAudioSettings = useCallback(() => {
    try {
      const settings = {
        timeOfDay: currentTimeOfDay,
        weather: currentWeather,
        isMuted: isMuted
      };
      localStorage.setItem('dnd_audioSettings', JSON.stringify(settings));
      console.log('Saved audio settings to localStorage:', settings);
    } catch (error) {
      console.error('Failed to save audio settings to localStorage:', error);
    }
  }, [currentTimeOfDay, currentWeather, isMuted]);

  const loadAudioSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('dnd_audioSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        console.log('Loaded audio settings from localStorage:', settings);
        
        if (settings.timeOfDay) setCurrentTimeOfDay(settings.timeOfDay);
        if (settings.weather) setCurrentWeather(settings.weather);
        if (typeof settings.isMuted === 'boolean') setIsMuted(settings.isMuted);
      }
    } catch (error) {
      console.error('Failed to load audio settings from localStorage:', error);
    }
  }, []);

  const clearAudioSettings = useCallback(() => {
    try {
      localStorage.removeItem('dnd_currentLocation');
      localStorage.removeItem('dnd_audioSettings');
      console.log('Cleared audio settings from localStorage');
    } catch (error) {
      console.error('Failed to clear audio settings from localStorage:', error);
    }
  }, []);

  const getSavedSettingsInfo = useCallback(() => {
    try {
      const savedLocation = localStorage.getItem('dnd_currentLocation');
      const savedSettings = localStorage.getItem('dnd_audioSettings');
      
      return {
        hasLocation: !!savedLocation,
        hasSettings: !!savedSettings,
        location: savedLocation || null,
        settings: savedSettings ? JSON.parse(savedSettings) : null
      };
    } catch (error) {
      console.error('Failed to get saved settings info:', error);
      return { hasLocation: false, hasSettings: false, location: null, settings: null };
    }
  }, []);

  // Загрузка конфигураций
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        // Загружаем главный конфиг аудио
        const audioResponse = await fetch('/audio-config.json');
        const mainAudioConfig = await audioResponse.json();
        setAudioConfig(mainAudioConfig);
        
        // Загружаем привязки локаций
        const bindingsResponse = await fetch('/location-audio-bindings.json');
        const locationBindings = await bindingsResponse.json();
        setBindings(locationBindings);
        
        // Восстанавливаем сохраненную локацию из localStorage
        const savedLocation = loadCurrentLocation();
        if (savedLocation && locationBindings.locations[savedLocation]) {
          console.log(`Restoring saved location: ${savedLocation}`);
          setCurrentLocation(savedLocation);
        }
        
        // Загружаем аудио настройки
        loadAudioSettings();
      } catch (error) {
        console.error('Ошибка загрузки аудио конфигураций:', error);
      }
    };
    
    loadConfigs();
  }, [loadCurrentLocation, loadAudioSettings]);

  // Воспроизведение звука с учетом главного конфига
  const playSound = useCallback((
    soundId: string, 
    category: 'music' | 'ambient' | 'sfx' | 'voice',
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: boolean;
      onEnd?: () => void;
    } = {}
  ) => {
    if (isMuted || !audioConfig) return;

    // Проверяем, не воспроизводится ли уже этот звук
    const existingSound = activeSounds.current.get(soundId);
    if (existingSound && existingSound.category === category) {         
      return;
    }

    // По умолчанию зацикливаем все, кроме эффектов (sfx)
    const defaultLoop = category !== 'sfx';
    const { volume = 1, loop = defaultLoop, fadeIn = false, onEnd } = options;
    
    // Проверяем лимит одновременных звуков
    if (activeSounds.current.size >= audioConfig.performanceSettings.maxSimultaneousSounds) {
      const oldestSound = Array.from(activeSounds.current.values())[0];
      oldestSound.howl.stop();
      activeSounds.current.delete(oldestSound.id);
    }

    // Формируем путь к звуковому файлу
    const soundPath = `/audio/${category}/${soundId}.wav`;
    
    // Применяем громкость из конфига
    const baseVolume = volume * audioConfig.categoryVolumes[category] * audioConfig.globalSettings.masterVolume;
    
    const howl = new Howl({
      src: [soundPath],
      volume: baseVolume,
      loop: false, // Отключаем стандартный loop для реализации кроссфейда
      onend: onEnd,
      onloaderror: (id, error) => {
        const errorMessage = `Ошибка загрузки аудио: ${soundPath}`;
        const reason = `Причина: ${error}`;
        
        message.error(`${errorMessage}. ${reason}`);
        console.error('Ошибка загрузки аудио:', { soundId, category, soundPath, error });
        
        // Для SFX показываем дополнительную нотификацию
        if (category === 'sfx') {
          message.error(`🔊 Не удалось воспроизвести звуковой эффект "${soundId}". ${reason}`);
        }
      },
      onplayerror: (id, error) => {
        const errorMessage = `Ошибка воспроизведения аудио: ${soundPath}`;
        const reason = `Причина: ${error}`;
        
        message.error(`${errorMessage}. ${reason}`);
        console.error('Ошибка воспроизведения аудио:', { soundId, category, soundPath, error });
        
        // Для SFX показываем дополнительную нотификацию
        if (category === 'sfx') {
          message.error(`🔊 Не удалось воспроизвести звуковой эффект "${soundId}". ${reason}`);
        }
      }
    });

    const activeSound: ActiveSound = {
      id: soundId,
      howl,
      category,
      volume: baseVolume,
      isLooping: loop
    };

    console.log(`Created new sound: ${soundId} (${category}), volume: ${baseVolume}, loop: ${loop}`);

    activeSounds.current.set(soundId, activeSound);
    
    if (fadeIn) {
      howl.volume(0);
      howl.fade(0, baseVolume, audioConfig.globalSettings.fadeInDuration);
    }
    
    howl.play();

    // Если трек должен зацикливаться, настраиваем кроссфейд
    if (loop && category !== 'sfx') {
      const setupCrossfade = (howlInstance: Howl, soundId: string, category: string, baseVolume: number) => {
        const duration = howlInstance.duration();
        if (duration > 0) {
          console.log(`Setting up crossfade for ${soundId} (${category}), duration: ${duration}s, crossfade starts at: ${duration - 3}s`);
          
          // Запускаем кроссфейд за 3 секунды до конца трека
          const crossfadeStartTime = duration - 3;
          
          setTimeout(() => {
            // Проверяем, что трек все еще активен
            if (activeSounds.current.has(soundId)) {
              console.log(`Starting crossfade for ${soundId} (${category})`);
              
              // Создаем новый экземпляр для кроссфейда
              const crossfadeHowl = new Howl({
                src: [soundPath],
                volume: 0, // Начинаем с тишины
                loop: false
              });
              
              // Запускаем новый трек
              crossfadeHowl.play();
              
              // Плавно увеличиваем громкость нового трека
              crossfadeHowl.fade(0, baseVolume, audioConfig.globalSettings.crossfadeDuration);
              
              // Плавно уменьшаем громкость старого трека
              howlInstance.fade(baseVolume, 0, audioConfig.globalSettings.crossfadeDuration);
              
              console.log(`Crossfade in progress for ${soundId} (${category}), duration: ${audioConfig.globalSettings.crossfadeDuration}ms`);
              
              // После завершения кроссфейда останавливаем старый трек
              setTimeout(() => {
                howlInstance.stop();
                console.log(`Crossfade completed for ${soundId} (${category}), old track stopped`);
                
                // Заменяем старый трек новым в activeSounds
                activeSounds.current.set(soundId, {
                  ...activeSound,
                  howl: crossfadeHowl
                });
                
                // Настраиваем следующий кроссфейд
                const nextCrossfadeStartTime = crossfadeHowl.duration() - 3;
                if (nextCrossfadeStartTime > 0) {
                  console.log(`Setting up next crossfade for ${soundId} (${category}) in ${nextCrossfadeStartTime}s`);
                  
                  setTimeout(() => {
                    if (activeSounds.current.has(soundId)) {
                      // Рекурсивно вызываем кроссфейд для нового трека
                      const currentSound = activeSounds.current.get(soundId);
                      if (currentSound) {
                        console.log(`Starting next crossfade for ${soundId} (${category})`);
                        
                        const newCrossfadeHowl = new Howl({
                          src: [soundPath],
                          volume: 0,
                          loop: false
                        });
                        
                        newCrossfadeHowl.play();
                        newCrossfadeHowl.fade(0, baseVolume, audioConfig.globalSettings.crossfadeDuration);
                        currentSound.howl.fade(baseVolume, 0, audioConfig.globalSettings.crossfadeDuration);
                        
                        setTimeout(() => {
                          currentSound.howl.stop();
                          activeSounds.current.set(soundId, {
                            ...currentSound,
                            howl: newCrossfadeHowl
                          });
                          console.log(`Next crossfade completed for ${soundId} (${category})`);
                        }, audioConfig.globalSettings.crossfadeDuration);
                      }
                    }
                  }, nextCrossfadeStartTime * 1000);
                }
              }, audioConfig.globalSettings.crossfadeDuration);
            } else {
              console.log(`Sound ${soundId} (${category}) no longer active, skipping crossfade`);
            }
          }, crossfadeStartTime * 1000);
        } else {
          console.log(`Cannot set up crossfade for ${soundId} (${category}): duration is 0 or undefined`);
        }
      };

      // Пытаемся настроить кроссфейд сразу
      setupCrossfade(howl, soundId, category, baseVolume);
      
      // Если duration не доступен сразу, пробуем через небольшую задержку
      if (howl.duration() <= 0) {
        setTimeout(() => {
          if (activeSounds.current.has(soundId)) {
            const currentSound = activeSounds.current.get(soundId);
            if (currentSound && currentSound.howl.duration() > 0) {
              console.log(`Setting up delayed crossfade for ${soundId} (${category})`);
              setupCrossfade(currentSound.howl, soundId, category, baseVolume);
            }
          }
        }, 1000);
      }
    }
  }, [isMuted, audioConfig]);

  // Остановка звука
  const stopSound = useCallback((soundId: string, fadeOut: boolean = false) => {
    const sound = activeSounds.current.get(soundId);
    if (!sound || !audioConfig) return;

    if (fadeOut) {
      sound.howl.fade(sound.volume, 0, audioConfig.globalSettings.fadeOutDuration);
      setTimeout(() => {
        sound.howl.stop();
        activeSounds.current.delete(soundId);
      }, audioConfig.globalSettings.fadeOutDuration);
    } else {
      sound.howl.stop();
      activeSounds.current.delete(soundId);
    }
  }, [audioConfig]);

  // Остановка всех звуков категории
  const stopCategory = useCallback((category: 'music' | 'ambient' | 'sfx' | 'voice') => {
    console.log(`Stopping all sounds of category: ${category}`);
    
    const soundsToRemove: string[] = [];
    
    activeSounds.current.forEach((sound, id) => {
      if (sound.category === category) {
        console.log(`Stopping sound: ${id} (${sound.category})`);
        sound.howl.stop();
        soundsToRemove.push(id);
      }
    });
    
    // Удаляем остановленные звуки из Map
    soundsToRemove.forEach(id => {
      activeSounds.current.delete(id);
      console.log(`Removed sound: ${id} from activeSounds`);
    });
    
    console.log(`Stopped ${soundsToRemove.length} sounds of category: ${category}`);
  }, []);

  // Плавное затухание текущих звуков
  const fadeOutCurrentSounds = useCallback(async (newLocationConfig?: LocationAudioConfig): Promise<void> => {
    if (!audioConfig) return;

    console.log('Fading out current sounds:', Array.from(activeSounds.current.values()).map(s => ({ id: s.id, category: s.category })));

    const fadeOutPromises: Promise<void>[] = [];
    
    activeSounds.current.forEach((sound) => {
      // Проверяем, не будет ли этот звук играть в новой локации
      let shouldStop = true;
      
      if (newLocationConfig) {
        if (sound.category === 'ambient') {
          // Проверяем дневной и ночной ambient
          const currentTime = currentTimeOfDay;
          const ambientId = currentTime === 'night' && newLocationConfig.ambient.night 
            ? newLocationConfig.ambient.night 
            : newLocationConfig.ambient.day;
          
          if (ambientId === sound.id) {
            shouldStop = false;
            console.log(`Keeping ambient sound: ${sound.id} - it will continue in new location`);
          }
        } else if (sound.category === 'music') {
          // Проверяем музыкальную тему
          if (newLocationConfig.music?.theme === sound.id) {
            shouldStop = false;
            console.log(`Keeping music: ${sound.id} - it will continue in new location`);
          }
        }
      }
      
      if (shouldStop) {
        fadeOutPromises.push(
          new Promise<void>((resolve) => {
            console.log(`Fading out sound: ${sound.id} (${sound.category})`);
            sound.howl.fade(sound.volume, 0, audioConfig.globalSettings.fadeOutDuration);
            setTimeout(() => {
              sound.howl.stop();
              console.log(`Stopped sound: ${sound.id} (${sound.category})`);
              resolve();
            }, audioConfig.globalSettings.fadeOutDuration);
          })
        );
      }
    });

    await Promise.all(fadeOutPromises);
    
    // Удаляем только остановленные звуки
    activeSounds.current.forEach((sound, id) => {
      if (sound.howl.volume() === 0) {
        activeSounds.current.delete(id);
      }
    });
    
    console.log('Fade out completed');
  }, [audioConfig, currentTimeOfDay]);

  // Смена локации с плавным переходом
  const changeLocation = useCallback(async (locationId: string) => {
    if (!bindings || !audioConfig || currentLocation === locationId) return;

    const locationConfig = bindings.locations[locationId];
    if (!locationConfig) return;

    console.log(`Changing location from ${currentLocation} to ${locationId}`);

    // Плавно убираем текущие звуки
    await fadeOutCurrentSounds(locationConfig);

    // Устанавливаем новую локацию
    setCurrentLocation(locationId);
    console.log(`Current location set to: ${locationId}`);
    
    // Сохраняем в localStorage
    saveCurrentLocation(locationId);

    // Плавно запускаем новые звуки
    await fadeInNewLocation(locationConfig);
  }, [bindings, audioConfig, currentLocation, fadeOutCurrentSounds]);

  // Плавное появление новой локации
  const fadeInNewLocation = useCallback(async (locationConfig: LocationAudioConfig): Promise<void> => {
    if (!audioConfig) return;

    // Определяем какой ambient звук воспроизводить в зависимости от времени суток
    const currentTime = currentTimeOfDay;
    const ambientId = currentTime === 'night' && locationConfig.ambient.night 
      ? locationConfig.ambient.night 
      : locationConfig.ambient.day;

    // Запуск основного ambient звука
    if (ambientId) {
      // Проверяем, не играет ли уже этот звук
      const existingSound = activeSounds.current.get(ambientId);
      if (!existingSound || existingSound.category !== 'ambient') {
        playSound(ambientId, 'ambient', {
          volume: locationConfig.ambient.volume || 0.6,
          loop: true, // Явно зацикливаем ambient
          fadeIn: true
        });
      } else {
        console.log(`Primary ambient ${ambientId} is already playing, skipping...`);
      }
    }

    // Запуск музыки
    if (locationConfig.music) {
      // Проверяем, не играет ли уже эта музыка
      const existingSound = activeSounds.current.get(locationConfig.music.theme);
      if (!existingSound || existingSound.category !== 'music') {
        setTimeout(() => {
          playSound(locationConfig.music!.theme, 'music', {
            volume: locationConfig.music!.volume,
            loop: true, // Явно зацикливаем музыку
            fadeIn: true
          });
        }, locationConfig.ambient?.crossfadeTime || 3000);
      } else {
        console.log(`Music ${locationConfig.music.theme} is already playing, skipping...`);
      }
    }

    // Применяем аудио фильтры
    if (locationConfig.environment.indoorOutdoor === 'indoors' || locationConfig.environment.indoorOutdoor === 'outdoors') {
      applyAudioFilter(locationConfig.environment.indoorOutdoor);
    }

    // Автоматически применяем текущие настройки времени и погоды
    setTimeout(() => {
      if (currentTimeOfDay && locationConfig.environment.timeOfDay !== 'none') {
        console.log(`Auto-applying time of day: ${currentTimeOfDay} for location: ${locationConfig.name}`);
        // Вызываем setTimeOfDay для применения эффектов времени
        const timeConfig = audioConfig.timeOfDay[currentTimeOfDay];
        if (timeConfig) {
          activeSounds.current.forEach((sound) => {
            if (sound.category === 'ambient' && !sound.id.startsWith('weather-')) {
              const newVolume = sound.volume * timeConfig.ambientModifier;
              sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
              sound.volume = newVolume;
            }
            if (sound.category === 'music') {
              const newVolume = sound.volume * timeConfig.musicModifier;
              sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
              sound.volume = newVolume;
            }
          });
        }
      }

      if (currentWeather && locationConfig.environment.weather !== 'none') {
        console.log(`Auto-applying weather: ${currentWeather} for location: ${locationConfig.name}`);
        // Вызываем setWeather для применения эффектов погоды
        const weatherConfig = audioConfig.weatherEffects[currentWeather];
        if (weatherConfig && weatherConfig.ambientLayer) {
          const weatherSoundId = `weather-${currentWeather}`;
          playSound(weatherConfig.ambientLayer, 'ambient', {
            volume: weatherConfig.volume,
            loop: true
          });
          
          // Переименовываем звук для лучшего отслеживания
          const sound = activeSounds.current.get(weatherConfig.ambientLayer);
          if (sound) {
            activeSounds.current.delete(weatherConfig.ambientLayer);
            activeSounds.current.set(weatherSoundId, sound);
            console.log(`Auto-added weather layer: ${weatherSoundId}`);
          }
        }
      }
    }, 2000); // Задержка для плавного появления
  }, [audioConfig, playSound, currentTimeOfDay, currentWeather]);

  // Применение аудио фильтров
  const applyAudioFilter = useCallback((filterType: string) => {
    if (!audioConfig) return;

    const filter = audioConfig.audioFilters[filterType];
    if (!filter) return;

    // Здесь можно применить Web Audio API фильтры
    console.log(`Применен фильтр: ${filterType}`, filter);
  }, [audioConfig]);

  // Воспроизведение эффекта перехода
  const playTransitionEffect = useCallback((effectType: string) => {
    if (!audioConfig) return;

    const effect = audioConfig.transitionEffects[effectType];
    if (!effect) return;

    // Воспроизводим звук эффекта
    playSound(effect.soundFile, effect.category as 'music' | 'ambient' | 'sfx' | 'voice', {
      volume: effect.volume
    });

    // Если нужно приглушить ambient
    if (effect.fadeOutAmbient) {
      activeSounds.current.forEach((sound) => {
        if (sound.category === 'ambient') {
          sound.howl.fade(sound.volume, sound.volume * 0.3, effect.ambientFadeTime);
        }
      });

      // Восстанавливаем ambient через задержку
      if (effect.newAmbientDelay) {
        setTimeout(() => {
          activeSounds.current.forEach((sound) => {
            if (sound.category === 'ambient') {
              sound.howl.fade(sound.volume * 0.3, sound.volume, effect.ambientFadeTime);
            }
          });
        }, effect.newAmbientDelay);
      }
    }
  }, [audioConfig, playSound]);

  // Воспроизведение эффекта локации
  const playLocationEffect = useCallback((locationId: string, effectKey: string) => {
    if (!bindings || !audioConfig) return;

    const locationConfig = bindings.locations[locationId];
    if (!locationConfig || !locationConfig.effects[effectKey]) return;

    const effect = locationConfig.effects[effectKey];
    
    // Воспроизводим звук эффекта
    playSound(effect.sound, 'sfx', {
      volume: effect.volume
    });

    // Если нужно приглушить ambient
    if (effect.fadeOutAmbient) {
      activeSounds.current.forEach((sound) => {
        if (sound.category === 'ambient') {
          sound.howl.fade(sound.volume, sound.volume * 0.3, effect.ambientFadeTime || audioConfig.globalSettings.fadeOutDuration);
        }
      });

      // Восстанавливаем ambient через задержку
      setTimeout(() => {
        activeSounds.current.forEach((sound) => {
          if (sound.category === 'ambient') {
            sound.howl.fade(sound.volume * 0.3, sound.volume, effect.ambientFadeTime || audioConfig.globalSettings.fadeOutDuration);
          }
        });
      }, effect.ambientFadeTime || audioConfig.globalSettings.fadeOutDuration);
    }

    // Если нужно приглушить музыку
    if (effect.fadeOutMusic) {
      activeSounds.current.forEach((sound) => {
        if (sound.category === 'music') {
          sound.howl.fade(sound.volume, sound.volume * 0.5, audioConfig.globalSettings.fadeOutDuration);
        }
      });

      // Восстанавливаем музыку через 3 секунды
      setTimeout(() => {
        activeSounds.current.forEach((sound) => {
          if (sound.category === 'music') {
            sound.howl.fade(sound.volume * 0.5, sound.volume, audioConfig.globalSettings.fadeOutDuration);
          }
        });
      }, 3000);
    }
  }, [bindings, audioConfig, playSound]);

  // Воспроизведение эффекта пути
  const playRouteEffect = useCallback((routeId: string, effectKey: string) => {
    if (!bindings || !audioConfig || !bindings.routes) return;

    const routeConfig = bindings.routes[routeId];
    if (!routeConfig || !routeConfig.effects[effectKey]) return;

    const effect = routeConfig.effects[effectKey];
    
    playSound(effect.sound, 'sfx', {
      volume: effect.volume
    });
  }, [bindings, audioConfig, playSound]);

  // Воспроизведение шагов
  const playFootstep = useCallback((surfaceType: string) => {
    if (!audioConfig) return;

    const footstepConfig = audioConfig.footstepSettings[surfaceType];
    if (!footstepConfig) return;

    // Добавляем вариацию высоты тона
    const pitchVariation = 1 + (Math.random() - 0.5) * footstepConfig.pitchVariation;
    
    playSound(footstepConfig.soundFile, 'sfx', {
      volume: footstepConfig.volume
    });
  }, [audioConfig, playSound]);

  // Управление временем дня
  const setTimeOfDay = useCallback((time: string) => {
    if (!audioConfig || !bindings || !currentLocation) return;

    setCurrentTimeOfDay(time);
    
    // Сохраняем настройки в localStorage
    setTimeout(() => saveAudioSettings(), 100);
    
    const timeConfig = audioConfig.timeOfDay[time];
    if (!timeConfig) return;

    // Получаем конфигурацию текущей локации
    const locationConfig = bindings.locations[currentLocation];
    if (!locationConfig) return;

    // Проверяем, нужно ли применять эффекты времени суток
    const shouldApplyTimeEffects = locationConfig.environment.timeOfDay !== 'none';
    
    if (!shouldApplyTimeEffects) {
      console.log(`Time effects disabled for location: ${currentLocation}`);
      return;
    }

    // Останавливаем предыдущий слой времени суток
    activeSounds.current.forEach((sound, id) => {
      if (id.startsWith('time-')) {
        console.log(`Stopping time layer: ${id}`);
        sound.howl.stop();
        activeSounds.current.delete(id);
      }
    });

    // Проверяем, нужно ли сменить ambient звук
    const currentAmbientId = time === 'night' && locationConfig.ambient.night 
      ? locationConfig.ambient.night 
      : locationConfig.ambient.day;

    // Останавливаем текущий ambient, если он отличается от нужного
    activeSounds.current.forEach((sound, id) => {
      if (sound.category === 'ambient' && !sound.id.startsWith('weather-') && !sound.id.startsWith('time-')) {
        // Проверяем, является ли это основным ambient звуком
        if (sound.id === locationConfig.ambient.day || sound.id === locationConfig.ambient.night) {
          // Если ambient звук не соответствует текущему времени, останавливаем его
          if (sound.id !== currentAmbientId) {
            console.log(`Stopping ambient sound: ${sound.id} - switching to ${currentAmbientId} for ${time}`);
            sound.howl.fade(sound.volume, 0, audioConfig.globalSettings.fadeOutDuration);
            setTimeout(() => {
              sound.howl.stop();
              activeSounds.current.delete(id);
            }, audioConfig.globalSettings.fadeOutDuration);
          }
        }
      }
    });

    // Запускаем новый ambient звук, если он отличается от текущего
    setTimeout(() => {
      const existingAmbient = Array.from(activeSounds.current.values()).find(s => 
        s.category === 'ambient' && 
        !s.id.startsWith('weather-') && 
        !s.id.startsWith('time-') &&
        (s.id === locationConfig.ambient.day || s.id === locationConfig.ambient.night)
      );

      if (!existingAmbient || existingAmbient.id !== currentAmbientId) {
        console.log(`Starting new ambient sound: ${currentAmbientId} for ${time}`);
        playSound(currentAmbientId, 'ambient', {
          volume: locationConfig.ambient.volume || 0.6,
          loop: true,
          fadeIn: true
        });
      }
    }, audioConfig.globalSettings.fadeOutDuration);

    // Применяем модификаторы к активным ambient звукам локации
    activeSounds.current.forEach((sound) => {
      if (sound.category === 'ambient' && !sound.id.startsWith('weather-')) {
        const newVolume = sound.volume * timeConfig.ambientModifier;
        sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
        sound.volume = newVolume;
        console.log(`Applied time modifier to ambient: ${sound.id}, new volume: ${newVolume}`);
      }
      if (sound.category === 'music') {
        const newVolume = sound.volume * timeConfig.musicModifier;
        sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
        sound.volume = newVolume;
        console.log(`Applied time modifier to music: ${sound.id}, new volume: ${newVolume}`);
      }
    });

  }, [audioConfig, bindings, currentLocation, playSound, currentTimeOfDay]);

  // Управление погодой
  const setWeather = useCallback((weather: string) => {
    if (!audioConfig || !bindings || !currentLocation) return;

    setCurrentWeather(weather);
    
    // Сохраняем настройки в localStorage
    setTimeout(() => saveAudioSettings(), 100);
    
    const weatherConfig = audioConfig.weatherEffects[weather];
    if (!weatherConfig) return;

    // Получаем конфигурацию текущей локации
    const locationConfig = bindings.locations[currentLocation];
    if (!locationConfig) return;

    // Проверяем, нужно ли применять эффекты погоды
    const shouldApplyWeatherEffects = locationConfig.environment.weather !== 'none';
    
    if (!shouldApplyWeatherEffects) {
      console.log(`Weather effects disabled for location: ${currentLocation}`);
      return;
    }

    // Останавливаем предыдущий слой погоды
    activeSounds.current.forEach((sound, id) => {
      if (id.startsWith('weather-')) {
        console.log(`Stopping weather layer: ${id}`);
        sound.howl.stop();
        activeSounds.current.delete(id);
      }
    });

    // Добавляем новый слой погоды, если есть ambientLayer
    if (weatherConfig.ambientLayer) {
      const weatherSoundId = `weather-${weather}`;
      playSound(weatherConfig.ambientLayer, 'ambient', {
        volume: weatherConfig.volume,
        loop: true
      });
      
      // Переименовываем звук для лучшего отслеживания
      const sound = activeSounds.current.get(weatherConfig.ambientLayer);
      if (sound) {
        activeSounds.current.delete(weatherConfig.ambientLayer);
        activeSounds.current.set(weatherSoundId, sound);
        console.log(`Added weather layer: ${weatherSoundId}`);
      }
    }

    // Применяем модификаторы к активным звукам
    if (weatherConfig.affectsFootsteps) {
      // Модифицируем звуки шагов, если они есть
      activeSounds.current.forEach((sound) => {
        if (sound.category === 'sfx' && sound.id.includes('footstep')) {
          const newVolume = sound.volume * (weatherConfig.footstepModifier || 1);
          sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
          sound.volume = newVolume;
          console.log(`Applied weather modifier to footsteps: ${sound.id}, new volume: ${newVolume}`);
        }
      });
    }

    if (weatherConfig.affectsMusic) {
      // Модифицируем музыку, если нужно
      activeSounds.current.forEach((sound) => {
        if (sound.category === 'music') {
          const newVolume = sound.volume * (weatherConfig.musicModifier || 1);
          sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
          sound.volume = newVolume;
          console.log(`Applied weather modifier to music: ${sound.id}, new volume: ${newVolume}`);
        }
      });
    }
  }, [audioConfig, bindings, currentLocation, playSound]);

  // Обновление громкости категории в реальном времени
  const updateCategoryVolume = useCallback((category: 'music' | 'ambient' | 'sfx' | 'voice', volume: number) => {
    if (!audioConfig) return;

    console.log(`Updating ${category} volume to: ${volume}`);

    // Обновляем громкость в конфиге
    audioConfig.categoryVolumes[category] = volume;

    // Применяем новую громкость к активным звукам этой категории
    activeSounds.current.forEach((sound) => {
      if (sound.category === category) {
        // Вычисляем новую громкость с учетом базовой громкости звука и общей громкости
        const baseVolume = sound.volume / (audioConfig.categoryVolumes[category] * audioConfig.globalSettings.masterVolume);
        const newVolume = baseVolume * volume * audioConfig.globalSettings.masterVolume;
        
        console.log(`Updating sound ${sound.id} volume from ${sound.volume} to ${newVolume}`);
        
        sound.howl.volume(newVolume);
        sound.volume = newVolume;
      }
    });
  }, [audioConfig]);

  // Обновление громкости конкретного трека
  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    if (!audioConfig || !bindings) return;
    
    console.log(`Updating track ${trackId} volume to: ${volume}`);
    
    // Обновляем громкость конкретного трека
    if (trackId.startsWith('ambient-')) {
      const ambientId = trackId.replace('ambient-', '');
      // Находим локацию с этим ambient и обновляем её громкость
      Object.values(bindings.locations).forEach(location => {
        if (location.ambient.day === ambientId || location.ambient.night === ambientId) {
          location.ambient.volume = volume;
          console.log(`Updated ambient ${ambientId} volume to ${volume} in location ${location.name}`);
        }
      });
    } else if (trackId.startsWith('music-')) {
      const musicId = trackId.replace('music-', '');
      // Находим локацию с этой музыкой и обновляем её громкость
      Object.values(bindings.locations).forEach(location => {
        if (location.music?.theme === musicId) {
          location.music.volume = volume;
          console.log(`Updated music ${musicId} volume to ${volume} in location ${location.name}`);
        }
      });
    }
    
    // Применяем к активным звукам
    activeSounds.current.forEach((sound) => {
      if (sound.id === trackId) {
        const newVolume = volume * audioConfig.globalSettings.masterVolume;
        sound.howl.volume(newVolume);
        sound.volume = newVolume;
        console.log(`Updated active sound ${sound.id} volume to ${newVolume}`);
      }
    });
  }, [audioConfig, bindings]);

  // Обновление общей громкости в реальном времени
  const updateMasterVolume = useCallback((volume: number) => {
    if (!audioConfig) return;

    // Обновляем общую громкость в конфиге
    audioConfig.globalSettings.masterVolume = volume;

    // Применяем новую громкость ко всем активным звукам
    activeSounds.current.forEach((sound) => {
      // Вычисляем новую громкость с учетом базовой громкости звука
      const baseVolume = sound.volume / audioConfig.globalSettings.masterVolume;
      const newVolume = baseVolume * volume;
      
      sound.howl.volume(newVolume);
      sound.volume = newVolume;
    });
  }, [audioConfig]);

  // Автоматическое воспроизведение атмосферы восстановленной локации
  useEffect(() => {
    if (currentLocation && bindings && audioConfig) {
      const locationConfig = bindings.locations[currentLocation];
      if (locationConfig) {
        console.log(`Auto-playing atmosphere for restored location: ${currentLocation}`);
        
        // Воспроизводим атмосферу локации
        setTimeout(() => {
          fadeInNewLocation(locationConfig);
        }, 1000); // Небольшая задержка для плавности
      }
    }
  }, [currentLocation, bindings, audioConfig, fadeInNewLocation]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      activeSounds.current.forEach((sound) => sound.howl.stop());
      activeSounds.current.clear();
    };
  }, []);

  // Функция спотлайта локации
  const playLocationSpotlight = useCallback((locationId: string) => {
    if (!bindings || !audioConfig) {
      message.error('Аудио конфигурация не загружена');
      return;
    }

    const locationConfig = bindings.locations[locationId];
    if (!locationConfig) {
      message.error(`Локация ${locationId} не найдена в аудио конфигурации`);
      return;
    }

    // Устанавливаем текущую локацию при спотлайте
    if (currentLocation !== locationId) {
      console.log(`Setting current location to: ${locationId} via spotlight`);
      setCurrentLocation(locationId);
      
      // Сохраняем в localStorage
      saveCurrentLocation(locationId);
    }

    // Останавливаем все текущие звуки, кроме тех, которые будут играть в новой локации
    const soundsToStop: string[] = [];
    
    // Определяем какой ambient звук нужен для текущего времени суток
    const currentTime = currentTimeOfDay;
    const ambientId = currentTime === 'night' && locationConfig.ambient.night 
      ? locationConfig.ambient.night 
      : locationConfig.ambient.day;
    
    activeSounds.current.forEach((sound, id) => {
      let shouldStop = true;
      
      if (sound.category === 'ambient') {
        // Проверяем primary ambient
        if (sound.id === ambientId) {
          shouldStop = false;
          console.log(`Keeping ambient sound: ${sound.id} - it will continue`);
        }
      } else if (sound.category === 'music') {
        // Проверяем музыкальную тему
        if (locationConfig.music?.theme === sound.id) {
          shouldStop = false;
          console.log(`Keeping music: ${sound.id} - it will continue`);
        }
      }
      
      if (shouldStop) {
        soundsToStop.push(id);
      }
    });
    
    // Останавливаем только те звуки, которые не нужны
    soundsToStop.forEach(id => {
      const sound = activeSounds.current.get(id);
      if (sound) {
        sound.howl.stop();
        activeSounds.current.delete(id);
        console.log(`Stopped sound: ${id} (${sound.category})`);
      }
    });

    // Воспроизводим основной эмбиент
    if (ambientId) {
      // Проверяем, не играет ли уже этот звук
      const existingSound = activeSounds.current.get(ambientId);
      if (!existingSound || existingSound.category !== 'ambient') {
        playSound(ambientId, 'ambient', {
          volume: locationConfig.ambient.volume || 0.6,
          loop: true, // Явно зацикливаем ambient
          fadeIn: true
        });
      } else {
        console.log(`Primary ambient ${ambientId} is already playing, skipping...`);
      }

      // Через crossfadeTime добавляем музыкальную тему
      if (locationConfig.music?.theme) {
        const musicTheme = locationConfig.music.theme;
        const musicVolume = locationConfig.music.volume || 0.4;
        
        // Проверяем, не играет ли уже эта музыка
        const existingMusic = activeSounds.current.get(musicTheme);
        if (!existingMusic || existingMusic.category !== 'music') {
          setTimeout(() => {
            playSound(musicTheme, 'music', {
              volume: musicVolume,
              loop: true, // Явно зацикливаем музыку
              fadeIn: true
            });
          }, locationConfig.ambient.crossfadeTime || 3000);
        } else {
          console.log(`Music ${musicTheme} is already playing, skipping...`);
        }
      }
    } else {
      message.warning(`Для локации ${locationId} не настроен основной эмбиент`);
    }

    // Автоматически применяем текущие настройки времени и погоды
    setTimeout(() => {
      if (currentTimeOfDay && locationConfig.environment.timeOfDay !== 'none') {
        console.log(`Auto-applying time of day: ${currentTimeOfDay} for location: ${locationConfig.name}`);
        // Вызываем setTimeOfDay для применения эффектов времени
        const timeConfig = audioConfig.timeOfDay[currentTimeOfDay];
        if (timeConfig) {
          activeSounds.current.forEach((sound) => {
            if (sound.category === 'ambient' && !sound.id.startsWith('weather-')) {
              const newVolume = sound.volume * timeConfig.ambientModifier;
              sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
              sound.volume = newVolume;
            }
            if (sound.category === 'music') {
              const newVolume = sound.volume * timeConfig.musicModifier;
              sound.howl.fade(sound.volume, newVolume, audioConfig.globalSettings.fadeInDuration);
              sound.volume = newVolume;
            }
          });
        }
      }

      if (currentWeather && locationConfig.environment.weather !== 'none') {
        console.log(`Auto-applying weather: ${currentWeather} for location: ${locationConfig.name}`);
        // Вызываем setWeather для применения эффектов погоды
        const weatherConfig = audioConfig.weatherEffects[currentWeather];
        if (weatherConfig && weatherConfig.ambientLayer) {
          const weatherSoundId = `weather-${currentWeather}`;
          playSound(weatherConfig.ambientLayer, 'ambient', {
            volume: weatherConfig.volume,
            loop: true
          });
          
          // Переименовываем звук для лучшего отслеживания
          const sound = activeSounds.current.get(weatherConfig.ambientLayer);
          if (sound) {
            activeSounds.current.delete(weatherConfig.ambientLayer);
            activeSounds.current.set(weatherSoundId, sound);
            console.log(`Auto-added weather layer: ${weatherSoundId}`);
          }
        }
      }
    }, 2000); // Задержка для плавного появления
  }, [bindings, audioConfig, playSound, currentTimeOfDay, currentWeather]);

  // Получение информации о текущей локации
  const getCurrentLocationInfo = useCallback(() => {
    if (!bindings || !currentLocation) return null;
    
    const locationConfig = bindings.locations[currentLocation];
    if (!locationConfig) return null;
    
    return {
      id: currentLocation,
      name: locationConfig.name,
      type: locationConfig.type,
      timeOfDayEnabled: locationConfig.environment.timeOfDay !== 'none',
      weatherEnabled: locationConfig.environment.weather !== 'none'
    };
  }, [bindings, currentLocation]);

  return {
    bindings,
    audioConfig,
    currentLocation,
    currentRoute,
    isMuted,
    currentTimeOfDay,
    currentWeather,
    playSound,
    stopSound,
    stopCategory,
    changeLocation,
    playLocationEffect,
    playRouteEffect,
    playTransitionEffect,
    playFootstep,
    setTimeOfDay,
    setWeather,
    setIsMuted: (muted: boolean) => {
      setIsMuted(muted);
      setTimeout(() => saveAudioSettings(), 100);
    },
    playLocationSpotlight,
    updateCategoryVolume,
    updateMasterVolume,
    updateTrackVolume,
    getCurrentLocationInfo,
    clearAudioSettings,
    getSavedSettingsInfo
  };
};
