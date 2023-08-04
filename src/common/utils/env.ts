export function isProduction() {
    return process.env.NODE_ENV === 'production'
}

export function isDevelopment() {
    return process.env.NODE_ENV === 'development'
}

export function envFilename() {
    return '.env.' + process.env.NODE_ENV?.toLowerCase()
}
