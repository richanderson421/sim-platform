export type BusinessState = {
  cash: number;
  inventory: number;
  employees: number;
  machines: number;
  debt: number;
  brand: number;
  demandBase: number;
};

export const initialBusinessState: BusinessState = {
  cash: 50000,
  inventory: 120,
  employees: 10,
  machines: 4,
  debt: 20000,
  brand: 50,
  demandBase: 140,
};

export type BusinessDecision = {
  price: number;
  staffDelta: number;
  machinePurchase: number;
  marketing: number;
};

export function simulateBusinessTurn(month: number, previous: BusinessState, d: BusinessDecision) {
  const seasonality = [0.94, 0.96, 1.0, 1.02, 1.05, 1.07, 1.06, 1.03, 1.0, 0.98, 1.01, 1.08][month - 1] ?? 1;

  const nextEmployees = Math.max(2, previous.employees + d.staffDelta);
  const nextMachines = Math.max(1, previous.machines + d.machinePurchase);

  // Simple production scaling curve: each employee contributes baseline, each machine adds throughput multiplier.
  const capacity = Math.round(nextEmployees * 14 + nextMachines * 35);
  const production = capacity;

  const priceDemandFactor = Math.max(0.6, Math.min(1.3, 1.04 - (d.price - 35) * 0.009));
  const marketingDemandFactor = 1 + Math.min(0.28, d.marketing / 24000);
  const brandDemandFactor = 0.88 + previous.brand / 100;

  const expectedDemand = Math.max(25, Math.round(previous.demandBase * seasonality * priceDemandFactor * marketingDemandFactor * brandDemandFactor));

  const availableUnits = previous.inventory + production;
  const unitsSold = Math.min(expectedDemand, availableUnits);
  const stockout = expectedDemand > availableUnits;

  const avgMarketPrice = Math.round(34 + (month % 4) * 1.5);
  const cogsPerUnit = Math.round(11 + nextEmployees * 0.05 + nextMachines * 0.08);

  const revenue = unitsSold * d.price;
  const cogs = unitsSold * cogsPerUnit;
  const payrollCost = nextEmployees * 2800;
  const machineCapex = Math.max(0, d.machinePurchase) * 14000;
  const fixedOverhead = 6500;
  const totalCost = cogs + payrollCost + d.marketing + machineCapex + fixedOverhead;

  const profit = revenue - totalCost;
  const nextCash = previous.cash + profit;
  const nextInventory = Math.max(0, availableUnits - unitsSold);

  const brandDelta = d.marketing / 6000 - (stockout ? 2.5 : 0) + (d.price <= avgMarketPrice ? 0.4 : -0.2);
  const nextBrand = Math.max(0, Math.min(100, previous.brand + brandDelta));

  const state: BusinessState = {
    cash: nextCash,
    inventory: nextInventory,
    employees: nextEmployees,
    machines: nextMachines,
    debt: previous.debt,
    brand: nextBrand,
    demandBase: previous.demandBase,
  };

  const summary = `Month ${month}: You priced at $${d.price}, ran ${nextEmployees} staff and ${nextMachines} machines, sold ${unitsSold}/${expectedDemand} units. Revenue $${Math.round(revenue)}, profit $${Math.round(profit)}, ending cash $${Math.round(nextCash)}.`;

  const score = nextCash + nextBrand * 120 - Math.max(0, nextInventory - 220) * 4;

  return {
    score,
    summary,
    kpis: {
      expectedDemand,
      unitsSold,
      revenue,
      cogs,
      cogsPerUnit,
      totalCost,
      profit,
      cash: nextCash,
      inventory: nextInventory,
      employees: nextEmployees,
      machines: nextMachines,
      brand: nextBrand,
      stockout,
      avgMarketPrice,
      capacity,
    },
    state,
  };
}
