// i18n.ts

export type Lang = "en";

type MessageKey =
  | "introHubTitle"
  | "introHubBody"
  | "introWatergunTitle"
  | "introWatergunBody"
  | "introMilkTitle"
  | "introMilkBody"
  | "introDuckTitle"
  | "introDuckBody"
  | "introButton";

const messages: Record<Lang, Record<MessageKey, string>> = {
  en: {
    introHubTitle: "Welcome to SlugFest!",
    introHubBody:
      "Welcome to the SlugFest carnival! Wander the midway, try out each game, and see how many plush prizes you can win.",
    introWatergunTitle: "Watergun Gallery",
    introWatergunBody:
      "Aim your water stream at the targets and keep it steady to score points. Fill the gauges before time runs out to win!",
    introMilkTitle: "Milk Toss",
    introMilkBody:
      "Hold to charge your throw, then release to toss the ball at the milk bottles. Knock every bottle off the stand within 4 throws to win a fox plush!",
    introDuckTitle: "Duck Pond",
    introDuckBody:
      "Tap a duck floating in the pond to pick it up and reveal your prize. You get up to 3 picks—find the big-prize duck to win a duck plush!",
    introButton: "Let’s play!",
  },
};

let currentLang: Lang = "en";

export function setLang(lang: Lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = "ltr"; // we'll change this when we add Arabic
}

export function t(key: MessageKey): string {
  return messages[currentLang][key];
}
