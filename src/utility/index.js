export const statusLevels = {
  veryLow: {
    color: "#2563eb",
    background: "#dbeafe",
    description: "Very low caffeine — no noticeable effect on alertness.",
    maxLevel: 50,
  },
  low: {
    color: "#047857",
    background: "#d1fae5",
    description: "Mild caffeine levels — light alertness boost with minimal side effects.",
    maxLevel: 150,
  },
  moderate: {
    color: "#b45309",
    background: "#fef3c7",
    description: "Moderate caffeine intake — noticeable focus improvement and possible restlessness.",
    maxLevel: 300,
  },
  high: {
    color: "#e11d48",
    background: "#ffe4e6",
    description: "High caffeine levels — may cause jitteriness, rapid heartbeat, or trouble concentrating.",
    maxLevel: 9999,
  },
};


const now = Date.now();

function randomPastTimestamp(daysBackMax = 3) {
  return now - Math.floor(Math.random() * daysBackMax * 24 * 60 * 60 * 1000);
}

export const coffeeConsumptionHistory = {
  [randomPastTimestamp()]: { name: "Masala Chai (240 ml)", cost: 15.0 },
  [randomPastTimestamp()]: { name: "Filter Coffee (240 ml)", cost: 25.0 },
  [randomPastTimestamp()]: { name: "Instant Coffee (1 tsp)", cost: 10.0 },
  [randomPastTimestamp()]: { name: "Black Tea (240 ml)", cost: 12.0 },
  [randomPastTimestamp()]: { name: "Green Tea (240 ml)", cost: 20.0 },
  [randomPastTimestamp()]: { name: "Red Bull (250 ml)", cost: 99.0 },
  [randomPastTimestamp()]: { name: "Monster Energy (500 ml)", cost: 130.0 },
  [randomPastTimestamp()]: { name: "Matcha Tea (240 ml)", cost: 85.0 },
  [randomPastTimestamp()]: { name: "Sting Energy Drink (250 ml)", cost: 50.0 },
  [randomPastTimestamp()]: { name: "Filter Coffee (240 ml)", cost: 25.0 },
  [randomPastTimestamp()]: { name: "Masala Chai (240 ml)", cost: 15.0 },
  [randomPastTimestamp()]: { name: "Green Tea (240 ml)", cost: 20.0 },
  [randomPastTimestamp()]: { name: "Instant Coffee (1 tsp)", cost: 10.0 },
  [randomPastTimestamp()]: { name: "Matcha Tea (240 ml)", cost: 85.0 },
  [randomPastTimestamp()]: { name: "Black Tea (240 ml)", cost: 12.0 },
  [randomPastTimestamp()]: { name: "Red Bull (250 ml)", cost: 99.0 },
  [randomPastTimestamp()]: { name: "Filter Coffee (240 ml)", cost: 25.0 },
  [randomPastTimestamp()]: { name: "Monster Energy (500 ml)", cost: 130.0 },
  [randomPastTimestamp()]: { name: "Sting Energy Drink (250 ml)", cost: 50.0 },
  [randomPastTimestamp()]: { name: "Masala Chai (240 ml)", cost: 15.0 },
};

export const coffeeOptions = [
  { name: "Masala Chai (240 ml)", caffeine: 40, cost: 15 },
  { name: "Filter Coffee (240 ml)", caffeine: 60, cost: 25 },
  { name: "Instant Coffee (1 tsp)", caffeine: 65, cost: 10 },
  { name: "Black Tea (240 ml)", caffeine: 45, cost: 12 },
  { name: "Green Tea (240 ml)", caffeine: 30, cost: 20 },
  { name: "Red Bull (250 ml)", caffeine: 75, cost: 99 },
  { name: "Monster Energy (500 ml)", caffeine: 160, cost: 130 },
  { name: "Matcha Tea (240 ml)", caffeine: 70, cost: 85 },
  { name: "Sting Energy Drink (250 ml)", caffeine: 50, cost: 50 },
];

const halfLifeHours = 5;



