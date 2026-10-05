const getWIBDate = () => {
    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);

    const year = parts.find((part) => part.type === "year").value;
    const month = parts.find((part) => part.type === "month").value;
    const day = parts.find((part) => part.type === "day").value;

    return `${year}-${month}-${day}`;
};

const getTodayWIB = () => {
    const dateWIB = getWIBDate();

    // Simpan sebagai UTC midnight agar PostgreSQL DATE
    // tidak bergeser ke hari sebelumnya.
    return new Date(`${dateWIB}T00:00:00.000Z`);
};

const getCurrentHourWIB = () => {
    const hour = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        hour12: false,
    }).format(new Date());

    return Number(hour);
};

const formatDateWIB = (date) => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(date));
};

const formatDateTimeWIB = (date) => {
    if (!date) return null;

    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date(date));
};

module.exports = {
    getWIBDate,
    getTodayWIB,
    getCurrentHourWIB,
    formatDateWIB,
    formatDateTimeWIB,
};