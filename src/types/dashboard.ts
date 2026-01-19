export interface DashboardMetrics {
  income: number;
  expenses: number;
  nextDeclarationDate: Date;
}

export interface PeriodSelection {
  month: number; // 0-11
  year: number;
}
