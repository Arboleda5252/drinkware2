import ProfitabilityAnalysisClient from "./profitability-analysis-client";

interface ProfitabilityAnalysisProps {
  quarter: number;
  year: number;
}

export default function ProfitabilityAnalysis({ quarter, year }: ProfitabilityAnalysisProps) {
  return <ProfitabilityAnalysisClient quarter={quarter} year={year} />;
}
