const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ${err.message}`);

    const status = err.status || 500;
    const message = err.status ? err.message : 'Internal server error';

    res.status(status).json({ success: false, error: message });
};

module.exports = errorHandler;
