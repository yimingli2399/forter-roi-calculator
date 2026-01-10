// ROI Calculation Logic

export interface ScenarioInputs {
  name: string
  preAuthDecline: number
  postAuthAuto: number
  postAuthManual: number
  '3dsUsage': number
  '3dsError': number
  authRate: number
  chargebackRate: number
  fixedFee: number
  percentageFee: number
  perTransactionCost: number
  manualReviewCost: number
  applyToNon3DS: boolean
}

export interface FunnelData {
  start: number
  preAuthDecline: number
  afterPreAuth: number
  threeDsDecline: number
  after3DS: number
  authDecline: number
  afterAuth: number
  postAuthDecline: number
  completed: number
  declined: number
}

export interface RevenueData {
  raw: number
  conservative: number
}

export interface CostData {
  chargeback: number
  threeDS: number
  manualReview: number
  tool: number
  toolJudgmentCost?: number // 判定費用: Fixed Fee + Per Transaction Cost
  toolCompensationCost?: number // 補填費用: Percentage Fee Component
  total: number
}

export interface ScenarioResults {
  name: string
  funnel: FunnelData
  revenue: RevenueData
  costs: CostData
  scenarioInputs: ScenarioInputs
}

export interface CalculationInputs {
  annualAttempts: number
  atvSuccess: number
  atvDecline: number
  threeDSCost: number
  retryRate: number
  s1: ScenarioInputs
  s2: ScenarioInputs
  hiddenFields?: string[] // Array of field IDs that are hidden
  hiddenCommonFields?: string[] // Array of common field IDs that are hidden
  comments?: { [fieldId: string]: string } // Comments for each field
}

export function calculateScenario(
  annualAttempts: number,
  atvSuccess: number,
  atvDecline: number,
  scenarioInputs: ScenarioInputs
): ScenarioResults {
  const funnel: FunnelData = {
    start: annualAttempts,
    preAuthDecline: annualAttempts * (scenarioInputs.preAuthDecline / 100),
    afterPreAuth: 0,
    threeDsDecline: 0,
    after3DS: 0,
    authDecline: 0,
    afterAuth: 0,
    postAuthDecline: annualAttempts * ((scenarioInputs.postAuthAuto / 100) + (scenarioInputs.postAuthManual / 100)),
    completed: 0,
    declined: 0,
  }

  funnel.afterPreAuth = funnel.start - funnel.preAuthDecline
  funnel.threeDsDecline = funnel.afterPreAuth * (scenarioInputs['3dsUsage'] / 100) * (scenarioInputs['3dsError'] / 100)
  funnel.after3DS = funnel.afterPreAuth - funnel.threeDsDecline
  funnel.authDecline = funnel.after3DS * (1 - scenarioInputs.authRate / 100)
  funnel.afterAuth = funnel.after3DS - funnel.authDecline
  funnel.completed = funnel.afterAuth - funnel.postAuthDecline
  funnel.declined = funnel.start - funnel.completed

  const revenue: RevenueData = {
    raw: funnel.completed * atvSuccess,
    conservative: 0, // Will be calculated later
  }

  return {
    name: scenarioInputs.name,
    funnel,
    revenue,
    costs: {
      chargeback: 0,
      threeDS: 0,
      manualReview: 0,
      tool: 0,
      toolJudgmentCost: 0,
      toolCompensationCost: 0,
      total: 0,
    },
    scenarioInputs,
  }
}

export function calculateCosts(
  results: ScenarioResults,
  annualAttempts: number,
  threeDSCost: number,
  atvDecline: number
): void {
  results.costs.chargeback = results.revenue.conservative * (results.scenarioInputs.chargebackRate / 100)
  results.costs.threeDS = annualAttempts * (results.scenarioInputs['3dsUsage'] / 100) * threeDSCost
  results.costs.manualReview = results.scenarioInputs.manualReviewCost

  let percentageFeeComponent: number
  if (results.scenarioInputs.applyToNon3DS) {
    percentageFeeComponent =
      results.revenue.conservative *
      (results.scenarioInputs.percentageFee / 100) *
      (1 - results.scenarioInputs['3dsUsage'] / 100)
  } else {
    percentageFeeComponent = results.revenue.conservative * (results.scenarioInputs.percentageFee / 100)
  }

  // 判定費用: Fixed Fee + Per Transaction Cost
  results.costs.toolJudgmentCost =
    results.scenarioInputs.fixedFee +
    annualAttempts * results.scenarioInputs.perTransactionCost

  // 補填費用: Percentage Fee Component
  results.costs.toolCompensationCost = percentageFeeComponent

  results.costs.tool =
    results.costs.toolJudgmentCost +
    results.costs.toolCompensationCost

  results.costs.total =
    results.costs.chargeback + results.costs.threeDS + results.costs.manualReview + results.costs.tool
}

export function calculateROI(inputs: CalculationInputs): {
  base: ScenarioResults
  comp: ScenarioResults
} {
  // Calculate base scenario
  const baseResults = calculateScenario(inputs.annualAttempts, inputs.atvSuccess, inputs.atvDecline, inputs.s1)

  // Calculate comparative scenario
  const compResults = calculateScenario(inputs.annualAttempts, inputs.atvSuccess, inputs.atvDecline, inputs.s2)

  // Raw revenue for comparative scenario
  const completedDiff = compResults.funnel.completed - baseResults.funnel.completed
  compResults.revenue.raw = baseResults.revenue.raw + completedDiff * inputs.atvDecline

  // Conservative revenue for both scenarios
  baseResults.revenue.conservative = baseResults.revenue.raw
  compResults.revenue.conservative =
    baseResults.revenue.raw + completedDiff * inputs.atvDecline * (1 - inputs.retryRate / 100)

  // Calculate costs
  calculateCosts(baseResults, inputs.annualAttempts, inputs.threeDSCost, inputs.atvDecline)
  calculateCosts(compResults, inputs.annualAttempts, inputs.threeDSCost, inputs.atvDecline)

  return {
    base: baseResults,
    comp: compResults,
  }
}

