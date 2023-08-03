if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot run tests in production mode')
}

if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === '') {
    throw new Error('NODE_ENV environment variable is not set')
}
