window.ValidationService = (() => {
    const departments = ["Engineering", "Marketing", "HR", "Finance", "Operations"];
    const statuses = ["Active", "Inactive"];

    function validateEmployee(payload) {
        const errors = {};

        if (!payload.firstName?.trim()) errors.firstName = "First name is required.";
        if (!payload.lastName?.trim()) errors.lastName = "Last name is required.";
        if (!payload.email?.trim()) errors.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.email = "Enter a valid email address.";

        if (!payload.phone?.trim()) errors.phone = "Phone is required.";
        else if (!/^\d{10}$/.test(payload.phone)) errors.phone = "Phone must be exactly 10 digits.";

        if (!departments.includes(payload.department)) errors.department = "Select a valid department.";
        if (!payload.designation?.trim()) errors.designation = "Designation is required.";
        if (!payload.salary || Number(payload.salary) <= 0) errors.salary = "Salary must be positive.";
        if (!payload.joinDate) errors.joinDate = "Join date is required.";
        if (!statuses.includes(payload.status)) errors.status = "Select a valid status.";

        return errors;
    }

    function mapServerErrors(error) {
        const errors = {};

        if (error.status === 409) {
            errors.email = error.body?.message || "A conflict occurred.";
            errors.username = error.body?.message || "A conflict occurred.";
        }

        if (error.status === 400 && error.body?.errors) {
            Object.entries(error.body.errors).forEach(([key, value]) => {
                const formKey = key.charAt(0).toLowerCase() + key.slice(1);
                errors[formKey] = Array.isArray(value) ? value[0] : value;
            });
        }

        return errors;
    }

    return { validateEmployee, mapServerErrors };
})();
