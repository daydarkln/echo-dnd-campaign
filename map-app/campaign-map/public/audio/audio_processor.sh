#!/bin/bash

# Скрипт для рекурсивного преобразования аудиофайлов в MP3 и обрезки до 2 часов

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для проверки установки ffmpeg
check_dependencies() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}Ошибка: ffmpeg не установлен${NC}"
        echo "Установите ffmpeg:"
        echo "  Ubuntu/Debian: sudo apt install ffmpeg"
        echo "  macOS: brew install ffmpeg"
        exit 1
    fi
    
    if ! command -v ffprobe &> /dev/null; then
        echo -e "${RED}Ошибка: ffprobe не установлен${NC}"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        echo -e "${RED}Ошибка: bc не установлен${NC}"
        echo "Установите bc:"
        echo "  Ubuntu/Debian: sudo apt install bc"
        echo "  macOS: brew install bc"
        exit 1
    fi
}

# Функция для конвертации в MP3
convert_to_mp3() {
    local input_file="$1"
    local output_file="${input_file%.*}.mp3"
    
    echo -e "${BLUE}Конвертируем: $input_file -> $output_file${NC}"
    
    ffmpeg -i "$input_file" -acodec libmp3lame -ab 192k -ar 44100 -y "$output_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Успешно: $output_file${NC}"
        # Удаляем исходный файл после успешной конвертации
        rm "$input_file"
        return 0
    else
        echo -e "${RED}✗ Ошибка конвертации: $input_file${NC}"
        return 1
    fi
}

# Функция для обрезки до 2 часов
trim_to_2hours() {
    local input_file="$1"
    local temp_file="${input_file%.mp3}_temp.mp3"
    
    echo -e "${YELLOW}Проверяем длительность: $input_file${NC}"
    
    # Получаем длительность файла
    duration=$(ffprobe -i "$input_file" -show_entries format=duration -v quiet -of csv="p=0" 2>/dev/null || echo "0")
    
    # Проверяем, что duration является числом
    if ! echo "$duration" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
        echo -e "${RED}✗ Не удалось получить длительность: $input_file${NC}"
        return 1
    fi
    
    # Обрезаем только если файл длиннее 2 часов + 1 секунда (7201 секунда)
    if (( $(echo "$duration > 7201" | bc -l 2>/dev/null) )); then
        echo -e "${BLUE}Обрезаем до 2 часов: $input_file (было: ${duration}s)${NC}"
        
        # Обрезаем файл
        ffmpeg -i "$input_file" -t 7200 -acodec libmp3lame -ab 192k -ar 44100 -y "$temp_file" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            # Заменяем оригинальный файл обрезанным
            mv "$temp_file" "$input_file"
            echo -e "${GREEN}✓ Обрезан: $input_file${NC}"
        else
            echo -e "${RED}✗ Ошибка обрезки: $input_file${NC}"
            [ -f "$temp_file" ] && rm "$temp_file"
        fi
    else
        echo -e "${GREEN}✓ Пропущен (короче 2 часов + 1 сек): $input_file (${duration}s)${NC}"
    fi
}

# Основная функция
main() {
    echo -e "${GREEN}=== Начало обработки аудиофайлов ===${NC}"
    
    check_dependencies
    
    # Этап 1: Конвертация WAV в MP3
    echo -e "${YELLOW}--- Этап 1: Конвертация WAV в MP3 ---${NC}"
    
    echo "Поиск WAV файлов..."
    find . -name "*.wav" -type f | while read -r file; do
        if [ -f "$file" ]; then
            convert_to_mp3 "$file"
        fi
    done
    
    # Этап 2: Обрезка MP3 файлов до 2 часов
    echo -e "${YELLOW}--- Этап 2: Обрезка MP3 файлов до 2 часов ---${NC}"
    
    echo "Поиск MP3 файлов..."
    find . -name "*.mp3" -type f | while read -r file; do
        if [ -f "$file" ]; then
            trim_to_2hours "$file"
        fi
    done
    
    echo -e "${GREEN}=== Обработка завершена ===${NC}"
}

# Запуск скрипта
main "$@"
