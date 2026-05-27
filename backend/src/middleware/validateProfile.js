const validateProfile = (req, res, next) => {
    const { budget_max, age } = req.body;

    if (budget_max !== undefined && (isNaN(budget_max) || budget_max <= 0)) {
        const err = new Error('Budget must be a positive number');
        err.status = 400;
        return next(err);
    }

    if (age !== undefined && (isNaN(age) || age <= 0 || age > 120)) {
        const err = new Error('Age must be a valid number between 1 and 120');
        err.status = 400;
        return next(err);
    }

    next();
};

module.exports = validateProfile;
