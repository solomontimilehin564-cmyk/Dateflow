// Zero-cost date ideas for each vibe. Every share is 0, so every cost is 0.
const FREE_PLANS = {
  Romantic: [
    { type: "Warm-up", title: "Sunset walk", note: "Stroll somewhere pretty and talk about anything.", share: 0 },
    { type: "Picnic", title: "Picnic with snacks from home", note: "Pack what you already have and find a quiet spot.", share: 0 },
    { type: "Activity", title: "People-watching", note: "Make up stories about the people passing by.", share: 0 },
    { type: "Finale", title: "Watch the city lights", note: "Find a high spot and end the night with the view.", share: 0 },
  ],
  Adventurous: [
    { type: "Warm-up", title: "Explore a park trail", note: "Pick the path neither of you has taken.", share: 0 },
    { type: "Activity", title: "Photo scavenger hunt", note: "Find 5 things: something red, something old, something funny, a doorway, a view.", share: 0 },
    { type: "Activity", title: "Find a hidden corner", note: "Wander until you discover a spot that feels like yours.", share: 0 },
    { type: "Finale", title: "Chase the sunset", note: "Reach the highest point you can before the sun goes down.", share: 0 },
  ],
  Chill: [
    { type: "Warm-up", title: "Slow park stroll", note: "No schedule, no phones for the first 20 minutes.", share: 0 },
    { type: "Picnic", title: "Blanket and snacks", note: "Bring a blanket and whatever is in your kitchen.", share: 0 },
    { type: "Activity", title: "Twenty questions", note: "Ask each other the questions you never get around to asking.", share: 0 },
    { type: "Finale", title: "Watch the sky change", note: "Sit together and watch the light fade.", share: 0 },
  ],
  Fancy: [
    { type: "Warm-up", title: "Dress-up stroll", note: "Wear your best outfits and walk an elegant part of town.", share: 0 },
    { type: "Activity", title: "Window-shopping", note: "Pick the one thing you'd each buy if money didn't matter.", share: 0 },
    { type: "Activity", title: "Landmark photoshoot", note: "Take your best photos at a famous spot.", share: 0 },
    { type: "Finale", title: "City lights walk", note: "End with a slow walk and a view.", share: 0 },
  ],
  Spontaneous: [
    { type: "Warm-up", title: "Pick a direction", note: "Choose a street and walk until something looks fun.", share: 0 },
    { type: "Activity", title: "Coin-flip route", note: "Flip a coin at every corner: heads left, tails right.", share: 0 },
    { type: "Activity", title: "Photo challenge", note: "Take 5 photos that match a random theme.", share: 0 },
    { type: "Finale", title: "Say yes to the last idea", note: "Whoever suggests something last, you do it.", share: 0 },
  ],
};

module.exports = { FREE_PLANS };