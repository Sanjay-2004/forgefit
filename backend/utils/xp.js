const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'World', 'Monarch'];

const RANK_XP_THRESHOLDS = {
  E: 0, D: 500, C: 1500, B: 4000, A: 10000, S: 25000,
  SS: 60000, SSS: 150000, National: 350000, World: 750000, Monarch: 1500000,
};

/** Level increases every 150 XP. Level 1 starts at 0 XP. */
function getLevel(totalXP) {
  return Math.floor(totalXP / 150) + 1;
}

function getRank(totalXP) {
  let rank = 'E';
  for (const r of RANK_ORDER) {
    if (totalXP >= RANK_XP_THRESHOLDS[r]) rank = r;
    else break;
  }
  return rank;
}

function getXPForNextLevel(totalXP) {
  const level = getLevel(totalXP);
  return level * 150 - totalXP;
}

module.exports = { getLevel, getRank, getXPForNextLevel, RANK_XP_THRESHOLDS };
