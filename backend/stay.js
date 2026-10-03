// At-home date ideas for each vibe. "share" is the fraction of the budget for that stop.
const STAY_PLANS = {
  Romantic: [
    { type: "Cook", title: "Cook a new recipe together", note: "Pick a dish neither of you has made. One chops, one stirs, then swap.", share: 0.55 },
    { type: "Drinks", title: "Candlelit table and mocktails", note: "Set the table properly, light candles and mix a drink for each other.", share: 0.15 },
    { type: "Movie", title: "Movie chosen by a randomizer", note: "Each of you writes 3 titles on paper, fold them, and pull one from a bowl.", share: 0.05 },
    { type: "Dessert", title: "Shared dessert", note: "One dessert, two spoons.", share: 0.2 },
    { type: "Finale", title: "Slow dance in the living room", note: "Pick one song each and dance to both.", share: 0.05 },
  ],
  Adventurous: [
    { type: "Cook", title: "Cook a cuisine from a country you've never visited", note: "Pick a country at random and cook one dish from it.", share: 0.5 },
    { type: "Game", title: "Couple challenge night", note: "Race to build the tallest tower from kitchen items, then play a round of charades.", share: 0.05 },
    { type: "Drinks", title: "Blind taste test", note: "Take turns blindfolding each other and guessing snacks and drinks.", share: 0.25 },
    { type: "Movie", title: "Random movie from a genre you never watch", note: "Spin a pen to choose the genre, then pick a title together.", share: 0.1 },
    { type: "Finale", title: "Build a blanket fort", note: "Sleep or stargaze inside it, no phones allowed.", share: 0.1 },
  ],
  Chill: [
    { type: "Cook", title: "Cozy comfort-food night", note: "Make pizza from scratch or a big pot of something warm.", share: 0.5 },
    { type: "Movie", title: "Movie chosen by a randomizer", note: "Each of you writes 3 titles on paper, fold them, and pull one from a bowl.", share: 0.1 },
    { type: "Game", title: "Board game or card game tournament", note: "Best of three, loser does the dishes.", share: 0.05 },
    { type: "Dessert", title: "Snack board", note: "Put out whatever sweets and snacks you have and graze.", share: 0.3 },
    { type: "Finale", title: "Stargaze from the window or balcony", note: "Turn off the lights and talk about your favorite memories.", share: 0.05 },
  ],
  Fancy: [
    { type: "Drinks", title: "Mocktail or cocktail masterclass", note: "Mix three fancy drinks and give each a name.", share: 0.25 },
    { type: "Cook", title: "Restaurant-style three-course dinner", note: "Starter, main and dessert, plated like a restaurant. Dress up for it.", share: 0.6 },
    { type: "Game", title: "Twenty questions for couples", note: "Ask the questions you never get around to asking.", share: 0.05 },
    { type: "Dessert", title: "Dessert and coffee by candlelight", note: "End with something sweet and a slow conversation.", share: 0.05 },
    { type: "Finale", title: "Dress-up photo session", note: "Take your best photos of each other at home.", share: 0.05 },
  ],
  Spontaneous: [
    { type: "Cook", title: "Mystery ingredient challenge", note: "Each of you picks one ingredient without telling the other, then cook something using both.", share: 0.45 },
    { type: "Game", title: "Wheel of dares", note: "Write 10 silly challenges on paper and draw one at a time.", share: 0.05 },
    { type: "Drinks", title: "Blind taste test", note: "Take turns blindfolding each other and guessing snacks and drinks.", share: 0.25 },
    { type: "Movie", title: "Movie chosen by a randomizer", note: "Each of you writes 3 titles on paper, fold them, and pull one from a bowl.", share: 0.1 },
    { type: "Finale", title: "Late-night snack run to the kitchen", note: "Whatever you both feel like.", share: 0.15 },
  ],
};

module.exports = { STAY_PLANS };