export class Env {
    public static isProduction() {
        return process.env.NODE_ENV === 'production'
    }

    public static isDevelopment() {
        return process.env.NODE_ENV === 'development'
    }
}
