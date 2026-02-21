/** Shape of a skill entry in User.skills (Prisma JSON) */
export interface UserSkillEntry {
  name: string;
  level?: number;
  unlocked?: boolean;
  solvedCount?: number;
}

/** Duel player state stored as JSON in Duel.player1State / player2State */
export interface DuelPlayerStateJson {
  code?: string;
  language?: string;
  testsPassed?: number;
  totalTests?: number;
  progress?: number;
  status?: string;
}
