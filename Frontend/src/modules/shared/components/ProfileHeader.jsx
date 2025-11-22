/**
 * Reusable Profile Header Component
 * Matches user dashboard profile header design
 */
const backgroundImageUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva";

const avatarImageUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDCqZRhSzmWMNhXuX4RPFuS_KD7WQ8XLgbsk2nXkV3JICy3ZcLfqjZnTbmofKaBePVQ9HQeoiASrUYaU_VYP7dBYSFBI9Z5WlMcnCKPDQIZaN5Uo8Qh4iv3tNNNnrRAnqP6QfGEIvqzMRneraT-7cwEGw9ba4Ci_wx2qsxlsRdxcPVRdPcnkz2n2vv4YM02MHGkKA3Punga2QFw4FyWv6phuBqmgoiAjWSehWquP1nyb8tigrHh5j6ir7c3uumnU1LI7khab45fuKmL";

export default function ProfileHeader({ name, profileImage = null, className = "" }) {
    return (
        <section className={`relative my-4 overflow-hidden rounded-[12px] bg-white p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] ${className}`}>
            <div className="absolute inset-0 z-0 opacity-10">
                <img
                    className="h-full w-full object-cover"
                    src={backgroundImageUrl}
                    alt=""
                />
            </div>
            <div className="relative z-10 flex items-center gap-4">
                <div
                    className="h-16 w-16 rounded-full bg-cover bg-center flex-shrink-0"
                    style={{
                        backgroundImage: profileImage
                            ? `url("${profileImage}")`
                            : `url("${avatarImageUrl}")`,
                    }}
                ></div>
                <div>
                    <p className="text-[22px] font-bold tracking-tight text-gray-800">
                        Welcome, {name}
                    </p>
                </div>
            </div>
        </section>
    );
}

