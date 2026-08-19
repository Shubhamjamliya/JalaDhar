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
  IoBriefcaseOutline,
  IoCashOutline,
  IoInformationCircleOutline,
  IoSearchOutline,
  IoClose,
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoHelpCircleOutline,
  IoBulbOutline
} from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import PageContainer from "../../shared/components/PageContainer";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import { getNearbyVendors, createBooking, calculateBookingCharges, getUserDashboardStats, getVendorProfile } from "../../../services/bookingApi";
import { getPublicSettings } from "../../../services/settingsApi";
import PolicyModal from "../../shared/components/PolicyModal";
import ExpertProfileCard from "../components/ExpertProfileCard";
import { parseAcresGuntas, isAgriCategory } from "../../../utils/landAreaHelper";
import StateDistrictInput from "../../../components/StateDistrictInput";
import { getStatesList, getDistrictsList, findStateForDistrict } from "../../../utils/indianStatesDistricts";
import { formatDateToDDMMYYYY, formatDateToLongString } from "../../../utils/dateFormatter";
import CustomDropdown from "../../shared/components/CustomDropdown";
import {
  formatWorkingDays,
  formatWorkingHours,
  isExpertAvailableOnDate,
  getNextAvailableDates,
  normalizeWorkingDays
} from "../../../utils/availabilityUtils";

const CROP_OPTIONS = [
  { value: "Paddy", label: "Paddy (Rice)" },
  { value: "Cotton", label: "Cotton" },
  { value: "Vegetables", label: "Vegetables" },
  { value: "Fruit Orchard", label: "Fruit Orchard / Horticulture" },
  { value: "Sugarcane", label: "Sugarcane" },
  { value: "Wheat", label: "Wheat" },
  { value: "Pulses", label: "Pulses / Grains" },
  { value: "Commercial", label: "Commercial Crops" },
  { value: "Others", label: "Others" }
];

const FARMING_TYPE_OPTIONS = [
  { value: "Dry Land (Metta)", label: "Dry Land (Metta)" },
  { value: "Wet Land (Magani)", label: "Wet Land (Magani)" },
  { value: "Irrigated Land", label: "Irrigated Land" },
  { value: "Rainfed Land", label: "Rainfed Land" },
  { value: "Garden Land", label: "Garden Land" },
  { value: "Orchard Land", label: "Orchard Land" },
  { value: "Plantation Land", label: "Plantation Land" },
  { value: "Pasture / Grazing Land", label: "Pasture / Grazing Land" },
  { value: "Barren / Fallow Agricultural Land", label: "Barren / Fallow Agricultural Land" },
  { value: "Mixed Agricultural Land", label: "Mixed Agricultural Land" },
  { value: "Converted Agricultural Land", label: "Converted Agricultural Land" },
  { value: "Other Agricultural Land", label: "Other Agricultural Land" }
];

const EXISTING_BOREWELL_OPTIONS = [
  { value: "No", label: "No Existing Borewell" },
  { value: "Yes (Active)", label: "Yes (Active Borewell)" },
  { value: "Yes (Dry / Failed)", label: "Yes (Dry / Dried Up Borewell)" }
];

const EXISTING_OPEN_WELL_OPTIONS = [
  { value: "No", label: "No Open Well" },
  { value: "Yes", label: "Yes (Open Well Present)" }
];

const WATER_SOURCE_OPTIONS = [
  { value: "Canal", label: "Canal Water" },
  { value: "Tank", label: "Village Tank / Lake" },
  { value: "Borewell", label: "Existing Borewell" },
  { value: "Rainfed", label: "Rainfed Only" },
  { value: "Others", label: "Others" }
];

const HOUSE_TYPE_OPTIONS = [
  { value: "Independent House", label: "Independent House" },
  { value: "Apartment / Flat", label: "Apartment / Flat" },
  { value: "Villa", label: "Villa" },
  { value: "Residential Plot", label: "Residential Plot" },
  { value: "Farmhouse", label: "Farmhouse" },
  { value: "Residential Layout", label: "Residential Layout" },
  { value: "Gated Community", label: "Gated Community" },
  { value: "Individual Residential Property", label: "Individual Residential Property" },
  { value: "Mixed Residential Property", label: "Mixed Residential Property" },
  { value: "Other Residential Property", label: "Other Residential Property" }
];

const COMMERCIAL_PROPERTY_TYPE_OPTIONS = [
  { value: "Commercial Building", label: "Commercial Building" },
  { value: "Office / Corporate Building", label: "Office / Corporate Building" },
  { value: "Shop / Retail Store", label: "Shop / Retail Store" },
  { value: "Shopping Complex / Mall", label: "Shopping Complex / Mall" },
  { value: "Hotel / Resort", label: "Hotel / Resort" },
  { value: "Restaurant / Food Court", label: "Restaurant / Food Court" },
  { value: "Warehouse / Godown", label: "Warehouse / Godown" },
  { value: "Business Park", label: "Business Park" },
  { value: "Hospital / Healthcare Facility", label: "Hospital / Healthcare Facility" },
  { value: "School / College / Educational Institution", label: "School / College / Educational Institution" },
  { value: "Petrol Pump / Fuel Station", label: "Petrol Pump / Fuel Station" },
  { value: "Commercial Plot", label: "Commercial Plot" },
  { value: "Market / Wholesale Market", label: "Market / Wholesale Market" },
  { value: "Other Commercial Property", label: "Other Commercial Property" }
];

