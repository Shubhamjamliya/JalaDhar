/**
 * Reusable Loading Spinner Component
 */
export default function LoadingSpinner({ message = "Loading..." }) {
    return (
        <div className="w-full min-h-[50vh] flex items-center justify-center py-12">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
}

