export type BusinessState = {
  cash: number;
  inventory: number;
  employees: number;
  debt: number;
  brand: number;
  demandBase: number;
};

export const initialBusinessState: BusinessState = {
  cash: 50000,
  inventory: 120,
  employees: 10,
  debt: 20000,
  brand: 50,
  demandBase: 140,
};

export type BusinessDecision = {
  price: number;
  production: number;
  marketing: number;
  hiring: number;
  rAndD: number;
  borrow: number;
  repay: number;
};

export function simulateBusinessTurn(month: number, previous: BusinessState, d: BusinessDecision) {
  const seasonality = [0.94, 0.96, 1.0, 1.02, 1.05, 1.07, 1.06, 1.03, 1.0, 0.98, 1.01, 1.08][month - 1] ?? 1;

  const priceDemandFactor = Math.max(0.6, Math.min(1.3, 1.05 - (d.price - 30) * 0.01));
  const marketingDemandFactor = 1 + Math.min(0.35, d.marketing / 25000);
  const brandDemandFactor = 0.85 + previous.brand / 100;

  const expectedDemand = Math.max(
    25,
    Math.round(previous.demandBase * seasonality * priceDemandFactor * marketingDemandFactor * brandDemandFactor),
  );

  const availableUnits = previous.inventory + d.production;
  const unitsSold = Math.min(expectedDemand, availableUnits);
  const stockout = expectedDemand > availableUnits;

  const revenue = unitsSold * d.price;
  const productionCost = d.production * 12;
  const payrollCost = (previous.employees + d.hiring) * 2800;
  const fixedOverhead = 7000;
  const interestCost = Math.max(0, previous.debt + d.borrow - d.repay) * 0.01;
  const totalCost = productionCost + payrollCost + d.marketing + d.rAndD + fixedOverhead + interestCost;

  const profit = revenue - totalCost;
  const nextDebt = Math.max(0, previous.debt + d.borrow - d.repay);
  const nextCash = previous.cash + profit + d.borrow - d.repay;
  const nextInventory = Math.max(0, availableUnits - unitsSold);
  const nextEmployees = Math.max(1, previous.employees + d.hiring);

  const brandDelta = (d.marketing / 5000) + (d.rAndD / 7000) - (stockout ? 3 : 0);
  const nextBrand = Math.max(0, Math.min(100, previous.brand + brandDelta));

  const state: BusinessState = {
    cash: nextCash,
    inventory: nextInventory,
    employees: nextEmployees,
    debt: nextDebt,
    brand: nextBrand,
    demandBase: previous.demandBase,
  };

  const summary = `Month ${month}: Sold ${unitsSold}/${expectedDemand} units at $${d.price}. Revenue $${Math.round(
    revenue,
  )}, profit $${Math.round(profit)}, cash now $${Math.round(nextCash)}.`;

  const score = nextCash - nextDebt + nextBrand * 100;

  return {
    score,
    summary,
    kpis: {
      expectedDemand,
      unitsSold,
      revenue,
      totalCost,
      profit,
      cash: nextCash,
      debt: nextDebt,
      inventory: nextInventory,
      employees: nextEmployees,
      brand: nextBrand,
      stockout,
    },
    state,
  };
}
