// Approved proposal data preserved from the v0.12 delivery (v0.10 data pack).
export const stage={
  "proposal": true,
  "version": "0.10",
  "stageId": "yellow_turban_01",
  "board": {
    "width": 8,
    "height": 8,
    "blocked": [],
    "friendlyRows": [
      0,
      1,
      2,
      3
    ]
  },
  "enemyDefs": {
    "melee": {
      "hp": 300,
      "atk": 40,
      "def": 10,
      "mdef": 5,
      "range": 1,
      "attackIntervalTicks": 24,
      "manaMax": 0,
      "skillId": null,
      "moveTicks": 10,
      "damageType": "physical"
    },
    "archer": {
      "hp": 220,
      "atk": 45,
      "def": 5,
      "mdef": 5,
      "range": 4,
      "attackIntervalTicks": 26,
      "manaMax": 0,
      "skillId": null,
      "moveTicks": 10,
      "damageType": "physical"
    },
    "shield": {
      "hp": 550,
      "atk": 30,
      "def": 35,
      "mdef": 10,
      "range": 1,
      "attackIntervalTicks": 28,
      "manaMax": 0,
      "skillId": null,
      "moveTicks": 10,
      "damageType": "physical"
    },
    "mage": {
      "hp": 220,
      "atk": 50,
      "def": 5,
      "mdef": 20,
      "range": 4,
      "attackIntervalTicks": 28,
      "manaMax": 0,
      "skillId": null,
      "moveTicks": 10,
      "damageType": "physical"
    },
    "zhangjue_illusion": {
      "hp": 3600,
      "atk": 110,
      "def": 30,
      "mdef": 30,
      "range": 3,
      "attackIntervalTicks": 28,
      "manaMax": 100,
      "skillId": "boss_thunder",
      "moveTicks": 10,
      "damageType": "physical"
    }
  },
  "rounds": [
    {
      "round": 1,
      "enemies": [
        {
          "id": "r1_0",
          "enemyDefId": "melee",
          "x": 3,
          "y": 5
        },
        {
          "id": "r1_1",
          "enemyDefId": "melee",
          "x": 4,
          "y": 5
        }
      ],
      "victorySilver": 4,
      "equipmentReward": null
    },
    {
      "round": 2,
      "enemies": [
        {
          "id": "r2_0",
          "enemyDefId": "melee",
          "x": 2,
          "y": 5
        },
        {
          "id": "r2_1",
          "enemyDefId": "melee",
          "x": 3,
          "y": 5
        },
        {
          "id": "r2_2",
          "enemyDefId": "melee",
          "x": 4,
          "y": 5
        },
        {
          "id": "r2_3",
          "enemyDefId": "archer",
          "x": 4,
          "y": 7
        }
      ],
      "victorySilver": 5,
      "equipmentReward": "choice_of_sword_armor_bow_rank1"
    },
    {
      "round": 3,
      "enemies": [
        {
          "id": "r3_0",
          "enemyDefId": "shield",
          "x": 3,
          "y": 5
        },
        {
          "id": "r3_1",
          "enemyDefId": "shield",
          "x": 4,
          "y": 5
        },
        {
          "id": "r3_2",
          "enemyDefId": "archer",
          "x": 2,
          "y": 7
        },
        {
          "id": "r3_3",
          "enemyDefId": "archer",
          "x": 5,
          "y": 7
        }
      ],
      "victorySilver": 6,
      "equipmentReward": null
    },
    {
      "round": 4,
      "enemies": [
        {
          "id": "r4_0",
          "enemyDefId": "melee",
          "x": 2,
          "y": 5
        },
        {
          "id": "r4_1",
          "enemyDefId": "melee",
          "x": 3,
          "y": 5
        },
        {
          "id": "r4_2",
          "enemyDefId": "melee",
          "x": 4,
          "y": 5
        },
        {
          "id": "r4_3",
          "enemyDefId": "mage",
          "x": 3,
          "y": 7
        },
        {
          "id": "r4_4",
          "enemyDefId": "archer",
          "x": 1,
          "y": 7
        },
        {
          "id": "r4_5",
          "enemyDefId": "archer",
          "x": 6,
          "y": 7
        }
      ],
      "victorySilver": 7,
      "equipmentReward": "choice_of_sword_armor_bow_rank1"
    },
    {
      "round": 5,
      "enemies": [
        {
          "id": "r5_0",
          "enemyDefId": "zhangjue_illusion",
          "x": 3,
          "y": 7
        },
        {
          "id": "r5_1",
          "enemyDefId": "shield",
          "x": 2,
          "y": 5
        },
        {
          "id": "r5_2",
          "enemyDefId": "shield",
          "x": 4,
          "y": 5
        },
        {
          "id": "r5_3",
          "enemyDefId": "archer",
          "x": 1,
          "y": 7
        },
        {
          "id": "r5_4",
          "enemyDefId": "archer",
          "x": 6,
          "y": 7
        }
      ],
      "victorySilver": 8,
      "equipmentReward": null
    }
  ],
  "bossSkill": {
    "id": "boss_thunder",
    "telegraphTicks": 20,
    "radius": 1.5,
    "radiusMetric": "euclidean",
    "coefficient": 1.8,
    "damageType": "magic",
    "targetRule": "highest_density_then_lowest_id"
  },
  "reward": {
    "firstClearGold": 100,
    "firstClearDiamonds": 30,
    "repeatGold": 20,
    "dailyRepeatLimit": 10
  },
  "chapterId": "camp_yellow",
  "mapId": "map_yellow_01",
  "rulesetVersion": "0.10",
  "attemptCost": 0,
  "unlockStageIds": [],
  "winCondition": "all_enemies_dead",
  "rewardTableId": "reward_pve_basic",
  "replayRewardLimit": 10,
  "tutorialSequenceId": null
};
