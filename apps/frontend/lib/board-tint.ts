const TINTS = [
  ["#ede9fe", "#ddd6fe"],
  ["#cffafe", "#a5f3fc"],
  ["#dcfce7", "#bbf7d0"],
  ["#fef3c7", "#fde68a"],
  ["#ffe4e6", "#fecdd3"],
  ["#e0e7ff", "#c7d2fe"],
] as const;

const TINTS_DARK = [
  ["#2e1f52", "#3f2d6b"],
  ["#123c47", "#17505e"],
  ["#12372a", "#174a37"],
  ["#3d2f10", "#523f14"],
  ["#41202a", "#552a36"],
  ["#1f2352", "#2b3070"],
] as const;

function hash(value: string): number {
  let result = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }

  return Math.abs(result);
}

export function boardTint(boardId: string): { light: string; dark: string } {
  const bucket = hash(boardId) % TINTS.length;
  const [lightFrom, lightTo] = TINTS[bucket]!;
  const [darkFrom, darkTo] = TINTS_DARK[bucket]!;

  return {
    light: `linear-gradient(135deg, ${lightFrom}, ${lightTo})`,
    dark: `linear-gradient(135deg, ${darkFrom}, ${darkTo})`,
  };
}
