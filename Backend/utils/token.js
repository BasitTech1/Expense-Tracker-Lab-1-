import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class TokenManager {
    // Generate access token
    static generateAccessToken(user) {
        return jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                role: user.role,
                fullName: user.fullName
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
    }

    // Generate refresh token
    static generateRefreshToken(user) {
        return jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET + '_refresh',
            { expiresIn: '30d' }
        );
    }

    // Verify token
    static verifyToken(token, type = 'access') {
        try {
            let secret;
            switch(type) {
                case 'access':
                    secret = process.env.JWT_SECRET;
                    break;
                case 'refresh':
                    secret = process.env.JWT_SECRET + '_refresh';
                    break;
                default:
                    secret = process.env.JWT_SECRET;
            }
            return jwt.verify(token, secret);
        } catch (error) {
            throw error;
        }
    }

    // Generate reset password token
    static generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Hash token
    static hashToken(token) {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }
}

// Create token response
export const createTokenResponse = (user, includeRefresh = true) => {
    const response = {
        token: TokenManager.generateAccessToken(user),
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            gender: user.gender,
            country: user.country
        }
    };

    if (includeRefresh) {
        response.refreshToken = TokenManager.generateRefreshToken(user);
    }

    return response;
};

// Cookie options
export const getTokenCookieOptions = (isProduction = false) => {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
};

export default TokenManager;