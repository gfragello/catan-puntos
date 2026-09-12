export const PLAYER_COLORS = {
  rojo: '#d94841',
  azul: '#3276c3',
  verde: '#2d9461',
  amarillo: '#e2b742',
  marron: '#8b5b3e',
  hueso: '#e8dfcb',
} as const;

export type PlayerColor = keyof typeof PLAYER_COLORS;
export type ScoreField = 'settlements' | 'cities' | 'roads' | 'armies' | 'additionalPoints';

export type PlayerScore = {
  id: number;
  name: string;
  color: PlayerColor;
  settlements: number;
  cities: number;
  roads: number;
  armies: number;
  additionalPoints: number;
  hasLongestRoad: boolean;
  hasLargestArmy: boolean;
  total: number;
};

export type GameState = {
  id: number;
  title: string;
  updatedAt: number;
  players: PlayerScore[];
};
