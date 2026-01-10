import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vendor, AuthResponse } from '@/types';
import { authAPI, vendorAPI } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    vendor: Vendor | null;
    token: string | null;
    isAuthenticated: boolean;
    hasVendorProfile: boolean;
    isLoading: boolean;
    login: (phone: string, otp: string) => Promise<AuthResponse>;
    logout: () => void;
    completeSignup: (data: any) => Promise<void>;
    refreshVendorProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const loadAuthState = () => {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('user_data');
            const storedVendor = localStorage.getItem('vendor_data');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                if (storedVendor) {
                    setVendor(JSON.parse(storedVendor));
                }
            }
            setIsLoading(false);
        };

        loadAuthState();
    }, []);

    const login = async (phone: string, otp: string): Promise<AuthResponse> => {
        const response = await authAPI.verifyOTP(phone, otp);
        const data = response.data;

        if (data.success && data.token) {
            setToken(data.token);
            setUser(data.user || null);

            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            // Fetch vendor profile if exists
            if (data.hasVendorProfile && data.vendorId) {
                try {
                    const vendorResponse = await vendorAPI.getProfile();
                    const vendorData = vendorResponse.data.data;
                    setVendor(vendorData);
                    localStorage.setItem('vendor_data', JSON.stringify(vendorData));
                } catch (error) {
                    console.error('Failed to fetch vendor profile:', error);
                }
            }
        }

        return data;
    };

    const logout = () => {
        setUser(null);
        setVendor(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('vendor_data');
    };

    const completeSignup = async (data: any) => {
        const response = await authAPI.completeSignup(data);
        const result = response.data;

        if (result.success && result.token) {
            setToken(result.token);
            localStorage.setItem('auth_token', result.token);

            // Fetch the newly created vendor profile
            await refreshVendorProfile();
        }
    };

    const refreshVendorProfile = async () => {
        try {
            const response = await vendorAPI.getProfile();
            const vendorData = response.data.data;
            setVendor(vendorData);
            localStorage.setItem('vendor_data', JSON.stringify(vendorData));
        } catch (error) {
            console.error('Failed to refresh vendor profile:', error);
        }
    };

    const value = {
        user,
        vendor,
        token,
        isAuthenticated: !!token && !!user,
        hasVendorProfile: !!vendor,
        isLoading,
        login,
        logout,
        completeSignup,
        refreshVendorProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
