import React from "react";
import {
    IoHourglassOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";

export default function UserStatus() {
    const vendorInfo = {
        name: "John Doe",
        avatar:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBWZ2XvHLfRWsNrAXjYxy-Jgge4jXhyKk8vQ8jpgf9KeH2Z6rp8iqeZP083F6IS5XEvlJTF5iJuZVh6_qGFTkEc8IhXTtkeqyVFZVzowVwwbE506041OM06VHyUeIFC1unG06fVnGstlmsEQpGK-nbMtnHG4tDUrs5k-7B8mXTrQliXWxI4R2HAS2LYlPQdSZZ89aye5MtHptvCot5TtqktLi34jiOk_GRb9uQHwbx5O3iAp0BTLFqjgev2VgrX27SXVUMP02dBYlfl",
        arrivalTime: "Arriving in approx. 45 mins",
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="grid grid-cols-[auto_1fr] gap-x-4">
                {/* Pending */}
                <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <IoHourglassOutline className="text-3xl text-[#0A84FF]" />
                    </div>
                    <div className="w-0.5 grow bg-gradient-to-b from-[#0A84FF] to-[#00C2A8]"></div>
                </div>

                <div className="mb-6 rounded-[12px] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <p className="text-base font-bold text-gray-800">Pending</p>
                    <p className="mb-2 text-sm text-gray-500">10:30 AM, Today</p>
                    <p className="text-sm text-gray-600">
                        Your service request has been received and is waiting for a vendor to be assigned.
                    </p>
                </div>

                {/* Vendor Assigned */}
                <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <IoPersonOutline className="text-3xl text-[#0A84FF]" />
                    </div>
                    <div className="w-0.5 grow bg-gradient-to-b from-[#00C2A8] to-gray-300"></div>
                </div>

                <div className="mb-6 rounded-[12px] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <p className="text-base font-bold text-gray-800">Vendor Assigned</p>
                    <p className="mb-3 text-sm text-gray-500">11:15 AM, Today</p>

                    <div className="flex items-center gap-3 rounded-[10px] border border-gray-200 p-3">
                        <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={vendorInfo.avatar}
                            alt=""
                        />
                        <div>
                            <p className="font-semibold text-gray-800">{vendorInfo.name}</p>
                            <p className="text-sm text-gray-500">{vendorInfo.arrivalTime}</p>
                        </div>
                    </div>
                </div>

                {/* In Progress */}
                <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <IoConstructOutline className="text-3xl text-gray-400" />
                    </div>
                    <div className="w-0.5 grow bg-gray-300"></div>
                </div>

                <div className="mb-6 rounded-[12px] bg-white p-4 text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <p className="text-base font-bold">In Progress</p>
                    <p className="mb-2 text-sm">Waiting for update</p>
                    <p className="text-sm">The technician will begin work shortly.</p>
                </div>

                {/* Completed */}
                <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <IoCheckmarkCircleOutline className="text-3xl text-gray-400" />
                    </div>
                </div>

                <div className="mb-6 rounded-[12px] bg-white p-4 text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <p className="text-base font-bold">Completed</p>
                    <p className="mb-2 text-sm">Waiting for update</p>
                    <p className="text-sm">The service will be marked as complete once finished.</p>
                </div>
            </div>
        </div>
    );
}
