export const getToken = () => {
    return localStorage.getItem("token");
};

export const getUser = () => {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
};

export const isAuthenticated = () => {
    return Boolean(getToken());
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
};