export const GAME_WIDTH = 900;
export const GAME_HEIGHT = 430;
export const GROUND_HEIGHT = 65;

export const PLAYER_X = 90;
export const PLAYER_WIDTH = 44;
export const PLAYER_HEIGHT = 82;
export const PLAYER_DUCK_HEIGHT = 42;

export const GRAVITY = 2100;
export const JUMP_FORCE = 680;

export const BASE_SPEED = 330;
export const MAX_SPEED = 650;

export const MAX_REVIVES = 3;
export const MILESTONE_SCORE = 250;

export const REVIVE_SHIELD_TIME = 1.5;
export const MILESTONE_SHIELD_TIME = 5;

export const WRONG_ANSWER_SPEED_PENALTY = 45;


/* =========================
   跑酷難度設定

   level 1：0 - 249
   level 2：250 - 499
   level 3：500 - 749
   level 4：750 - 999
   level 5：1000+
========================= */

export const RUNNER_DIFFICULTY = {

    1: {
        comboChance: 0,
        tripleChance: 0,
        minGap: 1.15,
        randomGap: 0.55
    },

    2: {
        comboChance: 0.25,
        tripleChance: 0,
        minGap: 1.05,
        randomGap: 0.5
    },

    3: {
        comboChance: 0.4,
        tripleChance: 0,
        minGap: 0.95,
        randomGap: 0.45
    },

    4: {
        comboChance: 0.55,
        tripleChance: 0,
        minGap: 0.85,
        randomGap: 0.4
    },

    5: {
        comboChance: 0.65,
        tripleChance: 0.25,
        minGap: 0.8,
        randomGap: 0.35
    }

};