const INDUSTRIAL_PROPERTY_TYPE_OPTIONS = [
  { value: "Manufacturing Unit / Factory", label: "Manufacturing Unit / Factory" },
  { value: "Industrial Plant", label: "Industrial Plant" },
  { value: "Processing Unit", label: "Processing Unit" },
  { value: "Food Processing Unit", label: "Food Processing Unit" },
  { value: "Pharmaceutical / Chemical Unit", label: "Pharmaceutical / Chemical Unit" },
  { value: "Textile / Garment Unit", label: "Textile / Garment Unit" },
  { value: "Steel / Metal Unit", label: "Steel / Metal Unit" },
  { value: "Cement / Construction Material Unit", label: "Cement / Construction Material Unit" },
  { value: "Power / Energy Plant", label: "Power / Energy Plant" },
  { value: "Cold Storage", label: "Cold Storage" },
  { value: "Warehouse / Logistics Facility", label: "Warehouse / Logistics Facility" },
  { value: "Industrial Park / Estate", label: "Industrial Park / Estate" },
  { value: "Mining / Quarrying Area", label: "Mining / Quarrying Area" },
  { value: "Industrial Plot", label: "Industrial Plot" },
  { value: "Other Industrial Property", label: "Other Industrial Property" }
];

// --- Sub-components for each step ---

const CATEGORY_FAQS = [
  {
    q: "What is an Agriculture Groundwater Survey?",
    a: "An Agriculture Groundwater Survey is conducted on agricultural land to assess the geological and subsurface conditions and relevant groundwater indicators, and to identify a suitable location for borewell drilling."
  },
  {
    q: "What is a Household Groundwater Survey?",
    a: "A Household Groundwater Survey is conducted for houses, residential plots and individual properties to assess the site and relevant subsurface conditions and identify a suitable location for borewell drilling for household water requirements."
  },
  {
    q: "What is a Commercial Groundwater Survey?",
    a: "A Commercial Groundwater Survey is conducted for commercial properties such as offices, apartments, hotels, institutions, shops and other commercial premises to assess groundwater conditions and identify suitable locations for borewell drilling."
  },
  {
    q: "What is an Industrial Groundwater Survey?",
    a: "An Industrial Groundwater Survey is conducted for factories, plants, warehouses and other industrial properties to assess geological and subsurface conditions and identify suitable borewell drilling locations based on the site's groundwater potential."
  },
  {
    q: "What does the survey cover?",
    a: "Assessment of the site, geological and subsurface conditions, and relevant groundwater indicators to recommend a drilling location."
  },
  {
    q: "Will I get the estimated drilling depth?",
    a: "Where technically feasible, the expert will provide an estimated drilling depth based on the survey findings."
  },
  {
    q: "Will I receive a survey report?",
    a: "Yes. A digital survey report will be submitted through the Jaladhaara app."
  },
  {
    q: "Can I request multiple drilling points?",
    a: "Yes, if multiple points are included in the selected survey package."
  },
  {
    q: "Does the survey guarantee water or borewell success?",
    a: "No. The survey provides a professional assessment and recommendation. Groundwater availability, yield, quality, depth and borewell success cannot be guaranteed."
  },
  {
    q: "Is borewell drilling included, and who conducts the survey?",
    a: "No. Borewell drilling is separate. The survey is conducted by a verified groundwater survey expert assigned through Jaladhaara."
  }
];

