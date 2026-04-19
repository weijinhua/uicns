export interface ChartSpec {
  /** Versioned shape; extend as the product evolves */
  version: 1;
  chartType: string;
  title?: string;
  data: unknown;
}

export interface SavedChartSummary {
  id: string;
  title: string;
  updatedAt: string;
}
