import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import UserLogin from "./modules/user/user-pages/UserLogin";
import UserSignup from "./modules/user/user-pages/UserSignup";
import UserDashboard from "./modules/user/user-pages/UserDashboard";
import VendorLogin from "./modules/vendor/vendor-pages/VendorLogin";
import VendorSignup from "./modules/vendor/vendor-pages/VendorSignup";
import UserNavbar from "./modules/user/user-components/UserNavbar";
import VendorNavbar from "./modules/vendor/vendor-components/VendorNavbar";
import UserServiceProvider from "./modules/user/user-pages/UserServiceProvider";
import UserStatus from "./modules/user/user-pages/UserStatus";
import UserBookingHistory from "./modules/user/user-pages/UserBookingHistory";
import UserProfile from "./modules/user/user-pages/UserProfile";
import VendorDashboard from "./modules/vendor/vendor-pages/VendorDashboard";
import VendorBookings from "./modules/vendor/vendor-pages/VendorBookings";
import VendorStatus from "./modules/vendor/vendor-pages/VendorStatus";
import VendorWallet from "./modules/vendor/vendor-pages/VendorWallet";
import VendorProfile from "./modules/vendor/vendor-pages/VendorProfile";
import VendorRequests from "./modules/vendor/vendor-pages/VendorRequests";
import VendorServices from "./modules/vendor/vendor-pages/VendorServices";

function App() {
    return (
        <Router>
            <Routes>
                {/* ---------- USER AUTH ---------- */}
                <Route path="/userlogin" element={<UserLogin />} />
                <Route path="/usersignup" element={<UserSignup />} />

                {/* ---------- USER PANEL (Nested with Navbar) ---------- */}
                <Route
                    path="/user/*"
                    element={
                        <>
                            <UserNavbar />
                            <main className="px-4 pb-28 pt-24 md:pb-8 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
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
                                        element={<UserDashboard />}
                                    />
                                    <Route
                                        path="/serviceprovider"
                                        element={<UserServiceProvider />}
                                    />
                                    <Route
                                        path="/status"
                                        element={<UserStatus />}
                                    />
                                    <Route
                                        path="/history"
                                        element={<UserBookingHistory />}
                                    />
                                    <Route
                                        path="/profile"
                                        element={<UserProfile />}
                                    />
                                </Routes>
                            </main>
                        </>
                    }
                />

                {/* ---------- VENDOR AUTH ---------- */}
                <Route path="/vendorlogin" element={<VendorLogin />} />
                <Route path="/vendorsignup" element={<VendorSignup />} />

                {/* ---------- VENDOR PANEL (Nested with Navbar) ---------- */}
                <Route
                    path="/vendor/*"
                    element={
                        <>
                            <VendorNavbar />
                            <main className="px-4 pb-28 pt-24 md:pb-8 md:pt-28 md:px-6 md:max-w-7xl md:mx-auto">
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
                                        element={<VendorDashboard />}
                                    />
                                    <Route
                                        path="/bookings"
                                        element={<VendorBookings />}
                                    />
                                    <Route
                                        path="/status"
                                        element={<VendorStatus />}
                                    />
                                    <Route
                                        path="/wallet"
                                        element={<VendorWallet />}
                                    />
                                    <Route
                                        path="/profile"
                                        element={<VendorProfile />}
                                    />
                                    <Route
                                        path="/requests"
                                        element={<VendorRequests />}
                                    />
                                    <Route
                                        path="/services"
                                        element={<VendorServices />}
                                    />
                                </Routes>
                            </main>
                        </>
                    }
                />

                {/* ---------- DEFAULT REDIRECT ---------- */}
                {/* <Route path="/" element={<Navigate to="/userlogin" replace />} /> */}
            </Routes>
        </Router>
    );
}

export default App;
