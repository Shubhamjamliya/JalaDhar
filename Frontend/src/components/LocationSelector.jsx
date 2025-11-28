import { useState, useEffect } from "react";
import { IoLocationOutline, IoSearchOutline, IoCloseOutline } from "react-icons/io5";
import PlaceAutocompleteInput from "./PlaceAutocompleteInput";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function LocationSelector({ 
    onLocationSelect, 
    initialLocation = null,
    showRadiusSelector = false,
    onRadiusChange = null,
    initialRadius = 50
}) {
    const [location, setLocation] = useState(initialLocation || { lat: null, lng: null, address: null });
    const [searchAddress, setSearchAddress] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [radius, setRadius] = useState(initialRadius);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    // Check if Google Maps is loaded
    useEffect(() => {
        const checkMapsLoaded = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setMapsLoaded(true);
            }
        };

        // Check if already loaded
        checkMapsLoaded();

        // Load Google Maps API if not loaded
        if (!window.google || !window.google.maps) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = () => {
                checkMapsLoaded();
            };
        }
    }, []);

    // Load location from localStorage on mount
    useEffect(() => {
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                if (parsed.lat && parsed.lng) {
                    setLocation(parsed);
                    if (onLocationSelect) {
                        onLocationSelect(parsed);
                    }
                }
            } catch (e) {
                console.error("Error loading saved location:", e);
            }
        }
    }, []);

    // Get current location using browser geolocation API
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    address: null
                };

                // Try to reverse geocode to get address
                if (GOOGLE_MAPS_API_KEY) {
                    try {
                        const response = await fetch(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLocation.lat},${newLocation.lng}&key=${GOOGLE_MAPS_API_KEY}`
                        );
                        const data = await response.json();
                        if (data.results && data.results.length > 0) {
                            newLocation.address = data.results[0].formatted_address;
                            setSearchAddress(data.results[0].formatted_address);
                        }
                    } catch (error) {
                        console.error("Reverse geocoding error:", error);
                    }
                }

                setLocation(newLocation);
                localStorage.setItem("userLocation", JSON.stringify(newLocation));
                if (onLocationSelect) {
                    onLocationSelect(newLocation);
                }
                setGettingLocation(false);
                setShowSearch(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                let errorMessage = "Unable to get your location";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location permission denied. Please allow location access or search manually.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = "Location information unavailable. Please search manually.";
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = "Location request timed out. Please try again or search manually.";
                }
                alert(errorMessage);
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Handle place selection from Google Places Autocomplete
    const handlePlaceSelect = (placeData) => {
        if (!placeData || !placeData.lat || !placeData.lng) {
            return;
        }

        const newLocation = {
            lat: placeData.lat,
            lng: placeData.lng,
            address: placeData.formattedAddress
        };

        setLocation(newLocation);
        setSearchAddress(placeData.formattedAddress);
        localStorage.setItem("userLocation", JSON.stringify(newLocation));
        if (onLocationSelect) {
            onLocationSelect(newLocation);
        }
        setShowSearch(false);
    };

    const handleRadiusChange = (newRadius) => {
        setRadius(newRadius);
        if (onRadiusChange) {
            onRadiusChange(newRadius);
        }
    };

    const clearLocation = () => {
        setLocation({ lat: null, lng: null, address: null });
        setSearchAddress("");
        localStorage.removeItem("userLocation");
        if (onLocationSelect) {
            onLocationSelect({ lat: null, lng: null, address: null });
        }
    };

    return (
        <div className="w-full mb-4">
            {/* Location Display/Selector */}
            <div className="flex flex-col gap-2">
                {location.lat && location.lng ? (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <IoLocationOutline className="text-blue-600 text-xl flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-900">
                                    {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                </p>
                                <p className="text-xs text-blue-600">Location set</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={clearLocation}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Clear location"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <IoSearchOutline className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-lg z-10" />
                            <PlaceAutocompleteInput
                                onPlaceSelect={handlePlaceSelect}
                                placeholder="Search for an address..."
                                value={searchAddress}
                                onChange={(e) => setSearchAddress(e.target.value)}
                                disabled={false}
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-md transition-all"
                                countryRestriction="in"
                                types={["geocode"]}
                            />
                        </div>

                        {/* Use Current Location Button - Icon Only */}
                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            className="flex items-center justify-center bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                            title={gettingLocation ? "Getting location..." : "Use Current Location"}
                        >
                            <IoLocationOutline className="text-xl text-white" />
                        </button>
                    </div>
                )}

                {/* Radius Selector */}
                {showRadiusSelector && location.lat && location.lng && (
                    <div className="mt-2 flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Search Radius:
                        </label>
                        <div className="flex gap-3 flex-1">
                            {[50, 75, 100].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleRadiusChange(r)}
                                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-full text-sm font-medium transition-all ${
                                        radius === r
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="text-base font-semibold">{r}</span>
                                    <span className="text-xs">km</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

