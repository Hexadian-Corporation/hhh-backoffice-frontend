import type { UserContext } from './types.js';
export declare function decodeJwtPayload(token: string): Record<string, unknown> | null;
export declare function isTokenExpired(token: string): boolean;
export declare function extractUserContext(token: string): UserContext | null;
//# sourceMappingURL=jwt.d.ts.map