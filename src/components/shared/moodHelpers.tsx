import React from "react";
import { MenuItem, SxProps, Theme } from "@mui/material";

export interface MoodOption {
  value: string;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: "excited", emoji: "🎉", label: "Excited" },
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "reflective", emoji: "🤔", label: "Reflective" },
  { value: "inspired", emoji: "💡", label: "Inspired" },
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "adventurous", emoji: "🏔️", label: "Adventurous" },
  { value: "frustrated", emoji: "😤", label: "Frustrated" },
  { value: "angry", emoji: "😠", label: "Angry" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "annoyed", emoji: "😒", label: "Annoyed" },
];

export const getMoodEmoji = (mood: string | undefined): string => {
  if (!mood) return "";
  const moodOption = MOOD_OPTIONS.find((option) => option.value === mood);
  return moodOption ? moodOption.emoji : "";
};

export const renderMoodMenuItems = (includeNone: boolean = true) => {
  const items = [];

  if (includeNone) {
    items.push(
      <MenuItem key="none" value="">
        None
      </MenuItem>
    );
  }

  MOOD_OPTIONS.forEach((mood) => {
    items.push(
      <MenuItem key={mood.value} value={mood.value}>
        {mood.emoji} {mood.label}
      </MenuItem>
    );
  });

  return items;
};

export const renderMoodMenuItemsWithSx = (
  sx: SxProps<Theme>,
  includeNone: boolean = true
) => {
  const items = [];

  if (includeNone) {
    items.push(
      <MenuItem key="none" value="" sx={sx}>
        None
      </MenuItem>
    );
  }

  MOOD_OPTIONS.forEach((mood) => {
    items.push(
      <MenuItem key={mood.value} value={mood.value} sx={sx}>
        {mood.emoji} {mood.label}
      </MenuItem>
    );
  });

  return items;
};
