import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminNavbar() {
    return (
        <>
            {/* Desktop Sidebar - Always visible on desktop */}
            <div className="hidden lg:block">
                <AdminSidebar />
            </div>

            {/* Top Bar - Always visible */}
            <AdminTopbar />
        </>
    );
}
