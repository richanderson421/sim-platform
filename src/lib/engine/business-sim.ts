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
  demandBase: 240,
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

  // Staff modifies machinery output.
  // Each machine has an ideal staffing level; under-staffing reduces efficiency sharply,
  // over-staffing helps a bit but with diminishing returns unless machinery is added.
  const staffPerMachineTarget = 3;
  const idealStaff = nextMachines * staffPerMachineTarget;
  const staffingRatio = nextEmployees / Math.max(1, idealStaff);

  const machineBaseOutput = 95;
  const underStaffMultiplier = Math.max(0.35, Math.min(1, staffingRatio));
  const overStaffBonus = staffingRatio > 1 ? Math.min(0.25, (staffingRatio - 1) * 0.25) : 0;
  const efficiencyMultiplier = staffingRatio <= 1 ? underStaffMultiplier : 1 + overStaffBonus;

  const capacity = Math.round(nextMachines * machineBaseOutput * efficiencyMultiplier);
  const production = capacity;

  const priceDemandFactor = Math.max(0.6, Math.min(1.3, 1.06 - (d.price - 55) * 0.008));
  const marketingDemandFactor = 1 + Math.min(0.28, d.marketing / 24000);
  const brandDemandFactor = 0.88 + previous.brand / 100;

  const expectedDemand = Math.max(25, Math.round(previous.demandBase * seasonality * priceDemandFactor * marketingDemandFactor * brandDemandFactor));

  const availableUnits = previous.inventory + production;
  const unitsSold = Math.min(expectedDemand, availableUnits);
  const stockout = expectedDemand > availableUnits;

  const avgMarketPrice = Math.round(55 + (month % 4) * 2);
  const cogsPerUnit = Math.round(18 + nextEmployees * 0.03 + nextMachines * 0.05);

  const revenue = unitsSold * d.price;
  const cogs = unitsSold * cogsPerUnit;
  const payrollPerStaff = 700;
  const payrollCost = nextEmployees * payrollPerStaff;
  const machineCapex = Math.max(0, d.machinePurchase) * 14000;
  const fixedOverhead = 2200;
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

  const drivers: string[] = [];
  if (d.price > avgMarketPrice) drivers.push(`Your price ($${d.price}) was above market average ($${avgMarketPrice}), which likely reduced unit demand.`);
  else drivers.push(`Your price ($${d.price}) was at/below market average ($${avgMarketPrice}), supporting demand.`);

  if (d.machinePurchase > 0) drivers.push(`Machine purchases increased max throughput but added $${Math.round(machineCapex).toLocaleString()} in capital costs this month.`);
  if (d.staffDelta > 0) drivers.push(`Hiring improved machine utilization (where understaffed) but raised payroll to $${Math.round(payrollCost).toLocaleString()}.`);
  if (d.staffDelta < 0) drivers.push(`Staff reductions lowered payroll but may have reduced machine utilization and output efficiency.`);
  if (d.marketing > 0) drivers.push(`Marketing spend of $${Math.round(d.marketing).toLocaleString()} boosted demand/brand but reduced short-term profit.`);
  if (stockout) drivers.push(`Demand exceeded supply, causing stockouts and lost sales opportunities.`);
  if (!stockout && nextInventory > 220) drivers.push(`High ending inventory (${nextInventory} units) tied up working capital.`);

  const score = nextCash + nextBrand * 120 - Math.max(0, nextInventory - 220) * 4;

  return {
    score,
    summary,
    drivers,
    kpis: {
      expectedDemand,
      unitsSold,
      revenue,
      cogs,
      cogsPerUnit,
      totalCost,
      payrollCost,
      fixedOverhead,
      machineCapex,
      profit,
      cash: nextCash,
      inventory: nextInventory,
      employees: nextEmployees,
      machines: nextMachines,
      brand: nextBrand,
      stockout,
      avgMarketPrice,
      capacity,
      staffingRatio,
      idealStaff,
      efficiencyMultiplier,
    },
    state,
  };
}
