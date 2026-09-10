import { useState, useEffect } from "react";
import { getUserWalletBalance, getUserWalletTransactions, createUserWithdrawalRequest, saveUserPayoutDetails, removeUserPayoutDetails, verifyIFSCCode } from "../../../services/userApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import {
    IoSearchOutline,
    IoChevronBackOutline,
    IoChevronForwardOutline,
    IoCloseOutline,
    IoFilterOutline,
    IoCheckmarkCircle,
    IoAlertCircle,
    IoEyeOutline,
    IoEyeOffOutline
} from "react-icons/io5";

export default function UserWallet() {
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [totalCredited, setTotalCredited] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const toast = useToast();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processingWithdraw, setProcessingWithdraw] = useState(false);

    // Filter & Pagination States for Transactions
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, REFUND, WITHDRAWAL
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, SUCCESS, PENDING, FAILED
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTransactions: 0, limit: 10 });
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const activeFilterCount = (typeFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

    // Active Tab: "TRANSACTIONS" | "WITHDRAWALS"
    const [activeTab, setActiveTab] = useState("TRANSACTIONS");

    // Filter & Pagination States for Withdrawal Requests
    const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("ALL"); // ALL, PENDING, APPROVED, PROCESSED, REJECTED
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const withdrawalItemsPerPage = 5;

    // Filtered & Paginated Withdrawal Requests
    const filteredWithdrawalRequests = withdrawalRequests.filter((req) => {
        if (withdrawalStatusFilter === "ALL") return true;
        return req.status === withdrawalStatusFilter;
    });
    const totalWithdrawalPages = Math.max(1, Math.ceil(filteredWithdrawalRequests.length / withdrawalItemsPerPage));
    const paginatedWithdrawalRequests = filteredWithdrawalRequests.slice(
        (withdrawalPage - 1) * withdrawalItemsPerPage,
        withdrawalPage * withdrawalItemsPerPage
    );
    const pendingWithdrawalsCount = withdrawalRequests.filter(
        (r) => r.status === "PENDING" || r.status === "APPROVED"
    ).length;

    const loadTransactions = async (page = 1, limit = 10, type = "ALL", status = "ALL", search = "", showSpinner = false) => {
        try {
            if (showSpinner) setTransactionsLoading(true);
            const params = { page, limit };
            if (type && type !== "ALL") params.type = type;
            if (status && status !== "ALL") params.status = status;
            if (search && search.trim()) params.search = search.trim();

            const res = await getUserWalletTransactions(params);
            if (res.success) {
                setTransactions(res.data.transactions || []);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        } catch (err) {
            handleApiError(err, "Failed to load transactions");
        } finally {
            if (showSpinner) setTransactionsLoading(false);
        }
    };

    const loadWalletData = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            
            // Get wallet balance and summary
            const balanceResponse = await getUserWalletBalance();
            if (balanceResponse.success) {
                setWalletBalance(balanceResponse.data.walletBalance || 0);
                setTotalCredited(balanceResponse.data.totalCredited || 0);
                setWithdrawalRequests(balanceResponse.data.withdrawalRequests || []);

                // Pre-fill payout details from DB if available
                const saved = balanceResponse.data.savedPayoutDetails;
                if (saved) {
                    if (saved.payoutType) {
                        setPayoutType(saved.payoutType);
                    }
                    if (saved.upiId) {
                        setUpiId(saved.upiId);
                        localStorage.setItem("user_withdrawal_upi", saved.upiId);
                    }
                    if (saved.accountDetails && (saved.accountDetails.accountNumber || saved.accountDetails.ifscCode)) {
                        const acc = {
                            accountHolderName: saved.accountDetails.accountHolderName || "",
                            accountNumber: saved.accountDetails.accountNumber || "",
                            ifscCode: saved.accountDetails.ifscCode || "",
                            bankName: saved.accountDetails.bankName || ""
                        };
                        setAccountDetails(acc);
                        setConfirmAccountNumber(acc.accountNumber);
                        localStorage.setItem("user_withdrawal_bank", JSON.stringify(acc));
                    }
                }
            }

            // Load transactions with current filters
            await loadTransactions(currentPage, itemsPerPage, typeFilter, statusFilter, debouncedSearch, false);
        } catch (err) {
            handleApiError(err, "Failed to load wallet data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadWalletData(true);
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch transactions when filters or page change
    useEffect(() => {
        if (!loading) {
            loadTransactions(currentPage, itemsPerPage, typeFilter, statusFilter, debouncedSearch, true);
        }
    }, [currentPage, itemsPerPage, typeFilter, statusFilter, debouncedSearch]);

    // Auto-refresh when tab/window gains focus or visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadWalletData(false);
            }
        };
        window.addEventListener('focus', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('focus', handleVisibilityChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Real-time socket updates (auto-updates withdrawal requests & balance without manual refresh)
    useEffect(() => {
        if (!socket) return;

        const handleWalletUpdate = (data) => {
            console.log('[UserWallet] Real-time wallet update received:', data);
            loadWalletData(false);
        };

        const handleNotification = (notif) => {
            if (
                notif?.type?.startsWith('WITHDRAWAL_') ||
                notif?.type?.startsWith('WALLET_') ||
                notif?.relatedEntity?.entityType === 'UserWithdrawalRequest' ||
                notif?.relatedEntity?.entityType === 'Wallet' ||
                notif?.metadata?.link === '/user/wallet'
            ) {
                console.log('[UserWallet] Withdrawal/wallet notification received:', notif);
                loadWalletData(false);
            }
        };

        socket.on('wallet_updated', handleWalletUpdate);
        socket.on('withdrawal_updated', handleWalletUpdate);
        socket.on('new_notification', handleNotification);

        return () => {
            socket.off('wallet_updated', handleWalletUpdate);
            socket.off('withdrawal_updated', handleWalletUpdate);
            socket.off('new_notification', handleNotification);
        };
    }, [socket]);

    const [payoutType, setPayoutType] = useState("UPI");
    const [upiId, setUpiId] = useState(() => localStorage.getItem("user_withdrawal_upi") || "");
    const [accountDetails, setAccountDetails] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user_withdrawal_bank")) || { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" };
        } catch {
            return { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" };
        }
    });
    const [confirmAccountNumber, setConfirmAccountNumber] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("user_withdrawal_bank"));
            return saved?.accountNumber || "";
        } catch {
            return "";
        }
    });
    const [showConfirmAccEye, setShowConfirmAccEye] = useState(false);
    const [ifscStatus, setIfscStatus] = useState({ loading: false, verified: false, error: "", bank: "", branch: "" });
    const [showPayoutManageModal, setShowPayoutManageModal] = useState(false);
    const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
    const [savingPayout, setSavingPayout] = useState(false);
    const [removingPayout, setRemovingPayout] = useState(false);

    const validateAccountNumber = (num) => {
        if (!num) return { isValid: false, message: "Bank Account Number is required" };
        const clean = String(num).replace(/[\s-]/g, '').trim();
        if (!/^\d+$/.test(clean)) {
            return { isValid: false, message: "Bank Account Number must contain numbers only" };
        }
        if (clean.length < 9 || clean.length > 18) {
            return { isValid: false, message: `Bank Account Number must be between 9 and 18 digits (current: ${clean.length})` };
        }
        if (/^0+$/.test(clean)) {
            return { isValid: false, message: "Bank Account Number cannot be all zeros" };
        }
        return { isValid: true, sanitized: clean };
    };

    const validateConfirmAccountNumber = (acc, conf) => {
        if (!conf) return { isValid: false, message: "Please confirm your bank account number" };
        const cleanAcc = String(acc || '').replace(/[\s-]/g, '').trim();
        const cleanConf = String(conf || '').replace(/[\s-]/g, '').trim();
        if (cleanAcc !== cleanConf) {
            return { isValid: false, message: "Account numbers do not match" };
        }
        return { isValid: true };
    };

    const validateIFSC = (code) => {
        if (!code) return { isValid: false, message: "IFSC Code is required" };
        const clean = String(code).replace(/[\s-]/g, '').trim().toUpperCase();
        if (clean.length !== 11) {
            return { isValid: false, message: `IFSC Code must be exactly 11 characters (current: ${clean.length}/11)` };
        }
        if (!/^[A-Z]{4}/.test(clean)) {
            return { isValid: false, message: "First 4 characters must be bank code letters (e.g. SBIN)" };
        }
        if (clean[4] !== '0') {
            return { isValid: false, message: "5th character of IFSC must be 0 (Zero)" };
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
            return { isValid: false, message: "Invalid IFSC format. Must be 4 letters, a 0 (zero), followed by 6 alphanumeric characters" };
        }
        return { isValid: true, sanitized: clean };
    };

    const validateAccountHolderName = (name) => {
        if (!name || !String(name).trim()) return { isValid: false, message: "Account Holder Name is required" };
        const clean = String(name).trim();
        if (clean.length < 3) return { isValid: false, message: "Account Holder Name must be at least 3 characters" };
        if (!/^[a-zA-Z\s.'-]+$/.test(clean)) return { isValid: false, message: "Account Holder Name should only contain letters and spaces" };
        return { isValid: true, sanitized: clean };
    };

    const validateBankName = (name) => {
        if (!name || !String(name).trim()) return { isValid: false, message: "Bank Name is required" };
        const clean = String(name).trim();
        if (clean.length < 2) return { isValid: false, message: "Bank Name must be at least 2 characters" };
        return { isValid: true, sanitized: clean };
    };

    const handleIFSCChange = async (rawVal) => {
        const val = rawVal.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        setAccountDetails(prev => ({ ...prev, ifscCode: val }));

        if (val.length < 11) {
            setIfscStatus({ loading: false, verified: false, error: "", bank: "", branch: "" });
            return;
        }

        const check = validateIFSC(val);
        if (!check.isValid) {
            setIfscStatus({ loading: false, verified: false, error: check.message, bank: "", branch: "" });
            return;
        }

        try {
            setIfscStatus({ loading: true, verified: false, error: "", bank: "", branch: "" });
            const res = await verifyIFSCCode(val);
            if (res.success && res.data) {
                const bankName = res.data.bank || res.data.BANK || "";
                const branchName = res.data.branch || res.data.BRANCH || "";
                setIfscStatus({
                    loading: false,
                    verified: true,
                    error: "",
                    bank: bankName,
                    branch: branchName
                });
                if (bankName) {
                    setAccountDetails(prev => ({
                        ...prev,
                        bankName: bankName
                    }));
                }
            } else {
                setIfscStatus({
                    loading: false,
                    verified: false,
                    error: res.message || "IFSC not recognized by RBI database",
                    bank: "",
                    branch: ""
                });
            }
        } catch {
            // Direct Razorpay public fallback
            try {
                const fallbackRes = await fetch(`https://ifsc.razorpay.com/${val}`);
                if (fallbackRes.status === 404) {
                    setIfscStatus({
                        loading: false,
                        verified: false,
                        error: `IFSC "${val}" not found in RBI database`,
                        bank: "",
                        branch: ""
                    });
                    return;
                }
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    const bankName = data.BANK || "";
                    const branchName = data.BRANCH || "";
                    setIfscStatus({
                        loading: false,
                        verified: true,
                        error: "",
                        bank: bankName,
                        branch: branchName
                    });
                    if (bankName) {
                        setAccountDetails(prev => ({
                            ...prev,
                            bankName: bankName
                        }));
                    }
                    return;
                }
            } catch {
                // Ignore offline error
            }
            setIfscStatus({ loading: false, verified: true, error: "", bank: "", branch: "" });
        }
    };

    const validateUPI = (upi) => {
        if (!upi) return { isValid: false, message: "UPI ID is required" };
        const clean = String(upi).trim();
        if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/.test(clean)) {
            return { isValid: false, message: "Please enter a valid UPI ID (e.g. name@upi, 9876543210@paytm)" };
        }
        return { isValid: true, sanitized: clean };
    };

    const hasSavedPayout = Boolean(
        (upiId && upiId.trim()) ||
        (accountDetails && accountDetails.accountNumber && accountDetails.accountNumber.trim())
    );

    const handleSavePayoutDetails = async (e) => {
        if (e) e.preventDefault();
        if (payoutType === "UPI") {
            const upiCheck = validateUPI(upiId);
            if (!upiCheck.isValid) {
                toast.showError(upiCheck.message);
                return;
            }
        }
        if (payoutType === "BANK_TRANSFER") {
            const holderCheck = validateAccountHolderName(accountDetails.accountHolderName);
            if (!holderCheck.isValid) {
                toast.showError(holderCheck.message);
                return;
            }
            const accCheck = validateAccountNumber(accountDetails.accountNumber);
            if (!accCheck.isValid) {
                toast.showError(accCheck.message);
                return;
            }
            const confCheck = validateConfirmAccountNumber(accountDetails.accountNumber, confirmAccountNumber);
            if (!confCheck.isValid) {
                toast.showError(confCheck.message);
                return;
            }
            const ifscCheck = validateIFSC(accountDetails.ifscCode);
            if (!ifscCheck.isValid) {
                toast.showError(ifscCheck.message);
                return;
            }
            if (ifscStatus.error) {
                toast.showError(ifscStatus.error);
                return;
            }
            const bankCheck = validateBankName(accountDetails.bankName);
            if (!bankCheck.isValid) {
                toast.showError(bankCheck.message);
                return;
            }
        }

        try {
            setSavingPayout(true);
            const res = await saveUserPayoutDetails({
                payoutType,
                upiId: payoutType === "UPI" ? upiId.trim() : null,
                accountDetails: payoutType === "BANK_TRANSFER" ? {
                    ...accountDetails,
                    accountHolderName: accountDetails.accountHolderName.trim(),
                    accountNumber: accountDetails.accountNumber.trim(),
                    confirmAccountNumber: confirmAccountNumber.trim(),
                    ifscCode: accountDetails.ifscCode.trim().toUpperCase(),
                    bankName: accountDetails.bankName.trim()
                } : null
            });
            if (res.success) {
                toast.showSuccess("Payout details saved successfully!");
                if (payoutType === "UPI") {
                    localStorage.setItem("user_withdrawal_upi", upiId.trim());
                } else {
                    localStorage.setItem("user_withdrawal_bank", JSON.stringify(accountDetails));
                }
                setShowPayoutManageModal(false);
                await loadWalletData(false);
            }
        } catch (err) {
            handleApiError(err, "Failed to save payout details");
        } finally {
            setSavingPayout(false);
        }
    };

    const handleRemovePayoutDetails = async () => {
        try {
            setRemovingPayout(true);
            const res = await removeUserPayoutDetails();
            if (res.success) {
                toast.showSuccess("Payout account unlinked successfully!");
                setUpiId("");
                setAccountDetails({ accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" });
                setConfirmAccountNumber("");
                setIfscStatus({ loading: false, verified: false, error: "", bank: "", branch: "" });
                localStorage.removeItem("user_withdrawal_upi");
                localStorage.removeItem("user_withdrawal_bank");
                setShowRemoveConfirmModal(false);
                await loadWalletData(false);
            }
        } catch (err) {
            handleApiError(err, "Failed to unlink payout details");
        } finally {
            setRemovingPayout(false);
        }
    };

    const handleWithdrawClick = () => {
        if (walletBalance >= 1000) {
            setConfirmAccountNumber(accountDetails.accountNumber || "");
            setShowWithdrawModal(true);
            setWithdrawAmount("");
            if (accountDetails.ifscCode && accountDetails.ifscCode.length === 11) {
                handleIFSCChange(accountDetails.ifscCode);
            }
        } else {
            toast.showError("Minimum withdrawal amount is ₹1,000");
        }
    };

    const handleAmountChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setWithdrawAmount('');
            return;
        }
        if (val.startsWith('-')) return;

        const num = parseFloat(val);
        if (!isNaN(num) && num > walletBalance) {
            setWithdrawAmount(walletBalance.toString());
        } else {
            setWithdrawAmount(val);
        }
    };

    const handleWithdrawSubmit = async (e) => {
        if (e) e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        
        if (!amount || amount <= 0) {
            toast.showError("Please enter a valid amount");
            return;
        }

        if (amount < 1000) {
            toast.showError("Minimum withdrawal amount is ₹1,000");
            return;
        }

        if (amount > walletBalance) {
            toast.showError("Insufficient wallet balance");
            return;
        }

        if (payoutType === "UPI") {
            const upiCheck = validateUPI(upiId);
            if (!upiCheck.isValid) {
                toast.showError(upiCheck.message);
                return;
            }
        }

        if (payoutType === "BANK_TRANSFER") {
            const holderCheck = validateAccountHolderName(accountDetails.accountHolderName);
            if (!holderCheck.isValid) {
                toast.showError(holderCheck.message);
                return;
            }
            const accCheck = validateAccountNumber(accountDetails.accountNumber);
            if (!accCheck.isValid) {
                toast.showError(accCheck.message);
                return;
            }
            const confCheck = validateConfirmAccountNumber(accountDetails.accountNumber, confirmAccountNumber);
            if (!confCheck.isValid) {
                toast.showError(confCheck.message);
                return;
            }
            const ifscCheck = validateIFSC(accountDetails.ifscCode);
            if (!ifscCheck.isValid) {
                toast.showError(ifscCheck.message);
                return;
            }
            if (ifscStatus.error) {
                toast.showError(ifscStatus.error);
                return;
            }
            const bankCheck = validateBankName(accountDetails.bankName);
            if (!bankCheck.isValid) {
                toast.showError(bankCheck.message);
                return;
            }
        }

        try {
            setProcessingWithdraw(true);
            
            // Save payout details for future withdrawals
            if (payoutType === "UPI") {
                localStorage.setItem("user_withdrawal_upi", upiId.trim());
            } else {
                localStorage.setItem("user_withdrawal_bank", JSON.stringify(accountDetails));
            }

            const response = await createUserWithdrawalRequest(amount, {
                payoutType,
                upiId: payoutType === "UPI" ? upiId.trim() : null,
                accountDetails: payoutType === "BANK_TRANSFER" ? accountDetails : null
            });

            if (response.success) {
                handleApiSuccess("Withdrawal request submitted successfully!");
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                setActiveTab("WITHDRAWALS");
                loadWalletData(); // Reload data
            }
        } catch (err) {
            handleApiError(err, "Failed to create withdrawal request");
        } finally {
            setProcessingWithdraw(false);
        }
    };

    // Format amount with 2 decimal places
    const formatAmount = (amount) => {
        return amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get transaction type label
    const getTransactionTypeLabel = (type) => {
        const labels = {
            'REFUND': 'Refund',
            'WITHDRAWAL_REQUEST': 'Withdrawal Request',
            'WITHDRAWAL_PROCESSED': 'Withdrawal Processed',
            'WITHDRAWAL_REJECTED': 'Withdrawal Rejected'
        };
        return labels[type] || type;
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const colors = {
            'SUCCESS': 'text-[#34C759]',
            'PENDING': 'text-[#FF9F0A]',
            'FAILED': 'text-red-500',
            'APPROVED': 'text-blue-500',
            'REJECTED': 'text-red-500',
            'PROCESSED': 'text-[#34C759]'
        };
        return colors[status] || 'text-gray-500';
    };

    if (loading) {
        return <LoadingSpinner message="Loading wallet..." />;
    }

    return (
        <>
        <PageContainer>
            {/* Hydro Aqua Ocean Balance Card */}
            <section className="relative my-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F52BA] via-[#0A84FF] to-[#00C49F] p-6 text-white shadow-xl shadow-cyan-500/15 border border-cyan-400/30">
                {/* Hydro Ripple Background Waves */}
                <div className="absolute inset-0 z-0 opacity-25">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#E0F7FA" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(15px)' }}>
                        <path fill="#00E5FF" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-cyan-100 border border-white/25 mb-2 shadow-2xs">
                        <span>My Wallet</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-100 opacity-90">Available Refund & Credit Balance</p>
                    <p className="mt-1 text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
                        ₹{formatAmount(walletBalance)}
                    </p>
                    {walletBalance >= 1000 && (
                        <button
                            onClick={handleWithdrawClick}
                            className="mt-4 w-full max-w-xs rounded-2xl bg-white/20 px-8 py-3 font-extrabold text-white backdrop-blur-md border border-white/30 shadow-lg shadow-cyan-500/20 hover:bg-white/30 active:scale-95 transition-all"
                        >
                            Request Withdrawal 💸
                        </button>
                    )}
                </div>
            </section>

            {/* Hydro Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white p-3 shadow-xs border border-gray-100 hover:border-emerald-300 transition-all">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                        <span className="material-symbols-outlined text-lg sm:text-xl font-bold">payments</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-500 truncate">Total Refunded</p>
                        <p className="text-sm sm:text-base font-black text-emerald-600 truncate">
                            ₹{formatAmount(totalCredited)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white p-3 shadow-xs border border-gray-100 hover:border-teal-300 transition-all">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                        <span className="material-symbols-outlined text-lg sm:text-xl font-bold">account_balance_wallet</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-500 truncate">Available Balance</p>
                        <p className="text-sm sm:text-base font-black text-teal-700 truncate">
                            ₹{formatAmount(walletBalance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Linked Payout Method Card (Bank Account / UPI) */}
            <div className="mb-5 rounded-2xl bg-white p-4 shadow-xs border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-blue-200">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0A84FF] shrink-0 text-2xl font-bold shadow-xs">
                        {hasSavedPayout ? (payoutType === 'BANK_TRANSFER' ? '🏦' : '⚡') : '💳'}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-slate-800">
                                {hasSavedPayout 
                                    ? (payoutType === 'BANK_TRANSFER' ? 'Linked Bank Account' : 'Linked UPI ID')
                                    : 'No Linked Payout Method'}
                            </p>
                            {hasSavedPayout && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Saved for Disbursals
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                            {hasSavedPayout ? (
                                payoutType === 'BANK_TRANSFER' ? (
                                    <>
                                        <span className="font-semibold text-slate-800">{accountDetails.bankName || 'Bank'}</span>
                                        {' '}••••{accountDetails.accountNumber ? accountDetails.accountNumber.slice(-4) : '----'}
                                        {accountDetails.ifscCode ? ` (${accountDetails.ifscCode})` : ''}
                                        {accountDetails.accountHolderName ? ` • ${accountDetails.accountHolderName}` : ''}
                                    </>
                                ) : (
                                    <span className="font-semibold text-blue-600 font-mono">{upiId}</span>
                                )
                            ) : (
                                'Add your Bank Account or UPI to receive refund payouts smoothly.'
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {hasSavedPayout ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirmAccountNumber(accountDetails.accountNumber || "");
                                    setShowPayoutManageModal(true);
                                    if (accountDetails.ifscCode && accountDetails.ifscCode.length === 11) {
                                        handleIFSCChange(accountDetails.ifscCode);
                                    }
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0A84FF] bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                                Edit / Change
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRemoveConfirmModal(true)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                                Remove
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setConfirmAccountNumber(accountDetails.accountNumber || "");
                                setShowPayoutManageModal(true);
                                if (accountDetails.ifscCode && accountDetails.ifscCode.length === 11) {
                                    handleIFSCChange(accountDetails.ifscCode);
                                }
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>+ Link Account / UPI</span>
                        </button>
                    )}
                </div>
            </div>

            {/* View Tabs: All Transactions vs Withdrawal Requests */}
            <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("TRANSACTIONS")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "TRANSACTIONS"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <span className="material-symbols-outlined !text-base">receipt_long</span>
                        <span>All Transactions</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === "TRANSACTIONS" ? "bg-blue-50 text-[#0A84FF]" : "bg-slate-200 text-slate-600"
                        }`}>
                            {pagination.totalTransactions}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("WITHDRAWALS")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                            activeTab === "WITHDRAWALS"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <span className="material-symbols-outlined !text-base">account_balance_wallet</span>
                        <span>Withdrawal Requests</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === "WITHDRAWALS" ? "bg-blue-50 text-[#0A84FF]" : "bg-slate-200 text-slate-600"
                        }`}>
                            {withdrawalRequests.length}
                        </span>
                        {pendingWithdrawalsCount > 0 && (
                            <span className="flex h-2 w-2 relative" title={`${pendingWithdrawalsCount} active request(s)`}>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                        )}
                    </button>
                </div>

                {refreshing && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        Syncing...
                    </span>
                )}
            </div>

            {/* Tab 1: Withdrawal Requests */}
            {activeTab === "WITHDRAWALS" && (
                <div className="space-y-4 mb-8">
                    {/* Header with Sub-filters */}
                    <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Withdrawal Requests</h2>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {filteredWithdrawalRequests.length} of {withdrawalRequests.length}
                            </span>
                        </div>

                        {walletBalance >= 1000 && (
                            <button
                                type="button"
                                onClick={handleWithdrawClick}
                                className="px-3.5 py-1.5 bg-[#0A84FF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                                <span>+ Request Withdrawal</span>
                            </button>
                        )}
                    </div>

                    {/* Status Filter for Withdrawal Requests */}
                    {withdrawalRequests.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                { id: "ALL", label: `All (${withdrawalRequests.length})`, count: withdrawalRequests.length },
                                { id: "PENDING", label: `Pending (${withdrawalRequests.filter(r => r.status === 'PENDING').length})`, count: withdrawalRequests.filter(r => r.status === 'PENDING').length },
                                { id: "APPROVED", label: `Approved (${withdrawalRequests.filter(r => r.status === 'APPROVED').length})`, count: withdrawalRequests.filter(r => r.status === 'APPROVED').length },
                                { id: "PROCESSED", label: `Processed (${withdrawalRequests.filter(r => r.status === 'PROCESSED').length})`, count: withdrawalRequests.filter(r => r.status === 'PROCESSED').length },
                                { id: "REJECTED", label: `Rejected (${withdrawalRequests.filter(r => r.status === 'REJECTED').length})`, count: withdrawalRequests.filter(r => r.status === 'REJECTED').length },
                            ]
                                .filter((f) => f.id === "ALL" || f.count > 0)
                                .map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => {
                                            setWithdrawalStatusFilter(f.id);
                                            setWithdrawalPage(1);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                                            withdrawalStatusFilter === f.id
                                                ? "bg-slate-900 text-white shadow-xs"
                                                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                        </div>
                    )}

                    {/* Cards List */}
                    {withdrawalRequests.length === 0 ? (
                        <div className="rounded-2xl bg-white p-10 text-center shadow-xs border border-gray-100">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0A84FF] flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                            </div>
                            <p className="text-gray-900 text-sm font-bold">No withdrawal requests yet</p>
                            <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                                When you request payouts for your refundable credits, you can track their status and payout reference here.
                            </p>
                            {walletBalance >= 1000 && (
                                <button
                                    type="button"
                                    onClick={handleWithdrawClick}
                                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#0A84FF] to-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                                >
                                    Request Withdrawal 💸
                                </button>
                            )}
                        </div>
                    ) : paginatedWithdrawalRequests.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
                            No withdrawal requests match the selected status.
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={() => setWithdrawalStatusFilter("ALL")}
                                    className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg cursor-pointer"
                                >
                                    Show All Requests
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {paginatedWithdrawalRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100 hover:border-blue-200 transition-all"
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
                                        request.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        request.status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        request.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}>
                                        <span className="material-symbols-outlined font-bold text-xl">
                                            {request.status === 'PROCESSED' ? 'check_circle' :
                                             request.status === 'REJECTED' ? 'cancel' :
                                             request.status === 'APPROVED' ? 'verified' : 'pending'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-extrabold text-gray-900 text-sm">
                                                Withdrawal Request
                                            </p>
                                            {request.payoutType === 'UPI' && request.upiId && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    ⚡ {request.upiId}
                                                </span>
                                            )}
                                            {request.payoutType === 'BANK_TRANSFER' && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    🏦 {request.accountDetails?.bankName || 'Bank'} ••••{request.accountDetails?.accountNumber?.slice(-4) || ''}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            {formatDateTime(request.requestedAt)}
                                        </p>
                                        {request.status === 'PROCESSED' && request.transactionReference && (
                                            <p className="text-xs text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                                                UTR / Ref: {request.transactionReference}
                                            </p>
                                        )}
                                        {request.rejectionReason && (
                                            <p className="text-xs text-rose-600 mt-1 font-semibold bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                                                Reason: {request.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-extrabold text-gray-900 text-sm">
                                            ₹{formatAmount(request.amount)}
                                        </p>
                                        <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Withdrawal Requests Pagination if > 1 page */}
                    {totalWithdrawalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 px-1 text-xs font-semibold text-slate-500">
                            <span>Page {withdrawalPage} of {totalWithdrawalPages}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={withdrawalPage === 1}
                                    onClick={() => setWithdrawalPage(p => Math.max(1, p - 1))}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    aria-label="Previous Page"
                                >
                                    <IoChevronBackOutline className="text-sm" />
                                </button>
                                <button
                                    type="button"
                                    disabled={withdrawalPage === totalWithdrawalPages}
                                    onClick={() => setWithdrawalPage(p => Math.min(totalWithdrawalPages, p + 1))}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    aria-label="Next Page"
                                >
                                    <IoChevronForwardOutline className="text-sm" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Transaction History */}
            {activeTab === "TRANSACTIONS" && (
                <div className="space-y-3 mb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Transaction History</h2>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {pagination.totalTransactions}
                            </span>
                        </div>
                    </div>

                    {/* Filter & Search Bar - Compact & Sticky on scroll */}
                    <div className="sticky top-[62px] md:top-[74px] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-sm space-y-2.5 transition-all">
                        {/* Search Input & Filter Button */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by description or reference..."
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                                    >
                                        <IoCloseOutline />
                                    </button>
                                )}
                            </div>

                            {/* Filter Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setShowFilters(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                                    showFilters || activeFilterCount > 0
                                        ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-xs"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                                title="Toggle Filters"
                            >
                                <IoFilterOutline className="text-sm" />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                                        showFilters || activeFilterCount > 0 ? "bg-white text-[#0A84FF]" : "bg-[#0A84FF] text-white"
                                    }`}>
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Collapsible Filter Options */}
                        {showFilters && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* Type Filters */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Type:</span>
                                    {[
                                        { id: "ALL", label: "All Activities" },
                                        { id: "REFUND", label: "Refund Credits" },
                                        { id: "WITHDRAWAL", label: "Withdrawals" },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setTypeFilter(t.id);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                                typeFilter === t.id
                                                    ? "bg-[#0A84FF] text-white shadow-xs"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Status Filters */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Status:</span>
                                    {[
                                        { id: "ALL", label: "All" },
                                        { id: "SUCCESS", label: "Success" },
                                        { id: "PENDING", label: "Pending" },
                                        { id: "FAILED", label: "Rejected" },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setStatusFilter(s.id);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                                statusFilter === s.id
                                                    ? "bg-slate-900 text-white shadow-xs"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>

                                {activeFilterCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTypeFilter("ALL");
                                            setStatusFilter("ALL");
                                            setCurrentPage(1);
                                        }}
                                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer ml-auto"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Transaction Cards List */}
                    {transactionsLoading ? (
                        <div className="py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center">
                            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs font-semibold text-slate-500">Loading transactions...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="rounded-2xl bg-white p-10 text-center shadow-xs border border-gray-100">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
                            <p className="text-gray-700 text-sm font-bold">No transactions found</p>
                            <p className="text-gray-400 text-xs mt-1">
                                {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery)
                                    ? "Try adjusting your filters or search query"
                                    : "Transactions will appear here once you receive refunds or request withdrawals"}
                            </p>
                            {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTypeFilter("ALL");
                                        setStatusFilter("ALL");
                                        setSearchQuery("");
                                        setCurrentPage(1);
                                    }}
                                    className="mt-3 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {transactions.map((transaction) => {
                                const isCredit = transaction.type === 'REFUND';
                                const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(transaction.type);
                                const isFailed = transaction.status === 'FAILED' || transaction.status === 'REJECTED' || transaction.type === 'WITHDRAWAL_REJECTED';
                                const isSuccess = transaction.status === 'SUCCESS' && !isFailed;
                                const isPending = transaction.status === 'PENDING' && !isFailed;
                                
                                return (
                                    <div
                                        key={transaction._id}
                                        className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100 hover:border-blue-300 transition-all"
                                    >
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
                                            isFailed ? "bg-rose-50 text-rose-500 border border-rose-100" :
                                            isSuccess ? (isCredit ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : isWithdrawal ? "bg-blue-50 text-[#0A84FF] border border-blue-100" : "bg-gray-50 text-gray-500") : 
                                            isPending ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                        }`}>
                                            <span className="material-symbols-outlined font-bold text-xl">
                                                {isFailed ? "cancel" : isCredit ? "arrow_downward_alt" : isWithdrawal ? "account_balance_wallet" : "info"}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-extrabold text-gray-900 text-sm truncate">
                                                {getTransactionTypeLabel(transaction.type)}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium">
                                                {formatDateTime(transaction.createdAt)}
                                            </p>
                                            {transaction.booking && (
                                                <p className="text-xs text-blue-600 font-bold mt-0.5">
                                                    Booking #{transaction.booking._id?.toString().slice(-8).toUpperCase()}
                                                </p>
                                            )}
                                            {(transaction.errorMessage || transaction.metadata?.rejectionReason) && (
                                                <p className="text-xs text-rose-500 mt-0.5 font-semibold">
                                                    Reason: {transaction.errorMessage || transaction.metadata?.rejectionReason}
                                                </p>
                                            )}
                                            {transaction.description && !transaction.errorMessage && (
                                                <p className="text-xs text-gray-500 mt-0.5 italic">
                                                    {transaction.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-extrabold text-sm ${
                                                isFailed ? "text-slate-400 line-through" :
                                                isSuccess ? (isCredit ? "text-emerald-600" : isWithdrawal ? "text-[#0A84FF]" : "text-gray-700") : 
                                                isPending ? "text-amber-600" : "text-rose-600"
                                            }`}>
                                                {isFailed ? "" : isCredit ? "+" : isWithdrawal ? "-" : ""} ₹{formatAmount(Math.abs(transaction.amount))}
                                            </p>
                                            <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
                                                isFailed ? "text-rose-600" : getStatusColor(transaction.status)
                                            }`}>
                                                {isFailed ? "REJECTED" : transaction.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalTransactions > 0 && (
                        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 px-1 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500">
                                Showing <span className="font-bold text-slate-800">{(pagination.currentPage - 1) * pagination.limit + 1}</span>–<span className="font-bold text-slate-800">{Math.min(pagination.currentPage * pagination.limit, pagination.totalTransactions)}</span> of <span className="font-bold text-slate-800">{pagination.totalTransactions}</span>
                            </p>

                            <div className="flex items-center gap-2">
                                {/* Rows Selector */}
                                <div className="flex items-center gap-1.5 mr-1">
                                    <span className="text-[11px] font-semibold text-slate-400">Rows:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>

                                {/* Prev Page Button */}
                                <button
                                    type="button"
                                    disabled={pagination.currentPage <= 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    <IoChevronBackOutline />
                                    <span>Prev</span>
                                </button>

                                {/* Page Numbers */}
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        return page === 1 || page === pagination.totalPages || Math.abs(page - pagination.currentPage) <= 1;
                                    })
                                    .map((page, idx, arr) => {
                                        const prev = arr[idx - 1];
                                        return (
                                            <div key={page} className="flex items-center">
                                                {prev && page - prev > 1 && (
                                                    <span className="px-1 text-slate-400 font-bold text-xs">...</span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-7 h-7 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                        pagination.currentPage === page
                                                            ? "bg-[#0A84FF] text-white shadow-xs"
                                                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        );
                                    })}

                                {/* Next Page Button */}
                                <button
                                    type="button"
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    <span>Next</span>
                                    <IoChevronForwardOutline />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>

        {/* Withdrawal Request Modal */}
        {showWithdrawModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#0A84FF] font-bold text-lg">
                                💸
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Request Withdrawal</h3>
                                <p className="text-xs text-slate-500 font-semibold">Available: ₹{formatAmount(walletBalance)}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowWithdrawModal(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body Form */}
                    <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {/* Amount */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Withdrawal Amount <span className="text-red-500">*</span>
                                </label>
                                {walletBalance > 0 && (
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        Max: ₹{formatAmount(walletBalance)}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    step="any"
                                    min="1000"
                                    max={walletBalance}
                                    value={withdrawAmount}
                                    onChange={handleAmountChange}
                                    placeholder={`Min: ₹1,000 | Max: ₹${formatAmount(walletBalance)}`}
                                    className="w-full pl-8 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none text-sm font-semibold text-slate-800 transition-all"
                                    required
                                />
                                {walletBalance > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawAmount(walletBalance.toString())}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-extrabold text-[#0A84FF] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                                        title="Use maximum available balance"
                                    >
                                        MAX
                                    </button>
                                )}
                            </div>

                            {/* Live Hints */}
                            {withdrawAmount && parseFloat(withdrawAmount) > walletBalance && (
                                <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                                    ⚠️ Amount cannot exceed available balance of ₹{formatAmount(walletBalance)}
                                </p>
                            )}
                            {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) < 1000 && (
                                <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                                    ℹ️ Minimum withdrawal amount is ₹1,000
                                </p>
                            )}
                        </div>

                        {/* Payout Mode Tabs */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Preferred Payout Method <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setPayoutType("UPI")}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        payoutType === "UPI" ? "bg-white text-[#0A84FF] shadow-xs" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    ⚡ UPI ID
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPayoutType("BANK_TRANSFER")}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        payoutType === "BANK_TRANSFER" ? "bg-white text-[#0A84FF] shadow-xs" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    🏦 Bank Account
                                </button>
                            </div>
                        </div>

                        {/* UPI Details */}
                        {payoutType === "UPI" ? (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Your UPI ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="e.g. 7389279971@ybl, name@upi"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none text-xs font-semibold text-slate-800"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 font-medium">Admin will send refund payout to this UPI address.</p>
                            </div>
                        ) : (
                            /* Bank Details */
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Account Holder Name <span className="text-red-500">*</span>
                                        </label>
                                        {accountDetails.accountHolderName && (
                                            <span className={`text-[10px] font-bold ${
                                                validateAccountHolderName(accountDetails.accountHolderName).isValid ? "text-emerald-600" : "text-amber-600"
                                            }`}>
                                                {validateAccountHolderName(accountDetails.accountHolderName).isValid ? "✓ Valid Name" : "Min 3 letters required"}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={accountDetails.accountHolderName}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountHolderName: e.target.value })}
                                        placeholder="Full name as per bank passbook"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Bank Account Number <span className="text-red-500">*</span>
                                        </label>
                                        {accountDetails.accountNumber && (
                                            <span className={`text-[10px] font-bold ${
                                                accountDetails.accountNumber.length >= 9 && !/^0+$/.test(accountDetails.accountNumber)
                                                    ? "text-emerald-600"
                                                    : "text-amber-600"
                                            }`}>
                                                {accountDetails.accountNumber.length >= 9 && !/^0+$/.test(accountDetails.accountNumber)
                                                    ? `✓ Valid account length (${accountDetails.accountNumber.length} digits)`
                                                    : `9–18 digits required (${accountDetails.accountNumber.length}/18)`}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={18}
                                        autoComplete="off"
                                        value={accountDetails.accountNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                            setAccountDetails({ ...accountDetails, accountNumber: val });
                                        }}
                                        placeholder="Enter 9–18 digit Bank Account Number"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Confirm Account Number <span className="text-red-500">*</span>
                                        </label>
                                        {confirmAccountNumber && (
                                            <span className={`text-[10px] font-bold ${
                                                accountDetails.accountNumber === confirmAccountNumber && confirmAccountNumber.length >= 9
                                                    ? "text-emerald-600"
                                                    : "text-rose-500"
                                            }`}>
                                                {accountDetails.accountNumber === confirmAccountNumber && confirmAccountNumber.length >= 9
                                                    ? "✓ Account numbers match"
                                                    : "✕ Account numbers do not match"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showConfirmAccEye ? "text" : "password"}
                                            inputMode="numeric"
                                            maxLength={18}
                                            autoComplete="off"
                                            value={confirmAccountNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                                setConfirmAccountNumber(val);
                                            }}
                                            placeholder="Re-enter Bank Account Number"
                                            className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmAccEye(!showConfirmAccEye)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                                            title={showConfirmAccEye ? "Hide digits" : "Show digits"}
                                        >
                                            {showConfirmAccEye ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            IFSC Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={11}
                                            value={accountDetails.ifscCode}
                                            onChange={(e) => handleIFSCChange(e.target.value)}
                                            placeholder="e.g. SBIN0001234"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 font-mono uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Bank Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={accountDetails.bankName}
                                            onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                                            placeholder="e.g. State Bank of India"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                {accountDetails.ifscCode && (
                                    <div className="pt-0.5">
                                        {ifscStatus.loading ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium animate-pulse">
                                                <span className="inline-block animate-spin">⏳</span>
                                                <span>Verifying IFSC with RBI directory...</span>
                                            </div>
                                        ) : ifscStatus.verified ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-medium">
                                                <IoCheckmarkCircle className="text-emerald-600 text-sm shrink-0" />
                                                <span className="truncate">
                                                    <strong>{ifscStatus.bank || accountDetails.bankName || "Bank"}</strong>
                                                    {ifscStatus.branch ? ` • ${ifscStatus.branch} Branch` : " (Verified)"}
                                                </span>
                                            </div>
                                        ) : ifscStatus.error ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-medium">
                                                <IoAlertCircle className="text-rose-500 text-sm shrink-0" />
                                                <span>{ifscStatus.error}</span>
                                            </div>
                                        ) : accountDetails.ifscCode.length < 11 ? (
                                            <p className="text-[10px] font-bold text-slate-400">
                                                {accountDetails.ifscCode.length >= 5 && accountDetails.ifscCode[4] !== '0'
                                                    ? "⚠️ 5th character must be '0' (Zero)"
                                                    : `Format: 4 letters + 0 + 6 letters/digits (${accountDetails.ifscCode.length}/11)`}
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50/80 border border-emerald-100 rounded-xl text-[11px] font-medium text-emerald-800">
                            <span>🔒</span>
                            <span>Details will be saved securely to your account for future withdrawals.</span>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    processingWithdraw ||
                                    !withdrawAmount ||
                                    parseFloat(withdrawAmount) < 1000 ||
                                    parseFloat(withdrawAmount) > walletBalance
                                }
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-[#0A84FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {processingWithdraw ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {/* Manage Linked Payout Details Modal (Anytime) */}
        {showPayoutManageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-outfit">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 transition-all animate-in fade-in zoom-in-95">
                    <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900 leading-tight">
                                {hasSavedPayout ? "Manage Payout Account" : "Link Payout Account"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Where should admin send your approved refund payouts?
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPayoutManageModal(false)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <IoCloseOutline className="text-2xl" />
                        </button>
                    </div>

                    <form onSubmit={handleSavePayoutDetails} className="mt-4 space-y-4">
                        {/* Payout Mode Selector */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setPayoutType("UPI")}
                                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                    payoutType === "UPI" ? "bg-white text-[#0A84FF] shadow-xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                ⚡ UPI ID
                            </button>
                            <button
                                type="button"
                                onClick={() => setPayoutType("BANK_TRANSFER")}
                                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                    payoutType === "BANK_TRANSFER" ? "bg-white text-[#0A84FF] shadow-xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                🏦 Bank Account
                            </button>
                        </div>

                        {/* UPI Form */}
                        {payoutType === "UPI" ? (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Your UPI ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="e.g. mobile@upi, name@okaxis"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Refunds will be transferred to this Virtual Payment Address.</p>
                            </div>
                        ) : (
                            /* Bank Form */
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Account Holder Name <span className="text-red-500">*</span>
                                        </label>
                                        {accountDetails.accountHolderName && (
                                            <span className={`text-[10px] font-bold ${
                                                validateAccountHolderName(accountDetails.accountHolderName).isValid ? "text-emerald-600" : "text-amber-600"
                                            }`}>
                                                {validateAccountHolderName(accountDetails.accountHolderName).isValid ? "✓ Valid Name" : "Min 3 letters required"}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={accountDetails.accountHolderName}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountHolderName: e.target.value })}
                                        placeholder="Full name on bank passbook"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Bank Account Number <span className="text-red-500">*</span>
                                        </label>
                                        {accountDetails.accountNumber && (
                                            <span className={`text-[10px] font-bold ${
                                                accountDetails.accountNumber.length >= 9 && !/^0+$/.test(accountDetails.accountNumber)
                                                    ? "text-emerald-600"
                                                    : "text-amber-600"
                                            }`}>
                                                {accountDetails.accountNumber.length >= 9 && !/^0+$/.test(accountDetails.accountNumber)
                                                    ? `✓ Valid account length (${accountDetails.accountNumber.length} digits)`
                                                    : `9–18 digits required (${accountDetails.accountNumber.length}/18)`}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={18}
                                        autoComplete="off"
                                        value={accountDetails.accountNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                            setAccountDetails({ ...accountDetails, accountNumber: val });
                                        }}
                                        placeholder="Enter 9–18 digit Bank Account Number"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Confirm Account Number <span className="text-red-500">*</span>
                                        </label>
                                        {confirmAccountNumber && (
                                            <span className={`text-[10px] font-bold ${
                                                accountDetails.accountNumber === confirmAccountNumber && confirmAccountNumber.length >= 9
                                                    ? "text-emerald-600"
                                                    : "text-rose-500"
                                            }`}>
                                                {accountDetails.accountNumber === confirmAccountNumber && confirmAccountNumber.length >= 9
                                                    ? "✓ Account numbers match"
                                                    : "✕ Account numbers do not match"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showConfirmAccEye ? "text" : "password"}
                                            inputMode="numeric"
                                            maxLength={18}
                                            autoComplete="off"
                                            value={confirmAccountNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                                setConfirmAccountNumber(val);
                                            }}
                                            placeholder="Re-enter Bank Account Number"
                                            className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmAccEye(!showConfirmAccEye)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                                            title={showConfirmAccEye ? "Hide digits" : "Show digits"}
                                        >
                                            {showConfirmAccEye ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            IFSC Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={11}
                                            value={accountDetails.ifscCode}
                                            onChange={(e) => handleIFSCChange(e.target.value)}
                                            placeholder="e.g. SBIN0001234"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 font-mono uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Bank Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={accountDetails.bankName}
                                            onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                                            placeholder="e.g. State Bank of India"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                {accountDetails.ifscCode && (
                                    <div className="pt-0.5">
                                        {ifscStatus.loading ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium animate-pulse">
                                                <span className="inline-block animate-spin">⏳</span>
                                                <span>Verifying IFSC with RBI directory...</span>
                                            </div>
                                        ) : ifscStatus.verified ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-medium">
                                                <IoCheckmarkCircle className="text-emerald-600 text-sm shrink-0" />
                                                <span className="truncate">
                                                    <strong>{ifscStatus.bank || accountDetails.bankName || "Bank"}</strong>
                                                    {ifscStatus.branch ? ` • ${ifscStatus.branch} Branch` : " (Verified)"}
                                                </span>
                                            </div>
                                        ) : ifscStatus.error ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-medium">
                                                <IoAlertCircle className="text-rose-500 text-sm shrink-0" />
                                                <span>{ifscStatus.error}</span>
                                            </div>
                                        ) : accountDetails.ifscCode.length < 11 ? (
                                            <p className="text-[10px] font-bold text-slate-400">
                                                {accountDetails.ifscCode.length >= 5 && accountDetails.ifscCode[4] !== '0'
                                                    ? "⚠️ 5th character must be '0' (Zero)"
                                                    : `Format: 4 letters + 0 + 6 letters/digits (${accountDetails.ifscCode.length}/11)`}
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800">
                            <span>🔒</span>
                            <span>Stored securely in your profile for fast, seamless refund disbursals.</span>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPayoutManageModal(false)}
                                disabled={savingPayout}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingPayout}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {savingPayout ? "Saving..." : "Save Payout Details"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Remove Payout Confirmation Modal */}
        {showRemoveConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-outfit">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 transition-all animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 pb-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
                            🗑️
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 leading-tight">
                                Remove Payout Details?
                            </h3>
                            <p className="text-xs text-slate-500">
                                Unlink your saved bank account / UPI ID.
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-600 my-3 leading-relaxed">
                        Are you sure you want to remove your saved payout details? You will need to re-enter your account or UPI ID for any future withdrawal requests.
                    </p>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowRemoveConfirmModal(false)}
                            disabled={removingPayout}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleRemovePayoutDetails}
                            disabled={removingPayout}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {removingPayout ? "Removing..." : "Yes, Remove"}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>);
}

