window.StorageService = (() => {
    function _headers(withAuth = true) {
        const headers = { "Content-Type": "application/json" };
        if (withAuth) {
            const token = window.AuthService?.getToken?.();
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    async function _request(path, options = {}, withAuth = true) {
        const response = await fetch(`${AppConfig.API_BASE_URL}${path}`, {
            ...options,
            headers: {
                ..._headers(withAuth),
                ...(options.headers || {})
            }
        });

        const raw = await response.text();
        const body = raw ? JSON.parse(raw) : null;

        if (!response.ok) {
            const error = new Error(body?.message || "Request failed.");
            error.status = response.status;
            error.body = body;
            throw error;
        }

        return body;
    }

    function getAll(params) {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) search.append(key, value);
        });

        return _request(`/employees?${search.toString()}`);
    }

    return {
        getAll,
        getById: id => _request(`/employees/${id}`),
        add: employee => _request("/employees", { method: "POST", body: JSON.stringify(employee) }),
        update: (id, employee) => _request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(employee) }),
        remove: id => _request(`/employees/${id}`, { method: "DELETE" }),
        getDashboard: () => _request("/employees/dashboard"),
        login: credentials => _request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }, false),
        register: payload => _request("/auth/register", { method: "POST", body: JSON.stringify(payload) }, false)
    };
})();
