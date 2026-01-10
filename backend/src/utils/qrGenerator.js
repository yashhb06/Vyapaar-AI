import QRCode from 'qrcode';
import fs from 'fs';

/**
 * Generate UPI payment QR code
 * @param {object} upiData - UPI payment data
 * @param {string} upiData.upiId - UPI ID (e.g., merchant@paytm)
 * @param {string} upiData.name - Payee name
 * @param {number} upiData.amount - Payment amount (optional)
 * @param {string} upiData.transactionNote - Transaction note (optional)
 * @param {string} outputPath - Path to save the QR code image
 * @returns {Promise<string>} Path to the generated QR code
 */
export const generateUPIQRCode = async (upiData, outputPath) => {
    try {
        const { upiId, name, amount, transactionNote } = upiData;

        if (!upiId) {
            throw new Error('UPI ID is required');
        }

        // UPI Payment String Format
        // upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&tn=<NOTE>&cu=INR
        let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;

        if (name) {
            upiString += `&pn=${encodeURIComponent(name)}`;
        }

        if (amount) {
            upiString += `&am=${amount}`;
        }

        if (transactionNote) {
            upiString += `&tn=${encodeURIComponent(transactionNote)}`;
        }

        upiString += '&cu=INR'; // Currency

        // Generate QR code
        await QRCode.toFile(outputPath, upiString, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300,
            margin: 2
        });

        return outputPath;
    } catch (error) {
        throw new Error(`Failed to generate UPI QR code: ${error.message}`);
    }
};

/**
 * Generate UPI QR code as data URL (base64)
 * @param {object} upiData - UPI payment data
 * @returns {Promise<string>} Base64 data URL of the QR code
 */
export const generateUPIQRCodeDataURL = async (upiData) => {
    try {
        const { upiId, name, amount, transactionNote } = upiData;

        if (!upiId) {
            throw new Error('UPI ID is required');
        }

        let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;

        if (name) {
            upiString += `&pn=${encodeURIComponent(name)}`;
        }

        if (amount) {
            upiString += `&am=${amount}`;
        }

        if (transactionNote) {
            upiString += `&tn=${encodeURIComponent(transactionNote)}`;
        }

        upiString += '&cu=INR';

        const dataURL = await QRCode.toDataURL(upiString, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300,
            margin: 2
        });

        return dataURL;
    } catch (error) {
        throw new Error(`Failed to generate UPI QR code data URL: ${error.message}`);
    }
};

/**
 * Generate generic QR code for any data
 * @param {string} data - Data to encode
 * @param {string} outputPath - Path to save the QR code
 * @returns {Promise<string>} Path to the generated QR code
 */
export const generateQRCode = async (data, outputPath) => {
    try {
        await QRCode.toFile(outputPath, data, {
            width: 300,
            margin: 2
        });
        return outputPath;
    } catch (error) {
        throw new Error(`Failed to generate QR code: ${error.message}`);
    }
};
