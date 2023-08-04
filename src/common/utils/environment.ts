export function isProduction() {
    return process.env.NODE_ENV === 'production'
}

export function isDevelopment() {
    return process.env.NODE_ENV === 'development'
}

export function envFilename() {
    return '.env.' + process.env.NODE_ENV?.toLowerCase()
}

export function addItemInDevelopment(items: any[], developmentItem: any): any[] {
    return isDevelopment() ? [...items, developmentItem] : items
}
