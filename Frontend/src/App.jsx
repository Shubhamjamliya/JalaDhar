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
import LocationPermissionModal from "./components/LocationPermissionModal";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./contexts/LanguageContext";

// Lazy load all route components for better performance
const UserLogin = lazy(() => import("./modules/user/user-pages/UserLogin"));
const UserSignup = lazy(() => import("./modules/user/user-pages/UserSignup"));
const UserOTPVerification = lazy(() => import("./modules/user/user-pages/UserOTPVerification"));
const UserLoginOTPVerification = lazy(() => import("./modules/user/user-pages/UserLoginOTPVerification"));
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
const UserSurveyFlow = lazy(() => import("./modules/user/user-pages/UserSurveyFlow"));
const UserSurveyReport = lazy(() => import("./modules/user/user-pages/UserSurveyReport"));
const UserInvoice = lazy(() => import("./modules/user/user-pages/UserInvoice"));
const UserReports = lazy(() => import("./modules/user/user-pages/UserReports"));
const UserPaymentsInvoices = lazy(() => import("./modules/user/user-pages/UserPaymentsInvoices"));
const UserNotificationsPage = lazy(() => import("./modules/user/user-pages/UserNotificationsPage"));
const UserHelpSupport = lazy(() => import("./modules/user/user-pages/UserHelpSupport"));
const UserSettingsPage = lazy(() => import("./modules/user/user-pages/UserSettingsPage"));
const LiveTrackingPage = lazy(() => import("./modules/shared/pages/LiveTrackingPage"));
const VendorDashboard = lazy(() => import("./modules/vendor/vendor-pages/VendorDashboard"));
const VendorDisputes = lazy(() => import("./modules/vendor/vendor-pages/VendorDisputes"));
const VendorCreateDispute = lazy(() => import("./modules/vendor/vendor-pages/VendorCreateDispute"));
const VendorDisputeDetails = lazy(() => import("./modules/vendor/vendor-pages/VendorDisputeDetails"));
const VendorInvoice = lazy(() => import("./modules/vendor/vendor-pages/VendorInvoice"));
const VendorBookings = lazy(() => import("./modules/vendor/vendor-pages/VendorBookings"));
const VendorStatus = lazy(() => import("./modules/vendor/vendor-pages/VendorStatus"));
const VendorAllBookingsStatus = lazy(() => import("./modules/vendor/vendor-pages/VendorAllBookingsStatus"));
const VendorWallet = lazy(() => import("./modules/vendor/vendor-pages/VendorWallet"));
const VendorProfile = lazy(() => import("./modules/vendor/vendor-pages/VendorProfile"));
const VendorRequests = lazy(() => import("./modules/vendor/vendor-pages/VendorRequests"));

