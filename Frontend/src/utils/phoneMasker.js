/**
 * Utility helper to mask phone numbers for privacy across Jaladhaara
 * Example: "8019239898" -> "+91 80192 *****" or "+91 ***** *****"
 */
export const maskPhone = (phone, full = false) => {
    if (!phone) return "";
    if (full) return "+91 ***** *****";
    const str = phone.toString().trim();
    const digits = str.replace(/[^0-9]/g, "");
    if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        return `+91 ${last10.slice(0, 5)} *****`;
    }
    return "+91 ***** *****";
};
