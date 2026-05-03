window.App = (() => {
    const state = {
        search: "",
        department: "",
        status: "",
        sortBy: "name",
        sortDir: "asc",
        page: 1,
        pageSize: AppConfig.PAGE_SIZE,
        deleteId: null
    };

    let searchTimer = null;

    function employeePayloadFromForm() {
        return {
            firstName: $("#firstName").val().trim(),
            lastName: $("#lastName").val().trim(),
            email: $("#email").val().trim(),
            phone: $("#phone").val().trim(),
            department: $("#department").val(),
            designation: $("#designation").val().trim(),
            salary: Number($("#salary").val()),
            joinDate: $("#joinDate").val(),
            status: $("#status").val()
        };
    }

    async function refreshDashboard() {
        const summary = await DashboardService.getSummary();
        UiService.renderDashboard(summary);
    }

    async function refreshEmployees() {
        const pagedResult = await EmployeeService.getAll(state);
        UiService.renderEmployeeTable(pagedResult, {
            view: openViewModal,
            edit: openEditModal,
            delete: promptDelete,
            pageChange: goToPage
        });
    }

    function switchWorkspacePage(page) {
        UiService.showPage(page);
    }

    async function loadApp() {
        UiService.showApp();
        UiService.applyRoleUI();
        switchWorkspacePage("dashboard");
        await Promise.all([refreshDashboard(), refreshEmployees()]);
    }

    function goToPage(page) {
        state.page = Math.max(page, 1);
        refreshEmployees().catch(showGlobalError);
    }

    async function openViewModal(id) {
        const employee = await EmployeeService.getById(id);
        UiService.showEmployeeDetails(employee);
    }

    async function openEditModal(id) {
        if (!AuthService.isAdmin()) return;
        const employee = await EmployeeService.getById(id);
        UiService.fillEmployeeForm(employee);
        UiService.showEmployeeEditor("Edit Employee");
    }

    function openCreateModal() {
        UiService.fillEmployeeForm(null);
        UiService.showEmployeeEditor("Add Employee");
    }

    function promptDelete(id, name) {
        if (!AuthService.isAdmin()) return;
        state.deleteId = id;
        UiService.showDeletePrompt(name);
    }

    async function submitLogin(event) {
        event.preventDefault();
        $("#loginError").text("");
        try {
            await AuthService.login({
                username: $("#loginUsername").val().trim(),
                password: $("#loginPassword").val()
            });
            await loadApp();
        } catch (error) {
            $("#loginError").text(error.body?.message || "Login failed.");
        }
    }

    async function submitRegister(event) {
        event.preventDefault();
        $("#registerError").text("");
        try {
            await AuthService.signup({
                username: $("#registerUsername").val().trim(),
                password: $("#registerPassword").val(),
                role: $("#registerRole").val()
            });
            $("#registerError").removeClass("text-danger").addClass("text-success").text("Registration successful. You can log in now.");
            $("#registerForm")[0].reset();
            UiService.showAuthPanel("login");
        } catch (error) {
            $("#registerError").removeClass("text-success").addClass("text-danger").text(error.body?.message || "Registration failed.");
        }
    }

    async function saveEmployee() {
        const payload = employeePayloadFromForm();
        const clientErrors = ValidationService.validateEmployee(payload);
        if (Object.keys(clientErrors).length) {
            UiService.showFieldErrors($("#employeeForm"), clientErrors);
            return;
        }

        try {
            const employeeId = $("#employeeId").val();
            if (employeeId) await EmployeeService.update(employeeId, payload);
            else await EmployeeService.add(payload);

            UiService.hideEmployeeEditor();
            state.page = 1;
            await Promise.all([refreshEmployees(), refreshDashboard()]);
            switchWorkspacePage("employees");
        } catch (error) {
            const serverErrors = ValidationService.mapServerErrors(error);
            if (Object.keys(serverErrors).length) UiService.showFieldErrors($("#employeeForm"), serverErrors);
            else $("#employeeFormError").text(error.body?.message || "Unable to save employee.");
        }
    }

    async function confirmDelete() {
        if (!state.deleteId) return;
        await EmployeeService.remove(state.deleteId);
        state.deleteId = null;
        UiService.hideDeletePrompt();
        state.page = 1;
        await Promise.all([refreshEmployees(), refreshDashboard()]);
    }

    function resetFilters() {
        state.search = "";
        state.department = "";
        state.status = "";
        state.sortBy = "name";
        state.sortDir = "asc";
        state.page = 1;

        $("#searchInput").val("");
        $("#departmentFilter").val("");
        $("#statusFilter").val("");
        $("#sortBy").val("name");
        $("#sortDir").val("asc");

        refreshEmployees().catch(showGlobalError);
    }

    function showGlobalError(error) {
        alert(error.body?.message || error.message || "Something went wrong.");
    }

    function bindEvents() {
        $("#loginForm").on("submit", submitLogin);
        $("#registerForm").on("submit", submitRegister);
        $("#logoutBtn").on("click", () => {
            AuthService.logout();
            UiService.showAuth();
        });
        $("#showLoginBtn, #registerToLoginBtn").on("click", () => UiService.showAuthPanel("login"));
        $("#showRegisterBtn, #loginToRegisterBtn").on("click", () => UiService.showAuthPanel("register"));
        $("#navDashboardBtn").on("click", () => switchWorkspacePage("dashboard"));
        $("#navEmployeesBtn").on("click", () => switchWorkspacePage("employees"));
        $("#addEmployeeBtn").on("click", openCreateModal);
        $("#saveEmployeeBtn").on("click", saveEmployee);
        $("#confirmDeleteBtn").on("click", () => confirmDelete().catch(showGlobalError));
        $("#resetFiltersBtn").on("click", resetFilters);

        $("#searchInput").on("input", function onSearch() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                state.search = $(this).val().trim();
                state.page = 1;
                refreshEmployees().catch(showGlobalError);
            }, 350);
        });

        $("#departmentFilter, #statusFilter, #sortBy, #sortDir").on("change", () => {
            state.department = $("#departmentFilter").val();
            state.status = $("#statusFilter").val();
            state.sortBy = $("#sortBy").val();
            state.sortDir = $("#sortDir").val();
            state.page = 1;
            refreshEmployees().catch(showGlobalError);
        });
    }

    function init() {
        bindEvents();
        UiService.showAuth();
    }

    return { init };
})();

$(document).ready(() => App.init());


