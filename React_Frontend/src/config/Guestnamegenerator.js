// Utility to generate random fun guest names

const adjectives = [
    'Happy', 'Clever', 'Bright', 'Swift', 'Bold', 'Calm', 'Brave', 'Wise',
    'Gentle', 'Kind', 'Lively', 'Merry', 'Noble', 'Proud', 'Quick', 'Silent',
    'Sunny', 'Witty', 'Zesty', 'Cool', 'Epic', 'Fancy', 'Grand', 'Jolly',
    'Lucky', 'Mighty', 'Nifty', 'Quirky', 'Rusty', 'Snappy', 'Trusty', 'Vivid',
    'Wild', 'Zippy', 'Cosmic', 'Daring', 'Eager', 'Fiery', 'Gleaming', 'Humble'
];

const animals = [
    'Panda', 'Tiger', 'Eagle', 'Dolphin', 'Wolf', 'Fox', 'Bear', 'Lion',
    'Hawk', 'Owl', 'Deer', 'Rabbit', 'Falcon', 'Otter', 'Penguin', 'Koala',
    'Lemur', 'Cheetah', 'Jaguar', 'Lynx', 'Moose', 'Rhino', 'Seal', 'Shark',
    'Turtle', 'Whale', 'Zebra', 'Phoenix', 'Dragon', 'Griffin', 'Unicorn', 'Raven',
    'Sparrow', 'Gecko', 'Chameleon', 'Mongoose', 'Badger', 'Meerkat', 'Platypus', 'Axolotl'
];

/**
 * Generates a random fun guest name in format: Adjective_Animal_Number
 * Example: Happy_Panda_42, Clever_Dragon_789
 */
export const generateGuestName = () => {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomNumber = Math.floor(Math.random() * 1000); // 0-999
    
    return `${randomAdjective}_${randomAnimal}_${randomNumber}`;
};

/**
 * Generates a unique guest ID for tracking
 * Format: guest_timestamp_random
 */
export const generateGuestId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `guest_${timestamp}_${random}`;
};

/**
 * Gets a generated avatar URL based on the name
 */
export const getGuestProfilePic = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Guest')}&background=random&color=fff&bold=true`;
};

/**
 * Creates a complete guest user object
 */
export const createGuestUser = () => {
    const guestId = generateGuestId();
    const guestName = generateGuestName();
    // Pass the generated name to get a matching avatar
    const profilePicUrl = getGuestProfilePic(guestName);
    
    return {
        id: guestId,
        name: guestName,
        email: guestId, // Use guestId as email for consistency
        isGuest: true,
        profilePicUrl: profilePicUrl
    };
};