import { Tile } from "../Interfaces";

export type ACTIONTYPE = 
| { type: "change"; payload: Tile[] }
| { type: "tokenGrant" };

export interface ScoresState {
  score: number;
  bestScore: number;
  newPoints: number;
  tiles: Tile[];
  tokenGranted: boolean;
}