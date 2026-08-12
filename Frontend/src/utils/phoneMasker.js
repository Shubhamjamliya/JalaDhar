/**
 * Utility helper to mask customer phone numbers for privacy in Expert / Vendor App
 * Example: "8019239898" -> "+91 80192 *****"
 */
export const maskPhone = (phone) => {
    if (!phone) return "";
    const str = phone.toString().trim();
    const digits = str.replace(/[^0-9]/g, "");
    if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        return `+91 ${last10.slice(0, 5)} *****`;
    }
    return "+91 ***** *****";
};
