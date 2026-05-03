window.AuthService = (() => {
    let _session = null;

    function decodeToken(token) {
        if (!token) return null;
        const payload = token.split(".")[1];
        if (!payload) return null;

        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
    }

    async function login(credentials) {
        const result = await StorageService.login(credentials);
        const claims = decodeToken(result.token);
        _session = {
            username: result.username,
            role: result.role || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            token: result.token
        };
        return _session;
    }

    async function signup(payload) {
        return StorageService.register(payload);
    }

    function logout() {
        _session = null;
    }

    function getToken() {
        return _session?.token || null;
    }

    function getRole() {
        return _session?.role || null;
    }

    function getUsername() {
        return _session?.username || null;
    }

    function isAuthenticated() {
        return Boolean(_session?.token);
    }

    function isAdmin() {
        return getRole() === "Admin";
    }

    return { login, signup, logout, getToken, getRole, getUsername, isAuthenticated, isAdmin };
})();
