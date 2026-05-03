window.DashboardService = (() => ({
    getSummary: async () => StorageService.getDashboard()
}))();
