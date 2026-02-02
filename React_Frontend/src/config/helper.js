export function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString); // Ensure dateString is correctly parsed

    // Check if the date is valid
    if (isNaN(past.getTime())) {
        // console.error("Invalid date string provided:", dateString);
        return "Invalid date"; // Handle invalid date input
    }

    const secondsAgo = Math.floor((now.getTime() - past.getTime()) / 1000);

    // If less than 24 hours old (in seconds)
    if (secondsAgo < 24 * 60 * 60) {
        // Format as actual time (e.g., "1:23 PM")
        return past.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    // If 24 hours or more old
    // Format as date and time (e.g., "12/02/25 1:23 PM")
    // Using toLocaleString with options for desired format
    return past.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Example usage:
// (Note: Outputs will vary based on the current date and time when you run this)

// Example 1: Less than 24 hours ago (if run shortly after 12:00 PM today)
const lessThanADayAgo = "2025-07-25T12:00:00Z"; // Assuming current date is July 25, 2025
// console.log(`Less than a day ago: ${lessThanADayAgo} -> ${timeAgo(lessThanADayAgo)}`);

// Example 2: More than 24 hours ago
const moreThanADayAgo = "2025-07-24T10:30:00Z"; // Yesterday
// console.log(`More than a day ago (yesterday): ${moreThanADayAgo} -> ${timeAgo(moreThanADayAgo)}`);

// Example 3: A few days ago
const aFewDaysAgo = "2025-07-20T08:00:00Z"; // A few days ago
// console.log(`A few days ago: ${aFewDaysAgo} -> ${timeAgo(aFewDaysAgo)}`);

// Example 4: Invalid date
const invalidDate = "not-a-date-string";
// console.log(`Invalid date: ${invalidDate} -> ${timeAgo(invalidDate)}`);