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
import { getNearbyVendors, createBooking, calculateBookingCharges, getUserDashboardStats } from "../../../services/bookingApi";

// --- Sub-components for each step ---

const CategorySelection = ({ onSelect }) => {
  const categories = [
    { id: "Agriculture", label: "Agriculture", icon: IoLeafOutline, color: "bg-green-100 text-green-600" },
    { id: "Domestic/Household", label: "Domestic/Household", icon: IoHomeOutline, color: "bg-blue-100 text-blue-600" },
    { id: "Industrial/Commercial", label: "Industrial/Commercial", icon: IoBusinessOutline, color: "bg-purple-100 text-purple-600" },
    { id: "Open plots", label: "Open plots", icon: IoConstructOutline, color: "bg-orange-100 text-orange-600" }
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

const DetailsForm = ({ data, category, onSubmit, onBack }) => {
  const [formData, setFormData] = useState(data || {
    village: "",
    mandal: "",
    district: "",
    // Extra fields
    state: "",
    purposeExtent: "",
    surveyNumber: "",
    plotNumber: "",
    notes: "",
    images: [] // placeholder if needed later
  });

  const handleChange = (e) => {
    // Check if e is processed manually or native event
    const field = e.target?.name;
    const value = e.target?.value;
    if (field) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }



  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Project Details</h2>

      <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">Location Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Village / Locality</label>
            <input
              required
              name="village"
              value={formData.village}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
              placeholder="Village Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mandal</label>
            <input
              required
              name="mandal"
              value={formData.mandal}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
              placeholder="Mandal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input
              required
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
              placeholder="District"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              required
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
              placeholder="State"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Fields based on Category */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        {/* Survey/Plot Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {category === "Agriculture" ? "Survey No" :
              (category === "Domestic/Household" || category === "Open plots") ? "Plot No" :
                "Plot / Survey No"}
          </label>
          <input
            required
            type="text"
            name={category === "Agriculture" ? "surveyNumber" : "plotNumber"}
            value={category === "Agriculture" ? formData.surveyNumber : formData.plotNumber}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
            placeholder={`Enter ${category === "Agriculture" ? "Survey No" : "Plot No"}`}
          />
        </div>

        {/* Extent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {category === "Agriculture" ? "Area Extent (Acres / Bhiga)" :
              (category === "Domestic/Household" || category === "Open plots") ? "Area Extent (Sq Yards / Sq Ft)" :
                "Area Extent (Acres / Sq Yards)"}
          </label>
          <input
            type="number"
            required
            name="purposeExtent"
            value={formData.purposeExtent}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
            placeholder="Enter extent"
            min="0"
            step="0.01"
          />
        </div>
      </div>



      <div className="pt-4 flex gap-3 pb-20">
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
          onChange={(e) => setSelectedLocation(prev => ({ ...prev, address: e.target.value }))}
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
          <IoSearchOutline className="text-xl" /> Confirm Location
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

const SlotAndPayment = ({ surveyData, onConfirm, onBack, isSubmitting }) => {
  const [date, setDate] = useState("");
  // Time is removed as per requirement, default will be used
  const [loading, setLoading] = useState(false);
  const [charges, setCharges] = useState(null);
  const toast = useToast();

  const remainingAmount = charges ? (charges.totalAmount - charges.advanceAmount) : 0;
  const subtotal = charges ? ((charges.baseServiceFee || 0) + (charges.travelCharges || 0)) : 0;

  useEffect(() => {
    // Calculate dynamic charges
    const fetchCharges = async () => {
      // Assuming location.lat/lng and vendor are available
      if (!surveyData.vendor || !surveyData.location) return;

      try {
        const res = await calculateBookingCharges(
          surveyData.vendor.selectedService.id || surveyData.vendor.selectedService._id,
          surveyData.vendor._id || surveyData.vendor.id,
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
    if (!date) {
      toast.showError("Please select a date");
      return;
    }
    // Default time passed as it's no longer selected by user
    onConfirm({ scheduledDate: date, scheduledTime: "10:00 AM" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Review & Book</h2>

      {/* Slot */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <IoCalendarOutline /> Schedule Visit
        </h3>
        <div className="flex flex-col gap-3">
          <input
            type="date"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="text-xs text-gray-500 italic">
            * Our expert will contact you to coordinate the exact time.
          </p>
        </div>
      </div>

      {/* Vendor Info (if pre-selected it's nice to show who) */}
      {surveyData.vendor && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Service Provider</p>
            <p className="font-bold text-gray-800">{surveyData.vendor.name}</p>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url(${surveyData.vendor.documents?.profilePicture?.url || ''})` }}>
          </div>
        </div>
      )}

      {/* Payment Breakdown Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoCashOutline className="text-xl text-yellow-500" />
            <h3 className="font-bold text-gray-800">Payment Breakdown</h3>
          </div>
          <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-md">Calculated</span>
        </div>

        <div className="space-y-3">
          {/* Base Service Fee */}
          <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Base Service Fee</p>
              <p className="text-xs text-gray-500">Service charge</p>
            </div>
            <p className="font-bold text-gray-900">₹{charges?.baseServiceFee?.toFixed(2) || '0.00'}</p>
          </div>

          {/* Travel Charges */}
          <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Travel Charges (Two-way)</p>
              <p className="text-xs text-gray-500">
                {charges?.distance ? `${charges.distance} km` : '0 km'} from vendor
              </p>
              {charges?.travelCharges > 0 && (
                <p className="text-xs font-bold text-gray-500">
                  2 x ₹{(charges.travelCharges / 2).toFixed(2)}
                </p>
              )}
            </div>
            {charges?.travelCharges > 0 ? (
              <p className="font-bold text-gray-900">₹{charges.travelCharges.toFixed(2)}</p>
            ) : (
              <p className="font-bold text-green-600 text-xs">Free (Within Range)</p>
            )}
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
            <p className="font-semibold text-gray-800 text-sm">Subtotal</p>
            <p className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</p>
          </div>

          {/* GST */}
          <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800 text-sm">GST</p>
              <p className="text-xs text-gray-500">{charges?.gstPercentage || 18}% on subtotal</p>
            </div>
            <p className="font-bold text-gray-900">₹{charges?.gst?.toFixed(2) || '0.00'}</p>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
            <p className="font-bold text-gray-800 text-sm">Total Amount</p>
            <p className="font-bold text-xl text-gray-900">₹{charges?.totalAmount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Payment Schedule</p>
          <div className="space-y-3">
            {/* Advance Payment */}
            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Advance Payment</p>
                <p className="text-xs text-blue-600">40% of total</p>
              </div>
              <p className="font-bold text-blue-600 text-lg">₹{charges?.advanceAmount?.toFixed(2) || '0.00'}</p>
            </div>

            {/* Remaining Payment */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Remaining Payment</p>
                <p className="text-xs text-gray-500">60% of total</p>
              </div>
              <p className="font-bold text-gray-800 text-lg">₹{remainingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
        <button
          onClick={handlePay}
          disabled={!charges || isSubmitting}
          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <IoCashOutline /> Book & Pay
            </>
          )}
        </button>
      </div>
    </div>
  );
};


const PendingBookingModal = ({ booking, onResume, onIgnore }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 p-6 relative overflow-hidden">

        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>

        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-orange-50/50">
            <IoTimeOutline className="text-3xl text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Pending Booking Found</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-[80%]">
            You have an incomplete booking for <span className="font-semibold text-gray-800">{booking.service?.name || "Service"}</span> waiting for payment.
          </p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 flex items-center gap-4 text-left">
          <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
            <IoCalendarOutline className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {new Date(booking.scheduledDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">
              Amount Due: <span className="font-medium text-blue-600">₹{booking.payment?.advanceAmount?.toFixed(2)}</span>
            </p>
          </div>
          <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md uppercase tracking-wide">
            Action Req.
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onResume(booking)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Complete Payment <IoCheckmarkCircle className="text-lg" />
          </button>

          <button
            onClick={onIgnore}
            className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm"
          >
            Ignore & Start New Booking
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Wizard Component ---

export default function UserSurveyFlow() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    category: null,
    details: null,
    location: null,
    vendor: null,
    slot: null
  });
  const [showTerms, setShowTerms] = useState(false);
  const [isVendorPreSelected, setIsVendorPreSelected] = useState(false);
  const [pendingBookingAlert, setPendingBookingAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if we have pre-selected vendor data from navigation (Scenario B)
    if (location.state?.vendor) {
      setSurveyData(prev => ({
        ...prev,
        vendor: {
          ...location.state.vendor,
          // Ensure selectedService is attached if passed separately or needs to be found
          selectedService: location.state.service || location.state.vendor.selectedService
        }
      }));
      setIsVendorPreSelected(true);
    }

    // Check if category is passed (Scenario A or B)
    if (location.state?.category) {
      setSurveyData(prev => ({ ...prev, category: location.state.category }));
      setShowTerms(true);
    }

    // Check for pending bookings
    const checkPendingBookings = async () => {
      try {
        const stats = await getUserDashboardStats();
        if (stats.success && stats.data?.recentBookings) {
          const pendingBooking = stats.data.recentBookings.find(
            b => b.status?.toLowerCase() === 'pending' && (!b.payment || !b.payment.advancePaid)
          );

          if (pendingBooking) {
            setPendingBookingAlert(pendingBooking);
          }
        }
      } catch (error) {
        console.error("Error checking pending bookings:", error);
      }
    };

    checkPendingBookings();
  }, [location.state]);

  // Step 1: Category Selected
  const handleCategorySelect = (catId) => {
    setSurveyData({ ...surveyData, category: catId });
    setShowTerms(true);
  };

  // Step 2: Terms Accepted
  const handleTermsAccept = () => {
    setShowTerms(false);
    // Show "Added to Cart" toast - optional UX choice
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

    // If vendor is pre-selected, skip the expert selection step (generally step 4->5)
    // Here we have steps indexed 1..5. Step 4 originally goes to ExpertSelection (Step 4 render).
    // Wait, step logic:
    // Step 1: Category. Step 2: Details. Step 3: Location. Step 4: Expert. Step 5: Slot.
    // If pre-selected, jump to Step 5 (Slot)
    if (isVendorPreSelected) {
      setStep(5);
    } else {
      setStep(4);
    }
  };

  // Step 5: Expert Selected (Only for Scenario A)
  const handleExpertSelect = (vendor) => {
    setSurveyData({ ...surveyData, vendor });
    setStep(5);
  };

  // Step 6: Final Booking
  const handleBooking = async ({ scheduledDate, scheduledTime }) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Map frontend category to backend enum
      const purposeMap = {
        "Agriculture": "Agriculture",
        "Domestic/Household": "Domestic/Household",
        "Commercial": "Industrial/Commercial",
        "Industrial": "Industrial/Commercial"
      };

      const bookingPayload = {
        serviceId: surveyData.vendor.selectedService.id || surveyData.vendor.selectedService._id,
        vendorId: surveyData.vendor._id || surveyData.vendor.id,
        scheduledDate,
        scheduledTime,
        address: {
          coordinates: { lat: surveyData.location.lat, lng: surveyData.location.lng },
          street: surveyData.location.address,
          city: surveyData.details.village,
          state: surveyData.details.district,
          pincode: "000000" // filler
        },
        village: surveyData.details.village,
        mandal: surveyData.details.mandal,
        district: surveyData.details.district,
        purpose: purposeMap[surveyData.category] || "Open plots",
        purposeExtent: surveyData.details.purposeExtent,
        notes: `Category: ${surveyData.category}. ${surveyData.details.surveyNumber ? `Survey No: ${surveyData.details.surveyNumber}. ` : ''
          }${surveyData.details.plotNumber ? `Plot No: ${surveyData.details.plotNumber}. ` : ''
          }${surveyData.details.notes ? surveyData.details.notes : ''}`
      };

      const response = await createBooking(bookingPayload);
      if (response.success) {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---

  return (
    <PageContainer>
      {/* Header / Progress */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => {
          // Back navigation logic
          if (step === 1) navigate(-1);
          else if (step === 5 && isVendorPreSelected) setStep(3); // Jump back from Slot to Location if pre-selected
          else setStep(step - 1);
        }} className="p-2 -ml-2 text-gray-600">
          <IoArrowBack className="text-xl" />
        </button>
        <div className="flex gap-1.5">
          {/* Progress dots - adjust count based on mode? Or keep standard 5 */}
          {[1, 2, 3, 4, 5].map(i => {
            // Hide step 4 dot if pre-selected? Or just visually skip it
            if (isVendorPreSelected && i === 4) return null;
            return (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto min-h-[60vh] flex flex-col">
        {step === 1 && <CategorySelection onSelect={handleCategorySelect} />}
        {step === 2 && <DetailsForm category={surveyData.category} data={surveyData.details} onSubmit={handleDetailsSubmit} onBack={() => setStep(1)} />}
        {step === 3 && <LocationPicker onLocationSelect={handleLocationSelect} onBack={() => setStep(2)} />}
        {step === 4 && <ExpertSelection location={surveyData.location} category={surveyData.category} onSelect={handleExpertSelect} onBack={() => setStep(3)} />}
        {step === 5 && <SlotAndPayment surveyData={surveyData} onConfirm={handleBooking} onBack={() => isVendorPreSelected ? setStep(3) : setStep(4)} isSubmitting={isSubmitting} />}
      </div>

      {/* Modals */}
      {pendingBookingAlert && (
        <PendingBookingModal
          booking={pendingBookingAlert}
          onResume={(booking) => {
            navigate("/user/booking/advance-payment/confirmation", {
              replace: true,
              state: {
                booking: booking,
                service: booking.service,
                vendor: booking.vendor,
                paymentData: {
                  advanceAmount: booking.payment?.advanceAmount,
                  remainingAmount: booking.payment?.remainingAmount,
                  totalAmount: booking.payment?.totalAmount,
                  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID
                },
                razorpayOrder: {
                  id: booking.payment?.advanceRazorpayOrderId,
                  amount: (booking.payment?.advanceAmount || 0) * 100,
                  currency: "INR"
                }
              }
            });
          }}
          onIgnore={() => setPendingBookingAlert(null)}
        />
      )}

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
