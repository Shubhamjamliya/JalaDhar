import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { VendorAuthProvider } from "./contexts/VendorAuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import VendorProtectedRoute from "./components/VendorProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

import UserLogin from "./modules/user/user-pages/UserLogin";
import UserSignup from "./modules/user/user-pages/UserSignup";
import UserOTPVerification from "./modules/user/user-pages/UserOTPVerification";
import UserForgotPassword from "./modules/user/user-pages/UserForgotPassword";
import UserResetPassword from "./modules/user/user-pages/UserResetPassword";
import UserDashboard from "./modules/user/user-pages/UserDashboard";
import VendorLogin from "./modules/vendor/vendor-pages/VendorLogin";
import VendorSignup from "./modules/vendor/vendor-pages/VendorSignup";
import VendorOTPVerification from "./modules/vendor/vendor-pages/VendorOTPVerification";
import VendorForgotPassword from "./modules/vendor/vendor-pages/VendorForgotPassword";
import VendorResetPassword from "./modules/vendor/vendor-pages/VendorResetPassword";
import UserNavbar from "./modules/user/user-components/UserNavbar";
import VendorNavbar from "./modules/vendor/vendor-components/VendorNavbar";
import UserServiceProvider from "./modules/user/user-pages/UserServiceProvider";
import UserRequestService from "./modules/user/user-pages/UserRequestService";
import UserStatus from "./modules/user/user-pages/UserStatus";
import UserBookingHistory from "./modules/user/user-pages/UserBookingHistory";
import UserBookingDetails from "./modules/user/user-pages/UserBookingDetails";
import UserBookingConfirmation from "./modules/user/user-pages/UserBookingConfirmation";
import UserRemainingPayment from "./modules/user/user-pages/UserRemainingPayment";
import UserProfile from "./modules/user/user-pages/UserProfile";
import UserVendorProfile from "./modules/user/user-pages/UserVendorProfile";
import VendorDashboard from "./modules/vendor/vendor-pages/VendorDashboard";
import VendorBookings from "./modules/vendor/vendor-pages/VendorBookings";
import VendorStatus from "./modules/vendor/vendor-pages/VendorStatus";
import VendorWallet from "./modules/vendor/vendor-pages/VendorWallet";
import VendorProfile from "./modules/vendor/vendor-pages/VendorProfile";
import VendorRequests from "./modules/vendor/vendor-pages/VendorRequests";
import VendorServices from "./modules/vendor/vendor-pages/VendorServices";
import VendorBookingDetails from "./modules/vendor/vendor-pages/VendorBookingDetails";
import VendorUploadReport from "./modules/vendor/vendor-pages/VendorUploadReport";
import VendorReviews from "./modules/vendor/vendor-pages/VendorReviews";
import AdminLogin from "./modules/admin/admin-pages/AdminLogin";
import AdminForgotPassword from "./modules/admin/admin-pages/AdminForgotPassword";
import AdminResetPassword from "./modules/admin/admin-pages/AdminResetPassword";
import AdminDashboard from "./modules/admin/admin-pages/AdminDashboard";
import AdminVendors from "./modules/admin/admin-pages/AdminVendors";
import AdminPendingVendors from "./modules/admin/admin-pages/AdminPendingVendors";
import AdminVendorDetails from "./modules/admin/admin-pages/AdminVendorDetails";
import AdminUsers from "./modules/admin/admin-pages/AdminUsers";
import AdminUserDetails from "./modules/admin/admin-pages/AdminUserDetails";
import AdminSettings from "./modules/admin/admin-pages/AdminSettings";
import AdminPayments from "./modules/admin/admin-pages/AdminPayments";
import AdminNavbar from "./modules/admin/admin-component/AdminNavbar";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <VendorAuthProvider>
                    <AdminAuthProvider>
                        <Router>
                            <Routes>
                                {/* ---------- USER AUTH ---------- */}
                                <Route
                                    path="/userlogin"
                                    element={<UserLogin />}
                                />
                                <Route
                                    path="/usersignup"
                                    element={<UserSignup />}
                                />
                                <Route
                                    path="/user/verify-otp"
                                    element={<UserOTPVerification />}
                                />
                                <Route
                                    path="/user/forgot-password"
                                    element={<UserForgotPassword />}
                                />
                                <Route
                                    path="/user/reset-password"
                                    element={<UserResetPassword />}
                                />

                                {/* ---------- USER PANEL (Nested with Navbar) ---------- */}
                                <Route
                                    path="/user/*"
                                    element={
                                        <ProtectedRoute>
                                            <UserNavbar />
                                            <main className="px-4 pb-16 pt-16 md:pb-8 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
                                                <Routes>
                                                    <Route
                                                        path="/"
                                                        element={
                                                            <Navigate
                                                                to="/user/dashboard"
                                                                replace
                                                            />
                                                        }
                                                    />
                                                    <Route
                                                        path="/dashboard"
                                                        element={
                                                            <UserDashboard />
                                                        }
                                                    />
                                                    <Route
                                                        path="/serviceprovider"
                                                        element={
                                                            <UserServiceProvider />
                                                        }
                                                    />
                                                    <Route
                                                        path="/request-service"
                                                        element={
                                                            <UserRequestService />
                                                        }
                                                    />
                                                    <Route
                                                        path="/status"
                                                        element={<UserStatus />}
                                                    />
                                                    <Route
                                                        path="/history"
                                                        element={
                                                            <UserBookingHistory />
                                                        }
                                                    />
                                                    <Route
                                                        path="/booking/confirmation/:bookingId"
                                                        element={
                                                            <UserBookingConfirmation />
                                                        }
                                                    />
                                                    <Route
                                                        path="/booking/:bookingId"
                                                        element={
                                                            <UserBookingDetails />
                                                        }
                                                    />
                                                    <Route
                                                        path="/booking/:bookingId/payment"
                                                        element={
                                                            <UserRemainingPayment />
                                                        }
                                                    />
                                                    <Route
                                                        path="/profile"
                                                        element={
                                                            <UserProfile />
                                                        }
                                                    />
                                                    <Route
                                                        path="/vendor-profile/:vendorId"
                                                        element={
                                                            <UserVendorProfile />
                                                        }
                                                    />
                                                </Routes>
                                            </main>
                                        </ProtectedRoute>
                                    }
                                />

                                {/* ---------- VENDOR AUTH ---------- */}
                                <Route
                                    path="/vendorlogin"
                                    element={<VendorLogin />}
                                />
                                <Route
                                    path="/vendorsignup"
                                    element={<VendorSignup />}
                                />
                                <Route
                                    path="/vendor/verify-otp"
                                    element={<VendorOTPVerification />}
                                />
                                <Route
                                    path="/vendor/forgot-password"
                                    element={<VendorForgotPassword />}
                                />
                                <Route
                                    path="/vendor/reset-password"
                                    element={<VendorResetPassword />}
                                />

                                {/* ---------- VENDOR PANEL (Nested with Navbar) ---------- */}
                                <Route
                                    path="/vendor/*"
                                    element={
                                        <VendorProtectedRoute>
                                            <VendorNavbar />
                                            <main className="px-4 pb-16 pt-16 md:pb-8 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
                                                <Routes>
                                                    <Route
                                                        path="/"
                                                        element={
                                                            <Navigate
                                                                to="/vendor/dashboard"
                                                                replace
                                                            />
                                                        }
                                                    />
                                                    <Route
                                                        path="/dashboard"
                                                        element={
                                                            <VendorDashboard />
                                                        }
                                                    />
                                                    <Route
                                                        path="/bookings/:bookingId/upload-report"
                                                        element={
                                                            <VendorUploadReport />
                                                        }
                                                    />
                                                    <Route
                                                        path="/bookings/:bookingId"
                                                        element={
                                                            <VendorBookingDetails />
                                                        }
                                                    />
                                                    <Route
                                                        path="/bookings"
                                                        element={
                                                            <VendorRequests />
                                                        }
                                                    />
                                                    <Route
                                                        path="/status"
                                                        element={
                                                            <VendorStatus />
                                                        }
                                                    />
                                                    <Route
                                                        path="/wallet"
                                                        element={
                                                            <VendorWallet />
                                                        }
                                                    />
                                                    <Route
                                                        path="/profile"
                                                        element={
                                                            <VendorProfile />
                                                        }
                                                    />
                                                    <Route
                                                        path="/requests"
                                                        element={
                                                            <VendorRequests />
                                                        }
                                                    />
                                                    <Route
                                                        path="/services"
                                                        element={
                                                            <VendorServices />
                                                        }
                                                    />
                                                    <Route
                                                        path="/reviews"
                                                        element={
                                                            <VendorReviews />
                                                        }
                                                    />
                                                </Routes>
                                            </main>
                                        </VendorProtectedRoute>
                                    }
                                />

                                {/* ---------- ADMIN AUTH ---------- */}
                                <Route
                                    path="/adminlogin"
                                    element={<AdminLogin />}
                                />
                                <Route
                                    path="/admin/forgot-password"
                                    element={<AdminForgotPassword />}
                                />
                                <Route
                                    path="/admin/reset-password"
                                    element={<AdminResetPassword />}
                                />

                                {/* ---------- ADMIN PANEL (Nested with Sidebar and Topbar) ---------- */}
                                <Route
                                    path="/admin/*"
                                    element={
                                        <AdminProtectedRoute>
                                            <div className="flex min-h-screen bg-[#F6F7F9]">
                                                <AdminNavbar />
                                                <div className="flex-1 flex flex-col md:ml-64">
                                                    <main className="flex-1 p-6 mt-16">
                                                        <Routes>
                                                            <Route
                                                                path="/"
                                                                element={
                                                                    <Navigate
                                                                        to="/admin/dashboard"
                                                                        replace
                                                                    />
                                                                }
                                                            />
                                                            <Route
                                                                path="/dashboard"
                                                                element={
                                                                    <AdminDashboard />
                                                                }
                                                            />
                                                            <Route
                                                                path="/vendors"
                                                                element={
                                                                    <AdminVendors />
                                                                }
                                                            />
                                                            <Route
                                                                path="/vendors/pending"
                                                                element={
                                                                    <AdminPendingVendors />
                                                                }
                                                            />
                                                            <Route
                                                                path="/vendors/:vendorId"
                                                                element={
                                                                    <AdminVendorDetails />
                                                                }
                                                            />
                                                            <Route
                                                                path="/users"
                                                                element={
                                                                    <AdminUsers />
                                                                }
                                                            />
                                                            <Route
                                                                path="/users/:userId"
                                                                element={
                                                                    <AdminUserDetails />
                                                                }
                                                            />
                                                            <Route
                                                                path="/payments"
                                                                element={
                                                                    <AdminPayments />
                                                                }
                                                            />
                                                            <Route
                                                                path="/settings"
                                                                element={
                                                                    <AdminSettings />
                                                                }
                                                            />
                                                        </Routes>
                                                    </main>
                                                </div>
                                            </div>
                                        </AdminProtectedRoute>
                                    }
                                />

                                {/* ---------- DEFAULT REDIRECT ---------- */}
                                <Route
                                    path="/"
                                    element={
                                        <Navigate to="/userlogin" replace />
                                    }
                                />
                            </Routes>
                        </Router>
                    </AdminAuthProvider>
                </VendorAuthProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
