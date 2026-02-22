import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IoLocationSharp, IoClose } from 'react-icons/io5';

/**
 * A beautiful modal component that prompts the user to enable location services.
 * It checks if geolocation is available and if permission has been granted.
 * If not granted or promptable, it shows the modal.
 */
const LocationPermissionModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable location prompt for admin panel
    if (pathname.startsWith('/admin')) {
      setShowModal(false);
      return;
    }
    checkPermission();
  }, [pathname]);

  const checkPermission = async () => {
    // Check if we've already dealt with this in this session
    const hasPrompted = sessionStorage.getItem('locationPromptShown');
    if (hasPrompted) return;

    if (!navigator.permissions || !navigator.permissions.query) {
      // Safari/iOS or other browsers without Permissions API
      // Always show modal on first visit to prompt user
      setShowModal(true);
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(result.state);

      // If prompt (default) or denied (we might want to ask again or guide them), show modal
      // On mobile, 'prompt' is the standard state before dynamic request
      if (result.state === 'prompt') {
        setShowModal(true);
      }
    } catch (error) {
      // Fallback
      setShowModal(true);
    }
  };

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    // We use watchPosition specifically because on some mobile devices/browsers, 
    // asking for continuous updates (watch) is more likely to trigger 
    // the "Turn on GPS" system dialog than a single getCurrentPosition call.
    // We can immediately clear it after we get a result.
    const id = navigator.geolocation.watchPosition(
      (position) => {
        // Success - GPS is on and we have location
        navigator.geolocation.clearWatch(id);
        setShowModal(false);
        sessionStorage.setItem('locationPromptShown', 'true');
      },
      (error) => {
        console.error("Location request error", error);
        // PERMISSION_DENIED (1) - User clicked block or system setting is off
        // POSITION_UNAVAILABLE (2) - GPS might be off
        // TIMEOUT (3)

        if (error.code === error.PERMISSION_DENIED) {
          alert("Please enable Location Services/GPS in your device settings to continue.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("Location information is unavailable. Please check if your GPS is turned on.");
        }

        // Keep modal open or close? Let's keep it open so they can try again or click "Not Now"
      },
      {
        enableHighAccuracy: true, // Crucial for triggering GPS
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLater = () => {
    setShowModal(false);
    sessionStorage.setItem('locationPromptShown', 'true');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-300 relative">

        {/* Visual Header */}
        <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
          {/* Background Circles */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-20%] left-[-10%] w-24 h-24 rounded-full bg-white/10"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white/10"></div>
          </div>

          {/* Icon with Pulse Effect */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="absolute w-16 h-16 bg-white/20 rounded-full animate-ping"></div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <IoLocationSharp className="text-3xl text-blue-600" />
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Enable Location Services
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            To provide you with the best services like finding nearby vendors and accurate navigation, we need access to your device location.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleEnableLocation}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Turn on GPS / Allow Location
            </button>
            <button
              onClick={handleLater}
              className="w-full py-3.5 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400">
            You can change this anytime in your browser settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
