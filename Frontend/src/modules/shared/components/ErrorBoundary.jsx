import React from 'react';
import { IoAlertCircleOutline, IoRefreshOutline } from 'react-icons/io5';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary caught error]:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        } else {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="p-6 my-4 bg-white rounded-2xl border border-red-200 shadow-sm text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl">
                        <IoAlertCircleOutline />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        {this.props.title || "Something went wrong while displaying this content"}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {this.state.error?.message || "An unexpected rendering error occurred."}
                    </p>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                        <IoRefreshOutline className="text-sm" />
                        <span>Retry</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
