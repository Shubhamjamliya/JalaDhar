import { lazy, Suspense } from "react";
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
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import VendorProtectedRoute from "./components/VendorProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import LoadingSpinner from "./modules/shared/components/LoadingSpinner";
import ToastProvider from "./components/ToastProvider";

// Lazy load all route components for better performance
const UserLogin = lazy(() => import("./modules/user/user-pages/UserLogin"));
const UserSignup = lazy(() => import("./modules/user/user-pages/UserSignup"));
const UserOTPVerification = lazy(() => import("./modules/user/user-pages/UserOTPVerification"));
const UserForgotPassword = lazy(() => import("./modules/user/user-pages/UserForgotPassword"));
const UserResetPassword = lazy(() => import("./modules/user/user-pages/UserResetPassword"));
const UserDashboard = lazy(() => import("./modules/user/user-pages/UserDashboard"));
const VendorLogin = lazy(() => import("./modules/vendor/vendor-pages/VendorLogin"));
const VendorSignup = lazy(() => import("./modules/vendor/vendor-pages/VendorSignup"));
const VendorOTPVerification = lazy(() => import("./modules/vendor/vendor-pages/VendorOTPVerification"));
const VendorForgotPassword = lazy(() => import("./modules/vendor/vendor-pages/VendorForgotPassword"));
const VendorResetPassword = lazy(() => import("./modules/vendor/vendor-pages/VendorResetPassword"));
const UserNavbar = lazy(() => import("./modules/user/user-components/UserNavbar"));
const VendorNavbar = lazy(() => import("./modules/vendor/vendor-components/VendorNavbar"));
const UserServiceProvider = lazy(() => import("./modules/user/user-pages/UserServiceProvider"));
const UserRequestService = lazy(() => import("./modules/user/user-pages/UserRequestService"));
const UserStatus = lazy(() => import("./modules/user/user-pages/UserStatus"));
const UserAllBookingsStatus = lazy(() => import("./modules/user/user-pages/UserAllBookingsStatus"));
const UserBookingDetails = lazy(() => import("./modules/user/user-pages/UserBookingDetails"));
const UserBookingConfirmation = lazy(() => import("./modules/user/user-pages/UserBookingConfirmation"));
const UserRemainingPayment = lazy(() => import("./modules/user/user-pages/UserRemainingPayment"));
const UserAdvancePaymentConfirmation = lazy(() => import("./modules/user/user-pages/UserAdvancePaymentConfirmation"));
const UserProfile = lazy(() => import("./modules/user/user-pages/UserProfile"));
const UserWallet = lazy(() => import("./modules/user/user-pages/UserWallet"));
const UserVendorProfile = lazy(() => import("./modules/user/user-pages/UserVendorProfile"));
const UserDisputes = lazy(() => import("./modules/user/user-pages/UserDisputes"));
const UserCreateDispute = lazy(() => import("./modules/user/user-pages/UserCreateDispute"));
const UserDisputeDetails = lazy(() => import("./modules/user/user-pages/UserDisputeDetails"));
const UserRatings = lazy(() => import("./modules/user/user-pages/UserRatings"));
const VendorDashboard = lazy(() => import("./modules/vendor/vendor-pages/VendorDashboard"));
const VendorDisputes = lazy(() => import("./modules/vendor/vendor-pages/VendorDisputes"));
const VendorCreateDispute = lazy(() => import("./modules/vendor/vendor-pages/VendorCreateDispute"));
const VendorDisputeDetails = lazy(() => import("./modules/vendor/vendor-pages/VendorDisputeDetails"));
const VendorBookings = lazy(() => import("./modules/vendor/vendor-pages/VendorBookings"));
const VendorStatus = lazy(() => import("./modules/vendor/vendor-pages/VendorStatus"));
const VendorAllBookingsStatus = lazy(() => import("./modules/vendor/vendor-pages/VendorAllBookingsStatus"));
const VendorWallet = lazy(() => import("./modules/vendor/vendor-pages/VendorWallet"));
const VendorProfile = lazy(() => import("./modules/vendor/vendor-pages/VendorProfile"));
const VendorRequests = lazy(() => import("./modules/vendor/vendor-pages/VendorRequests"));
const VendorServices = lazy(() => import("./modules/vendor/vendor-pages/VendorServices"));
const VendorBookingDetails = lazy(() => import("./modules/vendor/vendor-pages/VendorBookingDetails"));
const VendorUploadReport = lazy(() => import("./modules/vendor/vendor-pages/VendorUploadReport"));
const VendorReviews = lazy(() => import("./modules/vendor/vendor-pages/VendorReviews"));
const AdminLogin = lazy(() => import("./modules/admin/admin-pages/AdminLogin"));
const AdminForgotPassword = lazy(() => import("./modules/admin/admin-pages/AdminForgotPassword"));
const AdminResetPassword = lazy(() => import("./modules/admin/admin-pages/AdminResetPassword"));
const AdminDashboard = lazy(() => import("./modules/admin/admin-pages/AdminDashboard"));
const AdminVendors = lazy(() => import("./modules/admin/admin-pages/AdminVendors"));
const AdminPendingVendors = lazy(() => import("./modules/admin/admin-pages/AdminPendingVendors"));
const AdminVendorDetails = lazy(() => import("./modules/admin/admin-pages/AdminVendorDetails"));
const AdminUsers = lazy(() => import("./modules/admin/admin-pages/AdminUsers"));
const AdminUserDetails = lazy(() => import("./modules/admin/admin-pages/AdminUserDetails"));
const AdminSettings = lazy(() => import("./modules/admin/admin-pages/AdminSettings"));
const AdminPayments = lazy(() => import("./modules/admin/admin-pages/AdminPayments"));
const AdminBookings = lazy(() => import("./modules/admin/admin-pages/AdminBookings"));
const AdminWithdrawals = lazy(() => import("./modules/admin/admin-pages/AdminWithdrawals"));
const AdminUserWithdrawals = lazy(() => import("./modules/admin/admin-pages/AdminUserWithdrawals"));
const AdminApprovals = lazy(() => import("./modules/admin/admin-pages/AdminApprovals"));
const AdminBookingDetails = lazy(() => import("./modules/admin/admin-pages/AdminBookingDetails"));
const AdminRatings = lazy(() => import("./modules/admin/admin-pages/AdminRatings"));
const AdminDisputes = lazy(() => import("./modules/admin/admin-pages/AdminDisputes"));
const AdminNavbar = lazy(() => import("./modules/admin/admin-component/AdminNavbar"));