export function calculateCurrentCaffeineLevel(history) {
  const now = Date.now();
  const halfLifeMs = halfLifeHours * 60 * 60 * 1000;
  const maxAgeMs = 48 * 60 * 60 * 1000;

  let total = 0;

  for (const entry of history) {
    const consumedTime = typeof entry.consumed_at === "number"
      ? entry.consumed_at
      : new Date(entry.consumed_at).getTime();

    const age = now - consumedTime;

    if (age <= maxAgeMs) {
      // Use caffeine_mg from the entry if available, otherwise fallback
      const caffeineAmount = entry.caffeine_mg ?? getCaffeineAmount(entry.name) ?? 0;
      const decayed = caffeineAmount * Math.pow(0.5, age / halfLifeMs);
      total += decayed;
    }
  }
  return total.toFixed(2);
}




export function getCaffeineAmount(coffeeName) {
  const coffee = coffeeOptions.find((c) => c.name === coffeeName);
  return coffee ? coffee.caffeine : 0;
}

export function getTopThreeCoffees(historyData) {
  const coffeeCount = {};

  for (const entry of Object.values(historyData)) {
    const coffeeName = entry.name;
    coffeeCount[coffeeName] = (coffeeCount[coffeeName] || 0) + 1;
  }

  const sortedCoffees = Object.entries(coffeeCount).sort((a, b) => b[1] - a[1]);
  const totalCoffees = Object.values(coffeeCount).reduce((sum, count) => sum + count, 0);

  return sortedCoffees.slice(0, 3).map(([coffeeName, count]) => ({
    coffeeName,
    count,
    percentage: ((count / totalCoffees) * 100).toFixed(2) + "%",
  }));
}

export function timeSinceConsumption(timestampMs) {
  const now = Date.now(); // current time in ms
  const diff = now - timestampMs; // already in ms

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(seconds / 86400);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'just now';
}



export function calculateCoffeeStats(history) {
  const dailyStats = {};
  let totalCoffees = 0;
  let totalCost = 0;
  let totalCaffeine = 0;
  let totalDaysWithCoffee = 0;

  for (const entry of history) {
    const timestamp = typeof entry.consumed_at === 'number'
      ? entry.consumed_at
      : new Date(entry.consumed_at).getTime();

    const date = new Date(timestamp).toISOString().split("T")[0];
    const caffeine = entry.caffeine_mg ?? getCaffeineAmount(entry.name) ?? 0;
    const cost = parseFloat(entry.cost) || 0;

    if (!dailyStats[date]) {
      dailyStats[date] = { caffeine: 0, cost: 0, count: 0 };
    }

    dailyStats[date].caffeine += caffeine;
    dailyStats[date].cost += cost;
    dailyStats[date].count += 1;

    totalCoffees += 1;
    totalCost += cost;
  }

  const days = Object.keys(dailyStats).length;

  for (const stats of Object.values(dailyStats)) {
    if (stats.caffeine > 0) {
      totalCaffeine += stats.caffeine;
      totalDaysWithCoffee += 1;
    }
  }

  const averageDailyCaffeine =
    totalDaysWithCoffee > 0
      ? (totalCaffeine / totalDaysWithCoffee).toFixed(2)
      : "0.00";

  const averageDailyCost =
    totalDaysWithCoffee > 0
      ? (totalCost / totalDaysWithCoffee).toFixed(2)
      : "0.00";

  return {
    daily_caffeine: averageDailyCaffeine,
    daily_cost: averageDailyCost,
    average_coffees: days > 0 ? (totalCoffees / days).toFixed(2) : "0.00",
    total_cost: totalCost.toFixed(2),
  };
}


export function getTopThreeCoffeesWithTimestamps(history) {
  const countMap = {};
  const timestampMap = {};

  for (const entry of history) {
    const name = entry.name;
    countMap[name] = (countMap[name] || 0) + 1;
    timestampMap[name] = timestampMap[name] || [];
    timestampMap[name].push(entry.consumed_at);  // Use actual consumed_at timestamp here
  }

  let sorted = Object.entries(countMap);

  // Selection sort (descending)
  for (let i = 0; i < sorted.length - 1; i++) {
    let maxIdx = i;
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j][1] > sorted[maxIdx][1]) {
        maxIdx = j;
      }
    }
    if (maxIdx !== i) {
      [sorted[i], sorted[maxIdx]] = [sorted[maxIdx], sorted[i]];
    }
  }

  sorted = sorted.slice(0, 3);
  const total = Object.values(countMap).reduce((sum, val) => sum + val, 0);

  return sorted.map(([name, count]) => ({
    coffeeName: name,
    count,
    percentage: ((count / total) * 100).toFixed(2) + "%",
    timestamps: (timestampMap[name] || []).sort((a, b) => b - a).slice(0,3),
  }));
}


