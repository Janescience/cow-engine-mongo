module.exports = {
    secret: "dairy-farm-secret-key",
    jwtExpiration: 3600,           // 1 hour
    jwtRefreshExpiration: 2592000000,   // 30 days

    /* for test */
    // jwtExpiration: 60,          // 1 minute
    // jwtRefreshExpiration: 120,  // 2 minutes
};
