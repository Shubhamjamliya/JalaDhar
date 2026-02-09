import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoLocationSharp,
  IoCalendarOutline,
  IoTimeOutline,
  IoPerson,
  IoLeafOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoConstructOutline,
  IoCashOutline,
  IoInformationCircleOutline,
  IoSearchOutline
} from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import PageContainer from "../../shared/components/PageContainer";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import { getNearbyVendors, createBooking, calculateBookingCharges } from "../../../services/bookingApi";

// --- Sub-components for each step ---

const CategorySelection = ({ onSelect }) => {
  const categories = [
    { id: "Agriculture", label: "Agriculture", icon: IoLeafOutline, color: "bg-green-100 text-green-600" },
    { id: "Domestic/Household", label: "Domestic/Household", icon: IoHomeOutline, color: "bg-blue-100 text-blue-600" },
    { id: "Commercial", label: "Commercial", icon: IoBusinessOutline, color: "bg-purple-100 text-purple-600" },
    { id: "Industrial", label: "Industrial", icon: IoConstructOutline, color: "bg-orange-100 text-orange-600" }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Select Survey Category</h2>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all aspect-square"
          >
            <div className={`p-4 rounded-full ${cat.color} mb-3 text-3xl`}>
              <cat.icon />
            </div>
            <span className="font-semibold text-gray-700 text-sm text-center">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TermsAndConditions = ({ category, onAccept, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-300">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Terms & Conditions</h3>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-2 max-h-60 overflow-y-auto">
          <p>By proceeding with the <strong>{category}</strong> survey, you agree to the following:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The survey report is based on scientific/traditional methods but does not guarantee 100% water yield.</li>
            <li>Advance payment is required to book the slot.</li>
            <li>Cancellation charges may apply as per company policy.</li>
            <li>Safe access to the site must be provided by the customer.</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailsForm = ({ data, onSubmit, onBack }) => {
  const [formData, setFormData] = useState(data || {
    village: "",
    mandal: "",
    district: "",
    name: "" // Optional if already logged in, but good to confirm
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Location Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Village / Locality</label>
          <input
            required
            name="village"
            value={formData.village}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            placeholder="Enter Village Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mandal</label>
          <input
            required
            name="mandal"
            value={formData.mandal}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            placeholder="Enter Mandal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <input
            required
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            placeholder="Enter District"
          />
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button type="button" onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
        <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Continue</button>
      </div>
    </form>
  );
};

const LocationPicker = ({ onLocationSelect, onBack }) => {
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // Local state for location
  const toast = useToast();

  const handlePlaceSelect = (place) => {
    if (place.lat && place.lng) {
      setSelectedLocation({
        lat: place.lat,
        lng: place.lng,
        address: place.formattedAddress
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.showError("Geolocation not supported");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = "Current Location";

        // Try to reverse geocode if Google Maps API is available
        if (window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise((resolve, reject) => {
              geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                  resolve(results[0].formatted_address);
                } else {
                  reject(status);
                }
              });
            });
            if (result) address = result;
          } catch (e) {
            console.error("Reverse geocoding failed", e);
          }
        }

        setSelectedLocation({
          lat: latitude,
          lng: longitude,
          address: address
        });
        setSearching(false);
      },
      (err) => {
        console.error(err);
        toast.showError("Could not get location. Check permissions.");
        setSearching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    } else {
      toast.showError("Please select a location first");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Pin Location</h2>

      {/* Current Location Section */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800 mb-3">Get your current GPS location seamlessly.</p>
        <button
          onClick={getCurrentLocation}
          disabled={searching}
          className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm"
        >
          <IoLocationSharp /> {searching ? "Locating..." : "Use Current Location"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 border-t border-gray-200"></div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#F6F7F9] text-gray-500">Or search & confirm</span>
        </div>
      </div>

      {/* Manual Search Input - Auto-filled if location selected */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Selected Location</label>
        <PlaceAutocompleteInput
          onPlaceSelect={handlePlaceSelect}
          placeholder="Search village or landmark..."
          value={selectedLocation?.address || ""}
          onChange={(e) => setSelectedLocation(prev => ({ ...prev, address: e.target.value }))} // Allow manual edit of text, though coords won't update unless selected
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 shadow-sm transition-all"
        />
        {selectedLocation && (
          <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <IoCheckmarkCircle className="text-sm" /> Location captured: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Main Action Button */}
      <div className="pt-4">
        <button
          onClick={handleConfirmLocation}
          disabled={!selectedLocation}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <IoSearchOutline className="text-xl" /> Search Nearby Vendors
        </button>
        <button onClick={onBack} className="w-full text-center py-3 mt-2 text-gray-500 font-medium hover:text-gray-700">Go Back</button>
      </div>
    </div>
  );
};

const ExpertSelection = ({ location, category, onSelect, onBack }) => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        // Filter by "Survey" service or category
        const res = await getNearbyVendors({
          lat: location.lat,
          lng: location.lng,
          radius: 100, // wider search for experts
          // serviceType: "Survey" // Removed strict filtering for now to debug - or to let user pick from all available vendors if backend filtering is too strict
        });

        if (res.success) {

          setExperts(res.data.vendors);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, [location]);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">Nearby Experts</h2>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : experts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <IoPerson className="text-4xl mb-2 opacity-50" />
          <p>No experts found nearby.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {experts.map(expert => {
            // Find the relevant service details for pricing
            // Logic from nearbyVendors controller ensures services are populated
            const surveyService = expert.allServices?.find(s =>
              s.name.toLowerCase().includes('survey') ||
              s.category?.toLowerCase().includes('survey') ||
              true // Fallback to first if filtering logic on backend is broad
            ) || expert.allServices?.[0]; // Fallback

            if (!surveyService) return null;

            return (
              <button
                key={expert._id}
                onClick={() => onSelect({ ...expert, selectedService: surveyService })}
                className="w-full flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl shrink-0">
                  {expert.documents?.profilePicture ? (
                    <img src={expert.documents.profilePicture.url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    "👨‍🔧"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{expert.name}</h3>
                  <p className="text-xs text-gray-500">
                    {expert.experience} Yrs Exp • ⭐ {expert.averageRating?.toFixed(1) || "New"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                      {expert.distance ? `${expert.distance.toFixed(1)} km` : 'Pre-verified'}
                    </span>
                    <span className="text-sm font-bold text-gray-900 ml-auto">
                      ₹{surveyService.price}
                      <span className="text-xs font-normal text-gray-400"> (Base)</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="pt-2">
        <button onClick={onBack} className="w-full text-center py-3 text-gray-500 font-medium hover:text-gray-700">Go Back</button>
      </div>
    </div>
  );
};

const SlotAndPayment = ({ surveyData, onConfirm, onBack }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [charges, setCharges] = useState(null);
  const toast = useToast();

  useEffect(() => {
    // Calculate dynamic charges
    const fetchCharges = async () => {
      // Assuming location.lat/lng and vendor are available
      if (!surveyData.vendor || !surveyData.location) return;

      try {
        const res = await calculateBookingCharges(
          surveyData.vendor.selectedService.id,
          surveyData.vendor._id,
          surveyData.location.lat,
          surveyData.location.lng
        );
        if (res.success) {
          setCharges(res.data);
        }
      } catch (err) {
        console.error("Error calculating charges", err);
      }
    };
    fetchCharges();
  }, []);

  const handlePay = () => {
    if (!date || !time) {
      toast.showError("Please select date and time");
      return;
    }
    onConfirm({ scheduledDate: date, scheduledTime: time });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Review & Book</h2>

      {/* Slot */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <IoCalendarOutline /> Schedule Visit
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            className="w-full p-2 border rounded-lg text-sm"
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="w-full p-2 border rounded-lg text-sm"
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="">Time</option>
            {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bill Info */}
      <div className="bg-gray-50 p-5 rounded-xl space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Base Service Charge</span>
          <span>₹{charges?.baseServiceFee || surveyData.vendor.selectedService.price}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Travel Charges ({charges?.distance ? `${charges.distance}km` : 'Calc..'})</span>
          <span>₹{charges?.travelCharges ?? 0}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>GST ({charges?.gstPercentage ?? 18}%)</span>
          <span>₹{charges?.gst ?? 0}</span>
        </div>
        <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-bold text-gray-900 text-base">
          <span>Total Estimate</span>
          <span>₹{charges?.totalAmount ?? 0}</span>
        </div>
        <div className="bg-blue-100 p-2 rounded text-blue-800 text-xs font-medium text-center">
          Advance Payable Now: ₹{charges?.advanceAmount ?? 0}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
        <button
          onClick={handlePay}
          disabled={!charges}
          className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <IoCashOutline /> Pay Advance
        </button>
      </div>
    </div>
  );
};


// --- Main Wizard Component ---

export default function UserSurveyFlow() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    category: null,
    details: null,
    location: null,
    vendor: null,
    slot: null
  });
  const [showTerms, setShowTerms] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.category) {
      setSurveyData(prev => ({ ...prev, category: location.state.category }));
      setShowTerms(true);
      // Clear state so back button works nicely? Or keep it? keeping it is fine.
    }
  }, [location.state]);

  // Step 1: Category Selected
  const handleCategorySelect = (catId) => {
    setSurveyData({ ...surveyData, category: catId });
    setShowTerms(true);
  };

  // Step 2: Terms Accepted
  const handleTermsAccept = () => {
    setShowTerms(false);
    // Show "Added to Cart" toast
    toast.showSuccess("Survey added to cart!");
    setTimeout(() => setStep(2), 500);
  };

  // Step 3: Details Submitted
  const handleDetailsSubmit = (details) => {
    setSurveyData({ ...surveyData, details });
    setStep(3);
  };

  // Step 4: Location Selected
  const handleLocationSelect = (loc) => {
    setSurveyData({ ...surveyData, location: loc });
    setStep(4);
  };

  // Step 5: Expert Selected
  const handleExpertSelect = (vendor) => {
    setSurveyData({ ...surveyData, vendor });
    setStep(5);
  };

  // Step 6: Final Booking
  const handleBooking = async ({ scheduledDate, scheduledTime }) => {
    try {
      // Map frontend category to backend enum
      // Backend accepts: 'Agriculture', 'Industrial/Commercial', 'Domestic/Household', 'Open plots'
      const purposeMap = {
        "Agriculture": "Agriculture",
        "Domestic/Household": "Domestic/Household",
        "Commercial": "Industrial/Commercial",
        "Industrial": "Industrial/Commercial"
      };

      const bookingPayload = {
        serviceId: surveyData.vendor.selectedService.id,
        vendorId: surveyData.vendor._id,
        scheduledDate,
        scheduledTime,
        address: {
          coordinates: { lat: surveyData.location.lat, lng: surveyData.location.lng },
          // Simple parsing for now, backend expects components
          street: surveyData.location.address,
          city: surveyData.details.village,
          state: surveyData.details.district,
          pincode: "000000" // filler
        },
        village: surveyData.details.village,
        mandal: surveyData.details.mandal,
        district: surveyData.details.district,
        purpose: purposeMap[surveyData.category] || "Open plots", // Default fallback
        notes: `Survey Category: ${surveyData.category}` // Store specific category in notes
      };

      const response = await createBooking(bookingPayload);
      if (response.success) {
        // Navigate to confirmation page (reusing existing one)
        const booking = response.data.booking;
        const paymentData = response.data.payment;
        const razorpayOrder = response.data.razorpayOrder;

        navigate("/user/booking/advance-payment/confirmation", {
          replace: true,
          state: {
            booking: booking,
            service: surveyData.vendor.selectedService,
            vendor: surveyData.vendor,
            paymentData: paymentData,
            razorpayOrder: razorpayOrder
          }
        });
      } else {
        toast.showError(response.message || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      toast.showError("Failed to create booking");
    }
  };

  // --- Render ---

  return (
    <PageContainer>
      {/* Header / Progress */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2 text-gray-600">
          <IoArrowBack className="text-xl" />
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto min-h-[60vh] flex flex-col">
        {step === 1 && <CategorySelection onSelect={handleCategorySelect} />}
        {step === 2 && <DetailsForm data={surveyData.details} onSubmit={handleDetailsSubmit} onBack={() => setStep(1)} />}
        {step === 3 && <LocationPicker onLocationSelect={handleLocationSelect} onBack={() => setStep(2)} />}
        {step === 4 && <ExpertSelection location={surveyData.location} category={surveyData.category} onSelect={handleExpertSelect} onBack={() => setStep(3)} />}
        {step === 5 && <SlotAndPayment surveyData={surveyData} onConfirm={handleBooking} onBack={() => setStep(4)} />}
      </div>

      {/* Modals */}
      {showTerms && (
        <TermsAndConditions
          category={surveyData.category}
          onAccept={handleTermsAccept}
          onCancel={() => setShowTerms(false)}
        />
      )}
    </PageContainer>
  );
}
