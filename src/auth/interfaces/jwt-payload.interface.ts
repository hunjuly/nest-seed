export interface JwtPayload {
    jti?: string
    userId: string
    email: string
    iat?: number
    exp?: number
}
