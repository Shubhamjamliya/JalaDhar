/**
 * Reusable Page Container Component
 * Provides consistent layout and styling for all pages
 */
export default function PageContainer({ children, className = "" }) {
    return (
        <div className={`min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 ${className}`}>
            {children}
        </div>
    );
}