function App() {
    return (
        <ThemeProvider>
            <ToastProvider />
            <AuthProvider>
                <VendorAuthProvider>
                    <AdminAuthProvider>
                        <NotificationProvider>
                            <Router>
                            <Routes>
                                {/* ---------- USER AUTH ---------- */}
                                <Route
                                    path="/userlogin"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <UserLogin />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/usersignup"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <UserSignup />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/user/verify-otp"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <UserOTPVerification />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/user/forgot-password"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <UserForgotPassword />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/user/reset-password"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <UserResetPassword />
                                        </Suspense>
                                    }
                                />

                                {/* ---------- USER PANEL (Nested with Navbar) ---------- */}
                                <Route
                                    path="/user/*"
                                    element={
                                        <ProtectedRoute>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <UserNavbar />
                                            </Suspense>
                                            <main className="px-4 pb-16 pt-16 md:pb-8 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
                                                <Suspense fallback={<LoadingSpinner />}>
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
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserDashboard />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/serviceprovider"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserServiceProvider />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/request-service"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserRequestService />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/status"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserAllBookingsStatus />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/booking/:bookingId/status"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserStatus />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/booking/confirmation/:bookingId"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserBookingConfirmation />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/booking/advance-payment/confirmation"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserAdvancePaymentConfirmation />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/booking/:bookingId"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserBookingDetails />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/booking/:bookingId/payment"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserRemainingPayment />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/profile"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserProfile />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/wallet"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserWallet />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/vendor-profile/:vendorId"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserVendorProfile />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/disputes"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserDisputes />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/disputes/create"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserCreateDispute />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/disputes/:disputeId"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserDisputeDetails />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/ratings"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <UserRatings />
                                                                </Suspense>
                                                            }
                                                        />
                                                    </Routes>
                                                </Suspense>
                                            </main>
                                        </ProtectedRoute>
                                    }
                                />

                                {/* ---------- VENDOR AUTH ---------- */}
                                <Route
                                    path="/vendorlogin"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <VendorLogin />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/vendorsignup"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <VendorSignup />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/vendor/verify-otp"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <VendorOTPVerification />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/vendor/forgot-password"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <VendorForgotPassword />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/vendor/reset-password"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <VendorResetPassword />
                                        </Suspense>
                                    }
                                />

                                {/* ---------- VENDOR PANEL (Nested with Navbar) ---------- */}
                                <Route
                                    path="/vendor/*"
                                    element={
                                        <VendorProtectedRoute>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <VendorNavbar />
                                            </Suspense>
                                            <main className="px-4 pb-16 pt-16 md:pb-8 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
                                                <Suspense fallback={<LoadingSpinner />}>
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
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorDashboard />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/bookings/:bookingId/upload-report"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorUploadReport />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/bookings/:bookingId"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorBookingDetails />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/booking/:bookingId/status"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorStatus />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/bookings"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorRequests />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/status"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorAllBookingsStatus />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/wallet"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorWallet />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/profile"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorProfile />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/requests"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorRequests />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/services"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorServices />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/reviews"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorReviews />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/disputes"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorDisputes />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/disputes/create"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorCreateDispute />
                                                                </Suspense>
                                                            }
                                                        />
                                                        <Route
                                                            path="/disputes/:disputeId"
                                                            element={
                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                    <VendorDisputeDetails />
                                                                </Suspense>
                                                            }
                                                        />
                                                    </Routes>
                                                </Suspense>
                                            </main>
                                        </VendorProtectedRoute>
                                    }
                                />

                                {/* ---------- ADMIN AUTH ---------- */}
                                <Route
                                    path="/adminlogin"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <AdminLogin />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/admin/forgot-password"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <AdminForgotPassword />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/admin/reset-password"
                                    element={
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <AdminResetPassword />
                                        </Suspense>
                                    }
                                />

                                {/* ---------- ADMIN PANEL (Nested with Sidebar and Topbar) ---------- */}
                                <Route
                                    path="/admin/*"
                                    element={
                                        <AdminProtectedRoute>
                                            <div className="flex min-h-screen bg-[#F6F7F9]">
                                                <Suspense fallback={<LoadingSpinner />}>
                                                    <AdminNavbar />
                                                </Suspense>
                                                <div className="flex-1 flex flex-col md:ml-64">
                                                    <main className="flex-1 p-6 mt-16">
                                                        <Suspense fallback={<LoadingSpinner />}>
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
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminDashboard />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/vendors"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminVendors />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/vendors/pending"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminPendingVendors />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/vendors/:vendorId"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminVendorDetails />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/users"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminUsers />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/users/:userId"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminUserDetails />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/bookings"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminBookings />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/payments"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminPayments />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/payments/admin"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminPayments defaultTab="admin-overview" />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/payments/user"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminPayments defaultTab="user-payments" />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/payments/vendor"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminPayments defaultTab="vendor-payments" />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/withdrawals"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminWithdrawals />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/user-withdrawals"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminUserWithdrawals />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/settings"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminSettings />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/approvals"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminApprovals />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/bookings/:bookingId"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminBookingDetails />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/ratings"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminRatings />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                                <Route
                                                                    path="/disputes"
                                                                    element={
                                                                        <Suspense fallback={<LoadingSpinner />}>
                                                                            <AdminDisputes />
                                                                        </Suspense>
                                                                    }
                                                                />
                                                            </Routes>
                                                        </Suspense>
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
                        </NotificationProvider>
                    </AdminAuthProvider>
                </VendorAuthProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
