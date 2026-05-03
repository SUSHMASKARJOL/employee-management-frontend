window.EmployeeService = (() => ({
    getAll: async filters => StorageService.getAll(filters),
    getById: async id => StorageService.getById(id),
    add: async employee => StorageService.add(employee),
    update: async (id, employee) => StorageService.update(id, employee),
    remove: async id => StorageService.remove(id)
}))();
