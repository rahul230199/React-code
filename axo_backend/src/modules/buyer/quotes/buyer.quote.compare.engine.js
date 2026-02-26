exports.calculateScores = (quotes) => {

  if (!quotes.length) return [];

  const maxPrice = Math.max(...quotes.map(q => Number(q.total_price)));
  const minPrice = Math.min(...quotes.map(q => Number(q.total_price)));

  const maxDelivery = Math.max(...quotes.map(q => Number(q.delivery_days)));
  const minDelivery = Math.min(...quotes.map(q => Number(q.delivery_days)));

  return quotes.map(q => {

    const priceScore =
      maxPrice === minPrice
        ? 100
        : 100 - ((q.total_price - minPrice) / (maxPrice - minPrice)) * 100;

    const deliveryScore =
      maxDelivery === minDelivery
        ? 100
        : 100 - ((q.delivery_days - minDelivery) / (maxDelivery - minDelivery)) * 100;

    const reliabilityScore = Number(q.reliability_score || 0);

    const weightedScore =
      (priceScore * 0.5) +
      (reliabilityScore * 0.25) +
      (deliveryScore * 0.25);

    return {
      ...q,
      weighted_score: Number(weightedScore.toFixed(2))
    };
  })
  .sort((a, b) => b.weighted_score - a.weighted_score)
  .map((q, index) => ({
    ...q,
    rank: index + 1
  }));
};