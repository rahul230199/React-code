const queries = require("./buyer.payment.queries");

exports.getLedger = async (orgId, poId) => {

  const poResult = await queries.getPoValue(orgId, poId);

  if (!poResult.rowCount) {
    throw new Error("Purchase order not found.");
  }

  const poValue = Number(poResult.rows[0].value);

  const paymentResult = await queries.getPaymentsForPo(poId);

  const payments = paymentResult.rows.map(p => ({
    payment_id: p.payment_id,
    amount: Number(p.amount),
    status: p.status,
    paid_at: p.paid_at
  }));

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    po_id: poId,
    po_value: poValue,
    total_paid: totalPaid,
    outstanding: poValue - totalPaid,
    payments
  };
};