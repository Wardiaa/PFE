import type { LucideIcon } from 'lucide-react';

export type IconContent = { type: 'icon'; iconIndex: number; };
export type AbstractContent = { type: 'abstract'; id: number; };
export type TileContent = IconContent | AbstractContent;

export interface InteractionIcon {
  icon: LucideIcon;
  label: string;
}

export interface TileProps {
  index: number;
  isDark: boolean;
}