import { useEffect, useRef, useCallback } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/**
 * PlaceAutocompleteInput - Uses the legacy Autocomplete (with fallback to new API)
 * This component uses Google's legacy Autocomplete for compatibility
 */
export default function PlaceAutocompleteInput({
    onPlaceSelect,
    placeholder = "Search for a location...",
    value = "",
    onChange,
    disabled = false,
    className = "",
    countryRestriction = "in",
    types = ["geocode"]
}) {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const containerRef = useRef(null);
    const initAttemptsRef = useRef(0);

    const initializeAutocomplete = useCallback(() => {
        if (!inputRef.current) {
            // Retry if input is not ready yet
            if (initAttemptsRef.current < 20) {
                initAttemptsRef.current++;
                setTimeout(initializeAutocomplete, 100);
            }
            return;
        }

        if (!window.google?.maps?.places) {
            // Retry if Google Maps API is not loaded yet
            if (initAttemptsRef.current < 20) {
                initAttemptsRef.current++;
                setTimeout(initializeAutocomplete, 200);
            }
            return;
        }

        // Ensure input is in the DOM
        if (!inputRef.current.isConnected) {
            if (initAttemptsRef.current < 20) {
                initAttemptsRef.current++;
                setTimeout(initializeAutocomplete, 100);
            }
            return;
        }

        // Clean up existing autocomplete if it exists
        if (autocompleteRef.current) {
            // Clear existing listeners by creating a new instance
            try {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            } catch (e) {
                // Ignore errors
            }
            autocompleteRef.current = null;
        }

        // Initialize autocomplete
        try {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: types,
                componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
                fields: ['geometry', 'formatted_address', 'place_id', 'address_components']
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                if (!place.geometry || !place.geometry.location) {
                    return;
                }

                // Handle both new and legacy location formats
                let lat, lng;
                if (typeof place.geometry.location.lat === 'function') {
                    lat = place.geometry.location.lat();
                    lng = place.geometry.location.lng();
                } else {
                    lat = place.geometry.location.lat;
                    lng = place.geometry.location.lng;
                }

                if (onPlaceSelect) {
                    onPlaceSelect({
                        place: place,
                        lat: lat,
                        lng: lng,
                        formattedAddress: place.formatted_address || '',
                        placeId: place.place_id || '',
                        addressComponents: place.address_components || []
                    });
                }
            });

            autocompleteRef.current = autocomplete;
            initAttemptsRef.current = 0; // Reset attempts on success
        } catch (error) {
            console.error("Error initializing autocomplete:", error);
            // Retry on error
            if (initAttemptsRef.current < 20) {
                initAttemptsRef.current++;
                setTimeout(initializeAutocomplete, 300);
            }
        }
    }, [onPlaceSelect, types, countryRestriction]);

    useEffect(() => {
        // Check if API key is set
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn("Google Maps API key not set. PlaceAutocompleteInput will work as regular input.");
            return;
        }

        // Reset attempts
        initAttemptsRef.current = 0;

        // Load Google Maps JavaScript API if not already loaded
        const loadMapsAPI = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                // API already loaded
                setTimeout(initializeAutocomplete, 100);
                return;
            }

            // Check if script already exists
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existingScript) {
                // Script exists, wait for it to load
                let attempts = 0;
                const maxAttempts = 50;
                const checkLoaded = () => {
                    attempts++;
                    if (window.google && window.google.maps && window.google.maps.places) {
                        setTimeout(initializeAutocomplete, 300);
                    } else if (attempts < maxAttempts) {
                        setTimeout(checkLoaded, 100);
                    } else {
                        console.error("Google Maps API failed to load after multiple attempts");
                    }
                };
                checkLoaded();
            } else {
                // Create and load script
                const script = document.createElement("script");
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
                script.async = true;
                script.defer = true;
                script.id = 'google-maps-script';

                script.onload = () => {
                    setTimeout(initializeAutocomplete, 300);
                };
                script.onerror = () => {
                    console.error("Failed to load Google Maps API");
                };

                document.head.appendChild(script);
            }
        };

        loadMapsAPI();

        return () => {
            // Cleanup
            if (autocompleteRef.current) {
                try {
                    google.maps.event.clearInstanceListeners(autocompleteRef.current);
                } catch (e) {
                    // Ignore errors
                }
                autocompleteRef.current = null;
            }
        };
    }, [initializeAutocomplete]);

    // Handle input changes - allow typing while autocomplete is active
    const handleInputChange = (e) => {
        if (onChange) {
            onChange(e);
        }
    };

    // Sync value with input when it changes externally
    useEffect(() => {
        if (inputRef.current && inputRef.current.value !== value) {
            // Only update if the value is different to avoid interfering with autocomplete
            // Don't update if user is currently typing (autocomplete dropdown is open)
            if (document.activeElement !== inputRef.current) {
                inputRef.current.value = value || '';
            }
        }
    }, [value]);

    // Re-initialize autocomplete when disabled state changes
    useEffect(() => {
        if (inputRef.current && autocompleteRef.current) {
            // Autocomplete handles disabled state automatically
            if (disabled) {
                inputRef.current.setAttribute('disabled', 'disabled');
            } else {
                inputRef.current.removeAttribute('disabled');
            }
        }
    }, [disabled]);

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                defaultValue={value || ''}
                onChange={handleInputChange}
                disabled={disabled}
                className={className}
                autoComplete="off"
                id={`place-autocomplete-${Math.random().toString(36).substr(2, 9)}`}
            />
        </div>
    );
}

