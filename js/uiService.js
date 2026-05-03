window.UiService = (() => {
    function renderDashboard(summary) {
        $("#totalEmployees").text(summary.totalEmployees);
        $("#activeEmployees").text(summary.activeCount);
        $("#inactiveEmployees").text(summary.inactiveCount);
        $("#departmentCount").text(summary.totalDepartments);

        const maxDepartmentCount = Math.max(...summary.departmentBreakdown.map(item => item.count), 1);
        const chartHtml = summary.departmentBreakdown.length
            ? summary.departmentBreakdown.map(item => `
                <div class="chart-row">
                    <div class="chart-meta">
                        <span class="fw-semibold">${item.department}</span>
                        <span class="text-muted small">${item.count} employees</span>
                    </div>
                    <div class="chart-track">
                        <div class="chart-bar" style="width: ${(item.count / maxDepartmentCount) * 100}%"></div>
                    </div>
                </div>`).join("")
            : '<div class="empty-state">No department data available.</div>';

        const breakdownHtml = summary.departmentBreakdown.length
            ? summary.departmentBreakdown.map(item => `
                <div class="breakdown-item">
                    <div>
                        <div class="fw-semibold">${item.department}</div>
                        <div class="text-muted small">${item.percentage}% of workforce</div>
                    </div>
                    <span class="badge bg-primary-subtle text-primary">${item.count}</span>
                </div>`).join("")
            : '<div class="empty-state">No department data available.</div>';

        const recentHtml = summary.recentEmployees.length
            ? summary.recentEmployees.map(employee => `
                <div class="list-group-item px-0">
                    <div class="fw-semibold">${employee.firstName} ${employee.lastName}</div>
                    <div class="text-muted small">${employee.department} | ${employee.designation}</div>
                </div>`).join("")
            : '<div class="empty-state">No recent employees found.</div>';

        $("#departmentChart").html(chartHtml);
        $("#departmentBreakdown").html(breakdownHtml);
        $("#recentEmployees").html(recentHtml);
    }

    function renderEmployeeTable(pagedResult, callbacks) {
        if (!pagedResult.data.length) {
            $("#employeeTableBody").html('<tr><td colspan="8" class="empty-state">No employees found.</td></tr>');
        } else {
            $("#employeeTableBody").html(pagedResult.data.map(employee => `
                <tr>
                    <td>${employee.firstName} ${employee.lastName}</td>
                    <td>${employee.email}</td>
                    <td>${employee.department}</td>
                    <td>${employee.designation}</td>
                    <td><span class="badge ${employee.status === "Active" ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}">${employee.status}</span></td>
                    <td>${Number(employee.salary).toLocaleString("en-IN")}</td>
                    <td>${employee.joinDate.slice(0, 10)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" data-action="view" data-id="${employee.id}">View</button>
                            <button class="btn btn-outline-secondary admin-only" data-action="edit" data-id="${employee.id}">Edit</button>
                            <button class="btn btn-outline-danger admin-only" data-action="delete" data-id="${employee.id}" data-name="${employee.firstName} ${employee.lastName}">Delete</button>
                        </div>
                    </td>
                </tr>`).join(""));
        }

        $("#employeeTableBody button").off("click").on("click", function onClick() {
            const action = $(this).data("action");
            const id = $(this).data("id");
            const name = $(this).data("name");
            callbacks[action]?.(id, name);
        });

        renderPagination(pagedResult, callbacks.pageChange);
        renderRecordCount(pagedResult);
        applyRoleUI();
    }

    function renderPagination(pagedResult, onPageChange) {
        const items = [];
        const addButton = (label, page, disabled = false, active = false) => {
            items.push(`
                <li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}">
                    <button class="page-link" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button>
                </li>`);
        };

        addButton("Prev", pagedResult.page - 1, !pagedResult.hasPrevPage);
        for (let page = 1; page <= Math.max(pagedResult.totalPages, 1); page += 1) {
            addButton(page, page, false, page === pagedResult.page);
        }
        addButton("Next", pagedResult.page + 1, !pagedResult.hasNextPage);

        $("#paginationBar").html(items.join(""));
        $("#paginationBar button").off("click").on("click", function onPageClick() {
            onPageChange(Number($(this).data("page")));
        });
    }

    function renderRecordCount(pagedResult) {
        if (!pagedResult.totalCount) {
            $("#recordCountLabel").text("Showing 0-0 of 0 employees");
            return;
        }

        const start = (pagedResult.page - 1) * pagedResult.pageSize + 1;
        const end = start + pagedResult.data.length - 1;
        $("#recordCountLabel").text(`Showing ${start}-${end} of ${pagedResult.totalCount} employees`);
    }

    function applyRoleUI() {
        const isAdmin = AuthService.isAdmin();
        $("#roleBadge")
            .toggleClass("d-none", !AuthService.isAuthenticated())
            .text(`${AuthService.getRole() || ""}${AuthService.getUsername() ? ` | ${AuthService.getUsername()}` : ""}`);
        $("#viewerNotice").toggleClass("d-none", isAdmin || !AuthService.isAuthenticated());
        $("#addEmployeeBtn").toggleClass("d-none", !isAdmin);
        $(".admin-only").toggleClass("d-none", !isAdmin);
    }

    function showAuthPanel(panel) {
        const isLogin = panel !== "register";
        $("#loginPanel").toggleClass("d-none", !isLogin);
        $("#registerPanel").toggleClass("d-none", isLogin);
        $("#showLoginBtn").toggleClass("active", isLogin);
        $("#showRegisterBtn").toggleClass("active", !isLogin);
        $("#loginError").text("");
        if (isLogin) {
            $("#registerError").removeClass("text-success").addClass("text-danger").text("");
        }
    }

    function showPage(page) {
        const isDashboard = page !== "employees";
        $("#dashboardPage").toggleClass("d-none", !isDashboard);
        $("#employeesPage").toggleClass("d-none", isDashboard);
        $("#navDashboardBtn").toggleClass("active", isDashboard);
        $("#navEmployeesBtn").toggleClass("active", !isDashboard);
    }

    function showAuth() {
        $("#authSection").removeClass("d-none");
        $("#appSection").addClass("d-none");
        $("#logoutBtn").addClass("d-none");
        $("#roleBadge").addClass("d-none");
        showAuthPanel("login");
    }

    function showApp() {
        $("#authSection").addClass("d-none");
        $("#appSection").removeClass("d-none");
        $("#logoutBtn").removeClass("d-none");
        $("#roleBadge").removeClass("d-none");
        showPage("dashboard");
    }

    function fillEmployeeForm(employee) {
        $("#employeeId").val(employee?.id || "");
        $("#firstName").val(employee?.firstName || "");
        $("#lastName").val(employee?.lastName || "");
        $("#email").val(employee?.email || "");
        $("#phone").val(employee?.phone || "");
        $("#department").val(employee?.department || "");
        $("#designation").val(employee?.designation || "");
        $("#salary").val(employee?.salary || "");
        $("#joinDate").val(employee?.joinDate ? employee.joinDate.slice(0, 10) : "");
        $("#status").val(employee?.status || "Active");
        clearFormErrors($("#employeeForm"));
        $("#employeeFormError").text("");
    }

    function showEmployeeDetails(employee) {
        $("#employeeDetailsBody").html(`
            <dl class="row mb-0">
                <dt class="col-5">Name</dt><dd class="col-7">${employee.firstName} ${employee.lastName}</dd>
                <dt class="col-5">Email</dt><dd class="col-7">${employee.email}</dd>
                <dt class="col-5">Phone</dt><dd class="col-7">${employee.phone}</dd>
                <dt class="col-5">Department</dt><dd class="col-7">${employee.department}</dd>
                <dt class="col-5">Designation</dt><dd class="col-7">${employee.designation}</dd>
                <dt class="col-5">Salary</dt><dd class="col-7">${Number(employee.salary).toLocaleString("en-IN")}</dd>
                <dt class="col-5">Join Date</dt><dd class="col-7">${employee.joinDate.slice(0, 10)}</dd>
                <dt class="col-5">Status</dt><dd class="col-7">${employee.status}</dd>
            </dl>`);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("viewEmployeeModal")).show();
    }

    function showDeletePrompt(employeeName) {
        $("#deleteMessage").text(`Delete ${employeeName}? This action cannot be undone.`);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
    }

    function hideDeletePrompt() {
        bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).hide();
    }

    function showEmployeeEditor(title) {
        $("#employeeModalTitle").text(title);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("employeeModal")).show();
    }

    function hideEmployeeEditor() {
        bootstrap.Modal.getOrCreateInstance(document.getElementById("employeeModal")).hide();
    }

    function clearFormErrors($form) {
        $form.find(".is-invalid").removeClass("is-invalid");
        $form.find(".invalid-feedback").text("");
    }

    function showFieldErrors($form, errors) {
        clearFormErrors($form);
        Object.entries(errors).forEach(([field, message]) => {
            const $field = $form.find(`[name='${field}']`);
            $field.addClass("is-invalid");
            $field.siblings(".invalid-feedback").text(message);
        });
    }

    return {
        renderDashboard,
        renderEmployeeTable,
        applyRoleUI,
        showAuthPanel,
        showPage,
        showAuth,
        showApp,
        fillEmployeeForm,
        showEmployeeDetails,
        showDeletePrompt,
        hideDeletePrompt,
        showEmployeeEditor,
        hideEmployeeEditor,
        showFieldErrors,
        clearFormErrors
    };
})();