const CategorySelection = ({ onSelect }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const categories = [
    { id: "Agriculture", label: "Agriculture", icon: IoLeafOutline, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    { id: "Household", label: "Household", icon: IoHomeOutline, color: "bg-blue-50 text-[#0A84FF] border border-blue-100" },
    { id: "Commercial", label: "Commercial", icon: IoBusinessOutline, color: "bg-purple-50 text-purple-600 border border-purple-100" },
    { id: "Industrial", label: "Industrial", icon: IoBriefcaseOutline, color: "bg-amber-50 text-amber-600 border border-amber-100" }
  ];

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
          Select Survey Category
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Choose the purpose of your groundwater survey to view specialized packages.
        </p>
      </div>

      {/* 2x2 Category Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center justify-center p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#0A84FF] hover:shadow-md transition-all cursor-pointer min-h-[135px] sm:min-h-[145px] group active:scale-98"
          >
            <div className={`p-3 rounded-2xl ${cat.color} mb-2.5 text-2xl group-hover:scale-105 transition-transform`}>
              <cat.icon />
            </div>
            <span className="font-extrabold text-slate-800 text-xs sm:text-sm text-center leading-tight">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* FAQs Section — Pixel Perfect Match with Design Mockup */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        {/* Header with Title and Lightbulb Icon */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">FAQs</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Frequently Asked Questions</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs shrink-0">
            <IoBulbOutline className="text-2xl" />
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {CATEGORY_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`border rounded-2xl transition-all overflow-hidden ${
                  isOpen ? "border-slate-300 shadow-2xs bg-slate-50/40" : "border-slate-200/80 hover:border-slate-300 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <span className="leading-snug text-slate-900 font-extrabold">
                    Q{idx + 1}. {faq.q}
                  </span>
                  <div className="p-1 rounded-full text-slate-400 shrink-0">
                    {isOpen ? (
                      <IoChevronUpOutline className="text-base text-slate-600" />
                    ) : (
                      <IoChevronDownOutline className="text-base" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};



const TermsAndConditions = ({ category, onAccept, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [termsContent, setTermsContent] = useState("");

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await getPublicSettings('policy');
        if (response.success && response.data.settings) {
          const terms = response.data.settings.find(s => s.key === 'terms_of_service');
          if (terms) {
            setTermsContent(terms.value);
          }
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onCancel}>
      <div className="bg-white rounded-[22px] shadow-2xl max-w-md w-full p-5 sm:p-6 border border-gray-100 space-y-4 transform transition-all animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>

        {/* Header — Tight & Aligned */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center shrink-0">
              <IoShieldCheckmarkOutline className="text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-none">Terms & Conditions</h3>
              <span className="text-[11px] font-semibold text-[#0A84FF] inline-block mt-1">
                {category || "Survey"} Category
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors active:scale-95"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* Content Body — Zero Scroll, Perfectly Aligned */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-gray-400">Loading terms...</span>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs text-gray-700 font-medium">
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
              <p className="leading-snug text-gray-700">
                <strong className="text-gray-900 font-bold">Scientific Assessment:</strong> Reports use geophysical methods; groundwater occurrence is natural and yield is not 100% guaranteed.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
              <p className="leading-snug text-gray-700">
                <strong className="text-gray-900 font-bold">Advance Payment:</strong> 40% advance payment is required to confirm expert assignment and lock your slot.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
              <p className="leading-snug text-gray-700">
                <strong className="text-gray-900 font-bold">Site Access:</strong> Customer presence inside the survey land and safe site access are mandatory during the visit.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
              <p className="leading-snug text-gray-700">
                <strong className="text-gray-900 font-bold">Platform Policy:</strong> Cancellations, refunds, and rescheduling are governed by standard Jaladhaara policies.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons — Aligned Footer */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="w-1/3 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-xs active:scale-98"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="w-2/3 py-2.5 rounded-xl font-bold text-white bg-[#0A84FF] hover:bg-[#0070DF] shadow-sm active:scale-98 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <IoCheckmarkCircleOutline className="text-base" />
            <span>I Agree & Continue</span>
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
    state: "",
    purposeExtent: "",
    areaUnit: (category && (category.toLowerCase().includes("commer") || category.toLowerCase().includes("indus") || category.toLowerCase().includes("house") || category.toLowerCase().includes("resi"))) ? "sqft" : "acres",
    surveyNumber: "",
    plotNumber: "",
    notes: "",
    // Category Specific Questionnaire Fields
    cropType: "Paddy",
    irrigatedType: "Irrigated",
    existingBorewells: "No",
    existingOpenWells: "No",
    waterSource: "Canal",
    houseType: "Independent House",
    colonyRoad: "",
    landmark: "",
    companyName: "",
    contactPerson: "",
    projectName: "",
    propertyType: "",
    factoryName: "",
    industryType: "",
    waterRequirement: "",
    pointsRequired: 1
  });

  const handleChange = (e) => {
    const field = e.target?.name;
    const value = e.target?.value;
    if (field) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const catLower = (category || "").toLowerCase();
  const isAgri = isAgriCategory(category) || catLower.includes("agri");
  const isResi = catLower.includes("house") || catLower.includes("resi");
  const isInd = catLower.includes("indus");
  const isComm = catLower.includes("commer") && !isInd;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-800">
          {category} Survey
        </h2>
      </div>

      {/* Customer & Company Details for Commercial & Industrial */}
      {(isComm || isInd) && (
        <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-2">Customer &amp; Company Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Company / Organization Name *</label>
              <input
                required
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
                placeholder="e.g. Acme Industries Ltd."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person Name *</label>
              <input
                required
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
                placeholder="e.g. John Doe"
              />
            </div>
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">Location &amp; Address</h3>
        
        {/* Residential Colony / Road & Landmark */}
        {isResi && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Colony / Road Name</label>
              <input
                name="colonyRoad"
                value={formData.colonyRoad}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
                placeholder="Colony or Street Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Landmark</label>
              <input
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
                placeholder="Nearby Landmark"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Village / Locality *</label>
            <input
              required
              name="village"
              value={formData.village}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
              placeholder="Village Name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mandal *</label>
            <input
              required
              name="mandal"
              value={formData.mandal}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
              placeholder="Mandal"
            />
          </div>
          <div>
            <StateDistrictInput
              required
              label="District *"
              value={formData.district}
              onChange={(val) => {
                handleChange({ target: { name: "district", value: val } });
                const matchedState = findStateForDistrict(val);
                if (matchedState && !formData.state) {
                  handleChange({ target: { name: "state", value: matchedState } });
                }
              }}
              onSelectSuggestion={(selectedDistrict) => {
                handleChange({ target: { name: "district", value: selectedDistrict } });
                const matchedState = findStateForDistrict(selectedDistrict);
                if (matchedState) {
                  handleChange({ target: { name: "state", value: matchedState } });
                }
              }}
              suggestions={getDistrictsList(formData.state, formData.district)}
              placeholder="Search or enter district..."
            />
          </div>
          <div>
            <StateDistrictInput
              required
              label="State *"
              value={formData.state}
              onChange={(val) => {
                handleChange({ target: { name: "state", value: val } });
              }}
              onSelectSuggestion={(selectedState) => {
                handleChange({ target: { name: "state", value: selectedState } });
              }}
              suggestions={getStatesList(formData.state)}
              placeholder="Search or enter state..."
            />
          </div>
        </div>
      </div>

      {/* Dynamic Category Specific Questionnaire */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-700 mb-2">Category Survey Information</h3>

        {/* 1. Agriculture Specifics */}
        {isAgri && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Crop Type *</label>
              <CustomDropdown
                name="cropType"
                value={formData.cropType}
                onChange={handleChange}
                options={CROP_OPTIONS}
                placeholder="Select Crop Type"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agricultural Land Type *</label>
              <CustomDropdown
                name="irrigatedType"
                value={formData.irrigatedType}
                onChange={handleChange}
                options={FARMING_TYPE_OPTIONS}
                placeholder="Select Land Type"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Existing Borewells? *</label>
              <CustomDropdown
                name="existingBorewells"
                value={formData.existingBorewells}
                onChange={handleChange}
                options={EXISTING_BOREWELL_OPTIONS}
                placeholder="Select Existing Borewell Status"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Existing Open Wells? *</label>
              <CustomDropdown
                name="existingOpenWells"
                value={formData.existingOpenWells}
                onChange={handleChange}
                options={EXISTING_OPEN_WELL_OPTIONS}
                placeholder="Select Open Well Status"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Primary Water Source *</label>
              <CustomDropdown
                name="waterSource"
                value={formData.waterSource}
                onChange={handleChange}
                options={WATER_SOURCE_OPTIONS}
                placeholder="Select Primary Water Source"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Borewell Points Required *</label>
              <input
                type="number"
                min="1"
                max="20"
                name="pointsRequired"
                value={formData.pointsRequired}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs font-bold"
              />
            </div>
          </div>
        )}

        {/* 2. Residential Specifics */}
        {isResi && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Household Land Type *</label>
              <CustomDropdown
                name="houseType"
                value={formData.houseType}
                onChange={handleChange}
                options={HOUSE_TYPE_OPTIONS}
                placeholder="Select Property Type"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Existing Borewell? *</label>
              <CustomDropdown
                name="existingBorewells"
                value={formData.existingBorewells}
                onChange={handleChange}
                options={EXISTING_BOREWELL_OPTIONS}
                placeholder="Select Existing Borewell Status"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Borewell Points Required *</label>
              <input
                type="number"
                min="1"
                max="10"
                name="pointsRequired"
                value={formData.pointsRequired}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs font-bold"
              />
            </div>
          </div>
        )}

        {/* 3. Commercial Specifics */}
        {isComm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Commercial Property Type *</label>
              <CustomDropdown
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                options={COMMERCIAL_PROPERTY_TYPE_OPTIONS}
                placeholder="Select Commercial Property Type"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
              <input
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
                placeholder="Project / Building Name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Points Required *</label>
              <input
                type="number"
                min="1"
                max="20"
                name="pointsRequired"
                value={formData.pointsRequired}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs font-bold"
              />
            </div>
          </div>
        )}

        {/* 4. Industrial Specifics */}
        {isInd && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Industrial Property Type *</label>
              <CustomDropdown
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
                options={INDUSTRIAL_PROPERTY_TYPE_OPTIONS}
                placeholder="Select Industrial Property Type"
                size="sm"
                activeColor="blue"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Factory / Plant Name *</label>
              <input
                required
                name="factoryName"
                value={formData.factoryName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
                placeholder="e.g. Unit 1 Plant"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Water Requirement Purpose *</label>
              <input
                required
                name="waterRequirement"
                value={formData.waterRequirement}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs font-medium"
                placeholder="Enter Water Purpose (e.g. Process Water, Cooling Plant, Staff Use)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Points Required *</label>
              <input
                type="number"
                min="1"
                max="30"
                name="pointsRequired"
                value={formData.pointsRequired}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs font-bold"
              />
            </div>
          </div>
        )}

        {/* Survey / Plot Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {isAgri ? "Survey Number *" : "Survey / Plot / Door Number *"}
          </label>
          <input
            required
            type="text"
            name={isAgri ? "surveyNumber" : "plotNumber"}
            value={isAgri ? formData.surveyNumber : formData.plotNumber}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-xs"
            placeholder={`Enter ${isAgri ? "Survey Number" : "Survey / Plot Number"}`}
          />
        </div>

        {/* Extent Input Block */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <span>Total Land / Site Area *</span>
            </label>
            {isAgri ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-100/80">
                🌾 Acres &amp; Guntas
              </span>
            ) : (
              <select
                name="areaUnit"
                value={formData.areaUnit || 'sqft'}
                onChange={handleChange}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0A84FF] border border-blue-100/80 outline-none cursor-pointer"
              >
                <option value="sqft">📐 Square Feet (Sq. Ft.)</option>
                <option value="sqyd">📐 Square Yards (Sq. Yd.)</option>
                <option value="acres">🌾 Acres</option>
              </select>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              type="number"
              required
              name="purposeExtent"
              value={formData.purposeExtent}
              onChange={(e) => {
                const val = e.target.value;
                if (val && isAgri) {
                  const parsed = parseAcresGuntas(val);
                  if (val.includes('.') && parseInt(val.split('.')[1], 10) >= 40) {
                    handleChange({ target: { name: "purposeExtent", value: String(parsed.decimalValue) } });
                    return;
                  }
                }
                handleChange(e);
              }}
              className="w-full pl-4 pr-24 py-2.5 rounded-xl border border-gray-200 focus:border-[#0A84FF] outline-none text-xs font-medium text-gray-900"
              placeholder={isAgri ? "e.g. 2.20 (2 Acres 20 Guntas)" : "e.g. 1800"}
              min="0"
              step="any"
            />
            <div className="absolute right-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg pointer-events-none select-none border border-gray-200">
              {isAgri ? "Acres" : (formData.areaUnit === 'sqyd' ? "Sq. Yd." : (formData.areaUnit === 'acres' ? "Acres" : "Sq. Ft."))}
            </div>
          </div>
        </div>
      </div>
      {/* Live Conversion & Formatted Summary Card */}
      {formData.purposeExtent && !isNaN(parseFloat(formData.purposeExtent)) && parseFloat(formData.purposeExtent) > 0 && isAgriCategory(category) && (
        <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-100/80 flex items-center justify-between text-xs transition-all animate-in fade-in duration-200">
          {(() => {
            const parsed = parseAcresGuntas(formData.purposeExtent);
            return (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">🌾</span>
                  <span className="font-bold text-gray-900 text-xs">
                    {parsed.formatted}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-gray-500 bg-white/90 px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                  40 Guntas = 1 Acre
                </span>
              </div>
            );
          })()}
        </div>
      )}

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
      toast.showError("Geolocation is not supported by your browser");
      return;
    }
    setSearching(true);

    const handleSuccess = async (pos) => {
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
    };

    const handleError = (err) => {
      console.warn("High accuracy geolocation failed, retrying with standard accuracy...", err);
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (finalErr) => {
          console.error("Geolocation failed:", finalErr);
          if (finalErr.code === 1) {
            toast.showError("Location permission denied. Please allow location access or search your land address below.");
          } else {
            toast.showError("Unable to detect GPS. Please search and select your land address below.");
          }
          setSearching(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && selectedLocation.lat !== undefined && selectedLocation.lng !== undefined) {
      onLocationSelect(selectedLocation);
    } else {
      toast.showError("Please pin the exact location of your survey land with valid GPS coordinates.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Pin Location</h2>

      {/* ─── SURVEY LAND LOCATION WARNING BANNER ─── */}
      <div className="rounded-2xl overflow-hidden border-2 border-red-200 shadow-md">
        {/* Header */}
        <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
          <span className="text-xl">📍</span>
          <p className="text-white font-extrabold text-sm tracking-wide uppercase">Important — Pin the Correct Location</p>
        </div>
        {/* Body */}
        <div className="bg-red-50 px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-black text-base mt-0.5">✅</span>
            <p className="text-sm font-semibold text-gray-800">
              <span className="text-green-700 font-extrabold">DO: </span>
              Stand inside the actual survey land and pin your exact GPS location.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-black text-base mt-0.5">❌</span>
            <p className="text-sm font-semibold text-gray-800">
              <span className="text-red-700 font-extrabold">DON'T: </span>
              Pin your village, home, office, road junction, or any nearby landmark unless it is the actual survey land.
            </p>
          </div>
          <p className="text-[11px] text-red-700 font-bold border-t border-red-200 pt-2">
            ⚠️ Incorrect location pinning may result in expert dispatch to the wrong site and non-refundable charges.
          </p>
        </div>
      </div>

      {/* Current Location Section */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800 mb-3">Get your current GPS location seamlessly.</p>
        <button
          onClick={getCurrentLocation}
          disabled={searching}
          className="relative w-full flex items-center justify-center bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm text-[13px] sm:text-sm"
        >
          <IoLocationSharp className="absolute left-4 text-lg" />
          <span>{searching ? "Locating..." : "Use Current Location of Your Land / Plot"}</span>
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
        {selectedLocation?.lat !== undefined && selectedLocation?.lng !== undefined && (
          <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <IoCheckmarkCircle className="text-sm" /> Location captured: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Main Action Button */}
      <div className="pt-4">
        <button
          onClick={handleConfirmLocation}
          disabled={!selectedLocation?.lat || !selectedLocation?.lng}
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
            const rawService = expert.allServices?.find(s =>
              s.name.toLowerCase().includes('survey') ||
              s.category?.toLowerCase().includes('survey') ||
              true
            ) || expert.allServices?.[0];

            const surveyService = rawService ? {
              ...rawService,
              price: expert.servicePrice || expert.minPrice || rawService.price || 3500
            } : {
              id: expert._id,
              name: 'Groundwater Survey',
              category: 'Groundwater Survey',
              price: expert.servicePrice || expert.minPrice || 3500
            };

            return (
              <ExpertProfileCard
                key={expert._id}
                expert={expert}
                selectedService={surveyService}
                onSelect={(selectedExp) => onSelect({ ...selectedExp, selectedService: surveyService })}
              />
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
  const [vendorData, setVendorData] = useState(surveyData.vendor);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [charges, setCharges] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const toast = useToast();

  const remainingAmount = charges ? (charges.totalAmount - charges.advanceAmount) : 0;
  const subtotal = charges ? ((charges.baseServiceFee || 0) + (charges.travelCharges || 0)) : 0;

  // Keep vendorData in sync with surveyData.vendor
  useEffect(() => {
    if (surveyData.vendor) {
      setVendorData(surveyData.vendor);
    }
  }, [surveyData.vendor]);

  // Fetch the latest fresh vendor profile from server to ensure live availability is always up to date
  useEffect(() => {
    const fetchLatestVendor = async () => {
      const vendorId = surveyData.vendor?._id || surveyData.vendor?.id;
      if (!vendorId) return;
      try {
        const res = await getVendorProfile(vendorId, surveyData.location?.lat, surveyData.location?.lng);
        if (res.success && res.data?.vendor) {
          setVendorData(prev => ({
            ...prev,
            ...res.data.vendor,
            selectedService: surveyData.vendor?.selectedService || prev?.selectedService || res.data.vendor.services?.[0]
          }));
        }
      } catch (err) {
        console.error("Could not refresh live vendor profile:", err);
      }
    };
    fetchLatestVendor();
  }, [surveyData.vendor?._id, surveyData.vendor?.id]);

  const fetchCharges = async () => {
    const currentVendor = vendorData || surveyData.vendor;
    const selectedService = currentVendor?.selectedService || surveyData.vendor?.selectedService || currentVendor?.services?.[0] || currentVendor?.allServices?.[0];

    if (!currentVendor) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const serviceId = selectedService?.id || selectedService?._id || (typeof currentVendor.services?.[0] === 'string' ? currentVendor.services[0] : currentVendor.services?.[0]?._id) || 'default';
      const vendorId = currentVendor._id || currentVendor.id;

      if (!vendorId) {
        setError("Vendor details are missing. Please go back and select an expert.");
        return;
      }

      const userLat = surveyData.location?.lat || surveyData.location?.latitude || 0;
      const userLng = surveyData.location?.lng || surveyData.location?.longitude || 0;

      const res = await calculateBookingCharges(
        serviceId,
        vendorId,
        userLat,
        userLng
      );
      if (res.success && res.data) {
        setCharges(res.data);
      } else {
        throw new Error(res.message || "Failed to calculate charges");
      }
    } catch (err) {
      console.error("Error calculating charges", err);
      const serverMsg = err.response?.data?.message || err.message;
      
      // Compute safe client-side estimate if backend call fails so booking isn't blocked with ₹0.00
      const fallbackBaseFee = currentVendor?.servicePrice || currentVendor?.minPrice || selectedService?.price || 3500;
      const gst = fallbackBaseFee * 0.18;
      const subtotal = fallbackBaseFee + gst;
      const total = subtotal;
      const advance = total * 0.40;
      const remaining = total - advance;

      setCharges(prev => prev || {
        baseServiceFee: fallbackBaseFee,
        distance: 0,
        travelCharges: 0,
        subtotal: subtotal,
        gst: gst,
        totalAmount: total,
        advanceAmount: advance,
        remainingAmount: remaining,
        gstPercentage: 18,
        advancePercentage: 40,
        remainingPercentage: 60
      });

      if (err.response?.status === 401) {
        setError("Session expired. Please re-login to ensure live rate verification.");
      } else {
        setError(serverMsg && !serverMsg.includes("Network Error") ? serverMsg : "Could not reach calculation service. Displaying standard pricing estimate.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, [vendorData, surveyData.vendor, surveyData.location]);

  const activeVendor = vendorData || surveyData.vendor;

  const handlePay = () => {
    if (!date) {
      toast.showError("Please select a preferred visit date");
      return;
    }
    // Expert sets the confirmed visit time when accepting — we send TBD
    onConfirm({ scheduledDate: date, scheduledTime: "TBD" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Review & Book</h2>

      {/* Slot & Availability Schedule */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <IoCalendarOutline className="text-[#0A84FF] text-lg" /> Schedule Field Visit
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            ● Available
          </span>
        </div>

        {/* Expert Working Schedule Banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
            <IoCalendarOutline className="text-blue-600 shrink-0 text-sm" />
            <span>Working Days: <strong className="text-gray-900">{formatWorkingDays(activeVendor?.workingDays)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs w-fit">
            <IoTimeOutline className="text-emerald-600 shrink-0 text-sm" />
            <span>Working Hours: <strong className="text-emerald-700">{formatWorkingHours(activeVendor?.workingHours)}</strong></span>
          </div>
        </div>

        {/* Quick Select Available Dates */}
        {(() => {
          const quickDates = getNextAvailableDates(activeVendor, 6);
          if (quickDates.length === 0) return null;
          return (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Quick Select Available Date:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickDates.map((item) => {
                  const isSelected = date === item.date;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => setDate(item.date)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/20"
                          : "bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
                      }`}
                    >
                      <span className={`text-[11px] font-bold ${isSelected ? "text-blue-100" : "text-[#0A84FF]"}`}>
                        {item.dayOfWeek}
                      </span>
                      <span className="text-xs font-extrabold mt-0.5">
                        {item.formattedDisplay}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Manual Date Input */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Or Choose from Calendar:
          </label>
          <input
            type="date"
            value={date || ''}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-gray-800 bg-gray-50/50"
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              const selectedDate = e.target.value;
              if (selectedDate) {
                const parts = selectedDate.split('-');
                const localDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
                
                const isAvailable = isExpertAvailableOnDate(activeVendor, selectedDate);
                if (!isAvailable) {
                  toast.showError(`The expert is not available on ${dayOfWeek}s. Active schedule: ${formatWorkingDays(activeVendor?.workingDays)}.`);
                  setDate("");
                  return;
                }
              }
              setDate(selectedDate);
            }}
          />
        </div>

        {date && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 font-semibold shadow-2xs">
            <span className="flex items-center gap-1.5">
              <IoCheckmarkCircle className="text-emerald-500 text-base" /> Confirmed Visit Date:
            </span>
            <span className="bg-white px-3 py-1 rounded-lg border border-blue-200 font-bold text-blue-700 shadow-2xs">
              {formatDateToDDMMYYYY(date)} ({formatDateToLongString(date)})
            </span>
          </div>
        )}

        <p className="text-xs text-amber-700 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2.5 font-medium flex items-center gap-2">
          <span>⏰</span>
          <span>The expert operates between <strong>{formatWorkingHours(activeVendor?.workingHours)}</strong> and will confirm the visit schedule upon accepting.</span>
        </p>
      </div>

      {/* Expert Info (if pre-selected it's nice to show who) */}
      {activeVendor && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Service Provider</p>
            <p className="font-bold text-gray-800">{activeVendor.name}</p>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-full bg-cover bg-center"
            style={{ backgroundImage: activeVendor.profilePicture ? `url("${activeVendor.profilePicture}")` : '' }}>
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

        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-amber-800 text-xs">
            <div className="flex items-center gap-2">
              <IoInformationCircleOutline className="text-lg shrink-0 text-amber-600" />
              <p className="font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchCharges}
              disabled={loading}
              className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors text-[11px] shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Calculating..." : "Retry"}
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-white/50 border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
            {/* Base Fee */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Base Service Fee</span>
              {loading ? (
                <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                <span className="text-gray-900 font-bold">₹{charges?.baseServiceFee?.toFixed(2) || '0.00'}/-</span>
              )}
            </div>

            {/* GST (18% on Base Service Fee) */}
            <div className="flex justify-between items-center text-xs font-medium pt-2 border-t border-gray-100">
              <span className="text-gray-500">GST ({charges?.gstPercentage || 18}% on Base Fee)</span>
              {loading ? (
                <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                <span className="text-gray-900 font-bold">₹{charges?.gst?.toFixed(2) || '0.00'}</span>
              )}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-gray-100">
              <span className="text-gray-700">Subtotal</span>
              {loading ? (
                <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                <span className="text-gray-900 font-bold">₹{charges?.subtotal?.toFixed(2) || '0.00'}</span>
              )}
            </div>

            {/* Travel Section */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Travel Distance</span>
                <span className="text-gray-700 font-semibold">{charges?.distance ? `${charges.distance} km` : '0 km'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">One Way Charge</span>
                <span className="text-gray-700 font-semibold">₹{(charges?.travelCharges / 2 || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Round Trip (Two Way)</span>
                <span className="text-blue-600 font-bold text-[10px] uppercase">Included (X 2)</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100/50">
                <span className="text-gray-600 font-bold">Total Travel Charges</span>
                {loading ? (
                  <div className="h-4 w-20 bg-gray-100 animate-pulse rounded"></div>
                ) : (
                  <span className="text-gray-900 font-bold">₹{charges?.travelCharges?.toFixed(2) || '0.00'}</span>
                )}
              </div>
            </div>

            {/* TOTAL AMOUNT */}
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
              <span className="text-base font-black text-gray-800">TOTAL AMOUNT</span>
              {loading ? (
                <div className="h-6 w-24 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                <span className="text-xl font-black text-blue-600">₹{charges?.totalAmount?.toFixed(2) || '0.00'}</span>
              )}
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="mt-6 pt-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Payment Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Advance ({charges?.advancePercentage || 40}%)</p>
                {loading ? (
                  <div className="h-5 w-16 bg-blue-100 animate-pulse rounded"></div>
                ) : (
                  <p className="text-lg font-black text-blue-700">₹{charges?.advanceAmount?.toFixed(2) || '0.00'}</p>
                )}
              </div>
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Remaining ({charges?.remainingPercentage || 60}%)</p>
                {loading ? (
                  <div className="h-5 w-16 bg-gray-100 animate-pulse rounded"></div>
                ) : (
                  <p className="text-lg font-black text-gray-800">₹{remainingAmount.toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activePolicy && (
        <PolicyModal
          type={activePolicy}
          onClose={() => setActivePolicy(null)}
          onAgree={activePolicy === 'checkout' ? handlePay : undefined}
          loadingAction={isSubmitting}
        />
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
        <button
          onClick={() => {
            if (!date) {
              toast.showError("Please select a visit date");
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            setActivePolicy('checkout');
          }}
          disabled={!charges || isSubmitting}
          className={`flex-1 py-3 font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${!date ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {!date ? <IoCalendarOutline /> : <IoCashOutline />}
          {!date ? "Select Date to Book" : "Book & Pay"}
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

  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem('usf_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [surveyData, setSurveyData] = useState(() => {
    const saved = sessionStorage.getItem('usf_surveyData');
    return saved ? JSON.parse(saved) : {
      category: null,
      details: null,
      location: null,
      vendor: null,
      slot: null
    };
  });
  const [showTerms, setShowTerms] = useState(() => {
    return sessionStorage.getItem('usf_showTerms') === 'true';
  });
  const [isVendorPreSelected, setIsVendorPreSelected] = useState(() => {
    return sessionStorage.getItem('usf_isVendorPreSelected') === 'true';
  });
  const [pendingBookingAlert, setPendingBookingAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('usf_step', step);
    sessionStorage.setItem('usf_surveyData', JSON.stringify(surveyData));
    sessionStorage.setItem('usf_showTerms', showTerms);
    sessionStorage.setItem('usf_isVendorPreSelected', isVendorPreSelected);
  }, [step, surveyData, showTerms, isVendorPreSelected]);

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
      const purposeMap = {
        "Agriculture": "Agriculture",
        "Household": "Household",
        "Domestic/Household": "Household",
        "Commercial": "Commercial",
        "Industrial/Commercial": "Commercial",
        "Industrial": "Industrial",
        "Open plots": "Industrial"
      };

      const selectedService = surveyData.vendor?.selectedService || surveyData.vendor?.services?.[0] || surveyData.vendor?.allServices?.[0];
      const serviceId = selectedService?.id || selectedService?._id || (typeof surveyData.vendor?.services?.[0] === 'string' ? surveyData.vendor.services[0] : surveyData.vendor?.services?.[0]?._id) || 'default';
      const vendorId = surveyData.vendor?._id || surveyData.vendor?.id;

      const bookingPayload = {
        serviceId,
        vendorId,
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
        purpose: purposeMap[surveyData.category] || "Industrial",
        purposeExtent: parseFloat(surveyData.details.purposeExtent),
        surveyNumber: surveyData.details.surveyNumber || surveyData.details.plotNumber || "",
        notes: `Category: ${surveyData.category}. ${surveyData.details.surveyNumber ? `Survey No: ${surveyData.details.surveyNumber}. ` : ''
          }${surveyData.details.plotNumber ? `Plot No: ${surveyData.details.plotNumber}. ` : ''
          }${surveyData.details.notes ? surveyData.details.notes : ''}`
      };

      const response = await createBooking(bookingPayload);
      if (response.success) {
        const booking = response.data.booking;
        const paymentData = response.data.payment;
        const razorpayOrder = response.data.razorpayOrder;

        // Clear session storage upon successful booking
        sessionStorage.removeItem('usf_step');
        sessionStorage.removeItem('usf_surveyData');
        sessionStorage.removeItem('usf_showTerms');
        sessionStorage.removeItem('usf_isVendorPreSelected');

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
      <div className="mb-5 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3 mb-2">
          {step > 1 ? (
            <button
              onClick={() => {
                if (step === 5 && isVendorPreSelected) setStep(3);
                else setStep(step - 1);
              }}
              className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <IoArrowBack className="text-base" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <span className="text-[11px] font-extrabold text-[#0A84FF] font-mono uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            Step {step} of {isVendorPreSelected ? 4 : 5}
          </span>
        </div>

        {/* Progress Bar Segments */}
        <div className="flex gap-1.5 w-full">
          {[1, 2, 3, 4, 5].map(i => {
            if (isVendorPreSelected && i === 4) return null;
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${i <= step
                  ? 'bg-[#0A84FF] shadow-2xs'
                  : 'bg-slate-200/80'
                  }`}
              />
            );
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
