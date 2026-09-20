function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

function parseDeadline(deadlineStr, daysRemaining) {
    const parts = (deadlineStr || "").split(',');
    const datePart = parts[0] ? parts[0].trim() : "Upcoming";
    const timePart = parts[1] ? parts[1].trim() : "11:59 PM";
    const year = new Date().getFullYear();
    const formattedDate = datePart.includes(String(year)) ? datePart : `${datePart} ${year}`;
    
    let relativeUrgency;
    let isUrgent = false;
    if (daysRemaining <= 1) {
        relativeUrgency = "Due tomorrow · Immediate Action Required";
        isUrgent = true;
    } else if (daysRemaining <= 3) {
        relativeUrgency = `${daysRemaining} days remaining · Urgent`;
        isUrgent = true;
    } else if (daysRemaining <= 7) {
        relativeUrgency = `${daysRemaining} days remaining · Approaching this week`;
        isUrgent = false;
    } else {
        relativeUrgency = `${daysRemaining} days remaining`;
        isUrgent = false;
    }

    return {
        date: formattedDate,
        time: timePart,
        relativeUrgency,
        isUrgent,
        deadlineDays: daysRemaining,
        raw: deadlineStr
    };
}

module.exports = {
    getOrdinal,
    parseDeadline
};
