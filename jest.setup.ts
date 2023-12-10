if (process.env.NODE_ENV !== 'development') {
    throw new Error('Cannot run tests in not development mode')
}

process.env.DEV_LOGGING_DURING_TESTING = 'false'
