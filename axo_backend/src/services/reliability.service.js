function calculateReliability(metrics) {

  const {
    onTimeRate,
    milestoneDiscipline,
    integrityRate,
    disputeRate,
    responseRate,
    dataAccuracyRate
  } = metrics;

  const score =
    (onTimeRate * 40) +
    (milestoneDiscipline * 20) +
    (integrityRate * 10) +
    (disputeRate * 10) +
    (responseRate * 10) +
    (dataAccuracyRate * 10);

  return Math.round(score);
}

module.exports = { calculateReliability };