const VendorBookingDetails = lazy(() => import("./modules/vendor/vendor-pages/VendorBookingDetails"));
const VendorUploadReport = lazy(() => import("./modules/vendor/vendor-pages/VendorUploadReport"));
const VendorReviews = lazy(() => import("./modules/vendor/vendor-pages/VendorReviews"));
const VendorAbout = lazy(() => import("./modules/vendor/vendor-pages/VendorAbout"));
const VendorSettings = lazy(() => import("./modules/vendor/vendor-pages/VendorSettings"));
const VendorPolicyPage = lazy(() => import("./modules/vendor/vendor-pages/VendorPolicyPage"));
const VendorHelpSupport = lazy(() => import("./modules/vendor/vendor-pages/VendorHelpSupport"));
const ExpertAgreementScreen = lazy(() => import("./modules/vendor/vendor-pages/ExpertAgreementScreen"));
const AdminLogin = lazy(() => import("./modules/admin/admin-pages/AdminLogin"));
const AdminForgotPassword = lazy(() => import("./modules/admin/admin-pages/AdminForgotPassword"));
const AdminResetPassword = lazy(() => import("./modules/admin/admin-pages/AdminResetPassword"));
const AdminDashboard = lazy(() => import("./modules/admin/admin-pages/AdminDashboard"));
const AdminVendors = lazy(() => import("./modules/admin/admin-pages/AdminVendors"));
const AdminPendingVendors = lazy(() => import("./modules/admin/admin-pages/AdminPendingVendors"));
const AdminVendorDetails = lazy(() => import("./modules/admin/admin-pages/AdminVendorDetails"));
const AdminUsers = lazy(() => import("./modules/admin/admin-pages/AdminUsers"));
const AdminUserBookings = lazy(() => import("./modules/admin/admin-pages/AdminUserBookings"));
const AdminUserTransactions = lazy(() => import("./modules/admin/admin-pages/AdminUserTransactions"));
const AdminUserAnalytics = lazy(() => import("./modules/admin/admin-pages/AdminUserAnalytics"));
const AdminUserDetails = lazy(() => import("./modules/admin/admin-pages/AdminUserDetails"));
const AdminSettings = lazy(() => import("./modules/admin/admin-pages/AdminSettings"));
const AdminPayments = lazy(() => import("./modules/admin/admin-pages/AdminPayments"));
const AdminBookings = lazy(() => import("./modules/admin/admin-pages/AdminBookings"));
const AdminWithdrawals = lazy(() => import("./modules/admin/admin-pages/AdminWithdrawals"));
const AdminUserWithdrawals = lazy(() => import("./modules/admin/admin-pages/AdminUserWithdrawals"));
const AdminVendorBookings = lazy(() => import("./modules/admin/admin-pages/AdminVendorBookings"));
const AdminVendorTransactions = lazy(() => import("./modules/admin/admin-pages/AdminVendorTransactions"));
const AdminVendorAnalytics = lazy(() => import("./modules/admin/admin-pages/AdminVendorAnalytics"));
const AdminVendorWallets = lazy(() => import("./modules/admin/admin-pages/AdminVendorWallets"));
const AdminBookingTracking = lazy(() => import("./modules/admin/admin-pages/AdminBookingTracking"));
const AdminBookingNotifications = lazy(() => import("./modules/admin/admin-pages/AdminBookingNotifications"));
const AdminBookingAnalytics = lazy(() => import("./modules/admin/admin-pages/AdminBookingAnalytics"));
const AdminApprovals = lazy(() => import("./modules/admin/admin-pages/AdminApprovals"));
const AdminBookingDetails = lazy(() => import("./modules/admin/admin-pages/AdminBookingDetails"));
const AdminRatings = lazy(() => import("./modules/admin/admin-pages/AdminRatings"));
const AdminDisputes = lazy(() => import("./modules/admin/admin-pages/AdminDisputes"));
const AdminTeamManagement = lazy(() => import("./modules/admin/admin-pages/AdminTeamManagement"));
const AdminPolicies = lazy(() => import("./modules/admin/admin-pages/AdminPolicies"));
const AdminAgreementLogs = lazy(() => import("./modules/admin/admin-pages/AdminAgreementLogs"));
const AdminExpertAgreementLogs = lazy(() => import("./modules/admin/admin-pages/AdminExpertAgreementLogs"));
const AdminOTPLogs = lazy(() => import("./modules/admin/admin-pages/AdminOTPLogs"));
const AdminActivityLogs = lazy(() => import("./modules/admin/admin-pages/AdminActivityLogs"));
const AdminReports = lazy(() => import("./modules/admin/admin-pages/Reports"));
const AdminNavbar = lazy(() => import("./modules/admin/admin-component/AdminNavbar"));

