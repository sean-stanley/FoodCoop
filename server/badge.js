var models = require('./models.js');

// badges are created by a specific function and saved to the DB. If a user already has a badge, they get an incremented quantity of that badge instead.

// user.badges.push(badge) and user.badges.id(id).remove() removes a badge

// badges are given for certain goals being completed. Each badge is awarded for those completions so the badge creator function tests to see if the user has met the prerequisites for a badge.