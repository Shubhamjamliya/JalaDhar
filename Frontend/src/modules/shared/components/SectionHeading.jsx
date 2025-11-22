/**
 * Reusable Section Heading Component
 */
export default function SectionHeading({ title, className = "" }) {
    return (
        <h2 className={`px-2 pt-4 pb-2 text-lg font-bold text-gray-800 ${className}`}>
            {title}
        </h2>
    );
}