import NotificationsRedirect from "./components/NotificationsRedirect";
const VerifyReport = lazy(() => import("./modules/shared/pages/VerifyReport"));

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <ToastProvider />
                <AuthProvider>
                <VendorAuthProvider>
                    <AdminAuthProvider>
                        <Router>
                            <ScrollToTop />
                            <NotificationProvider>
                                <LocationPermissionModal />
                                <Routes>
                                    <Route path="/notifications" element={<NotificationsRedirect />} />
                                    <Route path="/notification" element={<NotificationsRedirect />} />
                                    {/* ---------- PUBLIC VERIFY (QR Scan) ---------- */}
                                    <Route
                                        path="/verify/:id"
                                        element={
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <VerifyReport />
                                            </Suspense>
                                        }
                                    />
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
                                        path="/user/verify-login-otp"
                                        element={
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <UserLoginOTPVerification />
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
                                                                path="/status"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserAllBookingsStatus />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/my-bookings"
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
                                                                path="/booking/:bookingId/tracking"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <LiveTrackingPage role="User" />
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
                                                            <Route
                                                                path="/booking/:bookingId/report"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserSurveyReport />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/booking/:bookingId/invoice"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserInvoice />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/survey"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserSurveyFlow />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/survey-reports"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserReports />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/payments-invoices"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserPaymentsInvoices />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/notifications"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserNotificationsPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/notification"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserNotificationsPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            
                                                            <Route
                                                                path="/help-support"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserHelpSupport />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/settings"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserSettingsPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                        </Routes>
                                                    </Suspense>
                                                </main>
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Top-Level Tracking Route Fallback */}
                                    <Route
                                        path="/booking/:bookingId/tracking"
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<LoadingSpinner />}>
                                                    <LiveTrackingPage role="User" />
                                                </Suspense>
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
                                                <main className="px-4 pb-20 pt-20 md:pb-12 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
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
                                                                path="/reviews"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorReviews />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/booking/:bookingId/report"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserSurveyReport />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/booking/:bookingId/tracking"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <LiveTrackingPage role="Vendor" />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/booking/:bookingId/invoice"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorInvoice />
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
                                                            <Route
                                                                path="/notifications"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserNotificationsPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/notification"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <UserNotificationsPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/about"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorAbout />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/help"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorHelpSupport />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/faqs"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorHelpSupport />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/agreement"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorPolicyPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/privacy"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorPolicyPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/terms"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorPolicyPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/insurance"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorPolicyPage />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/settings"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <VendorSettings />
                                                                    </Suspense>
                                                                }
                                                            />
                                                            <Route
                                                                path="/agreement"
                                                                element={
                                                                    <Suspense fallback={<LoadingSpinner />}>
                                                                        <ExpertAgreementScreen />
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
                                                <div className="min-h-screen bg-[#F6F7F9]">
                                                    <Suspense fallback={<LoadingSpinner />}>
                                                        <AdminNavbar />
                                                    </Suspense>
                                                    <div className="lg:pl-[278px] min-h-screen flex flex-col">
                                                        <main className="flex-1 p-6 md:p-8 pt-24 md:pt-28">
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
                                                                        path="/expert-agreements"
                                                                        element={
                                                                            <Suspense fallback={<LoadingSpinner />}>
                                                                                <AdminExpertAgreementLogs />
                                                                            </Suspense>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/booking/:bookingId/tracking"
                                                                        element={
                                                                            <Suspense fallback={<LoadingSpinner />}>
                                                                                <LiveTrackingPage role="User" />
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
                                                                        path="/bookings/notifications"
                                                                        element={
                                                                            <Suspense fallback={<LoadingSpinner />}>
                                                                                <AdminBookingNotifications />
                                                                            </Suspense>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/notifications"
                                                                        element={
                                                                            <Suspense fallback={<LoadingSpinner />}>
                                                                                <UserNotificationsPage />
                                                                            </Suspense>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/notification"
                                                                        element={
                                                                            <Suspense fallback={<LoadingSpinner />}>
                                                                                <UserNotificationsPage />
                                                                            </Suspense>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminVendors />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors/pending"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPendingVendors />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors/:vendorId"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminVendorDetails />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors/wallets"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminVendorWallets />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors/bookings"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminVendorBookings />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors/transactions"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminVendorTransactions />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/vendors/analytics"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="vendors">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminVendorAnalytics />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/users"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="users">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminUsers />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/users/bookings"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="users">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminUserBookings />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/users/transactions"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="users">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminUserTransactions />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/users/analytics"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="users">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminUserAnalytics />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/users/:userId"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="users">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminUserDetails />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/bookings"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="bookings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminBookings />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/bookings/tracking"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="bookings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminBookingTracking />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/bookings/notifications"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="bookings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminBookingNotifications />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/bookings/analytics"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="bookings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminBookingAnalytics />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments/admin"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments defaultTab="admin-overview" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments/admin/transactions"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments defaultTab="admin-transactions" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments/user"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments defaultTab="user-overview" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments/user/transactions"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments defaultTab="user-transactions" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments/vendor"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments defaultTab="vendor-payments" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/payments/vendor/transactions"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPayments defaultTab="vendor-transactions" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/withdrawals"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminWithdrawals />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/user-withdrawals"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="finance">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminUserWithdrawals />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="hub" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/general"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="general" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/reschedule"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="reschedule" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/billing"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="billing" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/pricing"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="pricing" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/security"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="security" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/languages"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="languages" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/settings/register"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="settings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminSettings defaultTab="register" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/policies"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="policies">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPolicies defaultTab="hub" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/policies/legal"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="policies">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPolicies defaultTab="legal" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/policies/privacy"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="policies">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPolicies defaultTab="privacy" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/policies/cancellation"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="policies">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPolicies defaultTab="cancellation" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/policies/expert"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="policies">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminPolicies defaultTab="expert" />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/agreements"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="agreement-logs">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminAgreementLogs />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/expert-agreements"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="agreement-logs">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminExpertAgreementLogs />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/otp-logs"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="agreement-logs">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminOTPLogs />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/activity-logs"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="agreement-logs">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminActivityLogs />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/team"
                                                                        element={
                                                                            <AdminProtectedRoute requiredRole="SUPER_ADMIN">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminTeamManagement />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/approvals"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="approvals">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminApprovals />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/bookings/:bookingId"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="bookings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminBookingDetails />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/reports/*"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="reports">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminReports />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/ratings"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="ratings">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminRatings />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
                                                                        }
                                                                    />
                                                                    <Route
                                                                        path="/disputes"
                                                                        element={
                                                                            <AdminProtectedRoute requiredPermission="disputes">
                                                                                <Suspense fallback={<LoadingSpinner />}>
                                                                                    <AdminDisputes />
                                                                                </Suspense>
                                                                            </AdminProtectedRoute>
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
                            </NotificationProvider>
                        </Router>
                    </AdminAuthProvider>
                </VendorAuthProvider>
            </AuthProvider>
        </LanguageProvider>
    </ThemeProvider>
    );
}

export default App;
