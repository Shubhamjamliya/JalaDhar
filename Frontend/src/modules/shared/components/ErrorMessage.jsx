/**
 * Reusable Error Message Component
 */
export default function ErrorMessage({ message, className = "" }) {
    if (!message) return null;
    
    return (
        <div className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
            <p className="text-sm text-red-600">{message}</p>
        </div>
    );
}

