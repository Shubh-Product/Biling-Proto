import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, Eye, CheckCircle, CreditCard, Smartphone, ArrowLeft, Check, Trash2, AlertTriangle, RotateCcw, Save, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Upload, Download, Copy, RefreshCw, User, Package, Target, Edit, Share, Mail, LayoutDashboard, Users, FileText, HelpCircle, MessageSquare, Shield, Wallet, Menu, X, Bell, Filter, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import axios from "axios";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dropdown data for states and cities
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

const INDIAN_CITIES = [
  "Agra", "Ahmedabad", "Ajmer", "Allahabad", "Amritsar", "Aurangabad", "Bangalore", 
  "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore", "Delhi", "Dhanbad", 
  "Faridabad", "Ghaziabad", "Gurgaon", "Guwahati", "Howrah", "Hubli", "Hyderabad", 
  "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jammu", "Jamshedpur", "Jodhpur", 
  "Kanpur", "Kochi", "Kolkata", "Kota", "Lucknow", "Ludhiana", "Madurai", "Mangalore", 
  "Meerut", "Mumbai", "Mysore", "Nagpur", "Nashik", "Navi Mumbai", "Noida", "Patna", 
  "Pune", "Raipur", "Rajkot", "Ranchi", "Salem", "Srinagar", "Surat", "Thane", 
  "Thiruvananthapuram", "Tiruchirappalli", "Udaipur", "Vadodara", "Varanasi", "Vijayawada", 
  "Visakhapatnam", "Warangal"
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false); // Default to show transactions table
  
  // Navigation state
  const [activeMenu, setActiveMenu] = useState('payments'); // Default to payments
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    transactionType: "Renewal/Upgrade", // Default to Renewal/Upgrade for product-based flow
    licenseType: "Retail",
    serialNumber: "",
    productType: "Desktop", // Default to Desktop tab
    region: "India", // Default region
    licenseModel: "", // Perpetual or Subscription for Desktop
    duration: "", // 360 or 1080 for Desktop, 360 or 90 for Busy Online
    accessType: "", // Access or Client Server for Busy Online
    userCount: "1", // Default to 1 user
    companyCount: "1", // Default to 1 company
    deductTds: false, // TDS deduction toggle, default off
    recomOfferAdded: false, // Recom Bundle offer toggle
    upgradeVariant: "", // For Desktop upgrade: Desktop or Mandi
    customerDetails: {
      mobile: "",
      name: "",
      email: "",
      company: "",
      gstin: "",
      city: "",
      pincode: "",
      address: "",
      state: "",
      country: "India",
      caPanNo: "",
      caLicenseNumber: ""
    },
    clientReferences: [
      { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
      { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
      { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
      { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
      { name: "", email: "", mobile: "", gstin: "", company: "", address: "" }
    ],
    poUpload: null,
    planName: "",
    discountPercent: 0
  });

  const [validatingCustomer, setValidatingCustomer] = useState(false);
  const [customerValidated, setCustomerValidated] = useState(false);
  const [existingLicenses, setExistingLicenses] = useState([]);
  const [errors, setErrors] = useState({});
  const [visibleClientReferences, setVisibleClientReferences] = useState(2); // Show first 2 by default
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showPaymentLinkPage, setShowPaymentLinkPage] = useState(false); // New state for payment link page
  const [paymentLinkData, setPaymentLinkData] = useState(null); // Store payment link data
  const [planQuantities, setPlanQuantities] = useState({}); // Track quantity for each plan
  const [planCounts, setPlanCounts] = useState({}); // Track count for Client Server plans
  const [onlineUserCount, setOnlineUserCount] = useState(1); // Track user count for Online product
  const [onlineCompanyCount, setOnlineCompanyCount] = useState(1); // Track company count for Online product
  const [onlineMinUserCount, setOnlineMinUserCount] = useState(1); // Track minimum user count for Online renewal (cannot reduce below this)
  const [onlineMinCompanyCount, setOnlineMinCompanyCount] = useState(1); // Track minimum company count for Online renewal (cannot reduce below this)
  const [onlineDatabaseType, setOnlineDatabaseType] = useState(""); // Track database type for Online product
  const [addReduceCountValue, setAddReduceCountValue] = useState(0); // Track add/reduce count value for Add/Reduce Count flow
  const [isAddReduceCountCustomerDetailsOpen, setIsAddReduceCountCustomerDetailsOpen] = useState(true); // Track Add/Reduce Count customer details accordion
  const [appSubscriptionId, setAppSubscriptionId] = useState(""); // Track subscription ID for App product
  const [appSubscriptionValidated, setAppSubscriptionValidated] = useState(false); // Track if App subscription is validated
  const [appSubscriptionCount, setAppSubscriptionCount] = useState(1); // Track subscription count for App product
  const [appValidationMessage, setAppValidationMessage] = useState(""); // Track validation message for App product
  const [recomMarketPlace, setRecomMarketPlace] = useState(""); // Track market place selection for Recom product (Single/Multiple)
  const [recomSubscriptionId, setRecomSubscriptionId] = useState(""); // Track subscription ID for Recom product
  const [recomSubscriptionValidated, setRecomSubscriptionValidated] = useState(false); // Track if Recom subscription is validated
  const [recomValidationMessage, setRecomValidationMessage] = useState(""); // Track validation message for Recom product
  const [rdpCount, setRdpCount] = useState(1); // Track RDP count for RDP product
  const [rdpSubscriptionId, setRdpSubscriptionId] = useState(""); // Track subscription ID for RDP product
  const [rdpSubscriptionValidated, setRdpSubscriptionValidated] = useState(false); // Track if RDP subscription is validated
  const [rdpValidationMessage, setRdpValidationMessage] = useState(""); // Track validation message for RDP product
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [navigationType, setNavigationType] = useState(null); // 'dashboard' or 'other'
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // License type change warning state
  const [showLicenseChangeWarning, setShowLicenseChangeWarning] = useState(false);
  const [pendingLicenseType, setPendingLicenseType] = useState(null);
  
  // Edit customer details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [emailFormData, setEmailFormData] = useState({
    customerEmail: '',
    transactionId: ''
  });
  const [showTdsConfirmModal, setShowTdsConfirmModal] = useState(false);
  const [addRecomOffer, setAddRecomOffer] = useState(false);
  
  // Payment flow states
  const [showDummyPaymentPage, setShowDummyPaymentPage] = useState(false);
  const [showRedirectingPage, setShowRedirectingPage] = useState(false);
  const [showInvoiceGenerationPage, setShowInvoiceGenerationPage] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showInvoiceGeneratedPage, setShowInvoiceGeneratedPage] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [invoiceFormData, setInvoiceFormData] = useState({
    mobile: '',
    email: '',
    gstin: '',
    companyName: '',
    customerName: '',
    address: '',
    pincode: '',
    city: '',
    state: ''
  });
  
  // Prospect Details Accordion State
  const [isProspectDetailsOpen, setIsProspectDetailsOpen] = useState(true);
  const [isProspectDetailsSaved, setIsProspectDetailsSaved] = useState(false);
  
  // Renewal/Upgrade Customer Details Accordion State
  const [isRenewalCustomerDetailsOpen, setIsRenewalCustomerDetailsOpen] = useState(true);
  const [isUpgradeCustomerDetailsOpen, setIsUpgradeCustomerDetailsOpen] = useState(true);
  const [isUpgradeToOnlineCustomerDetailsOpen, setIsUpgradeToOnlineCustomerDetailsOpen] = useState(true);
  
  // Payment Link Modal State
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);

  // TDS Toggle Handler with Confirmation
  const handleTdsToggle = (newValue) => {
    if (newValue) {
      // Show confirmation popup when turning TDS ON
      setShowTdsConfirmModal(true);
    } else {
      // Directly turn OFF without confirmation
      setFormData(prev => ({ ...prev, deductTds: false }));
    }
  };

  // Confirm TDS Deduction
  const confirmTdsDeduction = () => {
    setFormData(prev => ({ ...prev, deductTds: true }));
    setShowTdsConfirmModal(false);
  };

  // Cancel TDS Deduction
  const cancelTdsDeduction = () => {
    setShowTdsConfirmModal(false);
  };
  const [editFormData, setEditFormData] = useState({
    // Required customer details from New Sales
    name: '',
    email: '',
    company: '',
    gstin: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
    country: 'India',
    // Optional additional details
    alternateNumber: '',
    landmark: '',
    notes: '',
    preferredContactTime: '',
    businessType: '',
    referralSource: ''
  });
  
  // Renewal/Upgrade flow state
  const [serialNumber, setSerialNumber] = useState('');
  const [fetchingSerialDetails, setFetchingSerialDetails] = useState(false);
  const [serialValidated, setSerialValidated] = useState(false);
  const [currentCustomerInfo, setCurrentCustomerInfo] = useState(null);
  const [currentProductInfo, setCurrentProductInfo] = useState(null);
  const [renewalOption, setRenewalOption] = useState(''); // 'renew' or 'upgrade'
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [eligibleUpgradePlans, setEligibleUpgradePlans] = useState([]);
  const [actionType, setActionType] = useState(''); // 'renew' or 'upgrade' - tracks which button was clicked
  
  // Mobile App flow state
  const [mobileAppSerialNumber, setMobileAppSerialNumber] = useState('');
  const [fetchingMobileAppDetails, setFetchingMobileAppDetails] = useState(false);
  const [mobileAppValidated, setMobileAppValidated] = useState(false);
  const [mobileAppCustomerInfo, setMobileAppCustomerInfo] = useState(null);
  const [mobileAppBaseProductInfo, setMobileAppBaseProductInfo] = useState(null);
  const [mobileAppProductInfo, setMobileAppProductInfo] = useState(null);
  const [mobileAppCounts, setMobileAppCounts] = useState({ totalFOC: 0, totalPaid: 0 });
  const [mobileAppOption, setMobileAppOption] = useState(''); // 'buy_new' or 'renew'
  const [mobileAppCount, setMobileAppCount] = useState('1');
  const [mobileAppValidity, setMobileAppValidity] = useState(''); // '360' or '1080'
  const [currentApps, setCurrentApps] = useState([]);
  const [selectedAppsForRenewal, setSelectedAppsForRenewal] = useState([]);
  const [renewalValidity, setRenewalValidity] = useState(''); // '360' or '1080'
  
  // Recom flow state
  const [recomSerialNumber, setRecomSerialNumber] = useState('');
  const [fetchingRecomDetails, setFetchingRecomDetails] = useState(false);
  const [recomValidated, setRecomValidated] = useState(false);
  const [recomCustomerInfo, setRecomCustomerInfo] = useState(null);
  const [recomBaseProductInfo, setRecomBaseProductInfo] = useState(null);
  const [recomCurrentPlan, setRecomCurrentPlan] = useState(null);
  const [recomOption, setRecomOption] = useState(''); // 'buy_new', 'renew', 'upgrade'
  const [recomChannelType, setRecomChannelType] = useState(''); // 'single' or 'multi'
  const [selectedRecomPlan, setSelectedRecomPlan] = useState(null);
  
  // Product duration toggle state
  const [selectedDuration, setSelectedDuration] = useState('360'); // '360' or '1080'
  
  // Date filter state
  const [selectedDateFilter, setSelectedDateFilter] = useState('last_365_days'); // Default to Last 365 Days
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Quick filters state
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('all'); // 'all', 'pending', 'received', 'expired', 'cancelled', 'draft'

  // Three dots menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  // Order Summary Modal state
  const [showOrderSummaryModal, setShowOrderSummaryModal] = useState(false);

  // Advanced Filter Modal state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    partnerName: '',
    status: '',
    generatedBy: '',
    transactionType: '',
    category: '',
    product: '',
    linkValidityFrom: '',
    linkValidityTo: ''
  });

  // Make Payment Page state
  const [showMakePaymentPage, setShowMakePaymentPage] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    mobile: '',
    email: '',
    name: '',
    gstin: '',
    companyName: '',
    address: '',
    city: '',
    pincode: '',
    state: ''
  });

  // Sold By filter state
  const [selectedSoldByFilter, setSelectedSoldByFilter] = useState('inside_sales'); // 'inside_sales', 'partner'

  // Renewal sub-filters state
  const [selectedRenewalSubFilter, setSelectedRenewalSubFilter] = useState('all'); // 'all', 'desktop', 'mobile_app', 'recom', 'busy_online'

  // Overdue sub-filters state
  const [selectedOverdueSubFilter, setSelectedOverdueSubFilter] = useState('all'); // 'all', 'desktop', 'mobile_app', 'recom', 'busy_online'

  // Hardcoded URL for success transactions (keeping for Transaction ID clicks)
  const successTransactionUrl = 'https://hi.busy.in/busy/report/subscriptionHistory?product_id=11&subId=1122039512';

  useEffect(() => {
    fetchTransactions();
    fetchProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDateDropdown && !event.target.closest('.date-dropdown')) {
        setShowDateDropdown(false);
      }
      // Close three dots menu when clicking outside
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown, openMenuId]);

  // Track unsaved changes
  useEffect(() => {
    const hasData = formData.customerDetails.mobile || 
                   formData.customerDetails.email || 
                   formData.customerDetails.name ||
                   formData.productType ||
                   formData.planName;
    setHasUnsavedChanges(hasData && showCreateForm);
  }, [formData, showCreateForm]);

  // Handle page refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchTransactions = async () => {
    try {
      // Temporarily force sample data for demonstration
      // const response = await axios.get(`${API}/transactions`);
      // setTransactions(response.data);
      throw new Error("Using sample data for demonstration");
    } catch (error) {
      console.error("Error fetching transactions:", error);
      
      // Add sample transactions with diverse products and plans that match backend
      const sampleTransactions = [
        {
          id: 'TXN-1190123456',
          customer_name: 'DRAFT ENTERPRISES PVT LTD',
          customer_city: 'Noida',
          customer_mobile: '9876543211',
          customer_email: 'admin@draftenterprises.com',
          customer_gstin: '09AABCD1234E1Z4',
          license_type: 'Retail',
          product_type: 'Desktop Subscription',
          plan_details: { plan_name: 'Gold Multi User' },
          final_amount: 23599,
          discount_percent: 0,
          status: 'Draft',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          salesperson: {
            name: 'Vikram Singh',
            email: 'vikram.singh@busy.in',
            mobile: '9123456780'
          },
          partner: null,
          is_inside_sales: true,
          team_name: 'Inside'
        },
        {
          id: 'TXN-1191234567',
          customer_name: 'PENDING SOLUTIONS LLP',
          customer_city: 'Gurgaon',
          customer_mobile: '9765432100',
          customer_email: 'contact@pendingsolutions.in',
          customer_gstin: '06AABCP5678F1Z6',
          license_type: 'Accountant',
          product_type: 'Busy Online',
          plan_details: { plan_name: 'SQL - Annual' },
          final_amount: 8400,  // 16800 with 50% Accountant discount
          discount_percent: 50,
          status: 'Draft',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          salesperson: {
            name: 'Anjali Sharma',
            email: 'anjali.sharma@busy.in',
            mobile: '9234567891'
          },
          partner: 'DataBridge Partners',
          is_inside_sales: false,
          team_name: 'Germenium'
        },
        {
          id: 'TXN-1102901234',
          customer_name: 'ABC CONSULTANTS PRIVATE LIMITED',
          customer_city: 'Mumbai',
          customer_mobile: '9123456789',
          customer_email: 'contact@abcconsultants.com',
          customer_gstin: '27AABCA1234F1Z5',
          license_type: 'Retail',
          product_type: 'Busy Online',
          plan_details: { plan_name: 'SQL - Annual' },
          final_amount: 16800,
          discount_percent: 0,
          status: 'Success',
          created_at: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000).toISOString(), // 320 days ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000).toISOString(), // 320 days ago (40 days left, in renewal period)
          is_renewal_opportunity: true,
          salesperson: {
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@busy.in',
            mobile: '9876543210'
          },
          partner: null,
          is_inside_sales: true,
          team_name: 'Inside'
        },
        {
          id: 'TXN-1113109045',
          customer_name: 'SHARMA & ASSOCIATES CA FIRM',
          customer_city: 'Delhi',
          customer_mobile: '9234567890',
          customer_email: 'info@sharmaassociates.com',
          customer_gstin: '07AABCS5678G1Z1',
          license_type: 'CA',
          product_type: 'Desktop Subscription',
          plan_details: { plan_name: 'Emerald Single User - Regular' },
          final_amount: 1999,  // 9999 with 80% CA discount
          discount_percent: 80,
          status: 'Pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          is_upgrade_1080_opportunity: false, // Pending status
          salesperson: {
            name: 'Ravi Kumar',
            email: 'ravi.kumar@chennai.busy.in',
            mobile: '9876543210'
          },
          partner: 'TechSolutions Pvt Ltd',
          is_inside_sales: false,
          team_name: 'Chennai Centre'
        },
        {
          id: 'TXN-1122039512',
          customer_name: 'DIGITAL ACCOUNTING SOLUTIONS',
          customer_city: 'Bangalore',
          customer_mobile: '9345678901',
          customer_email: 'admin@digitalaccounting.in',
          customer_gstin: '29AABCD6789H1Z2',
          license_type: 'Accountant',
          product_type: 'Desktop Perpetual',
          plan_details: { plan_name: 'Enterprise Multi User' },
          final_amount: 34199,  // 57999 with 50% Accountant discount + 18% GST
          discount_percent: 50,
          status: 'Success',
          created_at: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000).toISOString(), // 340 days ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000).toISOString(), // 340 days ago (20 days left, in renewal period)
          is_renewal_opportunity: true,
          is_recom_bundle_opportunity: true,
          salesperson: {
            name: 'Amit Patel',
            email: 'amit.patel@busy.in',
            mobile: '9654321098'
          },
          partner: null,
          is_inside_sales: true,
          team_name: 'Germenium'
        },
        {
          id: 'TXN-1134567890',
          customer_name: 'SHOBHIT GARMENTS',
          customer_city: 'Pune',
          customer_mobile: '9456789012',
          customer_email: 'contact@shobhitgarments.com',
          customer_gstin: '27AABCS1234K1Z3',
          license_type: 'Retail',
          product_type: 'Desktop Perpetual',
          plan_details: { plan_name: 'Standard Multi User' },
          final_amount: 47199,  // 39999 + 18% GST
          discount_percent: 0,
          status: 'Pending',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          is_upgrade_1080_opportunity: false, // Pending status
          salesperson: {
            name: 'Arun Sharma',
            email: 'arun.sharma@busy.in',
            mobile: '9765432109'
          },
          partner: 'BusinessLink Partners',
          is_inside_sales: false,
          team_name: 'CLM Team'
        },
        {
          id: 'TXN-1145678901',
          customer_name: 'GUPTA TAX CONSULTANTS',
          customer_city: 'Chennai',
          license_type: 'CA',
          product_type: 'Desktop Subscription',
          plan_details: { plan_name: 'Saffron Multi User' },
          final_amount: 4252,  // 17999 with 80% CA discount + 18% GST
          discount_percent: 80,
          status: 'Success',
          created_at: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(), // 360 days ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(), // 360 days ago (plan just expired)
          is_upgrade_1080_opportunity: false, // Plan has expired
          is_mobile_app_opportunity: false,
          salesperson: {
            name: 'Neha Singh',
            email: 'neha.singh@busy.in',
            mobile: '9432109876'
          },
          partner: null,
          is_inside_sales: true,
          team_name: 'Razorset'
        },
        {
          id: 'TXN-1156789012',
          customer_name: 'TECH SOLUTIONS PRIVATE LTD',
          customer_city: 'Hyderabad',
          license_type: 'Retail',
          product_type: 'Busy Online',
          plan_details: { plan_name: 'Access - Quarterly' },
          final_amount: 5900,  // 5000 + 18% GST
          discount_percent: 0,
          status: 'Failed',
          created_at: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(), // 360 days ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(), // 360 days ago (plan just expired)
          salesperson: {
            name: 'Suresh Reddy',
            email: 'suresh.reddy@busy.in',
            mobile: '9654321098'
          },
          partner: 'CloudBridge Systems',
          is_inside_sales: false,
          team_name: 'CA Team'
        },
        {
          id: 'TXN-1167890123',
          customer_name: 'MODERN RETAIL CORP',
          customer_city: 'Kolkata',
          license_type: 'Retail',
          product_type: 'Desktop Perpetual',
          plan_details: { plan_name: 'Basic Single User' },
          final_amount: 11799,
          discount_percent: 0,
          status: 'Success',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago (within 15 days for mobile app bundle)
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          renewal_due_date: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000).toISOString(), // This is a renewal transaction
          is_renewal_opportunity: false, // Too recent
          is_recom_bundle_opportunity: false, // Outside 2 day window
          is_mobile_app_opportunity: true, // Recent desktop renewal within 15 days
          salesperson: {
            name: 'Kavya Reddy',
            email: 'kavya.reddy@busy.in',
            mobile: '9210987654'
          },
          partner: null,
          is_inside_sales: true,
          team_name: 'Inside'
        },
        {
          id: 'TXN-1178901234',
          customer_name: 'RETAIL SOLUTIONS LTD',
          customer_city: 'Jaipur',
          license_type: 'Retail',
          product_type: 'Desktop Subscription',
          plan_details: { plan_name: 'Gold Multi User' },
          final_amount: 23599,
          discount_percent: 0,
          status: 'Success',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (within 2 days for recom bundle)
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          is_renewal_opportunity: false, // Too recent
          is_recom_bundle_opportunity: true, // Within 2 days
          is_mobile_app_opportunity: false, // Not desktop/busy online renewal
          salesperson: {
            name: 'Priya Nair',
            email: 'priya.nair@chennai.busy.in',
            mobile: '9987654321'
          },
          partner: 'SmartBiz Partners',
          is_inside_sales: false,
          team_name: 'Chennai Centre'
        },
        {
          id: 'TXN-1189012345',
          customer_name: 'OFFICE SUPPLIES MART',
          customer_city: 'Ahmedabad',
          license_type: 'Retail',
          product_type: 'Desktop Subscription',
          plan_details: { plan_name: 'Silver Single User' },
          final_amount: 14159,
          discount_percent: 0,
          status: 'Cancelled',
          cancel_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Cancelled 5 days ago
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Created 10 days ago
          plan_duration: '360',
          purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          salesperson: {
            name: 'Priya Mehta',
            email: 'priya.mehta@busy.in',
            mobile: '9098765432'
          },
          partner: null,
          is_inside_sales: true,
          team_name: 'Germenium'
        }
      ];
      
      setTransactions(sampleTransactions);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Use hardcoded product structure based on Excel mapping
      // Prices listed are base 360-day prices, 1080-day prices are calculated as (3x base price - 20% discount)
      const productStructure = {
        "Desktop": {
          "Subscription": {
            "Desktop Subscription Standard - Single User": { price: 12000, baseDuration: "360 Days", license: "Subscription", subType: "Standard", applicableTo: "Single User" },
            "Desktop Subscription Standard - Multi User": { price: 18000, baseDuration: "360 Days", license: "Subscription", subType: "Standard", applicableTo: "Multi User" },
            "Desktop Subscription Standard - Client Server": { price: 30000, baseDuration: "360 Days", license: "Subscription", subType: "Standard", applicableTo: "Client Server" },
            "Desktop Subscription Saffron - Single User": { price: 15000, baseDuration: "360 Days", license: "Subscription", subType: "Saffron", applicableTo: "Single User" },
            "Desktop Subscription Saffron - Multi User": { price: 22000, baseDuration: "360 Days", license: "Subscription", subType: "Saffron", applicableTo: "Multi User" },
            "Desktop Subscription Saffron - Client Server": { price: 35000, baseDuration: "360 Days", license: "Subscription", subType: "Saffron", applicableTo: "Client Server" },
            "Desktop Subscription Basic - Single User": { price: 8000, baseDuration: "360 Days", license: "Subscription", subType: "Basic", applicableTo: "Single User" },
            "Desktop Subscription Basic - Multi User": { price: 12000, baseDuration: "360 Days", license: "Subscription", subType: "Basic", applicableTo: "Multi User" },
            "Desktop Subscription Blue - Single User": { price: 10000, baseDuration: "360 Days", license: "Subscription", subType: "Blue", applicableTo: "Single User" },
            "Desktop Subscription Blue - Multi User": { price: 15000, baseDuration: "360 Days", license: "Subscription", subType: "Blue", applicableTo: "Multi User" },
            "Desktop Subscription Enterprise - Single User": { price: 20000, baseDuration: "360 Days", license: "Subscription", subType: "Enterprise", applicableTo: "Single User" },
            "Desktop Subscription Enterprise - Multi User": { price: 30000, baseDuration: "360 Days", license: "Subscription", subType: "Enterprise", applicableTo: "Multi User" },
            "Desktop Subscription Enterprise - Client Server": { price: 50000, baseDuration: "360 Days", license: "Subscription", subType: "Enterprise", applicableTo: "Client Server" },
            "Desktop Subscription Emerald - Single User": { price: 18000, baseDuration: "360 Days", license: "Subscription", subType: "Emerald", applicableTo: "Single User" },
            "Desktop Subscription Emerald - Multi User": { price: 28000, baseDuration: "360 Days", license: "Subscription", subType: "Emerald", applicableTo: "Multi User" },
            "Desktop Subscription Emerald - Client Server": { price: 45000, baseDuration: "360 Days", license: "Subscription", subType: "Emerald", applicableTo: "Client Server" }
          }
        },
        "Mobile App": {
          "Subscription": {
            "Mobile App Subscription New App 1 User": { price: 2499, duration: "360 Days", license: "Subscription", subType: "New App", applicableTo: "1 User" }
          }
        },
        "Busy Online": {
          "Subscription": {
            "Busy Online Single User Single Company Access": { price: 3999, duration: "360 Days", license: "Subscription", subType: "Single User Single Company Access", applicableTo: "Single Company" }
          }
        },
        "Recom Subscription": {
          "Subscription": {
            "Recom Subscription Multi MarketPlace 6000 Orders": { price: 5999, duration: "360 Days", license: "Subscription", subType: "Multi MarketPlace", applicableTo: "6000 Orders" },
            "Recom Subscription Multi MarketPlace 12000 Orders": { price: 9999, duration: "360 Days", license: "Subscription", subType: "Multi MarketPlace", applicableTo: "12000 Orders" },
            "Recom Subscription Multi MarketPlace 30000 Orders": { price: 19999, duration: "360 Days", license: "Subscription", subType: "Multi MarketPlace", applicableTo: "30000 Orders" },
            "Recom Subscription Multi MarketPlace 60000 Orders": { price: 39999, duration: "360 Days", license: "Subscription", subType: "Multi MarketPlace", applicableTo: "60000 Orders" },
            "Recom Subscription Multi MarketPlace 120000 Orders": { price: 79999, duration: "360 Days", license: "Subscription", subType: "Multi MarketPlace", applicableTo: "120000 Orders" },
            "Recom Subscription Single MarketPlace 6000 Orders": { price: 4999, duration: "360 Days", license: "Subscription", subType: "Single MarketPlace", applicableTo: "6000 Orders" },
            "Recom Subscription Single MarketPlace 12000 Orders": { price: 7999, duration: "360 Days", license: "Subscription", subType: "Single MarketPlace", applicableTo: "12000 Orders" },
            "Recom Subscription Single MarketPlace 30000 Orders": { price: 15999, duration: "360 Days", license: "Subscription", subType: "Single MarketPlace", applicableTo: "30000 Orders" },
            "Recom Subscription Single MarketPlace 60000 Orders": { price: 29999, duration: "360 Days", license: "Subscription", subType: "Single MarketPlace", applicableTo: "60000 Orders" },
            "Recom Subscription Single MarketPlace 120000 Orders": { price: 59999, duration: "360 Days", license: "Subscription", subType: "Single MarketPlace", applicableTo: "120000 Orders" }
          }
        }
      };
      
      setProducts(productStructure);
    } catch (error) {
      console.error("Error setting up products:", error);
      // Removed toast popup
    }
  };

  // Auto-apply discount based on license type
  const getDiscountByLicenseType = (licenseType) => {
    switch (licenseType) {
      case "CA":
        return 80; // 80% discount for CA license
      case "Accountant":
        return 50; // 50% discount for Accountant license
      case "Retail":
      default:
        return 0; // No discount for Retail license
    }
  };

  // Additional discount based on transaction type
  const getAdditionalDiscountByTransactionType = (transactionType) => {
    switch (transactionType) {
      case "New Sales":
        return 0; // No additional discount for new sales
      case "Renewal/Upgrade":
        return 15; // 15% additional discount for renewals/upgrades
      case "Mobile App":
        return 10; // 10% additional discount for mobile app
      case "Recom":
        return 20; // 20% additional discount for recom bundle
      case "Bundle Offer":
        return 25; // 25% additional discount for bundle offers
      default:
        return 0; // No additional discount
    }
  };

  const getAvailablePlans = (productType) => {
    if (!products[productType]) return [];
    
    const plans = [];
    const productData = products[productType];
    
    for (const category in productData) {
      for (const planName in productData[category]) {
        plans.push({
          name: planName,
          category,
          ...productData[category][planName]
        });
      }
    }
    
    return plans;
  };

  // Helper function to get first product type
  const getFirstProductType = () => {
    const productTypes = Object.keys(products);
    return productTypes.length > 0 ? productTypes[0] : "";
  };

  // Helper function to get first plan of a product type
  const getFirstPlan = (productType) => {
    const plans = getAvailablePlans(productType);
    return plans.length > 0 ? plans[0].name : "";
  };

  // Helper function to get time period suffix for plan pricing
  const getTimePeriodSuffix = (productType, planName) => {
    if (productType === 'Desktop Subscription') {
      return ' per year';
    } else if (productType === 'Busy Online') {
      if (planName.includes('Quarterly')) {
        return ' per quarter';
      } else if (planName.includes('Annual')) {
        return ' per year';
      }
    }
    return '';
  };

  // Helper function to calculate pricing based on duration
  const calculateDurationPricing = (basePrice, duration) => {
    if (duration === '1080') {
      // 3x pricing with 20% discount for 1080 days
      const triplePrice = basePrice * 3;
      const discountedPrice = triplePrice * 0.8; // 20% off
      return Math.round(discountedPrice);
    }
    return basePrice;
  };

  // Helper function to get available plans with duration pricing
  const getAvailablePlansWithDuration = (productType) => {
    const basePlans = getAvailablePlans(productType);
    return basePlans.map(plan => ({
      ...plan,
      originalPrice: plan.price,
      price: calculateDurationPricing(plan.price, selectedDuration),
      duration: selectedDuration,
      discount: selectedDuration === '1080' ? 20 : 0
    }));
  };

  // Helper function to get Desktop plans based on license model and duration
  const getDesktopPlans = (licenseModel, duration) => {
    if (!products["Desktop"] || !products["Desktop"][licenseModel]) return [];
    
    const plans = [];
    const productData = products["Desktop"][licenseModel];
    
    for (const planName in productData) {
      const planDetails = productData[planName];
      
      // Remove "Desktop Perpetual" and "Desktop Subscription" prefixes from plan names
      let cleanPlanName = planName
        .replace(/^Desktop Perpetual /, '')
        .replace(/^Desktop Subscription /, '');
      
      // Make all plans available for both 360 and 1080 days
      let finalPrice = planDetails.price;
      let discount = 0;
      
      if (duration === "1080") {
        if (licenseModel === "Perpetual") {
          // 1080 day Perpetual plans: 3x base price with 20% discount
          const triplePrice = planDetails.price * 3;
          finalPrice = Math.round(triplePrice * 0.8); // 20% discount
          discount = 20;
        } else {
          // 1080 day Subscription plans: 3x base price with 20% discount  
          const triplePrice = planDetails.price * 3;
          finalPrice = Math.round(triplePrice * 0.8); // 20% discount
          discount = 20;
        }
      }
      // For 360 days, use the base price as is
      
      plans.push({
        name: cleanPlanName,
        category: licenseModel,
        price: finalPrice,
        originalPrice: planDetails.price,
        basePrice: planDetails.price, // Store base price for reference
        duration: duration,
        discount: discount,
        ...planDetails
      });
    }
    
    return plans;
  };

  // Helper function to validate Busy Online user and company counts
  const validateBusyOnlineCounts = () => {
    if (formData.productType !== "Busy Online") {
      return { isValid: true, error: "" };
    }
    
    const userCount = parseInt(formData.userCount) || 0;
    const companyCount = parseInt(formData.companyCount) || 0;
    
    // Both cannot be 0 together
    if (userCount === 0 && companyCount === 0) {
      return { 
        isValid: false, 
        error: "Both User Count and Company Count cannot be 0. At least one must be greater than 0." 
      };
    }
    
    return { isValid: true, error: "" };
  };

  // Helper function to calculate comprehensive Busy Online pricing with TDS support
  const calculateBusyOnlinePricing = () => {
    if (formData.productType !== "Busy Online" || !formData.duration || !formData.accessType) {
      return null;
    }

    // Validate counts first
    const validation = validateBusyOnlineCounts();
    if (!validation.isValid) {
      return null;
    }

    // Sample pricing structure for Busy Online
    const basePricing = {
      "360_Access": 3999,        // Base price for 360 days Access
      "360_Client Server": 7999, // Base price for 360 days Client Server  
      "90_Access": 1199,         // Base price for 90 days Access
      "90_Client Server": 2399   // Base price for 90 days Client Server
    };

    const priceKey = `${formData.duration}_${formData.accessType}`;
    const basePrice = basePricing[priceKey] || 0;
    
    const userCount = Math.max(parseInt(formData.userCount) || 0, 0);
    const companyCount = Math.max(parseInt(formData.companyCount) || 0, 0);
    
    // Total base price with user and company multiplication
    const totalBasePrice = basePrice * userCount * companyCount;
    
    // Apply license and transaction discounts
    const licenseDiscountPercent = getDiscountByLicenseType(formData.licenseType);
    const transactionDiscountPercent = getAdditionalDiscountByTransactionType(formData.transactionType);
    const totalDiscountPercent = licenseDiscountPercent + transactionDiscountPercent;
    let discountAmount = Math.round(totalBasePrice * (totalDiscountPercent / 100));
    
    // Add Recom Bundle offer discount if applied
    const recomOfferDiscount = addRecomOffer ? 3000 : 0;
    discountAmount += recomOfferDiscount;
    
    const discountedPrice = totalBasePrice - discountAmount;
    
    // Calculate TDS deduction if enabled (10% of base price)
    const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
    const priceAfterTds = discountedPrice - tdsAmount;
    
    const taxAmount = Math.round(priceAfterTds * 0.18); // 18% GST on amount after TDS
    const finalAmount = priceAfterTds + taxAmount;

    return {
      basePrice: totalBasePrice,
      discountPercent: totalDiscountPercent,
      discountAmount,
      recomOfferDiscount,
      tdsAmount,
      taxAmount,
      finalAmount
    };
  };

  // Helper function to calculate Busy Online pricing based on user and company counts (backward compatibility)
  const calculateBusyOnlinePrice = () => {
    if (formData.productType !== "Busy Online" || !formData.duration || !formData.accessType) {
      return 0;
    }

    // Validate counts first
    const validation = validateBusyOnlineCounts();
    if (!validation.isValid) {
      return 0;
    }

    // Sample pricing structure for Busy Online
    const basePricing = {
      "360_Access": 3999,        // Base price for 360 days Access
      "360_Client Server": 7999, // Base price for 360 days Client Server  
      "90_Access": 1199,         // Base price for 90 days Access
      "90_Client Server": 2399   // Base price for 90 days Client Server
    };

    const priceKey = `${formData.duration}_${formData.accessType}`;
    const basePrice = basePricing[priceKey] || 0;
    
    const userCount = Math.max(parseInt(formData.userCount) || 0, 0);
    const companyCount = Math.max(parseInt(formData.companyCount) || 0, 0);
    
    // Pricing formula: Base price × User Count × Company Count
    return basePrice * userCount * companyCount;
  };

  // Helper function to calculate pricing for Online product
  const calculateOnlinePricing = () => {
    if (formData.productType !== "Online" || !formData.duration || !onlineDatabaseType) {
      return null;
    }

    // Sample pricing structure for Online product
    const basePricing = {
      "360_Access": 5000,           // Base price for 360 days Access
      "360_Client Server": 10000,   // Base price for 360 days Client Server
      "1080_Access": 12000,         // Base price for 1080 days Access (3 years with 20% discount)
      "1080_Client Server": 24000   // Base price for 1080 days Client Server (3 years with 20% discount)
    };

    const priceKey = `${formData.duration}_${onlineDatabaseType}`;
    const basePrice = basePricing[priceKey] || 0;
    
    // Total base price with user and company count multiplication
    const totalBasePrice = basePrice * onlineUserCount * onlineCompanyCount;
    
    // Apply license and transaction discounts
    const licenseDiscountPercent = getDiscountByLicenseType(formData.licenseType);
    const transactionDiscountPercent = getAdditionalDiscountByTransactionType(formData.transactionType);
    const totalDiscountPercent = licenseDiscountPercent + transactionDiscountPercent;
    let discountAmount = Math.round(totalBasePrice * (totalDiscountPercent / 100));
    
    // Add Recom Bundle offer discount if applied
    const recomOfferDiscount = addRecomOffer ? 3000 : 0;
    discountAmount += recomOfferDiscount;
    
    const discountedPrice = totalBasePrice - discountAmount;
    
    // Calculate TDS deduction if enabled (10% of base price)
    const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
    const priceAfterTds = discountedPrice - tdsAmount;
    
    const taxAmount = Math.round(priceAfterTds * 0.18); // 18% GST on amount after TDS
    const finalAmount = priceAfterTds + taxAmount;

    return {
      basePrice: totalBasePrice,
      discountPercent: totalDiscountPercent,
      discountAmount,
      recomOfferDiscount,
      tdsAmount,
      taxAmount,
      finalAmount
    };
  };

  // Helper function to calculate pricing for RDP plans
  const calculateRDPPricing = () => {
    if (formData.productType !== "RDP" || !formData.planName) {
      return null;
    }

    // RDP plan pricing
    const rdpPlans = {
      "RDP Basic": 4999,
      "RDP Professional": 8999,
      "RDP Enterprise": 14999,
      "RDP Premium": 19999
    };

    const basePrice = rdpPlans[formData.planName] || 0;
    const licenseDiscountPercent = getDiscountByLicenseType(formData.licenseType);
    const transactionDiscountPercent = getAdditionalDiscountByTransactionType(formData.transactionType);
    
    // Calculate total discount percentage
    const totalDiscountPercent = licenseDiscountPercent + transactionDiscountPercent;
    let discountAmount = (basePrice * totalDiscountPercent) / 100;
    
    // Add Recom Bundle offer discount if applied
    const recomOfferDiscount = addRecomOffer ? 3000 : 0;
    discountAmount += recomOfferDiscount;
    
    const discountedPrice = basePrice - discountAmount;
    
    // Calculate TDS deduction if enabled (10% of base price)
    const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
    const priceAfterTds = discountedPrice - tdsAmount;
    
    const taxAmount = Math.round(priceAfterTds * 0.18); // 18% GST on amount after TDS
    const finalAmount = priceAfterTds + taxAmount;

    return {
      basePrice,
      discountPercent: totalDiscountPercent,
      discountAmount: Math.round(discountAmount),
      recomOfferDiscount,
      tdsAmount,
      taxAmount,
      finalAmount: Math.round(finalAmount)
    };
  };

  // Helper function to calculate pricing for Desktop plans
  const calculateDesktopPricing = () => {
    // Support both Desktop and Mandi products
    if ((formData.productType !== "Desktop" && formData.productType !== "Mandi") || !formData.planName) {
      return null;
    }

    // Find the selected plan
    const plans = getDesktopPlans(formData.licenseModel, formData.duration);
    const selectedPlan = plans.find(plan => plan.name === formData.planName);
    
    if (!selectedPlan) return null;

    const basePrice = selectedPlan.price;
    const licenseDiscountPercent = getDiscountByLicenseType(formData.licenseType);
    const transactionDiscountPercent = getAdditionalDiscountByTransactionType(formData.transactionType);
    
    // Calculate total discount percentage
    const totalDiscountPercent = licenseDiscountPercent + transactionDiscountPercent;
    let discountAmount = Math.round(basePrice * (totalDiscountPercent / 100));
    
    // Add Recom Bundle offer discount if applied
    const recomOfferDiscount = addRecomOffer ? 3000 : 0;
    discountAmount += recomOfferDiscount;
    
    const discountedPrice = basePrice - discountAmount;
    
    // Calculate TDS deduction if enabled (10% of base price)
    const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
    const priceAfterTds = discountedPrice - tdsAmount;
    
    const taxAmount = Math.round(priceAfterTds * 0.18); // 18% GST on amount after TDS
    const finalAmount = priceAfterTds + taxAmount;

    return {
      basePrice,
      discountPercent: totalDiscountPercent,
      discountAmount,
      recomOfferDiscount,
      tdsAmount,
      taxAmount,
      finalAmount
    };
  };

  // Function to handle sending payment link
  const handleSendPaymentLink = () => {
    let orderSummary = {};
    
    if (formData.productType === "Desktop" && calculateDesktopPricing()) {
      const pricing = calculateDesktopPricing();
      orderSummary = {
        productType: formData.productType,
        planName: formData.planName,
        licenseModel: formData.licenseModel,
        duration: formData.duration + " Days",
        basePrice: pricing.basePrice,
        discountPercent: pricing.discountPercent,
        discountAmount: pricing.discountAmount,
        tdsAmount: pricing.tdsAmount || 0,
        taxAmount: pricing.taxAmount,
        finalAmount: pricing.finalAmount
      };
    } else if (formData.productType === "RDP" && calculateRDPPricing()) {
      const pricing = calculateRDPPricing();
      orderSummary = {
        productType: formData.productType,
        planName: formData.planName,
        duration: "365 Days",
        basePrice: pricing.basePrice,
        discountPercent: pricing.discountPercent,
        discountAmount: pricing.discountAmount,
        taxAmount: pricing.taxAmount,
        finalAmount: pricing.finalAmount
      };
    } else if (formData.productType === "Busy Online") {
      const busyOnlinePrice = calculateBusyOnlinePrice();
      const taxAmount = Math.round(busyOnlinePrice * 0.18);
      const finalAmount = busyOnlinePrice + taxAmount;
      
      orderSummary = {
        productType: `${formData.productType} - ${formData.accessType}`,
        duration: formData.duration + " Days",
        userCount: formData.userCount || 1,
        companyCount: formData.companyCount || 1,
        basePrice: busyOnlinePrice,
        taxAmount: taxAmount,
        finalAmount: finalAmount
      };
    }

    // Generate payment link
    const paymentLink = `https://payments.example.com/pay/${Math.random().toString(36).substr(2, 9)}`;
    
    setPaymentLinkData({
      orderSummary,
      paymentLink,
      customerDetails: {
        mobile: formData.customerDetails.mobile,
        email: formData.customerDetails.email,
        name: formData.customerDetails.name || "Customer"
      }
    });
    
    // Show modal instead of navigating to new page
    setShowPaymentLinkModal(true);
  };

  // Serial Number Validation for Renewal
  const validateSerialNumberForRenewal = async () => {
    if (!serialNumber.trim()) {
      setErrors(prev => ({ ...prev, serialNumber: "Please enter a serial number" }));
      return;
    }

    setFetchingSerialDetails(true);
    setErrors(prev => ({ ...prev, serialNumber: "" }));
    setActionType('renew'); // Set action type to renewal

    try {
      // Simulate API call to validate serial number and fetch details
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Mock validation logic with product-specific subscription IDs
      const mockSerialData = {
        "DES12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            mobile: "9876543210",
            company: "Kumar Enterprises",
            gstin: "27KUMAR123456Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          }
        },
        "MAN12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Priya Sharma",
            email: "priya.sharma@example.com",
            mobile: "9988776655",
            company: "Sharma Trading Co",
            gstin: "27SHARMA789012Z",
            city: "Delhi",
            state: "Delhi"
          },
          currentProduct: {
            type: "Mandi",
            planName: "Mandi Premium Plan",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-11-30",
            status: "Active"
          }
        },
        "ONL12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Amit Patel",
            email: "amit.patel@example.com",
            mobile: "9876512340",
            company: "Patel Enterprises",
            gstin: "24PATEL567890Z",
            city: "Ahmedabad",
            state: "Gujarat"
          },
          currentProduct: {
            type: "Online",
            planName: "Online Access - Annual",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-10-31",
            status: "Active",
            userCount: 5,
            companyCount: 2
          }
        },
        "APP12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Neha Singh",
            email: "neha.singh@example.com",
            mobile: "9123456789",
            company: "Singh Solutions",
            gstin: "09SINGH123456Z",
            city: "Bangalore",
            state: "Karnataka"
          },
          currentProduct: {
            type: "App",
            planName: "Business Pro Package",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-12-15",
            status: "Active"
          },
          baseProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          },
          productInfo: {
            type: "Mobile App",
            planName: "Business Pro Package",
            status: "Active",
            purchaseDate: "2023-06-15",
            lastRenewal: "2024-06-15"
          },
          appCounts: {
            totalFOC: 3,
            totalPaid: 7
          },
          currentApps: [
            {
              id: "4180149876",
              name: "Busy Analytics",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "05-Sep-23",
              startDate: "05-Sep-23"
            },
            {
              id: "4125190163", 
              name: "Inventory Manager",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            },
            {
              id: "4195786199",
              name: "Sales Tracker",
              type: "Paid", 
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "05-Sep-23",
              startDate: "05-Sep-23"
            },
            {
              id: "4121487662",
              name: "Report Generator",
              type: "Paid",
              status: "Active", 
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            },
            {
              id: "4199433912",
              name: "Customer Portal",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            }
          ]
        },
        "REC12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Anil Gupta",
            email: "anil.gupta@example.com",
            mobile: "9988001122",
            company: "Gupta Retail",
            gstin: "27GUPTA234567Z",
            city: "Pune",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Recom",
            planName: "Recom B - 12K Orders",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-09-30",
            status: "Active",
            marketPlace: "Single"
          }
        },
        "RDP12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Vikram Reddy",
            email: "vikram.reddy@example.com",
            mobile: "9876501234",
            company: "Reddy Systems",
            gstin: "36REDDY890123Z",
            city: "Hyderabad",
            state: "Telangana"
          },
          currentProduct: {
            type: "RDP",
            planName: "RDP Professional",
            licenseModel: "Subscription",
            duration: "365 Days",
            expiryDate: "2024-08-31",
            status: "Active",
            rdpCount: 3
          }
        },
        "SER123456": {
          valid: true,
          eligible: true,
          customer: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            mobile: "9876543210",
            company: "Kumar Enterprises",
            gstin: "27KUMAR123456Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          }
        },
        "SER789012": {
          valid: true,
          eligible: false,
          reason: "License already renewed for next year"
        },
        "INVALID123": {
          valid: false,
          reason: "Serial number not found in system"
        }
      };

      const serialData = mockSerialData[serialNumber.toUpperCase()];

      if (!serialData || !serialData.valid) {
        setErrors(prev => ({ ...prev, serialNumber: "Invalid Serial Number" }));
        setSerialValidated(false);
        setActionType('');
        return;
      }

      if (!serialData.eligible) {
        setErrors(prev => ({ 
          ...prev, 
          serialNumber: serialData.reason || "Not eligible for renewal" 
        }));
        setSerialValidated(false);
        setActionType('');
        return;
      }

      // Success - set customer and product info
      setCurrentCustomerInfo(serialData.customer);
      setCurrentProductInfo(serialData.currentProduct);
      setSerialValidated(true);
      // Auto-validate customer for renewal flow to skip customer details step
      setCustomerValidated(true);
      // Set product type and upgrade variant from current product info
      const currentProduct = serialData.currentProduct?.type || "Desktop";
      setFormData(prev => ({
        ...prev,
        productType: currentProduct,
        upgradeVariant: currentProduct === "Desktop" || currentProduct === "Mandi" ? currentProduct : "Desktop" // Default to Desktop
      }));
      
      // For Online product, initialize user and company counts from current product
      if (serialData.currentProduct?.type === "Online") {
        const minUserCount = serialData.currentProduct?.userCount || 1;
        const minCompanyCount = serialData.currentProduct?.companyCount || 1;
        setOnlineUserCount(minUserCount);
        setOnlineCompanyCount(minCompanyCount);
        // Set minimum counts that cannot be reduced below
        setOnlineMinUserCount(minUserCount);
        setOnlineMinCompanyCount(minCompanyCount);
      }
      
      // Auto-scroll to duration selection after a short delay
      setTimeout(() => {
        const durationSection = document.getElementById('product-selection-section');
        if (durationSection) {
          durationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (error) {
      setErrors(prev => ({ ...prev, serialNumber: "Error validating serial number. Please try again." }));
      setSerialValidated(false);
      setActionType('');
    } finally {
      setFetchingSerialDetails(false);
    }
  };

  // Serial Number Validation for Upgrade - Separate function
  const validateSerialNumberForUpgrade = async () => {
    if (!serialNumber.trim()) {
      setErrors(prev => ({ ...prev, serialNumber: "Please enter a serial number" }));
      return;
    }

    setFetchingSerialDetails(true);
    setErrors(prev => ({ ...prev, serialNumber: "" }));
    setActionType('upgrade'); // Set action type to upgrade

    try {
      // Simulate API call to validate serial number and fetch details
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Same mock data as renewal flow but for upgrade
      const mockSerialData = {
        "DES12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            mobile: "9876543210",
            company: "Kumar Enterprises",
            gstin: "27KUMAR123456Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          }
        },
        "MAN12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Priya Sharma",
            email: "priya.sharma@example.com",
            mobile: "9988776655",
            company: "Sharma Trading Co",
            gstin: "27SHARMA789012Z",
            city: "Delhi",
            state: "Delhi"
          },
          currentProduct: {
            type: "Mandi",
            planName: "Mandi Premium Plan",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-11-30",
            status: "Active"
          }
        },
        "ONL12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Amit Patel",
            email: "amit.patel@example.com",
            mobile: "9876512340",
            company: "Patel Enterprises",
            gstin: "24PATEL567890Z",
            city: "Ahmedabad",
            state: "Gujarat"
          },
          currentProduct: {
            type: "Online",
            planName: "Online Access - Annual",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-10-31",
            status: "Active",
            userCount: 5,
            companyCount: 2
          }
        },
        "APP12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Neha Singh",
            email: "neha.singh@example.com",
            mobile: "9123456789",
            company: "Singh Solutions",
            gstin: "09SINGH123456Z",
            city: "Bangalore",
            state: "Karnataka"
          },
          currentProduct: {
            type: "App",
            planName: "Business Pro Package",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-12-15",
            status: "Active"
          },
          baseProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          },
          productInfo: {
            type: "Mobile App",
            planName: "Business Pro Package",
            status: "Active",
            purchaseDate: "2023-06-15",
            lastRenewal: "2024-06-15"
          },
          appCounts: {
            totalFOC: 3,
            totalPaid: 7
          },
          currentApps: [
            {
              id: "4180149876",
              name: "Busy Analytics",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "05-Sep-23",
              startDate: "05-Sep-23"
            },
            {
              id: "4125190163", 
              name: "Inventory Manager",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            },
            {
              id: "4195786199",
              name: "Sales Tracker",
              type: "Paid", 
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "05-Sep-23",
              startDate: "05-Sep-23"
            },
            {
              id: "4121487662",
              name: "Report Generator",
              type: "Paid",
              status: "Active", 
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            },
            {
              id: "4199433912",
              name: "Customer Portal",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            }
          ]
        },
        "REC12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Anil Gupta",
            email: "anil.gupta@example.com",
            mobile: "9988001122",
            company: "Gupta Retail",
            gstin: "27GUPTA234567Z",
            city: "Pune",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Recom",
            planName: "Recom B - 12K Orders",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-09-30",
            status: "Active",
            marketPlace: "Single"
          }
        },
        "RDP12345": {
          valid: true,
          eligible: true,
          customer: {
            name: "Vikram Reddy",
            email: "vikram.reddy@example.com",
            mobile: "9876501234",
            company: "Reddy Systems",
            gstin: "36REDDY890123Z",
            city: "Hyderabad",
            state: "Telangana"
          },
          currentProduct: {
            type: "RDP",
            planName: "RDP Professional",
            licenseModel: "Subscription",
            duration: "365 Days",
            expiryDate: "2024-08-31",
            status: "Active",
            rdpCount: 3
          }
        },
        "SER123456": {
          valid: true,
          eligible: true,
          customer: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            mobile: "9876543210",
            company: "Kumar Enterprises",
            gstin: "27KUMAR123456Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          }
        }
      };

      const serialData = mockSerialData[serialNumber.toUpperCase()];

      if (!serialData || !serialData.valid) {
        setErrors(prev => ({ ...prev, serialNumber: "Invalid Serial Number" }));
        setSerialValidated(false);
        setActionType('');
        return;
      }

      if (!serialData.eligible) {
        setErrors(prev => ({ 
          ...prev, 
          serialNumber: serialData.reason || "Not eligible for upgrade" 
        }));
        setSerialValidated(false);
        setActionType('');
        return;
      }

      // Success - set customer and product info
      setCurrentCustomerInfo(serialData.customer);
      setCurrentProductInfo(serialData.currentProduct);
      setSerialValidated(true);

      // Set eligible upgrade plans based on current product
      const mockUpgradePlans = [
        {
          id: "desktop_enterprise_single",
          name: "Desktop Enterprise Single User",
          basePrice: 19999,
          discountedPrice: 17999,
          features: ["Advanced Analytics", "Priority Support", "Custom Reports"]
        },
        {
          id: "desktop_enterprise_multi",
          name: "Desktop Enterprise Multi User", 
          basePrice: 29999,
          discountedPrice: 26999,
          features: ["Multi-User Access", "Advanced Analytics", "Priority Support", "Custom Reports"]
        }
      ];
      setEligibleUpgradePlans(mockUpgradePlans);

    } catch (error) {
      setErrors(prev => ({ ...prev, serialNumber: "Error fetching serial details. Please try again." }));
      setSerialValidated(false);
    } finally {
      setFetchingSerialDetails(false);
    }
  };

  // Reset renewal/upgrade flow
  const resetRenewalFlow = () => {
    setSerialNumber('');
    setSerialValidated(false);
    setCurrentCustomerInfo(null);
    setCurrentProductInfo(null);
    setRenewalOption('');
    setSelectedUpgradePlan(null);
    setEligibleUpgradePlans([]);
    setErrors(prev => ({ ...prev, serialNumber: "" }));
  };

  // Mobile App Serial Number Validation
  const validateMobileAppSerial = async () => {
    if (!mobileAppSerialNumber.trim()) {
      setErrors(prev => ({ ...prev, mobileAppSerial: "Please enter a serial number" }));
      return;
    }

    setFetchingMobileAppDetails(true);
    setErrors(prev => ({ ...prev, mobileAppSerial: "" }));

    try {
      // Simulate API call to validate mobile app serial number
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock validation logic - in real implementation, this would be an API call
      const mockMobileAppData = {
        "SER123456": {
          valid: true,
          eligible: true,
          customer: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            mobile: "9876543210",
            company: "Kumar Enterprises",
            gstin: "27KUMAR123456Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "App",
            planName: "Business Pro Package",
            licenseModel: "Subscription",
            duration: "360 Days",
            expiryDate: "2024-12-15",
            status: "Active"
          },
          baseProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          },
          productInfo: {
            type: "Mobile App",
            planName: "Business Pro Package",
            status: "Active",
            purchaseDate: "2023-06-15",
            lastRenewal: "2024-06-15"
          },
          appCounts: {
            totalFOC: 3,
            totalPaid: 7
          },
          currentApps: [
            {
              id: "4180149876",
              name: "Busy Analytics",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "05-Sep-23",
              startDate: "05-Sep-23"
            },
            {
              id: "4125190163", 
              name: "Inventory Manager",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            },
            {
              id: "4195786199",
              name: "Sales Tracker",
              type: "Paid", 
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "05-Sep-23",
              startDate: "05-Sep-23"
            },
            {
              id: "4121487662",
              name: "Report Generator",
              type: "Paid",
              status: "Active", 
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            },
            {
              id: "4199433912",
              name: "Customer Portal",
              type: "Paid",
              status: "Active",
              expiryDate: "04-Mar-27",
              lastUsed: "30-Dec-25",
              startDate: "30-Dec-25"
            }
          ]
        },
        "SER789012": {
          valid: true,
          eligible: false,
          reason: "Account suspended due to payment issues"
        },
        "INVALID123": {
          valid: false,
          reason: "Serial number not found in system"
        }
      };

      const mobileAppData = mockMobileAppData[mobileAppSerialNumber.toUpperCase()];

      if (!mobileAppData || !mobileAppData.valid) {
        setErrors(prev => ({ ...prev, mobileAppSerial: "Invalid Serial Number" }));
        setMobileAppValidated(false);
        return;
      }

      if (!mobileAppData.eligible) {
        setErrors(prev => ({ 
          ...prev, 
          mobileAppSerial: mobileAppData.reason || "Not eligible for mobile app operations" 
        }));
        setMobileAppValidated(false);
        return;
      }

      // Success - set customer, base product, and mobile app info
      setMobileAppCustomerInfo(mobileAppData.customer);
      setMobileAppBaseProductInfo(mobileAppData.baseProduct);
      setMobileAppProductInfo(mobileAppData.productInfo);
      setMobileAppCounts(mobileAppData.appCounts);
      setCurrentApps(mobileAppData.currentApps);
      setMobileAppValidated(true);

    } catch (error) {
      setErrors(prev => ({ ...prev, mobileAppSerial: "Error fetching mobile app details. Please try again." }));
      setMobileAppValidated(false);
    } finally {
      setFetchingMobileAppDetails(false);
    }
  };

  // Reset mobile app flow
  const resetMobileAppFlow = () => {
    setMobileAppSerialNumber('');
    setMobileAppValidated(false);
    setMobileAppCustomerInfo(null);
    setMobileAppBaseProductInfo(null);
    setMobileAppProductInfo(null);
    setMobileAppCounts({ totalFOC: 0, totalPaid: 0 });
    setMobileAppOption('');
    setMobileAppCount('1');
    setMobileAppValidity('');
    setCurrentApps([]);
    setSelectedAppsForRenewal([]);
    setRenewalValidity('');
    setErrors(prev => ({ ...prev, mobileAppSerial: "" }));
  };

  // Recom Serial Number Validation
  const validateRecomSerial = async () => {
    if (!recomSerialNumber.trim()) {
      setErrors(prev => ({ ...prev, recomSerial: "Please enter a serial number" }));
      return;
    }

    setFetchingRecomDetails(true);
    setErrors(prev => ({ ...prev, recomSerial: "" }));

    try {
      // Simulate API call to validate Recom serial number
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock validation logic - in real implementation, this would be an API call
      const mockRecomData = {
        "SER123456": {
          valid: true,
          eligible: true,
          customer: {
            name: "Anil Gupta",
            email: "anil.gupta@example.com", 
            mobile: "9876543210",
            company: "Gupta Trading Co.",
            gstin: "27GUPTA456789Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          baseProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            status: "Active",
            expiryDate: "2025-03-15"
          },
          currentRecomPlan: {
            channelType: "Single Channel",
            planName: "Recom Single Channel Basic",
            orderCount: 1000,
            duration: "360 Days", 
            remainingOrders: 450,
            expiryDate: "2024-12-31",
            status: "Active"
          }
        },
        "SER789012": {
          valid: true,
          eligible: false,
          reason: "Recom plan suspended due to policy violations"
        },
        "INVALID789": {
          valid: false,
          reason: "Serial number not found in system"
        }
      };

      const recomData = mockRecomData[recomSerialNumber.toUpperCase()];

      if (!recomData || !recomData.valid) {
        setErrors(prev => ({ ...prev, recomSerial: "Invalid Serial Number" }));
        setRecomValidated(false);
        return;
      }

      if (!recomData.eligible) {
        setErrors(prev => ({ 
          ...prev, 
          recomSerial: recomData.reason || "Not eligible for Recom operations" 
        }));
        setRecomValidated(false);
        return;
      }

      // Success - set customer, base product, and current plan info
      setRecomCustomerInfo(recomData.customer);
      setRecomBaseProductInfo(recomData.baseProduct);
      setRecomCurrentPlan(recomData.currentRecomPlan);
      setRecomValidated(true);

    } catch (error) {
      setErrors(prev => ({ ...prev, recomSerial: "Error fetching Recom details. Please try again." }));
      setRecomValidated(false);
    } finally {
      setFetchingRecomDetails(false);
    }
  };

  // Reset recom flow
  const resetRecomFlow = () => {
    setRecomSerialNumber('');
    setRecomValidated(false);
    setRecomCustomerInfo(null);
    setRecomBaseProductInfo(null);
    setRecomCurrentPlan(null);
    setRecomOption('');
    setRecomChannelType('');
    setSelectedRecomPlan(null);
    setErrors(prev => ({ ...prev, recomSerial: "" }));
  };

  // Date filter helper functions
  const getDateFilterOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    
    const last365Days = new Date(today);
    last365Days.setDate(today.getDate() - 365);
    
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const currentQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    
    // Financial Year starts from April 1st
    const currentYear = today.getFullYear();
    const fyStart = new Date(today.getMonth() >= 3 ? currentYear : currentYear - 1, 3, 1); // April 1st

    return [
      {
        key: 'today',
        label: 'Today',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      },
      {
        key: 'yesterday',
        label: 'Yesterday',
        startDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        endDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      },
      {
        key: 'last_7_days',
        label: 'Last 7 Days',
        startDate: last7Days,
        endDate: today
      },
      {
        key: 'current_month',
        label: 'Current Month',
        startDate: currentMonthStart,
        endDate: today
      },
      {
        key: 'last_30_days',
        label: 'Last 30 Days',
        startDate: last30Days,
        endDate: today
      },
      {
        key: 'current_quarter',
        label: 'Current Quarter',
        startDate: currentQuarterStart,
        endDate: today
      },
      {
        key: 'current_fy',
        label: 'Current Financial Year',
        startDate: fyStart,
        endDate: today
      },
      {
        key: 'last_365_days',
        label: 'Last 365 Days',
        startDate: last365Days,
        endDate: today
      },
      {
        key: 'custom',
        label: 'Custom Date Range',
        startDate: null,
        endDate: null
      }
    ];
  };

  // Get filtered transactions (date filtering removed since All Transactions filter was removed)
  const getDateFilteredTransactions = () => {
    // For all current filters, return all transactions without date filtering
    return transactions;
  };

  // CSV Export function
  const exportToCSV = () => {
    const dataToExport = filteredTransactions;
    
    const csvHeaders = [
      'Transaction ID',
      'Date',
      'Customer Name',
      'Customer City',
      'Sold By',
      'Salesperson/Partner',
      'Product Type',
      'Plan Name',
      'License Type',
      'Amount',
      'Discount %',
      'Due Date',
      'Status'
    ];

    const csvData = dataToExport.map(transaction => {
      const statusInfo = getStatusDisplay(transaction);
      return [
        transaction.id,
        formatDate(transaction.created_at).dateMonth + ' ' + formatDate(transaction.created_at).year,
        transaction.customer_name,
        transaction.customer_city,
        transaction.team_name || (transaction.is_inside_sales ? 'Inside Sales' : 'Chennai Centre'),
        transaction.salesperson?.name || 'N/A',
        transaction.product_type,
        transaction.plan_details.plan_name,
        transaction.license_type,
        transaction.final_amount,
        transaction.discount_percent || 0,
        getDueDate(transaction),
        statusInfo.text.replace('\n', ' ')
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') ? `"${field}"` : field
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper functions for quick filters (updated to use date-filtered transactions)
  // Helper functions for quick filters (updated to use date-filtered transactions)
  const getRenewalOpportunities = () => {
    const now = new Date();
    const baseTransactions = getDateFilteredTransactions();

    return baseTransactions.filter(transaction => {
      if (transaction.status !== 'Success' || !transaction.purchase_date || !transaction.plan_duration) return false;

      const purchaseDate = new Date(transaction.purchase_date);
      const planDurationDays = parseInt(transaction.plan_duration);
      const planExpiryDate = new Date(purchaseDate.getTime() + planDurationDays * 24 * 60 * 60 * 1000);
      const renewalStartDate = new Date(planExpiryDate.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days before expiry

      // Check if we're in the last 60 days before plan expiry
      return now >= renewalStartDate && now <= planExpiryDate;
    });
  };

  const getOverdueOpportunities = () => {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const baseTransactions = getDateFilteredTransactions();

    return baseTransactions.filter(transaction => {
      if (transaction.status !== 'Success' || !transaction.purchase_date || !transaction.plan_duration) return false;

      const purchaseDate = new Date(transaction.purchase_date);
      const planDurationDays = parseInt(transaction.plan_duration);
      const planExpiryDate = new Date(purchaseDate.getTime() + planDurationDays * 24 * 60 * 60 * 1000);

      // Check if plan has expired more than 15 days ago
      return planExpiryDate < fifteenDaysAgo;
    });
  };

  const get1080DayUpgradeOpportunities = () => {
    const baseTransactions = getDateFilteredTransactions();
    return baseTransactions.filter(transaction => {
      return transaction.status === 'Success' &&
             transaction.plan_duration === '360'; // Only 360-day plan holders are eligible
    });
  };

  const getRecomBundleOpportunities = () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const baseTransactions = getDateFilteredTransactions();

    return baseTransactions.filter(transaction => {
      return transaction.status === 'Success' &&
             transaction.purchase_date &&
             new Date(transaction.purchase_date) >= twoDaysAgo &&
             transaction.is_recom_bundle_opportunity;
    });
  };

  const getMobileAppBundleOpportunities = () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const baseTransactions = getDateFilteredTransactions();

    return baseTransactions.filter(transaction => {
      return transaction.status === 'Success' &&
             transaction.purchase_date &&
             new Date(transaction.purchase_date) >= fifteenDaysAgo &&
             (transaction.product_type.includes('Desktop') || transaction.product_type.includes('Busy Online')) &&
             transaction.renewal_due_date; // Must be a renewal transaction
    });
  };

  // Renewal sub-filter helpers
  const getRenewalDesktopOpportunities = () => {
    return getRenewalOpportunities().filter(transaction =>
      transaction.product_type.includes('Desktop')
    );
  };

  const getRenewalMobileAppOpportunities = () => {
    return getRenewalOpportunities().filter(transaction =>
      transaction.is_mobile_app_opportunity
    );
  };

  const getRenewalRecomOpportunities = () => {
    return getRenewalOpportunities().filter(transaction =>
      transaction.is_recom_bundle_opportunity
    );
  };

  const getRenewalBusyOnlineOpportunities = () => {
    return getRenewalOpportunities().filter(transaction =>
      transaction.product_type.includes('Busy Online')
    );
  };

  // Overdue sub-filter helpers
  const getOverdueDesktopOpportunities = () => {
    return getOverdueOpportunities().filter(transaction =>
      transaction.product_type.includes('Desktop')
    );
  };

  const getOverdueMobileAppOpportunities = () => {
    return getOverdueOpportunities().filter(transaction =>
      transaction.is_mobile_app_opportunity
    );
  };

  const getOverdueRecomOpportunities = () => {
    return getOverdueOpportunities().filter(transaction =>
      transaction.is_recom_bundle_opportunity
    );
  };

  const getOverdueBusyOnlineOpportunities = () => {
    return getOverdueOpportunities().filter(transaction =>
      transaction.product_type.includes('Busy Online')
    );
  };

  // Get filtered transactions based on selected quick filter
  const getFilteredTransactionsByQuickFilter = () => {
    switch (selectedQuickFilter) {
      case 'all':
        return getDateFilteredTransactions();
      case 'pending':
        return getDateFilteredTransactions().filter(t => t.status === 'Pending');
      case 'received':
        return getDateFilteredTransactions().filter(t => t.status === 'Success');
      case 'failed':
        return getDateFilteredTransactions().filter(t => t.status === 'Failed');
      case 'expired':
        return getDateFilteredTransactions().filter(t => t.status === 'Expired');
      case 'cancelled':
        return getDateFilteredTransactions().filter(t => t.status === 'Cancelled');
      case 'draft':
        return getDateFilteredTransactions().filter(t => t.status === 'Draft');
      case 'renewal':
        // Apply renewal sub-filter
        switch (selectedRenewalSubFilter) {
          case 'desktop':
            return getRenewalDesktopOpportunities();
          case 'mobile_app':
            return getRenewalMobileAppOpportunities();
          case 'recom':
            return getRenewalRecomOpportunities();
          case 'busy_online':
            return getRenewalBusyOnlineOpportunities();
          default:
            return getRenewalOpportunities();
        }
      case 'overdue':
        // Apply overdue sub-filter
        switch (selectedOverdueSubFilter) {
          case 'desktop':
            return getOverdueDesktopOpportunities();
          case 'mobile_app':
            return getOverdueMobileAppOpportunities();
          case 'recom':
            return getOverdueRecomOpportunities();
          case 'busy_online':
            return getOverdueBusyOnlineOpportunities();
          default:
            return getOverdueOpportunities();
        }
      case 'upgrade1080':
        return get1080DayUpgradeOpportunities();
      case 'recom':
        return getRecomBundleOpportunities();
      case 'mobileapp':
        return getMobileAppBundleOpportunities();
      default:
        // For 'all' transactions, apply date filter
        return getDateFilteredTransactions();
    }
  };

  // Get filtered transactions based on selected sold by filter
  const getFilteredTransactionsBySoldBy = () => {
    const quickFilteredTransactions = getFilteredTransactionsByQuickFilter();

    switch (selectedSoldByFilter) {
      case 'inside_sales':
        return quickFilteredTransactions.filter(transaction => transaction.is_inside_sales);
      case 'partner':
        return quickFilteredTransactions.filter(transaction => !transaction.is_inside_sales);
      default:
        return quickFilteredTransactions;
    }
  };

  const getPlanDetails = (productType, planName) => {
    if (!products[productType]) return {};
    
    const productData = products[productType];
    for (const category in productData) {
      if (productData[category][planName]) {
        return productData[category][planName];
      }
    }
    return {};
  };

  const calculatePricing = () => {
    const planDetails = getPlanDetails(formData.productType, formData.planName);
    const basePrice = planDetails.price || 0;
    
    // Auto-apply discount based on license type
    const autoDiscountPercent = getDiscountByLicenseType(formData.licenseType);
    const discountAmount = (basePrice * autoDiscountPercent) / 100;
    const discountedPrice = basePrice - discountAmount;
    const taxAmount = discountedPrice * 0.18; // 18% GST
    const finalAmount = discountedPrice + taxAmount;

    return {
      basePrice,
      discountPercent: autoDiscountPercent,
      discountAmount,
      taxAmount: Math.round(taxAmount),
      finalAmount: Math.round(finalAmount),
      planDetails
    };
  };

  const removeClientReference = (indexToRemove) => {
    if (indexToRemove >= 2 && indexToRemove < visibleClientReferences) {
      // Clear the data for the client reference being removed
      const newClientReferences = [...formData.clientReferences];
      newClientReferences[indexToRemove] = { name: "", email: "", mobile: "", gstin: "", company: "", address: "" };
      setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
      
      // Decrease visible client references count
      setVisibleClientReferences(prev => prev - 1);
    }
  };

  // Check if mandatory client references are complete (for Accountant license)
  const areMandatoryClientReferencesComplete = () => {
    if (formData.licenseType !== "Accountant") return true;
    
    // Check first 2 client references (mandatory)
    for (let i = 0; i < 2; i++) {
      const client = formData.clientReferences[i];
      if (!client.name || !client.email || !client.mobile) {
        return false;
      }
    }
    return true;
  };

  // Validate client references for uniqueness (for Accountant license)
  const validateClientReferences = (updatedClientReferences = null) => {
    if (formData.licenseType !== "Accountant") return { isValid: true, errors: {} };

    const errors = {};
    const clientRefsErrors = {};
    
    // Use updated references if provided, otherwise use current form data
    const referencesToCheck = updatedClientReferences || formData.clientReferences;
    
    // Get all filled client references
    const filledRefs = referencesToCheck.filter(ref => 
      ref.name || ref.email || ref.mobile || ref.gstin
    );

    if (filledRefs.length === 0) return { isValid: true, errors: {} };

    // Check for duplicates within client references
    for (let i = 0; i < filledRefs.length; i++) {
      const ref1 = filledRefs[i];
      
      for (let j = i + 1; j < filledRefs.length; j++) {
        const ref2 = filledRefs[j];
        
        // Check mobile duplicates
        if (ref1.mobile && ref2.mobile && ref1.mobile === ref2.mobile) {
          clientRefsErrors[`clientRef_${i}_mobile`] = "Mobile number already used in another client reference";
          clientRefsErrors[`clientRef_${j}_mobile`] = "Mobile number already used in another client reference";
        }
        
        // Check email duplicates
        if (ref1.email && ref2.email && ref1.email === ref2.email) {
          clientRefsErrors[`clientRef_${i}_email`] = "Email already used in another client reference";
          clientRefsErrors[`clientRef_${j}_email`] = "Email already used in another client reference";
        }
        
        // Check GSTIN duplicates
        if (ref1.gstin && ref2.gstin && ref1.gstin === ref2.gstin) {
          clientRefsErrors[`clientRef_${i}_gstin`] = "GSTIN already used in another client reference";
          clientRefsErrors[`clientRef_${j}_gstin`] = "GSTIN already used in another client reference";
        }
      }
      
      // Check against customer details
      if (ref1.mobile && formData.customerDetails.mobile && ref1.mobile === formData.customerDetails.mobile) {
        clientRefsErrors[`clientRef_${i}_mobile`] = "Client mobile cannot be same as customer mobile";
      }
      
      if (ref1.email && formData.customerDetails.email && ref1.email === formData.customerDetails.email) {
        clientRefsErrors[`clientRef_${i}_email`] = "Client email cannot be same as customer email";
      }
      
      if (ref1.gstin && formData.customerDetails.gstin && ref1.gstin === formData.customerDetails.gstin) {
        clientRefsErrors[`clientRef_${i}_gstin`] = "Client GSTIN cannot be same as customer GSTIN";
      }
    }

    return { 
      isValid: Object.keys(clientRefsErrors).length === 0, 
      errors: clientRefsErrors 
    };
  };

  // Handle transaction ID click to open URL in new tab (only for success transactions)
  const handleTransactionClick = (transaction) => {
    if (transaction.status !== 'Success') {
      return;
    }
    
    window.open(successTransactionUrl, '_blank');
  };

  // Handle upgrade/renewal action - navigate to internal Renewal/Upgrade flow
  const handleUpgradeAction = (transaction) => {
    // Reset any existing form data and states
    setFormData({
      transactionType: "Renewal/Upgrade",
      licenseType: "",
      customerDetails: {
        mobile: "",
        email: "",
        name: "",
        company: "",
        gstin: "",
        address: "",
        city: "",
        pincode: "",
        state: "",
        ca_pan_no: "",
        ca_license_number: ""
      },
      productType: "",
      region: "India",
      licenseModel: "",
      duration: "",
      planName: "",
      discountPercent: 0
    });

    // Clear any existing states
    setCustomerValidated(false);
    setExistingLicenses([]);
    setErrors({});
    setPlanQuantities({}); // Reset plan quantities
    setIsProspectDetailsOpen(true); // Reset accordion to open
    setIsProspectDetailsSaved(false); // Reset saved state
    
    // Reset renewal/upgrade flow
    resetRenewalFlow();
    
    // Navigate to create form
    setShowCreateForm(true);
    
    // Pre-populate and auto-validate SER123456
    setTimeout(() => {
      setSerialNumber('SER123456');
      
      // Auto-validate after serial is set
      setTimeout(() => {
        validateSerialForCTA('SER123456');
      }, 100);
    }, 100);
  };

  // Helper function to validate serial for CTA actions
  const validateSerialForCTA = async (serial) => {
    setFetchingSerialDetails(true);
    setErrors(prev => ({ ...prev, serialNumber: "" }));

    try {
      // Simulate API call to validate serial number and fetch details
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use the same mock data as the validateSerialNumber function
      const mockSerialData = {
        "SER123456": {
          valid: true,
          eligible: true,
          customer: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            mobile: "9876543210",
            company: "Kumar Enterprises",
            gstin: "27KUMAR123456Z",
            city: "Mumbai",
            state: "Maharashtra"
          },
          currentProduct: {
            type: "Desktop",
            planName: "Desktop Standard Multi User",
            licenseModel: "Perpetual",
            duration: "360 Days",
            expiryDate: "2024-12-31",
            status: "Active"
          }
        }
      };

      const serialData = mockSerialData[serial.toUpperCase()];

      if (serialData && serialData.valid && serialData.eligible) {
        // Success - set customer and product info
        setCurrentCustomerInfo(serialData.customer);
        setCurrentProductInfo(serialData.currentProduct);
        setSerialValidated(true);
      }

    } catch (error) {
      setErrors(prev => ({ ...prev, serialNumber: "Error fetching details. Please try again." }));
      setSerialValidated(false);
    } finally {
      setFetchingSerialDetails(false);
    }
  };

  // Handle edit customer details for active licenses
  const handleEditCustomer = (transaction) => {
    setSelectedTransaction(transaction);
    // Pre-populate edit form with existing data
    setEditFormData({
      // Customer details from transaction
      name: transaction.customer_name || '',
      email: transaction.customer_email || '',
      company: transaction.customer_company || '',
      gstin: transaction.customer_gstin || '',
      address: transaction.customer_address || '',
      city: transaction.customer_city || '',
      pincode: transaction.customer_pincode || '',
      state: transaction.customer_state || '',
      country: transaction.customer_country || 'India',
      // Optional additional details (empty initially)
      alternateNumber: transaction.alternate_number || '',
      landmark: transaction.landmark || '',
      notes: transaction.notes || '',
      preferredContactTime: transaction.preferred_contact_time || '',
      businessType: transaction.business_type || '',
      referralSource: transaction.referral_source || ''
    });
    setShowEditModal(true);
  };

  // Save edited customer details
  const saveCustomerDetails = async () => {
    try {
      // Check if all required fields are filled
      const requiredFields = ['name', 'email', 'company', 'address', 'city', 'pincode', 'state'];
      const missingFields = requiredFields.filter(field => !editFormData[field] || editFormData[field].trim() === '');
      
      if (missingFields.length > 0) {
        alert(`Please fill the following required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      // In real implementation, this would be an API call
      console.log('Saving customer details for transaction:', selectedTransaction.id, editFormData);
      
      // Mock API call simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close edit modal and show invoice modal
      setShowEditModal(false);
      setShowInvoiceModal(true);
      
    } catch (error) {
      console.error('Error saving customer details:', error);
    }
  };

  // Generate invoice function
  const generateInvoice = async () => {
    try {
      // Mock invoice generation
      console.log('Generating invoice for transaction:', selectedTransaction.id);
      
      // Mock API call simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update transaction status to show invoice generated
      // In real implementation, this would update the backend
      
      // Close modal
      setShowInvoiceModal(false);
      setSelectedTransaction(null);
      
      console.log('Invoice generated successfully');
      
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  // Check if transaction has invoice status
  const getInvoiceStatus = (transaction) => {
    // Mock logic - in real implementation, this would come from API
    // Use transaction ID to ensure consistent status across renders
    const hash = transaction.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const invoiceGenerated = transaction.invoice_generated || (hash % 3 !== 0); // Deterministic based on transaction ID
    return invoiceGenerated ? 'Generated' : 'Pending';
  };

  // Auto-scroll helper function
  const scrollToElement = (elementId, delay = 800) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, delay);
  };

  // Auto-scroll when Order Summary becomes visible
  React.useEffect(() => {
    const busyOnlineValid = formData.productType === "Busy Online" && formData.duration && formData.accessType && validateBusyOnlineCounts().isValid;
    const onlineValid = formData.productType === "Online" && onlineUserCount >= 1 && onlineCompanyCount >= 1 && onlineDatabaseType && formData.duration;
    const mandiValid = formData.productType === "Mandi" && formData.duration && Object.values(planQuantities).some(qty => qty > 0);
    const appValid = formData.productType === "App" && appSubscriptionCount >= 1 && formData.duration;
    const rdpValid = formData.productType === "RDP" && rdpCount >= 1;
    const orderSummaryVisible = (((formData.productType === "Desktop" && formData.planName && calculateDesktopPricing()) || 
                                 mandiValid ||
                                 onlineValid ||
                                 appValid ||
                                 (formData.productType === "Recom" && formData.planName && calculateDesktopPricing()) ||
                                 rdpValid ||
                                 busyOnlineValid) && customerValidated);
    
    if (orderSummaryVisible) {
      scrollToElement('order-summary-section');
    }
  }, [formData.productType, formData.planName, formData.duration, formData.accessType, formData.userCount, formData.companyCount, customerValidated]);

  // Auto-scroll when plans become visible (after product type selection)
  React.useEffect(() => {
    if (customerValidated && formData.productType) {
      // Scroll to plans section when product type is selected
      setTimeout(() => {
        if (formData.productType === "Desktop") {
          const desktopPlansElement = document.querySelector('[data-scroll-target="desktop-plans"]');
          if (desktopPlansElement) {
            desktopPlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (formData.productType === "Mandi") {
          const mandiPlansElement = document.querySelector('[data-scroll-target="mandi-plans"]');
          if (mandiPlansElement) {
            mandiPlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (formData.productType === "Online") {
          const onlinePlansElement = document.querySelector('[data-scroll-target="online-plans"]');
          if (onlinePlansElement) {
            onlinePlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (formData.productType === "App") {
          const appPlansElement = document.querySelector('[data-scroll-target="app-plans"]');
          if (appPlansElement) {
            appPlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (formData.productType === "Recom") {
          const recomPlansElement = document.querySelector('[data-scroll-target="recom-plans"]');
          if (recomPlansElement) {
            recomPlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (formData.productType === "Busy Online") {
          const busyOnlinePlansElement = document.querySelector('[data-scroll-target="busy-online-plans"]');
          if (busyOnlinePlansElement) {
            busyOnlinePlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (formData.productType === "RDP") {
          const rdpPlansElement = document.querySelector('[data-scroll-target="rdp-plans"]');
          if (rdpPlansElement) {
            rdpPlansElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 600);
    }
  }, [customerValidated, formData.productType]);

  // Auto-scroll for Renewal/Upgrade flow
  React.useEffect(() => {
    // 1. After license validation to show options
    if (serialValidated && currentCustomerInfo && currentProductInfo) {
      scrollToElement('renewal-options-section', 600);
    }
  }, [serialValidated, currentCustomerInfo, currentProductInfo]);

  React.useEffect(() => {
    // 2. After option selection to show plans (upgrade flow)
    if (renewalOption === 'upgrade') {
      scrollToElement('upgrade-plans-section', 600);
    }
  }, [renewalOption]);

  React.useEffect(() => {
    // 3. After product/plan selection to show order summary (upgrade)
    if (renewalOption === 'upgrade' && formData.productType && formData.planName) {
      scrollToElement('upgrade-order-summary-section', 800);
    }
    // For renewal option
    if (renewalOption === 'renew') {
      scrollToElement('renewal-order-summary-section', 600);
    }
  }, [renewalOption, formData.productType, formData.planName]);

  // Auto-scroll for Mobile App flow
  React.useEffect(() => {
    // 1. After license validation to show options
    if (mobileAppValidated && mobileAppCustomerInfo && mobileAppBaseProductInfo) {
      scrollToElement('mobile-app-options-section', 600);
    }
  }, [mobileAppValidated, mobileAppCustomerInfo, mobileAppBaseProductInfo]);

  React.useEffect(() => {
    // 2. After option selection to show plans/forms
    if (mobileAppOption === 'buy_new') {
      scrollToElement('mobile-app-plans-section', 600);
    } else if (mobileAppOption === 'renew_existing') {
      scrollToElement('mobile-app-renewal-section', 600);
    }
  }, [mobileAppOption]);

  React.useEffect(() => {
    // 3. After plan selection to show order summary
    if (mobileAppOption === 'buy_new' && mobileAppCount && mobileAppValidity) {
      scrollToElement('mobile-app-order-summary-section', 800);
    }
    if (mobileAppOption === 'renew_existing' && selectedAppsForRenewal.length > 0 && renewalValidity) {
      scrollToElement('mobile-app-renewal-summary-section', 800);
    }
  }, [mobileAppOption, mobileAppCount, mobileAppValidity, selectedAppsForRenewal.length, renewalValidity]);

  // Auto-scroll for Recom flow
  React.useEffect(() => {
    // 1. After license validation to show options
    if (recomValidated && recomCustomerInfo && recomBaseProductInfo && recomCurrentPlan) {
      scrollToElement('recom-options-section', 600);
    }
  }, [recomValidated, recomCustomerInfo, recomBaseProductInfo, recomCurrentPlan]);

  React.useEffect(() => {
    // 2. After option selection to show plans
    if (recomOption === 'buy_new' || recomOption === 'upgrade') {
      scrollToElement('recom-plans-section', 600);
    }
  }, [recomOption]);

  React.useEffect(() => {
    // 3. After plan selection to show order summary
    if ((recomOption === 'buy_new' || recomOption === 'upgrade') && selectedRecomPlan) {
      scrollToElement('recom-order-summary-section', 800);
    }
    if (recomOption === 'renew') {
      scrollToElement('recom-renew-summary-section', 600);
    }
  }, [recomOption, selectedRecomPlan]);

  // Navigation warning functions
  const handleNavigationAttempt = (navigationAction, type = 'other') => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationAction);
      setNavigationType(type);
      setShowWarningModal(true);
    } else {
      navigationAction();
    }
  };

  const resetForm = () => {
    setFormData({
      licenseType: "Retail",
      customerDetails: {
        mobile: "",
        name: "",
        email: "",
        company: "",
        gstin: "",
        city: "",
        pincode: "",
        address: "",
        state: "",
        country: "India",
        caPanNo: "",
        caLicenseNumber: ""
      },
      clientReferences: [
        { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
        { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
        { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
        { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
        { name: "", email: "", mobile: "", gstin: "", company: "", address: "" }
      ],
      productType: "",
      region: "India",
      planName: "",
      discountPercent: 0
    });
    setCustomerValidated(false);
    setExistingLicenses([]);
    setErrors({});
    setVisibleClientReferences(2);
    setHasUnsavedChanges(false);
    setPlanQuantities({}); // Reset plan quantities
    setIsProspectDetailsOpen(true); // Reset accordion to open
    setIsProspectDetailsSaved(false); // Reset saved state
  };



  const proceedWithoutSaving = () => {
    setHasUnsavedChanges(false);
    
    // Handle different navigation behaviors based on type
    if (navigationType === 'dashboard') {
      // For dashboard navigation: execute pending navigation (go to dashboard)
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } else {
      // For other cases: stay on create page but reset form
      resetForm();
      setPendingNavigation(null);
    }
    
    setNavigationType(null);
    setShowWarningModal(false);
  };

  const validateCustomerDetails = async () => {
    const newErrors = {};

    // Validate mandatory fields
    if (!formData.customerDetails.mobile) {
      newErrors.mobile = "Mobile number is required";
    }
    if (!formData.customerDetails.email) {
      newErrors.email = "Email address is required";
    }
    if (!formData.customerDetails.name) {
      newErrors.name = "Name is required";
    }

    // GSTIN is mandatory for GSTP category
    if (formData.licenseType === "GST Practitioner" && !formData.customerDetails.gstin) {
      newErrors.gstin = "GSTIN is required for GSTP category";
    }

    // Additional validation for CA license
    if (formData.licenseType === "CA") {
      if (!formData.customerDetails.caLicenseNumber) {
        newErrors.caLicenseNumber = "CA License Number is required";
      }
    }

    // If there are errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Removed toast popup
      return;
    }

    // Clear any existing errors
    setErrors({});

    try {
      setValidatingCustomer(true);
      
      // Hardcoded values that will trigger validation failure
      const conflictValues = {
        mobile: '9953879832',
        email: 'arihant.mnnit@gmail.com',
        gstin: '09AAACI5853L2Z5',
        caPanNo: 'AGLPJ3967E',
        caLicenseNumber: '123456'
      };

      // Check for conflicts with hardcoded values
      const conflicts = [];
      const fieldErrors = {};

      if (formData.customerDetails.mobile === conflictValues.mobile) {
        conflicts.push('Mobile');
        fieldErrors.mobile = "Mobile already linked to an existing license";
      }
      if (formData.customerDetails.email === conflictValues.email) {
        conflicts.push('Email ID');
        fieldErrors.email = "Email already linked to an existing license";
      }
      if (formData.customerDetails.gstin === conflictValues.gstin) {
        conflicts.push('GSTIN');
        fieldErrors.gstin = "GSTIN already linked to an existing license";
      }
      if (formData.licenseType === "CA" && formData.customerDetails.caPanNo === conflictValues.caPanNo) {
        conflicts.push('CA PAN');
        fieldErrors.caPanNo = "CA PAN already linked to an existing license";
      }
      if (formData.licenseType === "CA" && formData.customerDetails.caLicenseNumber === conflictValues.caLicenseNumber) {
        conflicts.push('CA License');
        fieldErrors.caLicenseNumber = "CA License already linked to an existing license";
      }

      if (conflicts.length > 0) {
        // Validation failed - show field-level errors only
        setCustomerValidated(false);
        setErrors(fieldErrors);
      } else {
        // Validation successful
        setErrors({});
        setCustomerValidated(true);
        setIsProspectDetailsSaved(true);
        setIsProspectDetailsOpen(false); // Collapse accordion after save
        
        // DO NOT auto-select product - preserve the current productType from selected tab
        // The productType is already set when user clicked a product tab
        // Only set planName if needed, but keep productType unchanged
        
        // Auto scroll to Product Type section after validation
        setTimeout(() => {
          const productSection = document.getElementById('product-type-section');
          if (productSection) {
            productSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 500);
      }
      
    } catch (error) {
      console.error("Error validating customer:", error);
      // Removed toast popup
    } finally {
      setValidatingCustomer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation - check if we have either Desktop plan or Busy Online configuration
    const hasDesktopPlan = formData.productType === "Desktop" && formData.planName;
    const hasBusyOnline = formData.productType === "Busy Online" && formData.duration && formData.accessType && validateBusyOnlineCounts().isValid;
    
    if (!formData.customerDetails.mobile || !formData.customerDetails.email || (!hasDesktopPlan && !hasBusyOnline)) {
      // Removed toast popup
      return;
    }

    // Validate mobile number length
    if (formData.customerDetails.mobile.length !== 10) {
      // Removed toast popup
      return;
    }

    setSubmitting(true);

    try {
      // Instead of creating transaction, go to payment link page
      handleSendPaymentLink();
    } catch (error) {
      console.error("Error:", error);
      // Removed toast popup
    } finally {
      setSubmitting(false);
    }
  };

  // Handle license type changes with validation warning
  const handleLicenseTypeChange = (newLicenseType) => {
    // If customer is already validated and switching to CA or Accountant, show warning
    if (customerValidated && (newLicenseType === 'CA' || newLicenseType === 'Accountant') && formData.licenseType !== newLicenseType) {
      setPendingLicenseType(newLicenseType);
      setShowLicenseChangeWarning(true);
    } else {
      // Direct change without warning
      setFormData(prev => ({ ...prev, licenseType: newLicenseType }));
      if (customerValidated) {
        setCustomerValidated(false);
        setErrors({});
      }
    }
  };

  const confirmLicenseTypeChange = () => {
    setFormData(prev => ({ ...prev, licenseType: pendingLicenseType }));
    setCustomerValidated(false);
    setErrors({});
    setShowLicenseChangeWarning(false);
    setPendingLicenseType(null);
  };

  const cancelLicenseTypeChange = () => {
    setShowLicenseChangeWarning(false);
    setPendingLicenseType(null);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'product_type':
        aValue = a.product_type.toLowerCase();
        bValue = b.product_type.toLowerCase();
        break;
      case 'status':
        // For Success transactions, use invoice status for sorting
        if (a.status === 'Success') {
          aValue = getInvoiceStatus(a).toLowerCase();
        } else {
          aValue = a.status.toLowerCase();
        }
        
        if (b.status === 'Success') {
          bValue = getInvoiceStatus(b).toLowerCase();
        } else {
          bValue = b.status.toLowerCase();
        }
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    const year = date.getFullYear();
    return {
      dateMonth: `${day} ${month}`,
      year: year
    };
  };

  const getDueDate = (transaction) => {
    if (transaction.status === 'Success' && transaction.purchase_date && transaction.plan_duration) {
      const purchaseDate = new Date(transaction.purchase_date);
      const planDurationDays = parseInt(transaction.plan_duration);
      const planExpiryDate = new Date(purchaseDate.getTime() + planDurationDays * 24 * 60 * 60 * 1000);
      const formatted = formatDate(planExpiryDate.toISOString());
      return `${formatted.dateMonth} ${formatted.year}`;
    }
    return '-';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Success: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-gray-100 text-gray-800",
      Renewal: "bg-orange-100 text-orange-800"
    };

    return statusConfig[status] || statusConfig.Pending;
  };

  const getStatusDisplay = (transaction) => {
    const now = new Date();

    // Check if renewal is due within 60 days based on plan duration
    if (transaction.status === 'Success' && transaction.purchase_date && transaction.plan_duration) {
      const purchaseDate = new Date(transaction.purchase_date);
      const planDurationDays = parseInt(transaction.plan_duration);
      const planExpiryDate = new Date(purchaseDate.getTime() + planDurationDays * 24 * 60 * 60 * 1000);
      const renewalStartDate = new Date(planExpiryDate.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Check if we're in the last 60 days before plan expiry
      if (now >= renewalStartDate && now <= planExpiryDate) {
        const daysTillExpiry = Math.ceil((planExpiryDate - now) / (1000 * 60 * 60 * 24));
        return {
          text: `Renewal Due\nin ${daysTillExpiry} days`,
          badgeClass: getStatusBadge('Renewal')
        };
      }

      // Check if plan has expired (overdue)
      if (now > planExpiryDate) {
        return {
          text: `Renewal\nOverdue`,
          badgeClass: getStatusBadge('Failed')
        };
      }
    }

    // Handle cancelled status with cancel date
    if (transaction.status === 'Cancelled' && transaction.cancel_date) {
      const cancelDate = new Date(transaction.cancel_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return {
        text: `Cancelled\n(${cancelDate})`,
        badgeClass: getStatusBadge('Cancelled')
      };
    }

    // Handle payment statuses
    if (transaction.status === 'Pending') {
      return {
        text: 'Payment\nPending',
        badgeClass: getStatusBadge('Pending')
      };
    }

    if (transaction.status === 'Failed') {
      return {
        text: 'Payment\nFailed',
        badgeClass: getStatusBadge('Failed')
      };
    }

    // Change Success to Active
    const displayStatus = transaction.status === 'Success' ? 'Active' : transaction.status;

    // Default status display
    return {
      text: displayStatus,
      badgeClass: getStatusBadge(transaction.status)
    };
  };

  // Helper function to check if transaction is eligible for renewal
  const isEligibleForRenewal = (transaction) => {
    if (transaction.status !== 'Success' || !transaction.purchase_date || !transaction.plan_duration) return false;
    
    const now = new Date();
    const purchaseDate = new Date(transaction.purchase_date);
    const planDurationDays = parseInt(transaction.plan_duration);
    const planExpiryDate = new Date(purchaseDate.getTime() + planDurationDays * 24 * 60 * 60 * 1000);
    const renewalStartDate = new Date(planExpiryDate.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Eligible if within 60 days of expiry or already expired
    return now >= renewalStartDate;
  };

  // Apply search filter on sorted transactions
  const filteredTransactions = sortedTransactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    return (
      // Search by customer name
      transaction.customer_name.toLowerCase().includes(searchLower) ||
      // Search by mobile (check both customer_mobile and salesperson mobile)
      (transaction.customer_mobile && transaction.customer_mobile.toLowerCase().includes(searchLower)) ||
      (transaction.salesperson?.mobile && transaction.salesperson.mobile.toLowerCase().includes(searchLower)) ||
      // Search by email
      (transaction.customer_email && transaction.customer_email.toLowerCase().includes(searchLower)) ||
      (transaction.salesperson?.email && transaction.salesperson.email.toLowerCase().includes(searchLower)) ||
      // Search by GSTIN
      (transaction.customer_gstin && transaction.customer_gstin.toLowerCase().includes(searchLower)) ||
      // Search by Payment ID (transaction ID)
      transaction.id.toLowerCase().includes(searchLower) ||
      // Also keep existing searches
      transaction.product_type.toLowerCase().includes(searchLower) ||
      transaction.status.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const pricing = formData.productType && formData.planName ? calculatePricing() : null;

  // Payment Link Page Component
  const PaymentLinkPage = () => {
    if (!paymentLinkData) return null;

    const copyPaymentLink = () => {
      navigator.clipboard.writeText(paymentLinkData.paymentLink);
      // You could add a toast notification here for copy confirmation
    };

    const resendPaymentLink = () => {
      // Simulate resending the payment link
      console.log("Resending payment link to:", paymentLinkData.customerDetails.email);
      // You could add a toast notification here for resend confirmation
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Payment Link Sent Confirmation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-green-800">Payment Link Sent Successfully!</h2>
          </div>
          <p className="text-green-700">
            Payment link has been sent to <strong>{paymentLinkData.customerDetails.email}</strong> via email and WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{paymentLinkData.orderSummary.productType}</span>
                </div>
                {paymentLinkData.orderSummary.planName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{paymentLinkData.orderSummary.planName}</span>
                  </div>
                )}
                {paymentLinkData.orderSummary.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{paymentLinkData.orderSummary.duration}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{paymentLinkData.orderSummary.basePrice?.toLocaleString('en-IN') || 0}</span>
                </div>
                {paymentLinkData.orderSummary.discountAmount && paymentLinkData.orderSummary.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount ({paymentLinkData.orderSummary.discountPercent}%):</span>
                    <span className="font-medium text-green-600">-₹{paymentLinkData.orderSummary.discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-medium">₹{paymentLinkData.orderSummary.taxAmount?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span className="text-gray-900">Final Amount:</span>
                  <span className="text-blue-600">₹{paymentLinkData.orderSummary.finalAmount?.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Link Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Copy Payment Link */}
              <div className="space-y-2">
                <Label htmlFor="paymentLink">Payment Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="paymentLink"
                    value={paymentLinkData.paymentLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={copyPaymentLink}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Resend Options */}
              <div className="space-y-2">
                <Label>Resend Payment Link</Label>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    onClick={resendPaymentLink}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend via Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resendPaymentLink}
                    className="w-full"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Resend via WhatsApp
                  </Button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> The payment link is valid for 15 minutes. Customer will receive email and WhatsApp notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={() => {
              setShowPaymentLinkPage(false);
              setShowCreateForm(false);
              // Reset form data
              setFormData({
                transactionType: "New Sales",
                licenseType: "Retail",
                serialNumber: "",
                productType: "",
                region: "India",
                licenseModel: "",
                duration: "",
                accessType: "",
                userCount: "1",
                companyCount: "1",
                customerDetails: {
                  mobile: "",
                  name: "",
                  email: "",
                  company: "",
                  gstin: "",
                  city: "",
                  pincode: "",
                  address: "",
                  state: "",
                  country: "India",
                  caPanNo: "",
                  caLicenseNumber: ""
                },
                clientReferences: [
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" }
                ],
                poUpload: null,
                planName: "",
                discountPercent: 0
              });
              setCustomerValidated(false);
              setExistingLicenses([]);
              setErrors({});
              setVisibleClientReferences(2);
              setPlanQuantities({}); // Reset plan quantities
              setIsProspectDetailsOpen(true); // Reset accordion to open
              setIsProspectDetailsSaved(false); // Reset saved state
            }}
            variant="outline"
            className="px-8 py-2"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  };

  // Payment Page Component
  const PaymentPage = () => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

    // Payment timer countdown
    useEffect(() => {
      if (timeLeft <= 0) return;
      
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time for display
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handlePayment = async () => {
      if (!selectedPaymentMethod) {
        // Removed toast popup
        return;
      }

      setIsProcessing(true);
      
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentSuccess(true);
        // Removed toast popup
        
        // Reset form after success
        setTimeout(() => {
          setShowPaymentPage(false);
          setPaymentSuccess(false);
          setSelectedPaymentMethod('');
          setFormData({
            licenseType: "Retail",
            customerDetails: {
              mobile: "",
              name: "",
              email: "",
              company: "",
              gstin: "",
              city: "",
              pincode: "",
              address: "",
              state: "",
              country: "India",
              caPanNo: "",
              caLicenseNumber: ""
            },
            clientReferences: [
              { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
              { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
              { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
              { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
              { name: "", email: "", mobile: "", gstin: "", company: "", address: "" }
            ],
            poUpload: null,
            productType: "",
            region: "India",
            planName: "",
            discountPercent: 0
          });
          setCustomerValidated(false);
          setExistingLicenses([]);
          setErrors({});
          setVisibleClientReferences(2);
          setPlanQuantities({}); // Reset plan quantities
          setShowCreateForm(false);
        }, 2000);
      }, 3000);
    };

    if (paymentSuccess) {
      return (
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">Your transaction has been completed successfully.</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setShowPaymentPage(false)}
            className=""
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button
            onClick={() => {
              setShowPaymentPage(false);
              setShowCreateForm(true);
              // Reset form data for new sale
              setFormData({
                transactionType: "New Sales",
                licenseType: "Retail",
                serialNumber: "",
                productType: "",
                region: "India",
                licenseModel: "",
                duration: "",
                accessType: "",
                userCount: "1",
                companyCount: "1",
                customerDetails: {
                  mobile: "",
                  name: "",
                  email: "",
                  company: "",
                  gstin: "",
                  city: "",
                  pincode: "",
                  address: "",
                  state: "",
                  country: "India",
                  caPanNo: "",
                  caLicenseNumber: ""
                },
                clientReferences: [
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" },
                  { name: "", email: "", mobile: "", gstin: "", company: "", address: "" }
                ],
                poUpload: null,
                planName: "",
                discountPercent: 0
              });
              setCustomerValidated(false);
              setExistingLicenses([]);
              setErrors({});
              setVisibleClientReferences(2);
              setPlanQuantities({}); // Reset plan quantities
              setIsProspectDetailsOpen(true); // Reset accordion to open
              setIsProspectDetailsSaved(false); // Reset saved state
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            Generate Payment Link
          </Button>
        </div>
        
        <div>
          {/* Payment Link Sent Confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-800 font-medium">
                Payment link has been sent to customer's Email and WhatsApp
              </p>
            </div>
          </div>
          
          {/* Payment Expiry Timer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-yellow-800 font-medium">
                Payment link expires in: <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
              </p>
            </div>
            {timeLeft <= 60 && (
              <p className="text-yellow-700 text-sm text-center mt-2">
                ⚠️ Less than 1 minute remaining. Please complete your payment soon.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{formData.productType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{formData.planName}</span>
                </div>
                <hr className="my-4" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{pricing?.basePrice.toLocaleString('en-IN')}</span>
                </div>
                {pricing?.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount ({pricing.discountPercent}%):</span>
                    <span className="font-medium text-green-600">-₹{pricing.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-medium">₹{pricing?.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <hr className="my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{pricing?.finalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Link Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Payment Link Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Link:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value="https://busy.in/payment/TXN-1234567890"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText("https://busy.in/payment/TXN-1234567890");
                        // You could add a toast here for copy confirmation
                      }}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Resend Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Resend via email logic here
                    }}
                    className="text-green-600 border-green-300 hover:bg-green-50 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Resend via Email</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Resend via WhatsApp logic here
                    }}
                    className="text-green-600 border-green-300 hover:bg-green-50 flex items-center justify-center space-x-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Resend via WhatsApp</span>
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Payment link has been sent to customer's email and WhatsApp. 
                    Customer can use the link above to complete the payment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Direct Bank Transfer (NEFT/IMPS)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">🏦 Bank Account Details</h4>
                  <p className="text-amber-700 text-sm mb-3">
                    You can also pay directly via NEFT/IMPS using the following bank details:
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Account Holder Name:</label>
                      <p className="text-gray-900 mt-1">Busy Infotech. Pvt. Ltd.</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Bank Account Number:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-gray-900">123456789</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText('123456789')}
                          className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">IFSC Code:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-gray-900">PUNB123456</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText('PUNB123456')}
                          className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Bank Name:</label>
                      <p className="text-gray-900 mt-1">Punjab National Bank</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Branch:</label>
                      <p className="text-gray-900 mt-1">Main Branch</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <label className="font-medium text-gray-700 block mb-2">Amount to Transfer:</label>
                    <div className="bg-white border border-gray-300 rounded-md p-3">
                      <p className="text-2xl font-bold text-green-600">₹{pricing?.finalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-gray-600">Please transfer the exact amount mentioned above</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-800 mb-2">📋 Important Instructions:</h5>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Transfer the exact amount: <strong>₹{pricing?.finalAmount.toLocaleString('en-IN')}</strong></li>
                    <li>• Use your mobile number <strong>+91 {formData.customerDetails.mobile}</strong> as transfer reference</li>
                    <li>• Share payment screenshot/UTR on WhatsApp: <strong>+91 9876543210</strong></li>
                    <li>• License will be activated within 2 hours of payment confirmation</li>
                    <li>• Keep the transaction receipt for your records</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h5 className="font-semibold text-green-800">Quick Support</h5>
                  </div>
                  <p className="text-green-700 text-sm">
                    For any payment related queries, contact our support team at:
                    <br />📞 <strong>+91 9876543210</strong> | 📧 <strong>payments@busy.in</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Show payment page if payment is initiated
  if (showPaymentPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Gateway</h1>
                <p className="text-sm text-gray-600">Complete your purchase</p>
              </div>
            </div>
          </div>
        </div>
        <PaymentPage />
      </div>
    );
  }

  // Show Invoice Generated page
  if (showInvoiceGeneratedPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl text-green-800">Invoice Generated Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Name:</span>
                  <span className="font-medium">{invoiceFormData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium">{invoiceFormData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{invoiceFormData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{invoiceFormData.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GSTIN:</span>
                  <span className="font-medium">{invoiceFormData.gstin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{paymentLinkData?.orderSummary?.productType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-lg">₹{paymentLinkData?.orderSummary?.finalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm text-center">
                Invoice has been generated and sent to <strong>{invoiceFormData.email}</strong>
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShowInvoiceGeneratedPage(false);
                  setShowCreateForm(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Invoice Generation page
  if (showInvoiceGenerationPage) {
    const isFormValid = () => {
      return invoiceFormData.mobile && 
             invoiceFormData.email && 
             invoiceFormData.gstin && 
             invoiceFormData.companyName && 
             invoiceFormData.customerName && 
             invoiceFormData.address && 
             invoiceFormData.pincode && 
             invoiceFormData.city && 
             invoiceFormData.state;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Generate Invoice</CardTitle>
              <p className="text-gray-600 mt-2">Please provide necessary information for generating invoice</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerName"
                      value={invoiceFormData.customerName}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, customerName: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="companyName"
                      value={invoiceFormData.companyName}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, companyName: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mobile">Mobile <span className="text-red-500">*</span></Label>
                    <Input
                      id="mobile"
                      value={invoiceFormData.mobile}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, mobile: e.target.value })}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={invoiceFormData.email}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gstin">GSTIN <span className="text-red-500">*</span></Label>
                  <Input
                    id="gstin"
                    value={invoiceFormData.gstin}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, gstin: e.target.value })}
                    placeholder="Enter GSTIN"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="address"
                    value={invoiceFormData.address}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                    <Input
                      id="city"
                      value={invoiceFormData.city}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, city: e.target.value })}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode <span className="text-red-500">*</span></Label>
                    <Input
                      id="pincode"
                      value={invoiceFormData.pincode}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, pincode: e.target.value })}
                      placeholder="Enter pincode"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                    <Input
                      id="state"
                      value={invoiceFormData.state}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, state: e.target.value })}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> All fields are mandatory for invoice generation.
                  </p>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInvoiceGenerationPage(false);
                      setShowRedirectingPage(false);
                      setShowDummyPaymentPage(true);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (isFormValid()) {
                        setShowOtpModal(true);
                      } else {
                        alert('Please fill all mandatory fields');
                      }
                    }}
                    disabled={!isFormValid()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Confirm & Proceed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Enter OTP</CardTitle>
                <p className="text-sm text-gray-600">Enter the OTP to confirm invoice generation</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="otp">OTP (Use 1234)</Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength="4"
                    value={otpValue}
                    onChange={(e) => {
                      setOtpValue(e.target.value);
                      setOtpError('');
                    }}
                    placeholder="Enter 4-digit OTP"
                    className={otpError ? 'border-red-500' : ''}
                  />
                  {otpError && (
                    <p className="text-red-500 text-sm mt-1">{otpError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowOtpModal(false);
                      setOtpValue('');
                      setOtpError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (otpValue === '1234') {
                        setShowOtpModal(false);
                        setShowInvoiceGenerationPage(false);
                        setShowInvoiceGeneratedPage(true);
                        setOtpValue('');
                        setOtpError('');
                      } else {
                        setOtpError('Invalid OTP. Please use 1234');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Verify OTP
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Show Redirecting page
  if (showRedirectingPage) {
    setTimeout(() => {
      setShowRedirectingPage(false);
      setShowInvoiceGenerationPage(true);
    }, 2000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 text-lg">Redirecting to Invoice Generation page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Dummy Payment page
  if (showDummyPaymentPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setShowDummyPaymentPage(false);
              setShowPaymentLinkPage(true);
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
              <p className="text-gray-600 mt-2">Order Summary</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{paymentLinkData?.orderSummary?.productType}</span>
                  </div>
                  {paymentLinkData?.orderSummary?.planName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{paymentLinkData?.orderSummary?.planName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount:</span>
                    <span className="font-medium">₹{paymentLinkData?.orderSummary?.basePrice?.toLocaleString('en-IN')}</span>
                  </div>
                  {paymentLinkData?.orderSummary?.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-₹{paymentLinkData?.orderSummary?.discountAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">₹{paymentLinkData?.orderSummary?.taxAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span className="text-gray-900">Total Amount:</span>
                    <span className="text-blue-600">₹{paymentLinkData?.orderSummary?.finalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                </div>

              {/* Payment Method Selection (Dummy) */}
              <div>
                <h3 className="font-semibold mb-3">Select Payment Method</h3>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
                    <input type="radio" name="payment" className="mr-3" defaultChecked />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
                    <input type="radio" name="payment" className="mr-3" />
                    <span>UPI</span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
                    <input type="radio" name="payment" className="mr-3" />
                    <span>Net Banking</span>
                  </label>
                </div>
              </div>

              {/* Pay Now Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setShowDummyPaymentPage(false);
                    setShowRedirectingPage(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 w-full py-6 text-lg"
                >
                  Pay Now
                </Button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-gray-600 text-sm">
                  🔒 Secure payment gateway. Your payment information is safe with us.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show payment link page if initiated
  if (showPaymentLinkPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Link Sent</h1>
                <p className="text-sm text-gray-600">Customer payment link management</p>
              </div>
            </div>
          </div>
        </div>
        <PaymentLinkPage />
      </div>
    );
  };

  // Make Payment Page Component
  const MakePaymentPage = () => {
    const [billingData, setBillingData] = React.useState({
      mobile: '9876543210',
      email: 'john.doe@example.com',
      name: 'John Doe',
      gstin: '27AAACB1234C1Z5',
      companyName: 'BUSY INFOTECH PRIVATE LIMITED',
      address: '456 Business Park, Tech Hub',
      city: 'Mumbai',
      pincode: '400001',
      state: 'Maharashtra'
    });
    
    const [gstinFetching, setGstinFetching] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [showPaymentGateway, setShowPaymentGateway] = React.useState(false);
    const [showAcknowledgement, setShowAcknowledgement] = React.useState(false);
    const [redirectCountdown, setRedirectCountdown] = React.useState(3);

    // Handle GSTIN auto-fetch
    const handleGstinChange = async (value) => {
      setBillingData(prev => ({ ...prev, gstin: value.toUpperCase() }));
      
      // If GSTIN is 15 characters, try to fetch details
      if (value.length === 15) {
        setGstinFetching(true);
        try {
          // Simulate GSTIN API call - Replace with actual API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock data - Replace with actual API response
          const mockGstData = {
            companyName: 'BUSY INFOTECH PRIVATE LIMITED',
            address: '456 Business Park, Tech Hub',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          };
          
          setBillingData(prev => ({
            ...prev,
            companyName: mockGstData.companyName,
            address: mockGstData.address,
            city: mockGstData.city,
            state: mockGstData.state,
            pincode: mockGstData.pincode
          }));
          
          setErrors(prev => ({ ...prev, gstin: '' }));
        } catch (error) {
          setErrors(prev => ({ ...prev, gstin: 'Failed to fetch GSTIN details' }));
        } finally {
          setGstinFetching(false);
        }
      }
    };

    // Check if GSTIN is filled to disable certain fields
    const isGstinFilled = billingData.gstin.length === 15;

    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Billing Details</h2>
            <div className="relative group">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute left-0 top-6 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                Your Invoice will be generated on below mentioned details. Make sure it is correct to claim the GST Input Credit
                <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              </div>
            </div>
          </div>
          <button onClick={() => setShowMakePaymentPage(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content - Vertical Stacked Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full max-w-5xl mx-auto px-6 py-4">
            <div className="space-y-4">
              {/* Billing Information Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Billing Information</h3>
                
                {/* Billing Fields - 4-column grid for compact horizontal layout */}
                <div className="grid grid-cols-4 gap-x-4 gap-y-3">
                  {/* GSTIN */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={billingData.gstin}
                        onChange={(e) => handleGstinChange(e.target.value)}
                        maxLength={15}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white text-gray-900 text-xs" 
                        placeholder="15-digit GSTIN"
                      />
                      {gstinFetching && (
                        <div className="absolute right-2 top-1.5">
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {errors.gstin && <p className="text-xs text-red-500 mt-0.5">{errors.gstin}</p>}
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company Name*</label>
                    <input 
                      type="text" 
                      value={billingData.companyName}
                      onChange={(e) => setBillingData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none text-xs bg-white text-gray-900"
                      placeholder="Company name"
                    />
                    {errors.companyName && <p className="text-xs text-red-500 mt-0.5">{errors.companyName}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City*</label>
                    <input 
                      type="text" 
                      value={billingData.city}
                      onChange={(e) => setBillingData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none text-xs bg-white text-gray-900"
                      placeholder="City"
                    />
                    {errors.city && <p className="text-xs text-red-500 mt-0.5">{errors.city}</p>}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode*</label>
                    <input 
                      type="text" 
                      value={billingData.pincode}
                      onChange={(e) => setBillingData(prev => ({ ...prev, pincode: e.target.value }))}
                      maxLength={6}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none text-xs bg-white text-gray-900"
                      placeholder="Pincode"
                    />
                    {errors.pincode && <p className="text-xs text-red-500 mt-0.5">{errors.pincode}</p>}
                  </div>

                  {/* Address - Full width (span 2 columns) */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address*</label>
                    <input 
                      type="text" 
                      value={billingData.address}
                      onChange={(e) => setBillingData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none text-xs bg-white text-gray-900"
                      placeholder="Complete address"
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State*</label>
                    <input 
                      type="text" 
                      value={billingData.state}
                      onChange={(e) => setBillingData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none text-xs bg-white text-gray-900"
                      placeholder="State"
                    />
                    {errors.state && <p className="text-xs text-red-500 mt-0.5">{errors.state}</p>}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mobile*</label>
                    <input 
                      type="text" 
                      value={billingData.mobile}
                      onChange={(e) => setBillingData(prev => ({ ...prev, mobile: e.target.value }))}
                      maxLength={10}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white text-gray-900 text-xs" 
                      placeholder="Mobile number"
                    />
                    {errors.mobile && <p className="text-xs text-red-500 mt-0.5">{errors.mobile}</p>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name*</label>
                    <input 
                      type="text" 
                      value={billingData.name}
                      onChange={(e) => setBillingData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white text-gray-900 text-xs" 
                      placeholder="Full name"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
                  </div>

                  {/* Email - Full width (span 2 columns) */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email*</label>
                    <input 
                      type="email" 
                      value={billingData.email}
                      onChange={(e) => setBillingData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white text-gray-900 text-xs" 
                      placeholder="Email address"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Order Details Section - Below Billing Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col overflow-hidden">
                <h3 className="text-base font-semibold text-blue-900 mb-3 pb-2 border-b border-blue-200">Order Details</h3>
                
                {/* Product Table - Compact */}
                <div className="bg-white rounded border border-gray-200 overflow-hidden mb-3 flex-shrink-0">
                  <table className="w-full text-[10px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-1 px-1.5 font-semibold text-gray-700">S.No</th>
                        <th className="text-left py-1 px-1.5 font-semibold text-gray-700">Product</th>
                        <th className="text-center py-1 px-1.5 font-semibold text-gray-700">Duration</th>
                        <th className="text-center py-1 px-1.5 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-1 px-1.5 font-semibold text-gray-700">Rate</th>
                        <th className="text-right py-1 px-1.5 font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 px-1.5 text-gray-800">1</td>
                        <td className="py-1 px-1.5 text-gray-800">Basic - Single User</td>
                        <td className="py-1 px-1.5 text-center text-gray-800">360 Days</td>
                        <td className="py-1 px-1.5 text-center text-gray-800">1</td>
                        <td className="py-1 px-1.5 text-right text-gray-800">₹9,999</td>
                        <td className="py-1 px-1.5 text-right font-semibold text-gray-900">₹9,999</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 px-1.5 text-gray-800">2</td>
                        <td className="py-1 px-1.5 text-gray-800">Mobile App</td>
                        <td className="py-1 px-1.5 text-center text-gray-800">360 Days</td>
                        <td className="py-1 px-1.5 text-center text-gray-800">1</td>
                        <td className="py-1 px-1.5 text-right text-gray-800">₹2,999</td>
                        <td className="py-1 px-1.5 text-right font-semibold text-gray-900">₹2,999</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 px-1.5 text-gray-800">3</td>
                        <td className="py-1 px-1.5 text-gray-800">Recom</td>
                        <td className="py-1 px-1.5 text-center text-gray-800">365 Days</td>
                        <td className="py-1 px-1.5 text-center text-gray-800">1</td>
                        <td className="py-1 px-1.5 text-right text-gray-800">₹5,900</td>
                        <td className="py-1 px-1.5 text-right font-semibold text-gray-900">₹5,900</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pricing Summary - Compact */}
                <div className="bg-blue-50 rounded border border-blue-200 p-2.5 space-y-1 flex-shrink-0">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700">Total:</span>
                    <span className="font-semibold text-gray-900">₹18,898</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700">TDS Deduction:</span>
                    <span className="font-semibold text-gray-900">₹0</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700">GST (18%):</span>
                    <span className="font-semibold text-gray-900">₹3,402</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1.5 border-t border-blue-300">
                    <span className="font-bold text-gray-900">Grand Total:</span>
                    <span className="font-bold text-blue-900 text-base">₹22,300</span>
                  </div>
                </div>

                {/* Proceed to Pay Button */}
                <div className="mt-auto pt-3 flex justify-center flex-shrink-0">
                  <button 
                    onClick={() => setShowPaymentGateway(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold px-10 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-all"
                  >
                    Proceed to Pay
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Gateway Popup */}
        {showPaymentGateway && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]" onClick={() => setShowPaymentGateway(false)}>
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full">
              {/* Left Sidebar - Blue Background */}
              <div className="w-1/3 bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-l-lg relative">
                {/* Company Name */}
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
                      B
                    </div>
                    <span className="text-white font-semibold text-sm">BUSY INFOTECH PRIVA...</span>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-gray-600 text-xs mb-2">Price Summary</p>
                  <p className="text-3xl font-bold text-gray-900">₹22,300</p>
                </div>

                {/* Using As */}
                <div className="bg-white rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700 text-xs">Using as +91 82828 28282</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Offers */}
                <div className="bg-white rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-gray-700 text-xs">Offers on UPI and Axis</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Illustration */}
                <div className="mt-8 mb-6">
                  <svg className="w-32 h-32 mx-auto opacity-20" fill="white" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>

                {/* Secured by Razorpay */}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                    </svg>
                    <span className="text-white text-xs">Secured by Razorpay</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Payment Options */}
              <div className="w-2/3 p-4 flex flex-col max-h-[90vh]">
                <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Payment Options</h2>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
                    <button onClick={() => setShowPaymentGateway(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Available Offers */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-700">Available Offers</span>
                    </div>
                    <button className="text-xs text-blue-600 font-semibold">View all</button>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">Win up to ₹300 cashback via CRED UPI</p>
                </div>

                {/* Payment Methods Tabs */}
                <div className="border-b border-gray-200 mb-4">
                  <div className="flex gap-4">
                    <button className="pb-2 px-1 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">Recommended</button>
                    <button className="pb-2 px-1 text-sm font-medium text-gray-500">Available Offers</button>
                  </div>
                </div>

                {/* UPI QR Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">UPI QR</h3>
                      <p className="text-xs text-gray-600 mb-3">Scan the QR using any UPI App</p>
                      <div className="flex gap-2 mb-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">G</span>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">P</span>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">C</span>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">पे</span>
                        </div>
                      </div>
                      <div className="bg-green-100 rounded p-2">
                        <p className="text-xs text-green-800 font-medium">Win up to ₹300 cashback via CRED UPI</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-2">11:46</p>
                    </div>
                  </div>
                </div>

                {/* UPI */}
                <div className="border border-gray-200 rounded-lg p-3 mb-3 hover:border-blue-500 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">UPI</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">UPI</p>
                        <p className="text-xs text-gray-500">Win up to ₹300 ca...</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Cards */}
                <div className="border border-gray-200 rounded-lg p-3 mb-3 hover:border-blue-500 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Cards</p>
                        <p className="text-xs text-gray-500">Also enjoy compli...</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Netbanking */}
                <div className="border border-gray-200 rounded-lg p-3 mb-3 hover:border-blue-500 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Netbanking</p>
                        <p className="text-xs text-gray-500">All major banks</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Wallet */}
                <div className="border border-gray-200 rounded-lg p-3 mb-3 hover:border-blue-500 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Wallet</p>
                        <p className="text-xs text-gray-500">Paytm, MobiKwik</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                </div>
                
                {/* Continue Button - Fixed at bottom */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowAcknowledgement(true);
                      setRedirectCountdown(3);
                      // Start countdown
                      const timer = setInterval(() => {
                        setRedirectCountdown(prev => {
                          if (prev <= 1) {
                            clearInterval(timer);
                            setShowAcknowledgement(false);
                            setShowPaymentGateway(false);
                            setShowMakePaymentPage(false);
                            return 3;
                          }
                          return prev - 1;
                        });
                      }, 1000);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Continue
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    By proceeding, I agree to Razorpay's <span className="text-blue-600 cursor-pointer">Privacy Notice</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Payment Acknowledgement Page */}
        {showAcknowledgement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={() => {
            setShowAcknowledgement(false);
            setShowPaymentGateway(false);
            setShowMakePaymentPage(false);
          }}>
            <div className="bg-white rounded-lg max-w-6xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 border-b border-green-600 px-4 py-3 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Payment Successful</h2>
                </div>
                <button 
                  onClick={() => {
                    setShowAcknowledgement(false);
                    setShowPaymentGateway(false);
                    setShowMakePaymentPage(false);
                  }} 
                  className="text-white hover:text-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Redirection Notice */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>You will be redirected in {redirectCountdown} seconds</span>
                  </div>
                </div>
                
                <div className="max-w-3xl mx-auto">
                  {/* Success Icon & Message */}
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 w-24 h-24 bg-green-300 rounded-full opacity-30 animate-ping"></div>
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Completed Successfully!</h1>
                    <p className="text-gray-600">Thank you for your payment</p>
                  </div>
                  
                  {/* Transaction Details Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-300">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Merchant</p>
                        <h3 className="text-xl font-bold text-gray-900">Acme Corp</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                        <p className="text-3xl font-bold text-green-600">₹22,300</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Payment Method</span>
                        <span className="text-sm font-semibold text-gray-900">UPI</span>
                      </div>
                      <div className="flex items-center justify-between py-2 bg-white rounded-lg px-3">
                        <span className="text-sm text-gray-600">Transaction ID</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-900">razorpay_payment_id</span>
                          <button className="text-blue-600 hover:text-blue-700 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Completed
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-blue-50 rounded-lg p-4 flex items-start gap-3 border border-blue-200">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">Need help?</p>
                        <p className="text-sm text-blue-800">
                          Visit <a href="#" className="text-blue-600 font-semibold hover:underline">razorpay.com/support</a> for queries
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Secured by Razorpay */}
                  <div className="text-center mt-6">
                    <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                      </svg>
                      <span>Secured by Razorpay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Menu items configuration
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'lead', name: 'Lead', icon: Users },
    { id: 'report', name: 'Report', icon: FileText },
    { id: 'enquiry', name: 'Enquiry', icon: MessageSquare },
    { id: 'user', name: 'User', icon: User },
    { id: 'acl', name: 'ACL', icon: Shield },
    { id: 'payments', name: 'Payments', icon: Wallet }
  ];

  // If Make Payment page is active, show only that page (full-screen)
  if (showMakePaymentPage) {
    return <MakePaymentPage />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-16' : 'w-16'} bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-8 transition-all duration-300`}>
        {/* Logo */}
        <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xl">B</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col space-y-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  // If clicking on Payments, reset to main payments listing page
                  if (item.id === 'payments') {
                    setShowPaymentLinkPage(false);
                    setShowCreateForm(false);
                  }
                }}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title={item.name}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] mt-1">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200">
          {/* Single Row - Title, Search Bar, and Right Actions */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              {/* Page Title */}
              <div className="flex-shrink-0">
                {activeMenu === 'payments' && (
                  <>
                    <button
                      onClick={() => handleNavigationAttempt(() => setShowCreateForm(false), 'dashboard')}
                      className="text-2xl font-bold text-blue-900 hover:text-blue-800 transition-colors whitespace-nowrap"
                    >
                      My Payments
                    </button>
                    {showCreateForm && (
                      <span className="text-xl font-semibold text-gray-600"> / Generate Payment Link</span>
                    )}
                  </>
                )}
                {activeMenu !== 'payments' && (
                  <h1 className="text-2xl font-bold text-blue-900">
                    {menuItems.find(m => m.id === activeMenu)?.name}
                  </h1>
                )}
              </div>

              {/* Search Bar - Center */}
              {activeMenu === 'payments' && !showCreateForm && (
                <div className="flex-1 max-w-2xl relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by Mobile, Email, GSTIN, Payment ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button 
                    onClick={() => setShowAdvancedFilter(true)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Advanced Filters"
                  >
                    <Filter className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                {/* ASM Dropdown */}
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors">
                  <option>ASM</option>
                  <option>Sales Manager</option>
                  <option>Team Leader</option>
                </select>

                {/* Menu Toggle */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>

                {/* Notification Bell with Badge */}
                <button className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Shield Icon */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-gray-600" />
                </button>

                {/* User Avatar */}
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  S
                </div>
              </div>
            </div>
          </div>

          {/* Filter Buttons Row with Generate Payment Link - Only show on payments dashboard */}
          {activeMenu === 'payments' && !showCreateForm && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between gap-2">
                {/* Status Filter Buttons */}
                <div className="flex items-center space-x-1.5 flex-1">
                  {[
                    { id: 'all', label: 'All', count: transactions.length, color: 'blue' },
                    { id: 'pending', label: 'Pending', count: transactions.filter(t => t.status === 'Pending').length, color: 'yellow' },
                    { id: 'received', label: 'Received', count: transactions.filter(t => t.status === 'Success').length, color: 'green' },
                    { id: 'failed', label: 'Failed', count: transactions.filter(t => t.status === 'Failed').length, color: 'red' },
                    { id: 'expired', label: 'Expired', count: transactions.filter(t => t.status === 'Expired').length, color: 'red' },
                    { id: 'cancelled', label: 'PO Approval Pending', count: transactions.filter(t => t.status === 'Cancelled').length, color: 'gray' },
                    { id: 'draft', label: 'Draft', count: transactions.filter(t => t.status === 'Draft').length, color: 'purple' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedQuickFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedQuickFilter === filter.id
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {filter.label}
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedQuickFilter === filter.id
                          ? 'bg-white text-gray-900'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Make Payment Button */}
                <Button 
                  onClick={() => setShowMakePaymentPage(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0 text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Make Payment</span>
                </Button>

                {/* Generate Payment Link Button */}
                <Button 
                  onClick={() => handleNavigationAttempt(() => setShowCreateForm(!showCreateForm))}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Payment Link</span>
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          {activeMenu === 'payments' ? (
            // Payments Content (BIPL Sales Portal)
            <div className="max-w-full mx-auto p-6 space-y-6">
              {/* Action buttons removed - Generate Payment Link moved to filter row */}
              
        {/* Create Transaction Form */}
        {showCreateForm && (
          <div>
            {/* Product-based Tabs - Outside Card */}
            <div className="mb-0">
              <div className="flex space-x-1">
                {[
                  { value: "Desktop", label: "Desktop", icon: "💻" },
                  { value: "Mandi", label: "Mandi", icon: "🛒" },
                  { value: "Online", label: "Online", icon: "☁️" },
                  { value: "App", label: "App", icon: "📱" },
                  { value: "Recom", label: "Recom", icon: "🎯" },
                  { value: "RDP", label: "RDP", icon: "🖥️" }
                ].map((tab) => {
                  const isActive = formData.productType === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        // Set product type
                        setFormData(prev => ({
                          ...prev,
                          productType: tab.value,
                          transactionType: "Renewal/Upgrade" // Keep this for existing logic
                        }));
                        // Reset other fields when switching products
                        setSerialNumber('');
                        setSerialValidated(false);
                        setCustomerValidated(false);
                        setCurrentCustomerInfo(null);
                        setCurrentProductInfo(null);
                        setActionType('');
                        setErrors({});
                      }}
                      className={`flex items-center px-6 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white rounded-t-lg'
                          : 'bg-gray-50 text-gray-700 border border-gray-300 border-b-0 rounded-t-lg hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2 text-lg">{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Card className="rounded-t-none border-t-0">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                {/* Universal TDS Toggle removed - now inside Order Summary sections */}

                {/* Product-based Renewal/Upgrade Flow (Show for all products) */}
                {formData.productType && formData.transactionType === "Renewal/Upgrade" && (
                  <div className="space-y-6">

                    {/* Step 1: Serial Number Input & Validation */}
                    <div className="bg-white rounded-lg p-6">
                      
                      <div className="flex items-center space-x-4">
                        {/* New Button - Different placement for App, Recom and RDP tabs */}
                        {formData.productType !== "App" && formData.productType !== "Recom" && formData.productType !== "RDP" && (
                          <Button 
                            type="button"
                            onClick={() => {
                              // Switch to New Sales flow for selected product
                              const currentProductType = formData.productType; // Capture current product type
                              setFormData(prev => ({
                                ...prev,
                                transactionType: "New Sales",
                                productType: currentProductType, // Explicitly preserve productType
                                // Reset other fields
                                serialNumber: "",
                                duration: "",
                                licenseModel: "",
                                planName: "",
                                customerDetails: {
                                  mobile: "",
                                  name: "",
                                  email: "",
                                  company: "",
                                  gstin: "",
                                  city: "",
                                  pincode: "",
                                  address: "",
                                  state: "",
                                  country: "India",
                                  caPanNo: "",
                                  caLicenseNumber: ""
                                }
                              }));
                              // Reset validation states
                              setCustomerValidated(false);
                              setSerialValidated(false);
                              setSerialNumber('');
                              setCurrentCustomerInfo(null);
                              setCurrentProductInfo(null);
                              setActionType('');
                              setErrors({});
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-semibold"
                          >
                            New
                          </Button>
                        )}

                        <div className="flex items-center space-x-3">
                          {/* Subscription Number Input - Always visible */}
                          <Input
                            value={serialNumber}
                            onChange={(e) => {
                              setSerialNumber(e.target.value);
                              setErrors(prev => ({ ...prev, serialNumber: "" }));
                              setSerialValidated(false);
                            }}
                            placeholder="Enter Subscription Number"
                            className={`w-64 ${errors.serialNumber ? "border-red-500" : ""}`}
                            disabled={fetchingSerialDetails || serialValidated}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !fetchingSerialDetails && !serialValidated) {
                                validateSerialNumber();
                              }
                            }}
                          />
                          
                          {/* New Button for App tab - Positioned on right, before Renew */}
                          {formData.productType === "App" && (
                            <Button 
                              type="button"
                              onClick={() => {
                                // Switch to New Sales flow for App
                                const currentProductType = formData.productType;
                                setFormData(prev => ({
                                  ...prev,
                                  transactionType: "New Sales",
                                  productType: currentProductType,
                                  serialNumber: "",
                                  duration: "",
                                  licenseModel: "",
                                  planName: "",
                                  customerDetails: {
                                    mobile: "",
                                    name: "",
                                    email: "",
                                    company: "",
                                    gstin: "",
                                    city: "",
                                    pincode: "",
                                    address: "",
                                    state: "",
                                    country: "India",
                                    caPanNo: "",
                                    caLicenseNumber: ""
                                  }
                                }));
                                setCustomerValidated(false);
                                setSerialValidated(false);
                                setSerialNumber('');
                                setCurrentCustomerInfo(null);
                                setCurrentProductInfo(null);
                                setActionType('');
                                setErrors({});
                              }}
                              disabled={!serialNumber || serialNumber.toUpperCase() !== "SER12345"}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              New
                            </Button>
                          )}
                          
                          {/* New Button for Recom tab - Positioned on right, before Renew */}
                          {formData.productType === "Recom" && (
                            <Button 
                              type="button"
                              onClick={() => {
                                // Switch to New Sales flow for Recom
                                const currentProductType = formData.productType;
                                setFormData(prev => ({
                                  ...prev,
                                  transactionType: "New Sales",
                                  productType: currentProductType,
                                  serialNumber: "",
                                  duration: "",
                                  licenseModel: "",
                                  planName: "",
                                  customerDetails: {
                                    mobile: "",
                                    name: "",
                                    email: "",
                                    company: "",
                                    gstin: "",
                                    city: "",
                                    pincode: "",
                                    address: "",
                                    state: "",
                                    country: "India",
                                    caPanNo: "",
                                    caLicenseNumber: ""
                                  }
                                }));
                                setCustomerValidated(false);
                                setSerialValidated(false);
                                setSerialNumber('');
                                setCurrentCustomerInfo(null);
                                setCurrentProductInfo(null);
                                setActionType('');
                                setErrors({});
                              }}
                              disabled={!serialNumber || serialNumber.toUpperCase() !== "SER12345"}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              New
                            </Button>
                          )}
                          
                          {/* New Button for RDP tab - Positioned on right */}
                          {formData.productType === "RDP" && (
                            <Button 
                              type="button"
                              onClick={() => {
                                // Switch to New Sales flow for RDP
                                const currentProductType = formData.productType;
                                setFormData(prev => ({
                                  ...prev,
                                  transactionType: "New Sales",
                                  productType: currentProductType,
                                  serialNumber: "",
                                  duration: "",
                                  licenseModel: "",
                                  planName: "",
                                  customerDetails: {
                                    mobile: "",
                                    name: "",
                                    email: "",
                                    company: "",
                                    gstin: "",
                                    city: "",
                                    pincode: "",
                                    address: "",
                                    state: "",
                                    country: "India",
                                    caPanNo: "",
                                    caLicenseNumber: ""
                                  }
                                }));
                                setCustomerValidated(false);
                                setSerialValidated(false);
                                setSerialNumber('');
                                setCurrentCustomerInfo(null);
                                setCurrentProductInfo(null);
                                setActionType('');
                                setErrors({});
                              }}
                              disabled={!serialNumber || serialNumber.toUpperCase() !== "SER12345"}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              New
                            </Button>
                          )}
                          
                          {/* Renew Button - Visible on all tabs except RDP */}
                          {formData.productType !== 'RDP' && (
                            <Button 
                              type="button"
                              onClick={validateSerialNumberForRenewal}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                              disabled={!serialNumber || fetchingSerialDetails || serialValidated}
                            >
                              {fetchingSerialDetails && actionType === 'renew' ? (
                                <>
                                  <div className="loading-spinner mr-2"></div>
                                  Fetching...
                                </>
                              ) : (serialValidated && actionType === 'renew') ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Validated
                                </>
                              ) : (
                                'Renew'
                              )}
                            </Button>
                          )}
                          
                          {/* Upgrade Button - Visible on Desktop, Mandi, Online, Recom tabs */}
                          {['Desktop', 'Mandi', 'Online', 'Recom'].includes(formData.productType) && (
                            <Button 
                              type="button"
                              onClick={validateSerialNumberForUpgrade}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                              disabled={!serialNumber || fetchingSerialDetails || serialValidated}
                            >
                              {fetchingSerialDetails && actionType === 'upgrade' ? (
                                <>
                                  <div className="loading-spinner mr-2"></div>
                                  Fetching...
                                </>
                              ) : (serialValidated && actionType === 'upgrade') ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Validated
                                </>
                              ) : (
                                'Upgrade'
                              )}
                            </Button>
                          )}
                          
                          {/* Add/Reduce Count Button - Visible only on Desktop and Mandi tabs */}
                          {['Desktop', 'Mandi'].includes(formData.productType) && (
                            <Button 
                              type="button"
                              onClick={async () => {
                                console.log('Add/Reduce Count clicked');
                                // Validate serial number and set action type to 'addReduceCount'
                                if (!serialNumber || serialNumber.trim() === '') {
                                  setErrors(prev => ({ ...prev, serialNumber: 'Please enter a serial number' }));
                                  return;
                                }
                                
                                setFetchingSerialDetails(true);
                                setErrors(prev => ({ ...prev, serialNumber: '' }));
                                
                                try {
                                  // Simulate API call for validation
                                  await new Promise(resolve => setTimeout(resolve, 800));
                                  
                                  // Mock validation based on serial number
                                  const validSerials = {
                                    'DES12345': {
                                      customer: {
                                        name: 'Rajesh Kumar',
                                        mobile: '9876543210',
                                        email: 'rajesh.kumar@example.com',
                                        company: 'Kumar Enterprises',
                                        gstin: '27KUMAR123456Z',
                                        city: 'Mumbai'
                                      },
                                      product: {
                                        type: 'Desktop',
                                        planName: 'Standard - Multi User',
                                        status: 'Active',
                                        expiryDate: '2024-12-31',
                                        licenseModel: 'Subscription',
                                        currentCount: 10 // Current user/license count
                                      }
                                    },
                                    'MAN12345': {
                                      customer: {
                                        name: 'Suresh Patil',
                                        mobile: '9876543211',
                                        email: 'suresh.patil@example.com',
                                        company: 'Patil Traders',
                                        gstin: '27PATIL123456Z',
                                        city: 'Pune'
                                      },
                                      product: {
                                        type: 'Mandi',
                                        planName: 'Saffron - Multi User',
                                        status: 'Active',
                                        expiryDate: '2024-11-30',
                                        licenseModel: 'Subscription',
                                        currentCount: 5 // Current user/license count
                                      }
                                    }
                                  };
                                  
                                  const upperSerial = serialNumber.toUpperCase();
                                  const mockData = validSerials[upperSerial];
                                  
                                  if (mockData) {
                                    setCurrentCustomerInfo(mockData.customer);
                                    setCurrentProductInfo(mockData.product);
                                    setSerialValidated(true);
                                    setActionType('addReduceCount'); // Set action type to addReduceCount
                                    setErrors(prev => ({ ...prev, serialNumber: '' }));
                                  } else {
                                    setErrors(prev => ({ ...prev, serialNumber: 'Invalid serial number. Please try DES12345 or MAN12345 for testing.' }));
                                    setSerialValidated(false);
                                  }
                                } catch (error) {
                                  setErrors(prev => ({ ...prev, serialNumber: 'Failed to validate serial number. Please try again.' }));
                                  setSerialValidated(false);
                                } finally {
                                  setFetchingSerialDetails(false);
                                }
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
                              disabled={!serialNumber || fetchingSerialDetails}
                            >
                              Add/Reduce Count
                            </Button>
                          )}
                          
                          {/* Upgrade to Online Button - Visible only on Desktop and Mandi tabs */}
                          {['Desktop', 'Mandi'].includes(formData.productType) && (
                            <Button 
                              type="button"
                              onClick={async () => {
                                console.log('Upgrade to Online clicked');
                                // Validate serial number and set action type to 'upgradeToOnline'
                                if (!serialNumber || serialNumber.trim() === '') {
                                  setErrors(prev => ({ ...prev, serialNumber: 'Please enter a serial number' }));
                                  return;
                                }
                                
                                setFetchingSerialDetails(true);
                                setErrors(prev => ({ ...prev, serialNumber: '' }));
                                
                                try {
                                  // Simulate API call for validation
                                  await new Promise(resolve => setTimeout(resolve, 800));
                                  
                                  // Mock validation based on serial number
                                  const validSerials = {
                                    'DES12345': {
                                      customer: {
                                        name: 'Rajesh Kumar',
                                        mobile: '9876543210',
                                        email: 'rajesh.kumar@example.com',
                                        company: 'Kumar Enterprises',
                                        gstin: '27KUMAR123456Z',
                                        city: 'Mumbai'
                                      },
                                      product: {
                                        type: 'Desktop',
                                        planName: 'Standard - Multi User',
                                        status: 'Active',
                                        expiryDate: '2024-12-31',
                                        licenseModel: 'Subscription'
                                      }
                                    },
                                    'MAN12345': {
                                      customer: {
                                        name: 'Suresh Patil',
                                        mobile: '9876543211',
                                        email: 'suresh.patil@example.com',
                                        company: 'Patil Traders',
                                        gstin: '27PATIL123456Z',
                                        city: 'Pune'
                                      },
                                      product: {
                                        type: 'Mandi',
                                        planName: 'Saffron - Multi User',
                                        status: 'Active',
                                        expiryDate: '2024-11-30',
                                        licenseModel: 'Subscription'
                                      }
                                    }
                                  };
                                  
                                  const upperSerial = serialNumber.toUpperCase();
                                  const mockData = validSerials[upperSerial];
                                  
                                  if (mockData) {
                                    setCurrentCustomerInfo(mockData.customer);
                                    setCurrentProductInfo(mockData.product);
                                    setSerialValidated(true);
                                    setActionType('upgradeToOnline'); // Set action type to upgradeToOnline
                                    setErrors(prev => ({ ...prev, serialNumber: '' }));
                                  } else {
                                    setErrors(prev => ({ ...prev, serialNumber: 'Invalid serial number. Please try DES12345 or MAN12345 for testing.' }));
                                    setSerialValidated(false);
                                  }
                                } catch (error) {
                                  setErrors(prev => ({ ...prev, serialNumber: 'Failed to validate serial number. Please try again.' }));
                                  setSerialValidated(false);
                                } finally {
                                  setFetchingSerialDetails(false);
                                }
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
                              disabled={!serialNumber || fetchingSerialDetails}
                            >
                              Upgrade to Online
                            </Button>
                          )}
                          
                          {/* Reset button hidden as per requirement */}
                        </div>
                      </div>
                      
                      {errors.serialNumber && (
                        <p className="text-red-500 text-sm mt-2">{errors.serialNumber}</p>
                      )}
                      
                      <p className="text-sm text-blue-700 mt-2">
                        Enter the serial number to fetch customer and current product details for renewal or upgrade.
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        💡 <strong>Testing IDs:</strong> 
                        <code className="bg-gray-100 px-1 rounded ml-1">DES12345</code> (Desktop),
                        <code className="bg-gray-100 px-1 rounded ml-1">MAN12345</code> (Mandi),
                        <code className="bg-gray-100 px-1 rounded ml-1">ONL12345</code> (Online),
                        <code className="bg-gray-100 px-1 rounded ml-1">APP12345</code> (App),
                        <code className="bg-gray-100 px-1 rounded ml-1">REC12345</code> (Recom),
                        <code className="bg-gray-100 px-1 rounded ml-1">RDP12345</code> (RDP)
                      </p>
                    </div>

                    {/* Step 2: Customer & Product Details (Show after successful validation) - Accordion */}
                    {serialValidated && actionType === 'renew' && currentCustomerInfo && currentProductInfo && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        
                        {/* Accordion Header - Always Visible */}
                        <div 
                          className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
                            isRenewalCustomerDetailsOpen ? 'bg-green-50 border-b border-gray-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (customerValidated) {
                              setIsRenewalCustomerDetailsOpen(!isRenewalCustomerDetailsOpen);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <CardTitle className="text-green-600 flex items-center text-lg">
                              Customer Details 
                              <span className="mx-3 text-gray-400">|</span>
                              <span className="text-gray-700 font-normal text-base">
                                {currentCustomerInfo.mobile ? 
                                  `${currentCustomerInfo.mobile.substring(0, 3)}XXXX${currentCustomerInfo.mobile.substring(currentCustomerInfo.mobile.length - 3)}` 
                                  : 'No Mobile'}
                              </span>
                            </CardTitle>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.type}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">
                                {currentProductInfo.licenseModel === 'Perpetual' ? 'PERP M' : currentProductInfo.licenseModel}
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.planName}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">Valid Till: {currentProductInfo.expiryDate}</span>
                            </div>
                            <div className={`px-4 py-2 border rounded-xl ${
                              currentProductInfo.status === 'Active' 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-gray-300'
                            }`}>
                              <span className={`text-sm font-medium ${
                                currentProductInfo.status === 'Active' 
                                  ? 'text-green-700' 
                                  : 'text-gray-800'
                              }`}>{currentProductInfo.status}</span>
                            </div>
                            {customerValidated && (
                              <button
                                type="button"
                                className="text-gray-600 hover:text-gray-900 ml-2"
                              >
                                {isRenewalCustomerDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Accordion Content - Collapsible */}
                        {isRenewalCustomerDetailsOpen && (
                          <div className="p-6 bg-white">
                            <div className="grid grid-cols-4 gap-6">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Name</Label>
                                <Input
                                  value={currentCustomerInfo.name}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, name: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Company</Label>
                                <Input
                                  value={currentCustomerInfo.company}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, company: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">GSTIN</Label>
                                <Input
                                  value={currentCustomerInfo.gstin}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, gstin: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">City</Label>
                                <Input
                                  value={currentCustomerInfo.city}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, city: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-6">
                              <Button
                                type="button"
                                onClick={() => {
                                  // Set customer validated to true to trigger next sections
                                  setCustomerValidated(true);
                                  // Collapse the accordion
                                  setIsRenewalCustomerDetailsOpen(false);
                                  // Set product type from current product info
                                  setFormData(prev => ({
                                    ...prev,
                                    productType: currentProductInfo?.type || "Desktop"
                                  }));
                                  // Auto-scroll to next section
                                  setTimeout(() => {
                                    const nextSection = document.getElementById('product-selection-section');
                                    if (nextSection) {
                                      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }, 100);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg"
                              >
                                Save and Continue
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2b: Customer & Product Details (Show after Upgrade button validation) - Accordion */}
                    {serialValidated && actionType === 'upgrade' && currentCustomerInfo && currentProductInfo && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        
                        {/* Accordion Header - Always Visible */}
                        <div 
                          className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
                            isUpgradeCustomerDetailsOpen ? 'bg-blue-50 border-b border-gray-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (customerValidated) {
                              setIsUpgradeCustomerDetailsOpen(!isUpgradeCustomerDetailsOpen);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <CardTitle className="text-blue-600 flex items-center text-lg">
                              Customer Details 
                              <span className="mx-3 text-gray-400">|</span>
                              <span className="text-gray-700 font-normal text-base">
                                {currentCustomerInfo.mobile ? 
                                  `${currentCustomerInfo.mobile.substring(0, 3)}XXXX${currentCustomerInfo.mobile.substring(currentCustomerInfo.mobile.length - 3)}` 
                                  : 'No Mobile'}
                              </span>
                            </CardTitle>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.type}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">
                                {currentProductInfo.licenseModel === 'Perpetual' ? 'PERP M' : currentProductInfo.licenseModel}
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.planName}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">Valid Till: {currentProductInfo.expiryDate}</span>
                            </div>
                            <div className={`px-4 py-2 border rounded-xl ${
                              currentProductInfo.status === 'Active' 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-gray-300'
                            }`}>
                              <span className={`text-sm font-medium ${
                                currentProductInfo.status === 'Active' 
                                  ? 'text-green-700' 
                                  : 'text-gray-800'
                              }`}>{currentProductInfo.status}</span>
                            </div>
                            {customerValidated && (
                              <button
                                type="button"
                                className="text-gray-600 hover:text-gray-900 ml-2"
                              >
                                {isUpgradeCustomerDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Accordion Content - Collapsible */}
                        {isUpgradeCustomerDetailsOpen && (
                          <div className="p-6 bg-white">
                            <div className="grid grid-cols-4 gap-6">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Name</Label>
                                <Input
                                  value={currentCustomerInfo.name}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, name: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Company</Label>
                                <Input
                                  value={currentCustomerInfo.company}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, company: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">GSTIN</Label>
                                <Input
                                  value={currentCustomerInfo.gstin}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, gstin: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">City</Label>
                                <Input
                                  value={currentCustomerInfo.city}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, city: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-6">
                              <Button
                                type="button"
                                onClick={() => {
                                  // Set customer validated to true to trigger next sections for UPGRADE
                                  setCustomerValidated(true);
                                  // Collapse the accordion
                                  setIsUpgradeCustomerDetailsOpen(false);
                                  // Set product type from current product info
                                  setFormData(prev => ({
                                    ...prev,
                                    productType: currentProductInfo?.type || "Desktop"
                                  }));
                                  // Auto-scroll to upgrade product selection section
                                  setTimeout(() => {
                                    const nextSection = document.getElementById('upgrade-product-selection-section');
                                    if (nextSection) {
                                      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }, 100);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg"
                              >
                                Save and Continue
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2c: Customer & Product Details for Upgrade to Online (Show after Upgrade to Online button validation) - Accordion */}
                    {serialValidated && actionType === 'upgradeToOnline' && currentCustomerInfo && currentProductInfo && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        
                        {/* Accordion Header - Always Visible */}
                        <div 
                          className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
                            isUpgradeToOnlineCustomerDetailsOpen ? 'bg-orange-50 border-b border-gray-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (customerValidated) {
                              setIsUpgradeToOnlineCustomerDetailsOpen(!isUpgradeToOnlineCustomerDetailsOpen);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <CardTitle className="text-orange-600 flex items-center text-lg">
                              Customer Details 
                              <span className="mx-3 text-gray-400">|</span>
                              <span className="text-gray-700 font-normal text-base">
                                {currentCustomerInfo.mobile ? 
                                  `${currentCustomerInfo.mobile.substring(0, 3)}XXXX${currentCustomerInfo.mobile.substring(currentCustomerInfo.mobile.length - 3)}` 
                                  : 'No Mobile'}
                              </span>
                            </CardTitle>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.type}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">
                                {currentProductInfo.licenseModel === 'Perpetual' ? 'PERP M' : currentProductInfo.licenseModel}
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.planName}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">Valid Till: {currentProductInfo.expiryDate}</span>
                            </div>
                            <div className={`px-4 py-2 border rounded-xl ${
                              currentProductInfo.status === 'Active' 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-gray-300'
                            }`}>
                              <span className={`text-sm font-medium ${
                                currentProductInfo.status === 'Active' 
                                  ? 'text-green-700' 
                                  : 'text-gray-800'
                              }`}>{currentProductInfo.status}</span>
                            </div>
                            {customerValidated && (
                              <button
                                type="button"
                                className="text-gray-600 hover:text-gray-900 ml-2"
                              >
                                {isUpgradeToOnlineCustomerDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Accordion Content - Collapsible */}
                        {isUpgradeToOnlineCustomerDetailsOpen && (
                          <div className="p-6 bg-white">
                            <div className="grid grid-cols-4 gap-6">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Name</Label>
                                <Input
                                  value={currentCustomerInfo.name}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, name: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Company</Label>
                                <Input
                                  value={currentCustomerInfo.company}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, company: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">GSTIN</Label>
                                <Input
                                  value={currentCustomerInfo.gstin}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, gstin: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">City</Label>
                                <Input
                                  value={currentCustomerInfo.city}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, city: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-6">
                              <Button
                                type="button"
                                onClick={() => {
                                  // Set customer validated to true to trigger next sections for UPGRADE TO ONLINE
                                  setCustomerValidated(true);
                                  // Collapse the accordion
                                  setIsUpgradeToOnlineCustomerDetailsOpen(false);
                                  // Keep product type as Desktop/Mandi - DO NOT change to Online to keep tab active
                                  // The actionType 'upgradeToOnline' will control the flow
                                  // Auto-scroll to online configuration section
                                  setTimeout(() => {
                                    const nextSection = document.getElementById('upgrade-to-online-config-section');
                                    if (nextSection) {
                                      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }, 100);
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2 rounded-lg"
                              >
                                Save and Continue
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upgrade to Online Configuration - Same as Online New Flow */}
                    {serialValidated && customerValidated && actionType === 'upgradeToOnline' && (
                      <div id="upgrade-to-online-config-section" className="space-y-4 mt-6">
                        {/* All fields in single row */}
                        <div className="flex items-center space-x-6">
                          {/* User Count (Mandatory) - Add/Reduce control */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">User Count:</Label>
                            <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onlineUserCount > 1) {
                                    const newCount = onlineUserCount - 1;
                                    setOnlineUserCount(newCount);
                                    // Auto-update company count to match user count
                                    setOnlineCompanyCount(newCount);
                                  }
                                }}
                                className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                {onlineUserCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCount = onlineUserCount + 1;
                                  setOnlineUserCount(newCount);
                                  // Auto-update company count to match user count
                                  setOnlineCompanyCount(newCount);
                                }}
                                className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Company Count (Mandatory) - Add/Reduce control prefilled with User Count */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Company Count:</Label>
                            <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onlineCompanyCount > 1) {
                                    setOnlineCompanyCount(onlineCompanyCount - 1);
                                  }
                                }}
                                className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                {onlineCompanyCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setOnlineCompanyCount(onlineCompanyCount + 1);
                                }}
                                className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Database Type - Radio buttons */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Database Type:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "Access", label: "Access" },
                                { value: "Client Server", label: "Client Server" }
                              ].map((dbType) => (
                                <label key={dbType.value} className={`flex items-center cursor-pointer px-3 py-2 border-0 rounded-lg hover:shadow-md transition-all ${
                                  onlineDatabaseType === dbType.value
                                    ? "bg-blue-50" 
                                    : "bg-gray-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="upgradeToOnlineDatabaseType"
                                    value={dbType.value}
                                    checked={onlineDatabaseType === dbType.value}
                                    onChange={(e) => {
                                      setOnlineDatabaseType(e.target.value);
                                      // Set planName to trigger order summary
                                      setFormData(prev => ({ ...prev, planName: `Online ${e.target.value}` }));
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-2"
                                  />
                                  <span className="text-gray-700 font-medium text-sm whitespace-nowrap">{dbType.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Duration Selection for Online - Same as Desktop */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "360", label: "360 Days" },
                                { value: "1080", label: "1080 Days" }
                              ].map((duration) => (
                                <label key={duration.value} className={`flex items-center cursor-pointer px-2 py-1.5 border-0 rounded-lg hover:shadow-md transition-all ${
                                  formData.duration === duration.value
                                    ? "bg-orange-50" 
                                    : "bg-gray-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="upgradeToOnlineDuration"
                                    value={duration.value}
                                    checked={formData.duration === duration.value}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        duration: e.target.value
                                      }));
                                    }}
                                    className="w-3.5 h-3.5 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-xs whitespace-nowrap">{duration.label}</span>
                                    {duration.value === "1080" && (
                                      <span className="text-[10px] text-green-600 font-semibold">
                                        20% OFF
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Upgrade to Online - Show when all fields are filled */}
                    {serialValidated && customerValidated && actionType === 'upgradeToOnline' && onlineDatabaseType && formData.duration && (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200 mt-6">
                        <h4 id="upgrade-to-online-order-summary-section" className="text-xl font-bold text-orange-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Details</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  const userRate = 10000;
                                  const companyRate = 2000;
                                  const durationMultiplier = formData.duration === "1080" ? 3 : 1;
                                  const baseTotal = (onlineUserCount * userRate + onlineCompanyCount * companyRate) * durationMultiplier;
                                  const discountAmount = formData.duration === "1080" ? Math.round(baseTotal * 0.20) : 0;
                                  const finalRate = baseTotal - discountAmount;

                                  const productName = `Online - ${onlineDatabaseType}`;
                                  const details = `User: ${onlineUserCount}, Company: ${onlineCompanyCount}`;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        <div>{productName}</div>
                                        <div className="text-xs text-gray-600">{details}</div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {formData.duration} Days
                                        {formData.duration === "1080" && (
                                          <div className="text-[10px] text-green-600 font-semibold">20% OFF</div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        <div className="text-xs">₹{userRate.toLocaleString('en-IN')} × {onlineUserCount}</div>
                                        <div className="text-xs">₹{companyRate.toLocaleString('en-IN')} × {onlineCompanyCount}</div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        {formData.duration === "1080" && discountAmount > 0 ? (
                                          <div>
                                            <div className="line-through text-gray-500">₹{baseTotal.toLocaleString('en-IN')}</div>
                                            <div className="text-green-600">₹{finalRate.toLocaleString('en-IN')}</div>
                                          </div>
                                        ) : (
                                          `₹${finalRate.toLocaleString('en-IN')}`
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                        ₹{finalRate.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              const userRate = 10000;
                              const companyRate = 2000;
                              const durationMultiplier = formData.duration === "1080" ? 3 : 1;
                              const baseTotal = (onlineUserCount * userRate + onlineCompanyCount * companyRate) * durationMultiplier;
                              const discountAmount = formData.duration === "1080" ? Math.round(baseTotal * 0.20) : 0;
                              const afterDiscount = baseTotal - discountAmount;
                              
                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.10) : 0;
                              const afterTds = afterDiscount - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{afterDiscount.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-lg font-bold text-orange-900">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              Send Payment Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2d: Customer & Product Details for Add/Reduce Count (Show after Add/Reduce Count button validation) - Accordion */}
                    {serialValidated && actionType === 'addReduceCount' && currentCustomerInfo && currentProductInfo && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        
                        {/* Accordion Header - Always Visible */}
                        <div 
                          className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
                            isAddReduceCountCustomerDetailsOpen ? 'bg-purple-50 border-b border-gray-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (customerValidated) {
                              setIsAddReduceCountCustomerDetailsOpen(!isAddReduceCountCustomerDetailsOpen);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <CardTitle className="text-purple-600 flex items-center text-lg">
                              Customer Details 
                              <span className="mx-3 text-gray-400">|</span>
                              <span className="text-gray-700 font-normal text-base">
                                {currentCustomerInfo.mobile ? 
                                  `${currentCustomerInfo.mobile.substring(0, 3)}XXXX${currentCustomerInfo.mobile.substring(currentCustomerInfo.mobile.length - 3)}` 
                                  : 'No Mobile'}
                              </span>
                            </CardTitle>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.type}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">
                                {currentProductInfo.licenseModel === 'Perpetual' ? 'PERP M' : currentProductInfo.licenseModel}
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">{currentProductInfo.planName}</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-xl">
                              <span className="text-sm font-medium text-gray-800">Valid Till: {currentProductInfo.expiryDate}</span>
                            </div>
                            <div className={`px-4 py-2 border rounded-xl ${
                              currentProductInfo.status === 'Active' 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-white border-gray-300'
                            }`}>
                              <span className={`text-sm font-medium ${
                                currentProductInfo.status === 'Active' 
                                  ? 'text-green-700' 
                                  : 'text-gray-800'
                              }`}>{currentProductInfo.status}</span>
                            </div>
                            {customerValidated && (
                              <button
                                type="button"
                                className="text-gray-600 hover:text-gray-900 ml-2"
                              >
                                {isAddReduceCountCustomerDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Accordion Content - Collapsible */}
                        {isAddReduceCountCustomerDetailsOpen && (
                          <div className="p-6 bg-white">
                            <div className="grid grid-cols-4 gap-6">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Name</Label>
                                <Input
                                  value={currentCustomerInfo.name}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, name: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">Company</Label>
                                <Input
                                  value={currentCustomerInfo.company}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, company: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">GSTIN</Label>
                                <Input
                                  value={currentCustomerInfo.gstin}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, gstin: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1">City</Label>
                                <Input
                                  value={currentCustomerInfo.city}
                                  onChange={(e) => setCurrentCustomerInfo({...currentCustomerInfo, city: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-6">
                              <Button
                                type="button"
                                onClick={() => {
                                  // Set customer validated to true to trigger next sections for ADD/REDUCE COUNT
                                  setCustomerValidated(true);
                                  // Collapse the accordion
                                  setIsAddReduceCountCustomerDetailsOpen(false);
                                  // Auto-scroll to count configuration section
                                  setTimeout(() => {
                                    const nextSection = document.getElementById('add-reduce-count-config-section');
                                    if (nextSection) {
                                      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }, 100);
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-lg"
                              >
                                Save and Continue
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add/Reduce Count Configuration - Show after customer validation */}
                    {serialValidated && customerValidated && actionType === 'addReduceCount' && currentProductInfo && (
                      <div id="add-reduce-count-config-section" className="space-y-4 mt-6">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-8">
                            {/* Current Count - Non-editable */}
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium whitespace-nowrap">Current Count:</Label>
                              <Input
                                type="number"
                                value={currentProductInfo.currentCount || 0}
                                disabled
                                className="w-24 bg-gray-100 text-gray-700 font-semibold"
                              />
                            </div>

                            {/* Add / Reduce Count - Editable */}
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium whitespace-nowrap">Add / Reduce Count:</Label>
                              <Input
                                type="number"
                                value={addReduceCountValue}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setAddReduceCountValue(value);
                                  // Trigger order summary if there's any change
                                  if (value !== 0) {
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      planName: `${currentProductInfo.planName} - Count Adjustment` // Set planName to trigger order summary
                                    }));
                                  }
                                }}
                                placeholder="Enter +/- count"
                                className="w-32"
                              />
                              <span className="text-xs text-gray-500">(Use +/- for add/reduce)</span>
                            </div>

                            {/* Total Count - Label, Auto-calculated */}
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium whitespace-nowrap">Total Count:</Label>
                              <div className="px-4 py-2 bg-white border-2 border-purple-300 rounded-lg">
                                <span className="text-lg font-bold text-purple-900">
                                  {(currentProductInfo.currentCount || 0) + addReduceCountValue}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Add/Reduce Count - Show when count is changed */}
                    {serialValidated && customerValidated && actionType === 'addReduceCount' && addReduceCountValue !== 0 && currentProductInfo && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200 mt-6">
                        <h4 id="add-reduce-count-order-summary-section" className="text-xl font-bold text-purple-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Current Count</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Change</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">New Count</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate per Unit</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  // Sample rate per unit (this should come from pricing logic)
                                  const ratePerUnit = 5000;
                                  const changeAmount = Math.abs(addReduceCountValue) * ratePerUnit;
                                  const finalAmount = addReduceCountValue > 0 ? changeAmount : -changeAmount;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        <div>{currentProductInfo.planName}</div>
                                        <div className="text-xs text-gray-600">
                                          {addReduceCountValue > 0 ? 'Add License' : 'Reduce License'}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {currentProductInfo.currentCount || 0}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center font-medium">
                                        <span className={addReduceCountValue > 0 ? 'text-green-600' : 'text-red-600'}>
                                          {addReduceCountValue > 0 ? '+' : ''}{addReduceCountValue}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center font-medium text-purple-900">
                                        {(currentProductInfo.currentCount || 0) + addReduceCountValue}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        ₹{ratePerUnit.toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                        {addReduceCountValue > 0 ? '+' : '-'}₹{Math.abs(finalAmount).toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              const ratePerUnit = 5000;
                              const changeAmount = Math.abs(addReduceCountValue) * ratePerUnit;
                              const baseTotal = addReduceCountValue > 0 ? changeAmount : changeAmount; // Always positive for calculation
                              
                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(baseTotal * 0.10) : 0;
                              const afterTds = baseTotal - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;
                              
                              // If reducing, make it negative
                              const displayAmount = addReduceCountValue > 0 ? finalAmount : -finalAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">
                                        {addReduceCountValue > 0 ? 'Additional Charge:' : 'Credit Amount:'}
                                      </span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {addReduceCountValue > 0 ? '+' : '-'}₹{baseTotal.toLocaleString('en-IN')}
                                      </span>
                                    </div>

                                    {/* TDS Toggle */}
                                    {addReduceCountValue > 0 && (
                                      <div className="flex justify-between items-center border-t pt-2">
                                        <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={formData.deductTds}
                                            onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                            className="sr-only peer"
                                          />
                                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                          <span className="ml-2 text-xs font-medium text-gray-700">
                                            {formData.deductTds ? 'ON' : 'OFF'}
                                          </span>
                                        </label>
                                      </div>
                                    )}

                                    {formData.deductTds && addReduceCountValue > 0 && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    {addReduceCountValue > 0 && (
                                      <div className="flex justify-between items-center border-t pt-2">
                                        <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                        <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">
                                        {addReduceCountValue > 0 ? 'Grand Total:' : 'Credit Amount:'}
                                      </span>
                                      <span className={`text-lg font-bold ${addReduceCountValue > 0 ? 'text-purple-900' : 'text-red-600'}`}>
                                        {addReduceCountValue > 0 ? '+' : '-'}₹{Math.abs(displayAmount).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              {addReduceCountValue > 0 ? 'Send Payment Link' : 'Process Credit'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Debug logging for troubleshooting */}
                    {console.log('Renewal Debug:', {
                      transactionType: formData.transactionType,
                      serialValidated,
                      customerValidated,
                      shouldShowDuration: formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated
                    })}

                    {/* Product & Plan Selection - Show after customer validation in Renewal flow ONLY */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && (
                      <div className="space-y-6">
                        
                        {/* Desktop Product: Show Duration Selection */}
                        {formData.productType === "Desktop" && (
                          <div id="product-selection-section" className="flex items-center space-x-6">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-3">
                              {["360", "180", "90"].map((duration) => (
                                <label key={duration} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all ${
                                  formData.duration === duration 
                                    ? "border-blue-500 bg-blue-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="duration"
                                    value={duration}
                                    checked={formData.duration === duration}
                                    onChange={(e) => {
                                      setFormData(prev => ({ ...prev, duration: e.target.value }));
                                      // Auto-select first plan (same plan) when duration is selected
                                      setTimeout(() => {
                                        const plans = getDesktopPlans("Subscription", e.target.value);
                                        if (plans && plans.length > 0) {
                                          const firstPlan = plans[0];
                                          setFormData(prev => ({ ...prev, planName: firstPlan.name }));
                                          setPlanQuantities({ [firstPlan.name]: 1 });
                                          // Auto-scroll to order summary
                                          setTimeout(() => {
                                            const orderSummary = document.getElementById('order-summary-section');
                                            if (orderSummary) {
                                              orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                          }, 300);
                                        }
                                      }, 100);
                                    }}
                                    className="w-4 h-4 text-blue-600 mr-3"
                                  />
                                  <span className="text-gray-700 font-medium">{duration} Days</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Online Product: Show Online-specific configuration */}
                        {formData.productType === "Online" && (
                          <div id="product-selection-section" className="space-y-4">
                            {/* All fields in single row - without Database Type */}
                            <div className="flex items-center space-x-6">
                              {/* User Count (Mandatory) - Add/Reduce control with minimum enforcement */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium whitespace-nowrap">User Count:</Label>
                                <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Can only reduce if above minimum (original subscription count)
                                      if (onlineUserCount > onlineMinUserCount) {
                                        const newCount = onlineUserCount - 1;
                                        setOnlineUserCount(newCount);
                                        // Auto-update company count to match user count if not below company minimum
                                        if (newCount >= onlineMinCompanyCount) {
                                          setOnlineCompanyCount(newCount);
                                        }
                                      }
                                    }}
                                    disabled={onlineUserCount <= onlineMinUserCount}
                                    className={`font-bold text-lg w-6 h-6 flex items-center justify-center ${
                                      onlineUserCount <= onlineMinUserCount 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-red-600'
                                    }`}
                                  >
                                    -
                                  </button>
                                  <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                    {onlineUserCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCount = onlineUserCount + 1;
                                      setOnlineUserCount(newCount);
                                      // Auto-update company count to match user count
                                      setOnlineCompanyCount(newCount);
                                    }}
                                    className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500">(Min: {onlineMinUserCount})</span>
                              </div>

                              {/* Company Count (Mandatory) - Add/Reduce control with minimum enforcement */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium whitespace-nowrap">Company Count:</Label>
                                <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Can only reduce if above minimum (original subscription count)
                                      if (onlineCompanyCount > onlineMinCompanyCount) {
                                        setOnlineCompanyCount(onlineCompanyCount - 1);
                                      }
                                    }}
                                    disabled={onlineCompanyCount <= onlineMinCompanyCount}
                                    className={`font-bold text-lg w-6 h-6 flex items-center justify-center ${
                                      onlineCompanyCount <= onlineMinCompanyCount 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-red-600'
                                    }`}
                                  >
                                    -
                                  </button>
                                  <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                    {onlineCompanyCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOnlineCompanyCount(onlineCompanyCount + 1);
                                    }}
                                    className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500">(Min: {onlineMinCompanyCount})</span>
                              </div>

                              {/* Database Type - REMOVED from renewal flow */}

                              {/* Duration Selection for Online */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                                <div className="flex space-x-2">
                                  {[
                                    { value: "360", label: "360 Days" },
                                    { value: "1080", label: "1080 Days" }
                                  ].map((duration) => (
                                    <label key={duration.value} className={`flex items-center cursor-pointer px-2 py-1.5 border-0 rounded-lg hover:shadow-md transition-all ${
                                      formData.duration === duration.value
                                        ? "bg-orange-50" 
                                        : "bg-gray-50"
                                    }`}>
                                      <input
                                        type="radio"
                                        name="onlineDuration"
                                        value={duration.value}
                                        checked={formData.duration === duration.value}
                                        onChange={(e) => {
                                          setFormData(prev => ({ 
                                            ...prev, 
                                            duration: e.target.value,
                                            planName: "Online Renewal" // Set planName to trigger order summary
                                          }));
                                          // Auto-scroll to order summary
                                          setTimeout(() => {
                                            const orderSummary = document.getElementById('order-summary-section');
                                            if (orderSummary) {
                                              orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                          }, 300);
                                        }}
                                        className="w-3.5 h-3.5 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-gray-700 font-medium text-xs whitespace-nowrap">{duration.label}</span>
                                        {duration.value === "1080" && (
                                          <span className="text-[10px] text-green-600 font-semibold">
                                            20% OFF
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* App Product: Show only Duration selection */}
                        {formData.productType === "App" && (
                          <div id="product-selection-section" className="flex items-center space-x-6">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-3">
                              {["360", "180", "90"].map((duration) => (
                                <label key={duration} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all ${
                                  formData.duration === duration 
                                    ? "border-blue-500 bg-blue-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="appDuration"
                                    value={duration}
                                    checked={formData.duration === duration}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        duration: e.target.value,
                                        planName: "App Renewal" // Set planName to trigger order summary
                                      }));
                                      // Auto-scroll to order summary
                                      setTimeout(() => {
                                        const orderSummary = document.getElementById('order-summary-section');
                                        if (orderSummary) {
                                          orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 300);
                                    }}
                                    className="w-4 h-4 text-blue-600 mr-3"
                                  />
                                  <span className="text-gray-700 font-medium">{duration} Days</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skip plan selection - it's now auto-selected */}
                      </div>
                    )}

                    {/* NEW SECTION: App Details Summary Before Order Summary - Only for App Product */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && formData.productType === "App" && formData.duration && currentCustomerInfo && (
                      <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6 mt-6">
                        {/* Informational Text */}
                        <div className="space-y-3">
                          <p className="text-blue-600 text-sm font-medium">
                            All selected apps will have their expiry date reset.
                          </p>
                          <p className="text-blue-600 text-sm font-medium">
                            Deselected apps will be marked as expired and their tenure will be adjusted in the selected apps being renewed.
                          </p>
                        </div>

                        {/* Summary Boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm mb-2">Advance Credit</p>
                            <p className="text-2xl font-bold text-gray-900">13500</p>
                          </div>
                          <div className="bg-gray-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm mb-2">
                              <input type="checkbox" className="mr-2" />
                              LP (host non commission discounts)
                            </p>
                            <p className="text-2xl font-bold text-gray-900">18000</p>
                          </div>
                        </div>

                        <p className="text-gray-600 text-xs">13500 (SUB)</p>

                        {/* Apps Details Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-600 text-white">
                                <th className="border border-gray-400 px-3 py-2 text-left">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4"
                                    defaultChecked={true}
                                  />
                                </th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">App ID</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">Type</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">Status</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">Last Used</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">Start Date</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">End Date</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">Remaining Validity (Days)</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">New End Date</th>
                                <th className="border border-gray-400 px-3 py-2 text-left text-sm">New Validity (Days)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                // Get mock apps data from APP12345
                                const appData = mockSerialData["APP12345"];
                                const apps = appData?.currentApps || [];
                                
                                return apps.map((app) => {
                                  // Calculate remaining validity
                                  const endDate = new Date(app.expiryDate.split('-').reverse().join('-')); // Convert DD-MMM-YY to proper date
                                  const today = new Date();
                                  const remainingDays = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
                                  
                                  // Calculate new end date based on selected validity
                                  const newEndDate = new Date();
                                  newEndDate.setDate(newEndDate.getDate() + parseInt(formData.duration));
                                  const formattedNewEndDate = newEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                                  
                                  return (
                                    <tr key={app.id} className="bg-white hover:bg-indigo-50">
                                      <td className="border border-gray-400 px-3 py-2">
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4"
                                          defaultChecked={true}
                                        />
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">{app.id}</td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">{app.type}</td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">
                                        <span className={app.status === 'Active' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                          {app.status}
                                        </span>
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">
                                        {app.lastUsed || '05-Sep-23'}
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">
                                        {app.startDate || '05-Sep-23'}
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">{app.expiryDate}</td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm text-center">{remainingDays >= 0 ? remainingDays : 396}</td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm">{formattedNewEndDate}</td>
                                      <td className="border border-gray-400 px-3 py-2 text-sm text-center">{formData.duration}</td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Online Renewal - Show when duration is selected */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && formData.productType === "Online" && formData.duration && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mt-6">
                        <h4 id="order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">User Count</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Company Count</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  // Calculate Online pricing
                                  const baseRate = 10000; // Base rate per user per year
                                  const userRate = baseRate * onlineUserCount;
                                  const companyRate = 2000 * onlineCompanyCount; // Additional charge per company
                                  const durationMultiplier = formData.duration === "1080" ? 3 : 1; // 3 years or 1 year
                                  const totalBasePrice = (userRate + companyRate) * durationMultiplier;
                                  
                                  // Apply 20% discount for 1080 days
                                  const discountedPrice = formData.duration === "1080" 
                                    ? Math.round(totalBasePrice * 0.8) 
                                    : totalBasePrice;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        Online Renewal
                                        <div className="text-xs text-gray-500">
                                          Users: {onlineUserCount}, Companies: {onlineCompanyCount}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {formData.duration} Days
                                        {formData.duration === "1080" && (
                                          <div className="text-xs text-green-600 font-semibold">20% OFF</div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">{onlineUserCount}</td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">{onlineCompanyCount}</td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        {formData.duration === "1080" && totalBasePrice !== discountedPrice && (
                                          <div className="text-xs text-gray-400 line-through">₹{totalBasePrice.toLocaleString('en-IN')}</div>
                                        )}
                                        <div>₹{discountedPrice.toLocaleString('en-IN')}</div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{discountedPrice.toLocaleString('en-IN')}</td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing
                              const baseRate = 10000;
                              const userRate = baseRate * onlineUserCount;
                              const companyRate = 2000 * onlineCompanyCount;
                              const durationMultiplier = formData.duration === "1080" ? 3 : 1;
                              const totalBasePrice = (userRate + companyRate) * durationMultiplier;
                              
                              // Apply 20% discount for 1080 days
                              const discountedPrice = formData.duration === "1080" 
                                ? Math.round(totalBasePrice * 0.8) 
                                : totalBasePrice;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(discountedPrice * 0.10) : 0;
                              const afterTds = discountedPrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{discountedPrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-lg font-bold text-blue-900">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              Send Payment Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for App Renewal - Show when duration is selected */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && formData.productType === "App" && formData.duration && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200 mt-6">
                        <h4 id="order-summary-section" className="text-xl font-bold text-purple-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  // Calculate App pricing based on duration
                                  const basePriceMap = {
                                    "360": 15000,
                                    "180": 8000,
                                    "90": 4500
                                  };
                                  const basePrice = basePriceMap[formData.duration] || 15000;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        {currentProductInfo?.planName || "App Renewal"}
                                        <div className="text-xs text-gray-500">
                                          Subscription Renewal
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {formData.duration} Days
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        ₹{basePrice.toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                        ₹{basePrice.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing
                              const basePriceMap = {
                                "360": 15000,
                                "180": 8000,
                                "90": 4500
                              };
                              const basePrice = basePriceMap[formData.duration] || 15000;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
                              const afterTds = basePrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-lg font-bold text-purple-900">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              Send Payment Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recom Renewal Configuration - Show when serial validated and customer validated */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && formData.productType === "Recom" && (
                      <div className="space-y-4">
                        {/* Market Place Selection */}
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium whitespace-nowrap">Market Place:</Label>
                          <div className="flex space-x-2">
                            {[
                              { value: "Single", label: "Single" },
                              { value: "Multiple", label: "Multiple" }
                            ].map((marketplace) => (
                              <label key={marketplace.value} className={`flex items-center cursor-pointer px-3 py-2 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                recomMarketPlace === marketplace.value
                                  ? "border-teal-500 bg-teal-50" 
                                  : "border-gray-200"
                              }`}>
                                <input
                                  type="radio"
                                  name="recomRenewalMarketPlace"
                                  value={marketplace.value}
                                  checked={recomMarketPlace === marketplace.value}
                                  onChange={(e) => {
                                    setRecomMarketPlace(e.target.value);
                                    setFormData(prev => ({ ...prev, planName: "" }));
                                  }}
                                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500 mr-2"
                                />
                                <span className="text-gray-700 font-medium text-sm">{marketplace.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Recom Plans Display - Based on Market Place Selection */}
                        {recomMarketPlace && (
                          <div data-scroll-target="recom-renewal-plans" className="space-y-2">
                            <Label className="text-sm font-medium">Number of Orders:</Label>
                        
                        {/* Single Market Place Plans */}
                        {recomMarketPlace === "Single" && (
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { name: "A", orders: "6,000", days: "360" },
                              { name: "B", orders: "12,000", days: "360" },
                              { name: "C", orders: "30,000", days: "360" },
                              { name: "D", orders: "60,000", days: "360" },
                              { name: "E", orders: "120,000", days: "360" }
                            ].map((plan) => {
                              const isSelected = formData.planName === `Recom ${plan.name}`;
                              const isCurrentPlan = currentProductInfo?.planName?.includes(plan.name);
                              return (
                                <div 
                                  key={plan.name}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}`, duration: plan.days }));
                                  }}
                                  className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-teal-500 bg-teal-50 shadow-md" 
                                      : isCurrentPlan
                                      ? "border-green-400 bg-green-50"
                                      : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                    {plan.name}
                                  </div>
                                  {isCurrentPlan && (
                                    <div className="absolute top-1 right-1">
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    </div>
                                  )}
                                  <div className="text-center mt-5">
                                    <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                    <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Multiple Market Place Plans */}
                        {recomMarketPlace === "Multiple" && (
                          <div className="space-y-2">
                            {/* First Row - 5 plans */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "A", orders: "300", days: "21" },
                                { name: "B", orders: "12,000", days: "360" },
                                { name: "C", orders: "30,000", days: "360" },
                                { name: "D", orders: "60,000", days: "360" },
                                { name: "E", orders: "120,000", days: "360" }
                              ].map((plan) => {
                                const isSelected = formData.planName === `Recom ${plan.name}`;
                                const isCurrentPlan = currentProductInfo?.planName?.includes(plan.name);
                                return (
                                  <div 
                                    key={plan.name}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}`, duration: plan.days }));
                                    }}
                                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-teal-500 bg-teal-50 shadow-md" 
                                        : isCurrentPlan
                                        ? "border-green-400 bg-green-50"
                                        : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                      {plan.name}
                                    </div>
                                    {isCurrentPlan && (
                                      <div className="absolute top-1 right-1">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      </div>
                                    )}
                                    <div className="text-center mt-5">
                                      <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                      <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Second Row - 1 plan (720 days) */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "H", orders: "12,000", days: "720" }
                              ].map((plan) => {
                                const isSelected = formData.planName === `Recom ${plan.name}`;
                                const isCurrentPlan = currentProductInfo?.planName?.includes(plan.name);
                                return (
                                  <div 
                                    key={plan.name}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}`, duration: plan.days }));
                                    }}
                                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-teal-500 bg-teal-50 shadow-md" 
                                        : isCurrentPlan
                                        ? "border-green-400 bg-green-50"
                                        : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                      {plan.name}
                                    </div>
                                    {isCurrentPlan && (
                                      <div className="absolute top-1 right-1">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      </div>
                                    )}
                                    <div className="text-center mt-5">
                                      <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                      <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                      </div>
                    )}

                    {/* Order Summary for Desktop Renewal - Show when plans are selected (Renewal flow ONLY) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && formData.productType === "Desktop" && formData.duration && Object.values(planQuantities).some(qty => qty > 0) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <h4 id="order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Quantity</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  const lineItems = [];
                                  let serialNo = 1;
                                  
                                  // Generate line items from planQuantities
                                  if (formData.duration) {
                                    const plans = getDesktopPlans("Subscription", formData.duration);
                                    plans.forEach(plan => {
                                      const quantity = planQuantities[plan.name] || 0;
                                      if (quantity > 0) {
                                        const rate = plan.price;
                                        const amount = rate * quantity;
                                        lineItems.push(
                                          <tr key={plan.name} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                            <td className="px-3 py-2 text-sm text-gray-900">{plan.name}</td>
                                            <td className="px-3 py-2 text-sm text-center text-gray-700">{formData.duration} Days</td>
                                            <td className="px-3 py-2 text-sm text-center text-gray-700">{quantity}</td>
                                            <td className="px-3 py-2 text-sm text-right text-gray-700">₹{rate.toLocaleString('en-IN')}</td>
                                            <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{amount.toLocaleString('en-IN')}</td>
                                          </tr>
                                        );
                                      }
                                    });
                                  }
                                  
                                  if (lineItems.length === 0) {
                                    return (
                                      <tr>
                                        <td colSpan="6" className="px-3 py-4 text-sm text-center text-gray-500 italic">
                                          Select plans and add quantities to see line items
                                        </td>
                                      </tr>
                                    );
                                  }
                                  
                                  return lineItems;
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing based on planQuantities
                              let totalBasePrice = 0;
                              
                              if (formData.duration) {
                                const plans = getDesktopPlans("Subscription", formData.duration);
                                plans.forEach(plan => {
                                  const quantity = planQuantities[plan.name] || 0;
                                  if (quantity > 0) {
                                    totalBasePrice += plan.price * quantity;
                                  }
                                });
                              }
                              
                              if (totalBasePrice === 0) return null;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
                              const afterTds = totalBasePrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{totalBasePrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {/* TDS Deduction */}
                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">TDS (10%):</span>
                                        <span className="text-sm font-semibold text-red-600">-₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    {/* GST */}
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-base font-bold text-blue-600">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Send Payment Link Button */}
                        <div className="flex justify-end mt-6">
                          <Button
                            type="button"
                            onClick={handleSendPaymentLink}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
                          >
                            Send Payment Link
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Recom Renewal - Show when plan is selected */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'renew' && formData.productType === "Recom" && formData.planName && recomMarketPlace && (
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200 mt-6">
                        <h4 id="recom-renewal-order-summary-section" className="text-xl font-bold text-teal-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Market Place</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  // Calculate Recom pricing based on plan
                                  const recomPricing = {
                                    "Recom A": { single: 4999, multiple: 299, duration: recomMarketPlace === "Single" ? "360" : "21" },
                                    "Recom B": { single: 7999, multiple: 9999, duration: "360" },
                                    "Recom C": { single: 15999, multiple: 19999, duration: "360" },
                                    "Recom D": { single: 29999, multiple: 39999, duration: "360" },
                                    "Recom E": { single: 59999, multiple: 79999, duration: "360" },
                                    "Recom H": { single: 0, multiple: 28799, duration: "720" } // 720 days only for multiple
                                  };
                                  
                                  const planPricing = recomPricing[formData.planName];
                                  const basePrice = recomMarketPlace === "Single" ? planPricing.single : planPricing.multiple;
                                  const duration = planPricing.duration;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        {formData.planName} - Renewal
                                        <div className="text-xs text-gray-500">
                                          {recomMarketPlace} Marketplace
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {recomMarketPlace}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {duration} Days
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        ₹{basePrice.toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                        ₹{basePrice.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing
                              const recomPricing = {
                                "Recom A": { single: 4999, multiple: 299, duration: recomMarketPlace === "Single" ? "360" : "21" },
                                "Recom B": { single: 7999, multiple: 9999, duration: "360" },
                                "Recom C": { single: 15999, multiple: 19999, duration: "360" },
                                "Recom D": { single: 29999, multiple: 39999, duration: "360" },
                                "Recom E": { single: 59999, multiple: 79999, duration: "360" },
                                "Recom H": { single: 0, multiple: 28799, duration: "720" }
                              };
                              
                              const planPricing = recomPricing[formData.planName];
                              const basePrice = recomMarketPlace === "Single" ? planPricing.single : planPricing.multiple;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
                              const afterTds = basePrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-lg font-bold text-teal-900">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              Send Payment Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desktop Upgrade Flow - Variant Selection (Desktop tab specific) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType === "Desktop" && (
                      <div className="space-y-6">
                        
                        {/* Variant Selection for Desktop Upgrade */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                          {/* Variant Radio Buttons - Desktop / Mandi */}
                          <div className="flex items-center space-x-6">
                            <Label className="text-sm font-medium whitespace-nowrap">Variant:</Label>
                            <div className="flex space-x-3">
                              {[
                                { value: "Desktop", label: "Desktop" },
                                { value: "Mandi", label: "Mandi" }
                              ].map((variant) => (
                                <label key={variant.value} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  formData.upgradeVariant === variant.value 
                                    ? "border-indigo-500 bg-indigo-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="upgradeVariant"
                                    value={variant.value}
                                    checked={formData.upgradeVariant === variant.value}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        upgradeVariant: e.target.value,
                                        planName: ""
                                      }));
                                      setPlanQuantities({}); // Reset quantities when variant changes
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-3"
                                  />
                                  <span className="text-gray-700 font-medium text-sm">{variant.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Plans Display - Directly after Variant Selection */}
                          {formData.upgradeVariant && (
                            <div className="space-y-2 mt-4">
                              <Label className="text-sm font-medium">Plans:</Label>
                              {(() => {
                                // Define static plan lists for Desktop and Mandi variants
                                let plansToShow = [];
                                
                                if (formData.upgradeVariant === "Desktop") {
                                  // Desktop variant: 16 plans
                                  plansToShow = [
                                    "Standard - Single User",
                                    "Standard - Multi User",
                                    "Standard - Client Server",
                                    "Saffron - Single User",
                                    "Saffron - Multi User",
                                    "Saffron - Client Server",
                                    "Basic - Single User",
                                    "Basic - Multi User",
                                    "Blue - Single User",
                                    "Blue - Multi User",
                                    "Enterprise - Single User",
                                    "Enterprise - Multi User",
                                    "Enterprise - Client Server",
                                    "Emerald - Single User",
                                    "Emerald - Multi User",
                                    "Emerald - Client Server"
                                  ];
                                } else if (formData.upgradeVariant === "Mandi") {
                                  // Mandi variant: 6 plans
                                  plansToShow = [
                                    "Saffron - Single User",
                                    "Saffron - Multi User",
                                    "Saffron - Client Server",
                                    "Emerald - Single User",
                                    "Emerald - Multi User",
                                    "Emerald - Client Server"
                                  ];
                                }
                                
                                // Filter out current active plan
                                const currentPlanName = currentProductInfo?.planName || "";
                                const filteredPlans = plansToShow.filter(planName => planName !== currentPlanName);
                                
                                return (
                                  <div className="grid grid-cols-4 gap-2">
                                    {filteredPlans.length > 0 ? filteredPlans.map((planName) => {
                                      const isSelected = formData.planName === planName;
                                      const price = 15000; // Placeholder
                                      
                                      return (
                                        <div 
                                          key={planName}
                                          onClick={() => {
                                            // Single click selects plan and sets quantity to 1
                                            setFormData(prev => ({ ...prev, planName: planName }));
                                            setPlanQuantities({ [planName]: 1 });
                                          }}
                                          className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                            isSelected
                                              ? "border-indigo-500 bg-indigo-50 shadow-md" 
                                              : "border-gray-200 hover:border-gray-300"
                                          }`}
                                        >
                                          <div className="text-xs font-medium text-gray-900 mb-1">
                                            {planName}
                                          </div>
                                          <div className="flex flex-col mb-1">
                                            <span className="text-xs font-bold text-indigo-600">
                                              ₹{price.toLocaleString('en-IN')}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }) : (
                                      <div className="col-span-4 text-center text-gray-500 text-sm py-4">
                                        No upgrade plans available
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mandi Upgrade Flow - Same as Desktop (Mandi tab specific) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType === "Mandi" && (
                      <div className="space-y-6">
                        
                        {/* Variant Selection for Mandi Upgrade */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                          {/* Variant and Duration Radio Buttons in Same Row */}
                          <div className="flex items-center space-x-8">
                            {/* Variant Selection */}
                            <div className="flex items-center space-x-3">
                              <Label className="text-sm font-medium whitespace-nowrap">Variant:</Label>
                              <div className="flex space-x-3">
                                {[
                                  { value: "Desktop", label: "Desktop" },
                                  { value: "Mandi", label: "Mandi" }
                                ].map((variant) => (
                                  <label key={variant.value} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                    formData.upgradeVariant === variant.value 
                                      ? "border-indigo-500 bg-indigo-50" 
                                      : "border-gray-200"
                                  }`}>
                                    <input
                                      type="radio"
                                      name="mandiUpgradeVariant"
                                      value={variant.value}
                                      checked={formData.upgradeVariant === variant.value}
                                      onChange={(e) => {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          upgradeVariant: e.target.value,
                                          duration: "", // Reset duration when variant changes
                                          planName: ""
                                        }));
                                        setPlanQuantities({}); // Reset quantities when variant changes
                                      }}
                                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-3"
                                    />
                                    <span className="text-gray-700 font-medium text-sm">{variant.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Duration Selection - Same Row */}
                            <div className="flex items-center space-x-3">
                              <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                              <div className="flex space-x-3">
                                {[
                                  { value: "360", label: "360 Days" },
                                  { value: "720", label: "720 Days" }
                                ].map((duration) => (
                                  <label key={duration.value} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                    formData.duration === duration.value 
                                      ? "border-orange-500 bg-orange-50" 
                                      : "border-gray-200"
                                  }`}>
                                    <input
                                      type="radio"
                                      name="mandiUpgradeDuration"
                                      value={duration.value}
                                      checked={formData.duration === duration.value}
                                      onChange={(e) => {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          duration: e.target.value,
                                          planName: "" // Reset plan when duration changes
                                        }));
                                        setPlanQuantities({}); // Reset quantities when duration changes
                                      }}
                                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-3"
                                    />
                                    <span className="text-gray-700 font-medium text-sm">{duration.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Plans Display - Only after Variant AND Duration Selection */}
                          {formData.upgradeVariant && formData.duration && (
                            <div className="space-y-2 mt-4">
                              <Label className="text-sm font-medium">Plans:</Label>
                              {(() => {
                                // Define static plan lists for Desktop and Mandi variants
                                let plansToShow = [];
                                
                                if (formData.upgradeVariant === "Desktop") {
                                  // Desktop variant: 16 plans
                                  plansToShow = [
                                    "Standard - Single User",
                                    "Standard - Multi User",
                                    "Standard - Client Server",
                                    "Saffron - Single User",
                                    "Saffron - Multi User",
                                    "Saffron - Client Server",
                                    "Basic - Single User",
                                    "Basic - Multi User",
                                    "Blue - Single User",
                                    "Blue - Multi User",
                                    "Enterprise - Single User",
                                    "Enterprise - Multi User",
                                    "Enterprise - Client Server",
                                    "Emerald - Single User",
                                    "Emerald - Multi User",
                                    "Emerald - Client Server"
                                  ];
                                } else if (formData.upgradeVariant === "Mandi") {
                                  // Mandi variant: 6 plans
                                  plansToShow = [
                                    "Saffron - Single User",
                                    "Saffron - Multi User",
                                    "Saffron - Client Server",
                                    "Emerald - Single User",
                                    "Emerald - Multi User",
                                    "Emerald - Client Server"
                                  ];
                                }
                                
                                // Filter out current active plan
                                const currentPlanName = currentProductInfo?.planName || "";
                                const filteredPlans = plansToShow.filter(planName => planName !== currentPlanName);
                                
                                return (
                                  <div className="grid grid-cols-4 gap-2">
                                    {filteredPlans.length > 0 ? filteredPlans.map((planName) => {
                                      const isSelected = formData.planName === planName;
                                      const price = 15000; // Placeholder
                                      
                                      return (
                                        <div 
                                          key={planName}
                                          onClick={() => {
                                            // Single click selects plan and sets quantity to 1
                                            setFormData(prev => ({ ...prev, planName: planName }));
                                            setPlanQuantities({ [planName]: 1 });
                                          }}
                                          className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                            isSelected
                                              ? "border-indigo-500 bg-indigo-50 shadow-md" 
                                              : "border-gray-200 hover:border-gray-300"
                                          }`}
                                        >
                                          <div className="text-xs font-medium text-gray-900 mb-1">
                                            {planName}
                                          </div>
                                          <div className="flex flex-col mb-1">
                                            <span className="text-xs font-bold text-indigo-600">
                                              ₹{price.toLocaleString('en-IN')}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }) : (
                                      <div className="col-span-4 text-center text-gray-500 text-sm py-4">
                                        No upgrade plans available
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Online Upgrade Flow - Same as Online Renew (Online tab specific) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType === "Online" && (
                      <div className="space-y-4 mt-6">
                        <div id="product-selection-section" className="space-y-4">
                          {/* All fields in single row - without Database Type and Duration */}
                          <div className="flex items-center space-x-6">
                            {/* User Count (Mandatory) - Add/Reduce control with minimum enforcement */}
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium whitespace-nowrap">User Count:</Label>
                              <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Can only reduce if above minimum (original subscription count)
                                    if (onlineUserCount > onlineMinUserCount) {
                                      const newCount = onlineUserCount - 1;
                                      setOnlineUserCount(newCount);
                                      // Auto-update company count to match user count if not below company minimum
                                      if (newCount >= onlineMinCompanyCount) {
                                        setOnlineCompanyCount(newCount);
                                      }
                                      // Set default duration and trigger order summary when count changes
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        duration: "360",
                                        planName: "Online Upgrade"
                                      }));
                                      // Auto-scroll to order summary
                                      setTimeout(() => {
                                        const orderSummary = document.getElementById('online-upgrade-order-summary-section');
                                        if (orderSummary) {
                                          orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 300);
                                    }
                                  }}
                                  disabled={onlineUserCount <= onlineMinUserCount}
                                  className={`font-bold text-lg w-6 h-6 flex items-center justify-center ${
                                    onlineUserCount <= onlineMinUserCount 
                                      ? 'text-gray-300 cursor-not-allowed' 
                                      : 'text-gray-600 hover:text-red-600'
                                  }`}
                                >
                                  -
                                </button>
                                <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                  {onlineUserCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCount = onlineUserCount + 1;
                                    setOnlineUserCount(newCount);
                                    // Auto-update company count to match user count
                                    setOnlineCompanyCount(newCount);
                                    // Set default duration and trigger order summary when count changes
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      duration: "360",
                                      planName: "Online Upgrade"
                                    }));
                                    // Auto-scroll to order summary
                                    setTimeout(() => {
                                      const orderSummary = document.getElementById('online-upgrade-order-summary-section');
                                      if (orderSummary) {
                                        orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }, 300);
                                  }}
                                  className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-xs text-gray-500">(Min: {onlineMinUserCount})</span>
                            </div>

                            {/* Company Count (Mandatory) - Add/Reduce control with minimum enforcement */}
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium whitespace-nowrap">Company Count:</Label>
                              <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Can only reduce if above minimum (original subscription count)
                                    if (onlineCompanyCount > onlineMinCompanyCount) {
                                      setOnlineCompanyCount(onlineCompanyCount - 1);
                                      // Set default duration and trigger order summary when count changes
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        duration: "360",
                                        planName: "Online Upgrade"
                                      }));
                                      // Auto-scroll to order summary
                                      setTimeout(() => {
                                        const orderSummary = document.getElementById('online-upgrade-order-summary-section');
                                        if (orderSummary) {
                                          orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 300);
                                    }
                                  }}
                                  disabled={onlineCompanyCount <= onlineMinCompanyCount}
                                  className={`font-bold text-lg w-6 h-6 flex items-center justify-center ${
                                    onlineCompanyCount <= onlineMinCompanyCount 
                                      ? 'text-gray-300 cursor-not-allowed' 
                                      : 'text-gray-600 hover:text-red-600'
                                  }`}
                                >
                                  -
                                </button>
                                <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                  {onlineCompanyCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOnlineCompanyCount(onlineCompanyCount + 1);
                                    // Set default duration and trigger order summary when count changes
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      duration: "360",
                                      planName: "Online Upgrade"
                                    }));
                                    // Auto-scroll to order summary
                                    setTimeout(() => {
                                      const orderSummary = document.getElementById('online-upgrade-order-summary-section');
                                      if (orderSummary) {
                                        orderSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }, 300);
                                  }}
                                  className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-xs text-gray-500">(Min: {onlineMinCompanyCount})</span>
                            </div>

                            {/* Database Type - REMOVED from upgrade flow */}
                            {/* Duration Selection - REMOVED from upgrade flow, default 360 days used */}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Online Upgrade - Show when counts are changed (duration auto-set to 360) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType === "Online" && formData.duration && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mt-6">
                        <h4 id="online-upgrade-order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">User Count</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Company Count</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  // Calculate Online pricing
                                  const baseRate = 10000; // Base rate per user per year
                                  const userRate = baseRate * onlineUserCount;
                                  const companyRate = 2000 * onlineCompanyCount; // Additional charge per company
                                  const durationMultiplier = formData.duration === "1080" ? 3 : 1; // 3 years or 1 year
                                  const totalBasePrice = (userRate + companyRate) * durationMultiplier;
                                  
                                  // Apply 20% discount for 1080 days
                                  const discountedPrice = formData.duration === "1080" 
                                    ? Math.round(totalBasePrice * 0.8) 
                                    : totalBasePrice;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        Online Upgrade
                                        <div className="text-xs text-gray-500">
                                          Users: {onlineUserCount}, Companies: {onlineCompanyCount}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {formData.duration} Days
                                        {formData.duration === "1080" && (
                                          <div className="text-xs text-green-600 font-semibold">20% OFF</div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">{onlineUserCount}</td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">{onlineCompanyCount}</td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        {formData.duration === "1080" && totalBasePrice !== discountedPrice && (
                                          <div className="text-xs text-gray-400 line-through">₹{totalBasePrice.toLocaleString('en-IN')}</div>
                                        )}
                                        <div>₹{discountedPrice.toLocaleString('en-IN')}</div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{discountedPrice.toLocaleString('en-IN')}</td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing
                              const baseRate = 10000;
                              const userRate = baseRate * onlineUserCount;
                              const companyRate = 2000 * onlineCompanyCount;
                              const durationMultiplier = formData.duration === "1080" ? 3 : 1;
                              const totalBasePrice = (userRate + companyRate) * durationMultiplier;
                              
                              // Apply 20% discount for 1080 days
                              const discountedPrice = formData.duration === "1080" 
                                ? Math.round(totalBasePrice * 0.8) 
                                : totalBasePrice;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(discountedPrice * 0.10) : 0;
                              const afterTds = discountedPrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{discountedPrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-lg font-bold text-blue-900">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              Send Payment Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recom Upgrade Flow - Same as Recom Renew (Recom tab specific) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType === "Recom" && (
                      <div className="space-y-4">
                        {/* Market Place Selection */}
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium whitespace-nowrap">Market Place:</Label>
                          <div className="flex space-x-2">
                            {[
                              { value: "Single", label: "Single" },
                              { value: "Multiple", label: "Multiple" }
                            ].map((marketplace) => (
                              <label key={marketplace.value} className={`flex items-center cursor-pointer px-3 py-2 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                recomMarketPlace === marketplace.value
                                  ? "border-teal-500 bg-teal-50" 
                                  : "border-gray-200"
                              }`}>
                                <input
                                  type="radio"
                                  name="recomUpgradeMarketPlace"
                                  value={marketplace.value}
                                  checked={recomMarketPlace === marketplace.value}
                                  onChange={(e) => {
                                    setRecomMarketPlace(e.target.value);
                                    setFormData(prev => ({ ...prev, planName: "" }));
                                  }}
                                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500 mr-2"
                                />
                                <span className="text-gray-700 font-medium text-sm">{marketplace.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Recom Plans Display - Based on Market Place Selection */}
                        {recomMarketPlace && (
                          <div data-scroll-target="recom-upgrade-plans" className="space-y-2">
                            <Label className="text-sm font-medium">Number of Orders:</Label>
                        
                        {/* Single Market Place Plans */}
                        {recomMarketPlace === "Single" && (
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { name: "A", orders: "6,000", days: "360" },
                              { name: "B", orders: "12,000", days: "360" },
                              { name: "C", orders: "30,000", days: "360" },
                              { name: "D", orders: "60,000", days: "360" },
                              { name: "E", orders: "120,000", days: "360" }
                            ].map((plan) => {
                              const isSelected = formData.planName === `Recom ${plan.name}`;
                              const isCurrentPlan = currentProductInfo?.planName?.includes(plan.name);
                              return (
                                <div 
                                  key={plan.name}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}`, duration: plan.days }));
                                  }}
                                  className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-teal-500 bg-teal-50 shadow-md" 
                                      : isCurrentPlan
                                      ? "border-green-400 bg-green-50"
                                      : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                    {plan.name}
                                  </div>
                                  {isCurrentPlan && (
                                    <div className="absolute top-1 right-1">
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    </div>
                                  )}
                                  <div className="text-center mt-5">
                                    <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                    <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Multiple Market Place Plans */}
                        {recomMarketPlace === "Multiple" && (
                          <div className="space-y-2">
                            {/* First Row - 5 plans */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "A", orders: "300", days: "21" },
                                { name: "B", orders: "12,000", days: "360" },
                                { name: "C", orders: "30,000", days: "360" },
                                { name: "D", orders: "60,000", days: "360" },
                                { name: "E", orders: "120,000", days: "360" }
                              ].map((plan) => {
                                const isSelected = formData.planName === `Recom ${plan.name}`;
                                const isCurrentPlan = currentProductInfo?.planName?.includes(plan.name);
                                return (
                                  <div 
                                    key={plan.name}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}`, duration: plan.days }));
                                    }}
                                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-teal-500 bg-teal-50 shadow-md" 
                                        : isCurrentPlan
                                        ? "border-green-400 bg-green-50"
                                        : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                      {plan.name}
                                    </div>
                                    {isCurrentPlan && (
                                      <div className="absolute top-1 right-1">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      </div>
                                    )}
                                    <div className="text-center mt-5">
                                      <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                      <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Second Row - 1 plan (720 days) */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "H", orders: "12,000", days: "720" }
                              ].map((plan) => {
                                const isSelected = formData.planName === `Recom ${plan.name}`;
                                const isCurrentPlan = currentProductInfo?.planName?.includes(plan.name);
                                return (
                                  <div 
                                    key={plan.name}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}`, duration: plan.days }));
                                    }}
                                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-teal-500 bg-teal-50 shadow-md" 
                                        : isCurrentPlan
                                        ? "border-green-400 bg-green-50"
                                        : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                      {plan.name}
                                    </div>
                                    {isCurrentPlan && (
                                      <div className="absolute top-1 right-1">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      </div>
                                    )}
                                    <div className="text-center mt-5">
                                      <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                      <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                      </div>
                    )}

                    {/* Order Summary for Recom Upgrade - Show when plan is selected */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType === "Recom" && formData.planName && recomMarketPlace && (
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200 mt-6">
                        <h4 id="recom-upgrade-order-summary-section" className="text-xl font-bold text-teal-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Market Place</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  // Calculate Recom pricing based on plan
                                  const recomPricing = {
                                    "Recom A": { single: 4999, multiple: 299, duration: recomMarketPlace === "Single" ? "360" : "21" },
                                    "Recom B": { single: 7999, multiple: 9999, duration: "360" },
                                    "Recom C": { single: 15999, multiple: 19999, duration: "360" },
                                    "Recom D": { single: 29999, multiple: 39999, duration: "360" },
                                    "Recom E": { single: 59999, multiple: 79999, duration: "360" },
                                    "Recom H": { single: 0, multiple: 28799, duration: "720" } // 720 days only for multiple
                                  };
                                  
                                  const planPricing = recomPricing[formData.planName];
                                  const basePrice = recomMarketPlace === "Single" ? planPricing.single : planPricing.multiple;
                                  const duration = planPricing.duration;

                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        {formData.planName} - Upgrade
                                        <div className="text-xs text-gray-500">
                                          {recomMarketPlace} Marketplace
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {recomMarketPlace}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">
                                        {duration} Days
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">
                                        ₹{basePrice.toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                        ₹{basePrice.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing
                              const recomPricing = {
                                "Recom A": { single: 4999, multiple: 299, duration: recomMarketPlace === "Single" ? "360" : "21" },
                                "Recom B": { single: 7999, multiple: 9999, duration: "360" },
                                "Recom C": { single: 15999, multiple: 19999, duration: "360" },
                                "Recom D": { single: 29999, multiple: 39999, duration: "360" },
                                "Recom E": { single: 59999, multiple: 79999, duration: "360" },
                                "Recom H": { single: 0, multiple: 28799, duration: "720" }
                              };
                              
                              const planPricing = recomPricing[formData.planName];
                              const basePrice = recomMarketPlace === "Single" ? planPricing.single : planPricing.multiple;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
                              const afterTds = basePrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">TDS (10%):</span>
                                        <span className="text-sm text-red-600">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2 mt-2">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-lg font-bold text-teal-900">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Send Payment Link Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                              Send Payment Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upgrade Flow - Complete Product Selection (Show after customer validation for Upgrade button ONLY) */}
                    {/* This mirrors the exact same flow as renewalOption === 'upgrade' */}
                    {/* Exclude Desktop, Mandi, Online, and Recom as they have their own dedicated upgrade flows above */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && formData.productType !== "Desktop" && formData.productType !== "Mandi" && formData.productType !== "Online" && formData.productType !== "Recom" && (
                      <div className="space-y-6">
                        
                        {/* Product Selection - Exactly Same as renewalOption Upgrade Flow */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                          <h3 id="upgrade-product-selection-section" className="text-lg font-semibold text-indigo-900 mb-4">Choose Upgrade Product & Plan</h3>
                          
                          {/* Product Selection - Desktop, Mandi, Online, App, Recom */}
                          <div className="flex items-center space-x-6">
                            <Label className="text-sm font-medium whitespace-nowrap">Product:</Label>
                            <div className="flex space-x-3">
                              {[
                                { value: "Desktop", label: "Desktop" },
                                { value: "Mandi", label: "Mandi" },
                                { value: "Online", label: "Online" },
                                { value: "App", label: "App" },
                                { value: "Recom", label: "Recom" }
                              ].map((product) => (
                                <label key={product.value} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  formData.productType === product.value 
                                    ? "border-indigo-500 bg-indigo-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="productType"
                                    value={product.value}
                                    checked={formData.productType === product.value}
                                    onChange={(e) => setFormData(prev => ({ 
                                      ...prev, 
                                      productType: e.target.value,
                                      licenseModel: "",
                                      duration: "",
                                      accessType: "",
                                      userCount: "",
                                      companyCount: "",
                                      planName: ""
                                    }))}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-3"
                                  />
                                  <span className="text-gray-700 font-medium text-sm">{product.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Desktop Product Configuration */}
                          {formData.productType === "Desktop" && (
                            <div className="space-y-4 mt-4">
                              {/* License Model and Duration Selection - Combined in same line */}
                              <div className="flex items-center space-x-8">
                                <div className="flex items-center space-x-3">
                                  <Label className="text-sm font-medium whitespace-nowrap">License Model:</Label>
                                  <div className="flex space-x-2">
                                    {[
                                      { value: "Perpetual", label: "Perpetual" },
                                      { value: "Subscription", label: "Subscription" }
                                    ].map((model) => (
                                      <label key={model.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                        formData.licenseModel === model.value 
                                          ? "border-green-500 bg-green-50" 
                                          : "border-gray-200"
                                      }`}>
                                        <input
                                          type="checkbox"
                                          name="licenseModel"
                                          value={model.value}
                                          checked={formData.licenseModel === model.value}
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            licenseModel: e.target.checked ? model.value : "",
                                            duration: "",
                                            planName: ""
                                          }))}
                                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 mr-2"
                                        />
                                        <span className="text-gray-700 font-medium text-xs">{model.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Duration Selection for Desktop */}
                                {formData.licenseModel && (
                                  <div className="flex items-center space-x-3">
                                    <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                                    <div className="flex space-x-2">
                                      {[
                                        { value: "360 Days", label: "360 Days" },
                                        { value: "1080 Days", label: "1080 Days" }
                                      ].map((duration) => (
                                        <label key={duration.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                          formData.duration === duration.value.split(' ')[0] 
                                            ? "border-orange-500 bg-orange-50" 
                                            : "border-gray-200"
                                        }`}>
                                          <input
                                            type="checkbox"
                                            name="duration"
                                            value={duration.value.split(' ')[0]}
                                            checked={formData.duration === duration.value.split(' ')[0]}
                                            onChange={(e) => {
                                              const newDuration = e.target.checked ? duration.value.split(' ')[0] : "";
                                              setFormData(prev => ({ 
                                                ...prev, 
                                                duration: newDuration,
                                                planName: ""
                                              }));
                                              // Reset plan quantities when duration changes
                                              if (newDuration !== formData.duration) {
                                                setPlanQuantities({});
                                              }
                                            }}
                                            className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                            {duration.value === "1080 Days" && (
                                              <span className="text-xs text-green-600 font-semibold">
                                                20% OFF
                                              </span>
                                            )}
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Desktop Plan Selection - 4 Column Grid with Quantity */}
                              {formData.licenseModel && formData.duration && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Plans:</Label>
                                  {(() => {
                                    const plans = getDesktopPlans(formData.licenseModel, formData.duration);
                                    return (
                                      <div className="grid grid-cols-4 gap-2">
                                        {plans && plans.length > 0 ? plans.map((plan) => {
                                          const quantity = planQuantities[plan.name] || 0;
                                          return (
                                            <div 
                                              key={plan.name} 
                                              className={`relative border-2 rounded-lg p-2 transition-all ${
                                                quantity > 0
                                                  ? "border-indigo-500 bg-indigo-50 shadow-md" 
                                                  : "border-gray-200 hover:border-gray-300"
                                              }`}
                                            >
                                              <div className="text-xs font-medium text-gray-900 mb-1 pr-8">
                                                {plan.name}
                                              </div>
                                              <div className="flex flex-col mb-1">
                                                <span className="text-xs font-bold text-indigo-600">
                                                  ₹{plan.price?.toLocaleString('en-IN') || 'Contact'}
                                                </span>
                                              </div>
                                              <div className="absolute bottom-1.5 right-1.5 flex items-center bg-white rounded border border-gray-300 px-1 py-0.5">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (quantity > 0) {
                                                      const newQuantities = { ...planQuantities, [plan.name]: quantity - 1 };
                                                      setPlanQuantities(newQuantities);
                                                      if (quantity - 1 === 0 && formData.planName === plan.name) {
                                                        setFormData(prev => ({ ...prev, planName: "" }));
                                                      }
                                                    }
                                                  }}
                                                  className="text-gray-600 hover:text-red-600 font-bold text-xs w-4 h-4 flex items-center justify-center"
                                                >
                                                  -
                                                </button>
                                                <span className="text-xs font-semibold text-gray-900 min-w-[12px] text-center px-1">
                                                  {quantity}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newQuantities = { ...planQuantities, [plan.name]: quantity + 1 };
                                                    setPlanQuantities(newQuantities);
                                                    if (quantity === 0) {
                                                      setFormData(prev => ({ ...prev, planName: plan.name }));
                                                    }
                                                  }}
                                                  className="text-gray-600 hover:text-green-600 font-bold text-xs w-4 h-4 flex items-center justify-center"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }) : (
                                          <div className="col-span-4 text-center text-red-600 p-4">
                                            No plans available for upgrade.
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Add other product types (Mandi, Online, App, Recom) configurations as needed */}
                          {/* For now, showing placeholder for non-Desktop products */}
                          {formData.productType && formData.productType !== "Desktop" && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-800 text-sm">
                                {formData.productType} product configuration coming soon. Please select Desktop for now.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Desktop Upgrade - Show when plans are selected (Upgrade flow ONLY) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && 
                     formData.productType === "Desktop" && formData.upgradeVariant && Object.values(planQuantities).some(qty => qty > 0) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <h4 id="upgrade-order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Type</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Quantity</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  const lineItems = [];
                                  let serialNo = 1;
                                  
                                  // Generate line items from planQuantities
                                  Object.entries(planQuantities).forEach(([planName, quantity]) => {
                                    if (quantity > 0) {
                                      const rate = 15000; // Placeholder - will be fetched from HiBusy
                                      const amount = rate * quantity;
                                      lineItems.push(
                                        <tr key={planName} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900">{planName}</td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-700">Upgrade</td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-700">{quantity}</td>
                                          <td className="px-3 py-2 text-sm text-right text-gray-700">₹{rate.toLocaleString('en-IN')}</td>
                                          <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                      );
                                    }
                                  });
                                  
                                  if (lineItems.length === 0) {
                                    return (
                                      <tr>
                                        <td colSpan="6" className="px-3 py-4 text-sm text-center text-gray-500 italic">
                                          Select plans and add quantities to see line items
                                        </td>
                                      </tr>
                                    );
                                  }
                                  
                                  return lineItems;
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing based on planQuantities
                              let totalBasePrice = 0;
                              
                              Object.entries(planQuantities).forEach(([planName, quantity]) => {
                                if (quantity > 0) {
                                  const rate = 15000; // Placeholder
                                  totalBasePrice += rate * quantity;
                                }
                              });
                              
                              if (totalBasePrice === 0) return null;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
                              const afterTds = totalBasePrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{totalBasePrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {/* TDS Deduction */}
                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">TDS (10%):</span>
                                        <span className="text-sm font-semibold text-red-600">-₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    {/* GST */}
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-base font-bold text-blue-600">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Action Buttons - Cancel and Send Payment Link */}
                        <div className="flex justify-between items-center mt-6">
                          <Button
                            type="button"
                            onClick={() => {
                              // Reset upgrade flow
                              setFormData(prev => ({ ...prev, planName: "", upgradeVariant: "Desktop" }));
                              setPlanQuantities({});
                            }}
                            className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 px-8 py-3 rounded-lg text-lg font-semibold"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSendPaymentLink}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md"
                          >
                            Send Payment Link
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Order Summary for Mandi Upgrade - Show when plans are selected (Upgrade flow ONLY) */}
                    {formData.transactionType === "Renewal/Upgrade" && serialValidated && customerValidated && actionType === 'upgrade' && 
                     formData.productType === "Mandi" && formData.upgradeVariant && formData.duration && Object.values(planQuantities).some(qty => qty > 0) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <h4 id="mandi-upgrade-order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                        
                        <div>
                          {/* Invoice-Style Table */}
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Type</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Quantity</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  const lineItems = [];
                                  let serialNo = 1;
                                  
                                  // Generate line items from planQuantities
                                  Object.entries(planQuantities).forEach(([planName, quantity]) => {
                                    if (quantity > 0) {
                                      const rate = 15000; // Placeholder - will be fetched from HiBusy
                                      const amount = rate * quantity;
                                      lineItems.push(
                                        <tr key={planName} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                          <td className="px-3 py-2 text-sm text-gray-900">{planName}</td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-700">Upgrade</td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-700">{quantity}</td>
                                          <td className="px-3 py-2 text-sm text-right text-gray-700">₹{rate.toLocaleString('en-IN')}</td>
                                          <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                      );
                                    }
                                  });
                                  
                                  if (lineItems.length === 0) {
                                    return (
                                      <tr>
                                        <td colSpan="6" className="px-3 py-4 text-sm text-center text-gray-500 italic">
                                          Select plans and add quantities to see line items
                                        </td>
                                      </tr>
                                    );
                                  }
                                  
                                  return lineItems;
                                })()}
                              </tbody>
                            </table>
                            
                            {/* Summary Section */}
                            {(() => {
                              // Calculate pricing based on planQuantities
                              let totalBasePrice = 0;
                              
                              Object.entries(planQuantities).forEach(([planName, quantity]) => {
                                if (quantity > 0) {
                                  const rate = 15000; // Placeholder
                                  totalBasePrice += rate * quantity;
                                }
                              });
                              
                              if (totalBasePrice === 0) return null;

                              // Calculate TDS, GST, and final amount
                              const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
                              const afterTds = totalBasePrice - tdsAmount;
                              const gstAmount = Math.round(afterTds * 0.18);
                              const finalAmount = afterTds + gstAmount;

                              return (
                                <div className="border-t border-gray-300 bg-gray-50 p-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Total:</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{totalBasePrice.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* TDS Toggle */}
                                    <div className="flex justify-between items-center border-t pt-2">
                                      <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => setFormData(prev => ({ ...prev, deductTds: e.target.checked }))}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-2 text-xs font-medium text-gray-700">
                                          {formData.deductTds ? 'ON' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>

                                    {/* TDS Deduction */}
                                    {formData.deductTds && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">TDS (10%):</span>
                                        <span className="text-sm font-semibold text-red-600">-₹{tdsAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}

                                    {/* GST */}
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                      <span className="text-sm font-semibold text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                      <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                      <span className="text-base font-bold text-blue-600">₹{finalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Action Buttons - Cancel and Send Payment Link (both on right) */}
                        <div className="flex justify-end items-center space-x-4 mt-6">
                          <Button
                            type="button"
                            onClick={() => {
                              // Reset upgrade flow
                              setFormData(prev => ({ ...prev, planName: "", upgradeVariant: "Mandi", duration: "" }));
                              setPlanQuantities({});
                            }}
                            className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 px-8 py-3 rounded-lg text-lg font-semibold"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSendPaymentLink}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md"
                          >
                            Send Payment Link
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 4a: Renew Same Plan Flow */}
                    {serialValidated && renewalOption === 'renew' && (
                      <div className="space-y-6">
                        
                        {/* Order Summary for Renewal */}
                        <Card id="renewal-order-summary-section">
                          <CardHeader>
                            <CardTitle className="text-green-600">Renewal Order Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan Name:</span>
                                <span className="font-medium">{currentProductInfo?.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{currentProductInfo?.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Base Amount:</span>
                                <span className="font-medium">₹24,999</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Renewal Discount (15%):</span>
                                <span className="font-medium text-green-600">-₹3,750</span>
                              </div>
                              
                              {/* TDS Toggle - Inside Renewal Order Summary */}
                              <div className="flex justify-between items-center border-t pt-2 mt-2">
                                <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.deductTds}
                                    onChange={(e) => handleTdsToggle(e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 pointer-events-none"></div>
                                  <span className="ml-3 text-sm font-medium text-gray-700">
                                    {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                  </span>
                                </label>
                              </div>
                              
                              {formData.deductTds && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">TDS Deduction (10%):</span>
                                  <span className="font-medium text-red-600">-₹2,500</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between">
                                <span className="text-gray-600">GST (18%):</span>
                                <span className="font-medium">₹3,825</span>
                              </div>
                              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                <span className="text-gray-900">Total Amount:</span>
                                <span className="text-green-600">₹25,074</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Renewal Benefits */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2">Renewal Benefits</h4>
                          <ul className="text-green-700 text-sm space-y-1">
                            <li>✓ Early renewal benefit: +1 month free extension</li>
                            <li>✓ Renewal discount: 15% off regular price</li>
                            <li>✓ Priority customer support</li>
                            <li>✓ Free upgrade to latest software version</li>
                          </ul>
                        </div>

                        {/* Send Payment Link CTA - Only show with Order Summary */}
                        {serialValidated && renewalOption === 'renew' && (
                          <div className="flex justify-center">
                            <Button
                            disabled={(() => {
                              // Renewal pricing calculation
                              const basePrice = 8999;
                              const discount = 15; // 15% renewal discount
                              const discountAmount = Math.round(basePrice * discount / 100);
                              const discountedPrice = basePrice - discountAmount;
                              const taxAmount = Math.round(discountedPrice * 0.18);
                              const finalAmount = discountedPrice + taxAmount;
                              return finalAmount === 0;
                            })()}
                            onClick={() => {
                              // Set up payment link data for renewal
                              setPaymentLinkData({
                                customerDetails: {
                                  name: currentCustomerInfo.name,
                                  email: currentCustomerInfo.email,
                                  mobile: currentCustomerInfo.mobile
                                },
                                orderSummary: {
                                  productType: currentProductInfo.type,
                                  planName: currentProductInfo.planName,
                                  duration: currentProductInfo.duration,
                                  basePrice: 24999,
                                  discountAmount: 3750,
                                  discountPercent: 15,
                                  taxAmount: 3825,
                                  finalAmount: 25074
                                },
                                paymentLink: `https://payments.busy.in/renew/${serialNumber}`
                              });
                              setShowPaymentLinkPage(true);
                              setShowCreateForm(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg"
                          >
                            Send Payment Link for Renewal
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4b: Upgrade Flow - Use Same Product Selection as New Sales */}
                    {serialValidated && renewalOption === 'upgrade' && (
                      <div className="space-y-6">
                        
                        {/* Product Selection - Exactly Same as New Sales Flow */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <h3 id="upgrade-plans-section" className="text-lg font-semibold text-blue-900 mb-4">Choose Upgrade Product & Plan</h3>
                          
                          {/* Product Selection - Desktop, Mandi, Online, App, Recom */}
                          <div className="flex items-center space-x-6">
                            <Label className="text-sm font-medium whitespace-nowrap">Product:</Label>
                            <div className="flex space-x-3">
                              {[
                                { value: "Desktop", label: "Desktop" },
                                { value: "Mandi", label: "Mandi" },
                                { value: "Online", label: "Online" },
                                { value: "App", label: "App" },
                                { value: "Recom", label: "Recom" }
                              ].map((product) => (
                                <label key={product.value} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  formData.productType === product.value 
                                    ? "border-blue-500 bg-blue-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="productType"
                                    value={product.value}
                                    checked={formData.productType === product.value}
                                    onChange={(e) => setFormData(prev => ({ 
                                      ...prev, 
                                      productType: e.target.value,
                                      licenseModel: "",
                                      duration: "",
                                      accessType: "",
                                      userCount: "",
                                      companyCount: "",
                                      planName: ""
                                    }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                                  />
                                  <span className="text-gray-700 font-medium text-sm">{product.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Desktop Product Configuration */}
                          {formData.productType === "Desktop" && (
                            <div className="space-y-4">
                              {/* License Model and Duration Selection - Combined in same line */}
                              <div className="flex items-center space-x-8">
                                <div className="flex items-center space-x-3">
                                  <Label className="text-sm font-medium whitespace-nowrap">License Model:</Label>
                                  <div className="flex space-x-2">
                                    {[
                                      { value: "Perpetual", label: "Perpetual" },
                                      { value: "Subscription", label: "Subscription" }
                                    ].map((model) => (
                                      <label key={model.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                        formData.licenseModel === model.value 
                                          ? "border-green-500 bg-green-50" 
                                          : "border-gray-200"
                                      }`}>
                                        <input
                                          type="checkbox"
                                          name="licenseModel"
                                          value={model.value}
                                          checked={formData.licenseModel === model.value}
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            licenseModel: e.target.checked ? model.value : "",
                                            duration: "",
                                            planName: ""
                                          }))}
                                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 mr-2"
                                        />
                                        <span className="text-gray-700 font-medium text-xs">{model.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Duration Selection for Desktop */}
                                {formData.licenseModel && (
                                  <div className="flex items-center space-x-3">
                                    <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                                    <div className="flex space-x-2">
                                      {[
                                        { value: "360 Days", label: "360 Days" },
                                        { value: "1080 Days", label: "1080 Days" }
                                      ].map((duration) => (
                                        <label key={duration.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                          formData.duration === duration.value.split(' ')[0] 
                                            ? "border-orange-500 bg-orange-50" 
                                            : "border-gray-200"
                                        }`}>
                                          <input
                                            type="checkbox"
                                            name="duration"
                                            value={duration.value.split(' ')[0]}
                                            checked={formData.duration === duration.value.split(' ')[0]}
                                            onChange={(e) => setFormData(prev => ({ 
                                              ...prev, 
                                              duration: e.target.checked ? duration.value.split(' ')[0] : "",
                                              planName: ""
                                            }))}
                                            className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                            {duration.value === "1080 Days" && (
                                              <span className="text-xs text-green-600 font-semibold">
                                                20% OFF
                                              </span>
                                            )}
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Desktop Plan Selection */}
                              {formData.licenseModel && formData.duration && (
                                <div className="flex items-start space-x-6">
                                  <Label className="text-sm font-medium whitespace-nowrap pt-3">Plan:</Label>
                                  <div className="flex-1 grid grid-cols-2 gap-4">
                                    {getDesktopPlans(formData.licenseModel, formData.duration).map((plan, index) => (
                                      <label key={plan.name} className={`flex items-start space-x-2 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-all ${
                                        formData.planName === plan.name 
                                          ? "border-blue-500 bg-blue-50 shadow-md" 
                                          : "border-gray-200"
                                      }`}>
                                        <input
                                          type="radio"
                                          name="planName"
                                          value={plan.name}
                                          checked={formData.planName === plan.name}
                                          onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                                          className="w-4 h-4 text-blue-600 mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-gray-900 text-sm mb-1">{plan.name}</div>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg font-bold text-blue-600">₹{plan.price.toLocaleString()}</span>
                                            {formData.duration === "1080" && (
                                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                                                20% OFF
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {plan.subType} • {plan.applicableTo}
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Busy Online Product Configuration */}
                          {formData.productType === "Busy Online" && (
                            <div className="space-y-6">
                              {/* Duration and Access Type in same line */}
                              <div className="flex items-center space-x-8">
                                <div className="flex items-center space-x-3">
                                  <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                                  <div className="flex space-x-2">
                                    {[
                                      { value: "360 Days", label: "360 Days" },
                                      { value: "1080 Days", label: "1080 Days" }
                                    ].map((duration) => (
                                      <label key={duration.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                        formData.duration === duration.value.split(' ')[0] 
                                          ? "border-orange-500 bg-orange-50" 
                                          : "border-gray-200"
                                      }`}>
                                        <input
                                          type="checkbox"
                                          name="duration"
                                          value={duration.value.split(' ')[0]}
                                          checked={formData.duration === duration.value.split(' ')[0]}
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            duration: e.target.checked ? duration.value.split(' ')[0] : "",
                                            accessType: ""
                                          }))}
                                          className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                          {duration.value === "1080 Days" && (
                                            <span className="text-xs text-green-600 font-semibold">
                                              20% OFF
                                            </span>
                                          )}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Access Type Selection */}
                                {formData.duration && (
                                  <div className="flex items-center space-x-3">
                                    <Label className="text-sm font-medium whitespace-nowrap">Access Type:</Label>
                                    <div className="flex space-x-2">
                                      {[
                                        { value: "Web Access", label: "Web Access" },
                                        { value: "RDS Access", label: "RDS Access" }
                                      ].map((access) => (
                                        <label key={access.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                          formData.accessType === access.value 
                                            ? "border-purple-500 bg-purple-50" 
                                            : "border-gray-200"
                                        }`}>
                                          <input
                                            type="checkbox"
                                            name="accessType"
                                            value={access.value}
                                            checked={formData.accessType === access.value}
                                            onChange={(e) => setFormData(prev => ({ 
                                              ...prev, 
                                              accessType: e.target.checked ? access.value : ""
                                            }))}
                                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 mr-2"
                                          />
                                          <span className="text-gray-700 font-medium text-xs">{access.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* User Count and Company Count in same line with defaults */}
                              {formData.duration && formData.accessType && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-8">
                                    <div className="flex items-center space-x-3">
                                      <Label className="text-sm font-medium whitespace-nowrap">User Count:</Label>
                                      <Input
                                        type="number"
                                        value={formData.userCount || "1"}
                                        onChange={(e) => setFormData(prev => ({ ...prev, userCount: e.target.value }))}
                                        placeholder="1"
                                        min="0"
                                        className="w-20"
                                      />
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      <Label className="text-sm font-medium whitespace-nowrap">Company Count:</Label>
                                      <Input
                                        type="number"
                                        value={formData.companyCount || "1"}
                                        onChange={(e) => setFormData(prev => ({ ...prev, companyCount: e.target.value }))}
                                        placeholder="1"
                                        min="0"
                                        className="w-20"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Validation Error Display */}
                                  {(() => {
                                    const validation = validateBusyOnlineCounts();
                                    if (!validation.isValid) {
                                      return (
                                        <div className="flex items-center space-x-2 text-red-600 text-sm">
                                          <AlertTriangle className="w-4 h-4" />
                                          <span>{validation.error}</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}

                              {/* TDS Deduction Toggle for Busy Online */}
                              {formData.productType === "Busy Online" && (
                                <div className="flex items-center space-x-3 mt-4">
                                  <Label className="text-sm font-medium whitespace-nowrap">Deduct TDS:</Label>
                                  <div className="flex items-center space-x-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={formData.deductTds}
                                        onChange={(e) => handleTdsToggle(e.target.checked)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                      <span className="ml-3 text-sm font-medium text-gray-700">
                                        {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mazu Product Configuration */}
                          {formData.productType === "Mazu" && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mazu Plans</h3>
                              <p className="text-yellow-700">Plans Coming Soon</p>
                              <p className="text-sm text-yellow-600 mt-2">We are working on exciting Mazu plans. Please check back later!</p>
                            </div>
                          )}

                          {/* RDP Product Configuration */}
                          {formData.productType === "RDP" && (
                            <div className="space-y-6">
                              <div className="flex items-start space-x-6">
                                <Label className="text-sm font-medium whitespace-nowrap pt-3">Plan:</Label>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[
                                    {
                                      name: "RDP Basic",
                                      price: 4999,
                                      features: ["Single User Access", "Remote Desktop", "Basic Support", "Standard Security"],
                                      recommended: false
                                    },
                                    {
                                      name: "RDP Professional", 
                                      price: 8999,
                                      features: ["Multi-User Access", "Enhanced Security", "Priority Support", "Advanced Features"],
                                      recommended: true
                                    },
                                    {
                                      name: "RDP Enterprise",
                                      price: 14999,
                                      features: ["Unlimited Users", "Enterprise Security", "24/7 Support", "Custom Configuration"],
                                      recommended: false
                                    },
                                    {
                                      name: "RDP Premium",
                                      price: 19999,
                                      features: ["Premium Features", "Dedicated Support", "High Availability", "Advanced Analytics"],
                                      recommended: false
                                    }
                                  ].map((plan) => (
                                    <label key={plan.name} className={`relative flex flex-col cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-50 transition-all ${
                                      formData.planName === plan.name 
                                        ? "border-blue-500 bg-blue-50 shadow-md" 
                                        : "border-gray-200"
                                    }`}>
                                      {plan.recommended && (
                                        <span className="absolute -top-2 left-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                          Recommended
                                        </span>
                                      )}
                                      
                                      <div className="flex items-center space-x-3 mb-3">
                                        <input
                                          type="radio"
                                          name="planName"
                                          value={plan.name}
                                          checked={formData.planName === plan.name}
                                          onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                                          className="w-4 h-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                          <div className="font-semibold text-gray-900">{plan.name}</div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-lg font-bold text-blue-600">₹{plan.price.toLocaleString()}</span>
                                          <span className="text-sm text-gray-600">per year</span>
                                        </div>
                                        
                                        <div>
                                          <p className="text-xs text-gray-600 mb-1">Features:</p>
                                          <ul className="text-xs text-gray-700 space-y-0.5">
                                            {plan.features.map((feature, index) => (
                                              <li key={index}>• {feature}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              {/* TDS Deduction Toggle for RDP */}
                              {formData.productType === "RDP" && (
                                <div className="flex items-center space-x-3 mt-4">
                                  <Label className="text-sm font-medium whitespace-nowrap">Deduct TDS:</Label>
                                  <div className="flex items-center space-x-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={formData.deductTds}
                                        onChange={(e) => handleTdsToggle(e.target.checked)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                      <span className="ml-3 text-sm font-medium text-gray-700">
                                        {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Upgrade Order Summary */}
                        {formData.productType && formData.planName && (
                          <>
                            <Card id="upgrade-order-summary-section">
                              <CardHeader>
                                <CardTitle className="text-blue-600">Upgrade Order Summary</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Upgrading to:</span>
                                    <span className="font-medium">{formData.planName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Product Type:</span>
                                    <span className="font-medium">{formData.productType}</span>
                                  </div>
                                  {formData.productType === "Desktop" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">License Model:</span>
                                        <span className="font-medium">{formData.licenseModel}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{formData.duration} Days</span>
                                      </div>
                                    </>
                                  )}
                                  {formData.productType === "Busy Online" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Access Type:</span>
                                        <span className="font-medium">{formData.accessType}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{formData.duration} Days</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Users/Companies:</span>
                                        <span className="font-medium">{formData.userCount || 1}/{formData.companyCount || 1}</span>
                                      </div>
                                    </>
                                  )}
                                  {formData.productType === "RDP" && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Duration:</span>
                                      <span className="font-medium">365 Days</span>
                                    </div>
                                  )}
                                  
                                  {/* Calculate and show pricing based on product type */}
                                  {(() => {
                                    let pricing = null;
                                    if (formData.productType === "Desktop") {
                                      pricing = calculateDesktopPricing();
                                    } else if (formData.productType === "RDP") {
                                      pricing = calculateRDPPricing();
                                    } else if (formData.productType === "Busy Online") {
                                      const basePrice = calculateBusyOnlinePrice();
                                      const taxAmount = Math.round(basePrice * 0.18);
                                      pricing = {
                                        basePrice: basePrice,
                                        discountAmount: 0,
                                        discountPercent: 0,
                                        taxAmount: taxAmount,
                                        finalAmount: basePrice + taxAmount
                                      };
                                    }
                                    
                                    if (!pricing) return null;
                                    
                                    // Calculate TDS on base price (10%)
                                    const tdsAmount = formData.deductTds ? Math.round(pricing.basePrice * 0.10) : 0;
                                    const finalAmount = pricing.basePrice - pricing.discountAmount + pricing.taxAmount - tdsAmount;
                                    
                                    return (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Base Amount:</span>
                                          <span className="font-medium">₹{pricing.basePrice.toLocaleString()}</span>
                                        </div>
                                        {pricing.discountAmount > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Upgrade Discount ({pricing.discountPercent}%):</span>
                                            <span className="font-medium text-green-600">-₹{pricing.discountAmount.toLocaleString()}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">GST (18%):</span>
                                          <span className="font-medium">₹{pricing.taxAmount.toLocaleString()}</span>
                                        </div>
                                        
                                        {/* TDS Toggle - Inside Upgrade Order Summary */}
                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                          <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                          <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={formData.deductTds}
                                              onChange={(e) => handleTdsToggle(e.target.checked)}
                                              className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                              {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                            </span>
                                          </label>
                                        </div>
                                        
                                        {formData.deductTds && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">TDS Deduction (10%):</span>
                                            <span className="font-medium text-red-600">-₹{tdsAmount.toLocaleString()}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                          <span className="text-gray-900">Total Amount:</span>
                                          <span className="text-blue-600">₹{finalAmount.toLocaleString()}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Upgrade Benefits */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-2">Upgrade Benefits</h4>
                              <ul className="text-blue-700 text-sm space-y-1">
                                <li>✓ Enhanced features and functionality</li>
                                <li>✓ Premium support included</li>
                                <li>✓ Advanced capabilities unlock</li>
                                <li>✓ Priority updates and patches</li>
                                <li>✓ Improved performance and security</li>
                              </ul>
                            </div>

                            {/* Send Payment Link CTA for Upgrade - Only show with Order Summary */}
                            {formData.productType && formData.planName && (
                              <div className="flex justify-center">
                                <Button
                                  disabled={(() => {
                                    // Get upgrade pricing
                                    if (formData.productType === "Desktop" || formData.productType === "RDP") {
                                      const pricing = formData.productType === "Desktop" ? calculateDesktopPricing() : calculateRDPPricing();
                                      return pricing?.finalAmount === 0;
                                    }
                                    return false;
                                  })()}
                                  onClick={handleSendPaymentLink}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg"
                                >
                                  Send Payment Link for Upgrade
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile App Flow (For Mobile App transaction type) */}
                {formData.transactionType === "Mobile App" && (
                  <div className="space-y-6">
                    
                    {/* Step 1: Mobile App Serial Number Input & Validation */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-purple-900 mb-4">📱 Enter Mobile App License Details</h3>
                      
                      <div className="flex items-center space-x-4">
                        <Label className="text-sm font-medium whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            value={mobileAppSerialNumber}
                            onChange={(e) => {
                              setMobileAppSerialNumber(e.target.value);
                              setErrors(prev => ({ ...prev, mobileAppSerial: "" }));
                              setMobileAppValidated(false);
                            }}
                            placeholder="Enter mobile app license serial number"
                            className={`w-64 ${errors.mobileAppSerial ? "border-red-500" : ""}`}
                            disabled={fetchingMobileAppDetails || mobileAppValidated}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !fetchingMobileAppDetails && !mobileAppValidated) {
                                validateMobileAppSerial();
                              }
                            }}
                          />
                          <Button 
                            type="button"
                            onClick={validateMobileAppSerial}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
                            disabled={!mobileAppSerialNumber || fetchingMobileAppDetails || mobileAppValidated}
                          >
                            {fetchingMobileAppDetails ? (
                              <>
                                <div className="loading-spinner mr-2"></div>
                                Fetching...
                              </>
                            ) : mobileAppValidated ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Validated
                              </>
                            ) : (
                              'Fetch Details'
                            )}
                          </Button>
                          
                          {mobileAppValidated && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={resetMobileAppFlow}
                              className="text-gray-600"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {errors.mobileAppSerial && (
                        <p className="text-red-500 text-sm mt-2">{errors.mobileAppSerial}</p>
                      )}
                      
                      <p className="text-sm text-purple-700 mt-2">
                        Enter the license serial number to fetch customer and Product details.
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        💡 <strong>Testing:</strong> Enter <code className="bg-gray-100 px-1 rounded">SER123456</code> for testing
                      </p>
                    </div>

                    {/* Step 2: Customer, Base Product & App Counts */}
                    {mobileAppValidated && mobileAppCustomerInfo && mobileAppBaseProductInfo && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Customer Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-purple-600 flex items-center">
                              <User className="w-5 h-5 mr-2" />
                              Customer Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{mobileAppCustomerInfo.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{mobileAppCustomerInfo.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mobile:</span>
                                <span className="font-medium">{mobileAppCustomerInfo.mobile}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Company:</span>
                                <span className="font-medium">{mobileAppCustomerInfo.company}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">GSTIN:</span>
                                <span className="font-medium">{mobileAppCustomerInfo.gstin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{mobileAppCustomerInfo.city}, {mobileAppCustomerInfo.state}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Base Product Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-teal-600 flex items-center">
                              <Package className="w-5 h-5 mr-2" />
                              Base Product Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Product Type:</span>
                                <span className="font-medium">{mobileAppBaseProductInfo.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan Name:</span>
                                <span className="font-medium">{mobileAppBaseProductInfo.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">License Model:</span>
                                <span className="font-medium">{mobileAppBaseProductInfo.licenseModel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{mobileAppBaseProductInfo.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    {mobileAppBaseProductInfo.status}
                                  </span>
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expiry Date:</span>
                                <span className="font-medium">{mobileAppBaseProductInfo.expiryDate}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* App Counts */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-green-600 flex items-center">
                              <Smartphone className="w-5 h-5 mr-2" />
                              App Counts
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{mobileAppCounts.totalFOC}</div>
                                <div className="text-sm text-green-700 font-medium">Total FOC Apps</div>
                              </div>
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{mobileAppCounts.totalPaid}</div>
                                <div className="text-sm text-blue-700 font-medium">Total Paid Apps</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Step 3: Options Selection (Buy New vs Renew) */}
                    {mobileAppValidated && (
                      <div id="mobile-app-options-section" className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Action</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="mobileAppOption"
                              value="buy_new"
                              checked={mobileAppOption === 'buy_new'}
                              onChange={(e) => {
                                setMobileAppOption(e.target.value);
                                setSelectedAppsForRenewal([]);
                                setRenewalValidity('');
                              }}
                              className="w-4 h-4 text-purple-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 flex items-center">
                                <Plus className="w-4 h-4 mr-2 text-purple-600" />
                                Buy New
                              </div>
                              <div className="text-sm text-gray-600">Purchase additional mobile app licenses</div>
                            </div>
                          </label>
                          
                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="mobileAppOption"
                              value="renew"
                              checked={mobileAppOption === 'renew'}
                              onChange={(e) => {
                                setMobileAppOption(e.target.value);
                                setMobileAppCount('1');
                                setMobileAppValidity('');
                              }}
                              className="w-4 h-4 text-purple-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 flex items-center">
                                <RefreshCw className="w-4 h-4 mr-2 text-indigo-600" />
                                Renew
                              </div>
                              <div className="text-sm text-gray-600">Renew existing mobile app licenses</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Step 4a: Buy New Flow */}
                    {mobileAppValidated && mobileAppOption === 'buy_new' && (
                      <div className="space-y-6">
                        
                        {/* App Count and Validity Selection */}
                        <div id="mobile-app-plans-section" className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-purple-900 mb-4">📱 Configure New Apps</h3>
                          
                          <div className="flex items-center space-x-8">
                            {/* Number of Apps */}
                            <div className="flex items-center space-x-3">
                              <Label className="text-sm font-medium whitespace-nowrap">No. of Apps <span className="text-red-500">*</span>:</Label>
                              <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCount = parseInt(mobileAppCount) || 1;
                                    if (currentCount > 1) {
                                      setMobileAppCount((currentCount - 1).toString());
                                    }
                                  }}
                                  className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                  {mobileAppCount || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCount = parseInt(mobileAppCount) || 1;
                                    setMobileAppCount((currentCount + 1).toString());
                                  }}
                                  className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            {/* Validity Selection */}
                            <div className="flex items-center space-x-3">
                              <Label className="text-sm font-medium whitespace-nowrap">Validity <span className="text-red-500">*</span>:</Label>
                              <div className="flex space-x-2">
                                <label className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  mobileAppValidity === '360' 
                                    ? "border-orange-500 bg-orange-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="checkbox"
                                    name="mobileAppValidity"
                                    value="360"
                                    checked={mobileAppValidity === '360'}
                                    onChange={(e) => setMobileAppValidity(e.target.checked ? '360' : '')}
                                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <span className="text-gray-700 font-medium text-sm">360 Days</span>
                                </label>
                                
                                <label className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  mobileAppValidity === '1080' 
                                    ? "border-green-500 bg-green-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="checkbox"
                                    name="mobileAppValidity"
                                    value="1080"
                                    checked={mobileAppValidity === '1080'}
                                    onChange={(e) => setMobileAppValidity(e.target.checked ? '1080' : '')}
                                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-sm">1080 Days</span>
                                    <span className="text-xs text-green-600 font-semibold">20% OFF</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Summary for Buy New */}
                        {mobileAppCount && mobileAppValidity && (
                          <Card id="mobile-app-order-summary-section">
                            <CardHeader>
                              <CardTitle className="text-purple-600">📱 Buy New Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Service Type:</span>
                                  <span className="font-medium">Mobile App License</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Number of Apps:</span>
                                  <span className="font-medium">{mobileAppCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Validity:</span>
                                  <span className="font-medium">{mobileAppValidity} Days</span>
                                </div>
                                
                                {(() => {
                                  const basePrice = 2999; // Base price per app
                                  const totalBasePrice = basePrice * parseInt(mobileAppCount);
                                  const discount = mobileAppValidity === '1080' ? 20 : 0;
                                  const discountAmount = (totalBasePrice * discount) / 100;
                                  
                                  // Add Recom Bundle offer discount if applied
                                  const recomOfferDiscount = addRecomOffer ? 3000 : 0;
                                  
                                  const discountedPrice = totalBasePrice - discountAmount - recomOfferDiscount;
                                  
                                  // Calculate TDS deduction if enabled (10% of base price)
                                  const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
                                  const priceAfterTds = discountedPrice - tdsAmount;
                                  
                                  const taxAmount = Math.round(priceAfterTds * 0.18); // 18% GST on amount after TDS
                                  const finalAmount = priceAfterTds + taxAmount;
                                  
                                  return (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Base Amount:</span>
                                        <span className="font-medium">₹{totalBasePrice.toLocaleString()}</span>
                                      </div>
                                      {discount > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Discount ({discount}%):</span>
                                          <span className="font-medium text-green-600">-₹{discountAmount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {addRecomOffer && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Recom Bundle Offer:</span>
                                          <span className="font-medium text-orange-600">-₹{recomOfferDiscount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      
                                      {/* TDS Toggle - Inside Mobile App Order Summary */}
                                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                                        <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={formData.deductTds}
                                            onChange={(e) => handleTdsToggle(e.target.checked)}
                                            className="sr-only peer"
                                          />
                                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 pointer-events-none"></div>
                                          <span className="ml-3 text-sm font-medium text-gray-700">
                                            {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                          </span>
                                        </label>
                                      </div>
                                      
                                      {formData.deductTds && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">TDS Deduction (10%):</span>
                                          <span className="font-medium text-red-600">-₹{tdsAmount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">GST (18%):</span>
                                        <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                        <span className="text-gray-900">Total Amount:</span>
                                        <span className="text-purple-600">₹{finalAmount.toLocaleString()}</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Offers Section */}
                        {mobileAppCount && mobileAppValidity && (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">🎉 Special Offers</h4>
                            <ul className="text-yellow-700 text-sm space-y-1">
                              <li>✓ Buy 5+ apps and get 1 additional app free</li>
                              <li>✓ Extended warranty on 1080 days validity</li>
                              <li>✓ Priority customer support for bulk purchases</li>
                              <li>✓ Free app migration assistance</li>
                            </ul>
                          </div>
                        )}

                        {/* Send Payment Link CTA */}
                        {mobileAppCount && mobileAppValidity && (
                          <div className="flex justify-center">
                            <Button
                              disabled={(() => {
                                // Mobile app pricing calculation
                                const basePrice = 2999;
                                const quantity = parseInt(mobileAppCount);
                                const totalBasePrice = basePrice * quantity;
                                const taxAmount = Math.round(totalBasePrice * 0.18);
                                const finalAmount = totalBasePrice + taxAmount;
                                return finalAmount === 0;
                              })()}
                              onClick={() => {
                                const basePrice = 2999;
                                const totalBasePrice = basePrice * parseInt(mobileAppCount);
                                const discount = mobileAppValidity === '1080' ? 20 : 0;
                                const discountAmount = (totalBasePrice * discount) / 100;
                                const discountedPrice = totalBasePrice - discountAmount;
                                const taxAmount = Math.round(discountedPrice * 0.18);
                                const finalAmount = discountedPrice + taxAmount;
                                
                                setPaymentLinkData({
                                  customerDetails: {
                                    name: mobileAppCustomerInfo.name,
                                    email: mobileAppCustomerInfo.email,
                                    mobile: mobileAppCustomerInfo.mobile
                                  },
                                  orderSummary: {
                                    productType: "Mobile App - Buy New",
                                    planName: `${mobileAppCount} App License${parseInt(mobileAppCount) > 1 ? 's' : ''}`,
                                    duration: `${mobileAppValidity} Days`,
                                    basePrice: totalBasePrice,
                                    discountAmount: discountAmount,
                                    discountPercent: discount,
                                    taxAmount: taxAmount,
                                    finalAmount: finalAmount
                                  },
                                  paymentLink: `https://payments.busy.in/mobile-app/buy/${mobileAppSerialNumber}`
                                });
                                setShowPaymentLinkPage(true);
                                setShowCreateForm(false);
                              }}
                              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg flex items-center space-x-2"
                            >
                              <Smartphone className="w-5 h-5" />
                              <span>Send Payment Link</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4b: Renew Flow */}
                    {mobileAppValidated && mobileAppOption === 'renew' && (
                      <div className="space-y-6">
                        
                        {/* Current Apps List */}
                        <div id="mobile-app-renewal-section">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Select Apps to Renew</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentApps.map((app, index) => (
                              <div
                                key={app.id}
                                className={`border-2 rounded-lg p-4 transition-all ${
                                  selectedAppsForRenewal.includes(app.id)
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold text-gray-900">{app.name}</span>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        app.type === 'FOC' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {app.type}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">App ID: {app.id}</div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={selectedAppsForRenewal.includes(app.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedAppsForRenewal(prev => [...prev, app.id]);
                                      } else {
                                        setSelectedAppsForRenewal(prev => prev.filter(id => id !== app.id));
                                      }
                                    }}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium ${
                                      app.status === 'Active' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Expiry Date:</span>
                                    <span className="font-medium">{app.expiryDate}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Renewal Validity Selection */}
                        {selectedAppsForRenewal.length > 0 && (
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-4">🔄 Select Renewal Validity</h3>
                            
                            <div className="flex items-center space-x-3">
                              <Label className="text-sm font-medium whitespace-nowrap">Validity <span className="text-red-500">*</span>:</Label>
                              <div className="flex space-x-2">
                                <label className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  renewalValidity === '360' 
                                    ? "border-orange-500 bg-orange-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="checkbox"
                                    name="renewalValidity"
                                    value="360"
                                    checked={renewalValidity === '360'}
                                    onChange={(e) => setRenewalValidity(e.target.checked ? '360' : '')}
                                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <span className="text-gray-700 font-medium text-sm">360 Days</span>
                                </label>
                                
                                <label className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                  renewalValidity === '1080' 
                                    ? "border-green-500 bg-green-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="checkbox"
                                    name="renewalValidity"
                                    value="1080"
                                    checked={renewalValidity === '1080'}
                                    onChange={(e) => setRenewalValidity(e.target.checked ? '1080' : '')}
                                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-sm">1080 Days</span>
                                    <span className="text-xs text-green-600 font-semibold">20% OFF</span>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {/* TDS toggle moved to Order Summary section */}
                          </div>
                        )}

                        {/* NEW SECTION: App Details Summary Before Order Summary */}
                        {selectedAppsForRenewal.length > 0 && renewalValidity && (
                          <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6">
                            {/* Informational Text */}
                            <div className="space-y-3">
                              <p className="text-blue-600 text-sm font-medium">
                                All selected apps will have their expiry date reset.
                              </p>
                              <p className="text-blue-600 text-sm font-medium">
                                Deselected apps will be marked as expired and their tenure will be adjusted in the selected apps being renewed.
                              </p>
                            </div>

                            {/* Summary Boxes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-200 rounded-lg p-4">
                                <p className="text-gray-600 text-sm mb-2">Advance Credit</p>
                                <p className="text-2xl font-bold text-gray-900">13500</p>
                              </div>
                              <div className="bg-gray-200 rounded-lg p-4">
                                <p className="text-gray-600 text-sm mb-2">
                                  <input type="checkbox" className="mr-2" />
                                  LP (host non commission discounts)
                                </p>
                                <p className="text-2xl font-bold text-gray-900">18000</p>
                              </div>
                            </div>

                            <p className="text-gray-600 text-xs">13500 (SUB)</p>

                            {/* Apps Details Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-600 text-white">
                                    <th className="border border-gray-400 px-3 py-2 text-left">
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4"
                                        checked={selectedAppsForRenewal.length === currentApps.length}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedAppsForRenewal(currentApps.map(app => app.id));
                                          } else {
                                            setSelectedAppsForRenewal([]);
                                          }
                                        }}
                                      />
                                    </th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">App ID</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">Type</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">Status</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">Last Used</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">Start Date</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">End Date</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">Remaining Validity (Days)</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">New End Date</th>
                                    <th className="border border-gray-400 px-3 py-2 text-left text-sm">New Validity (Days)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentApps.map((app) => {
                                    // Calculate remaining validity
                                    const endDate = new Date(app.expiryDate);
                                    const today = new Date();
                                    const remainingDays = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
                                    
                                    // Calculate new end date based on selected validity
                                    const newEndDate = new Date();
                                    newEndDate.setDate(newEndDate.getDate() + parseInt(renewalValidity));
                                    const formattedNewEndDate = newEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
                                    
                                    return (
                                      <tr key={app.id} className={selectedAppsForRenewal.includes(app.id) ? 'bg-indigo-50' : 'bg-white'}>
                                        <td className="border border-gray-400 px-3 py-2">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4"
                                            checked={selectedAppsForRenewal.includes(app.id)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedAppsForRenewal(prev => [...prev, app.id]);
                                              } else {
                                                setSelectedAppsForRenewal(prev => prev.filter(id => id !== app.id));
                                              }
                                            }}
                                          />
                                        </td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">{app.id}</td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">{app.type}</td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">
                                          <span className={app.status === 'Active' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                            {app.status}
                                          </span>
                                        </td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">
                                          {app.lastUsed || '05-Sep-23'}
                                        </td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">
                                          {app.startDate || '05-Sep-23'}
                                        </td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">{app.expiryDate}</td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm text-center">{remainingDays}</td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm">{formattedNewEndDate}</td>
                                        <td className="border border-gray-400 px-3 py-2 text-sm text-center">{renewalValidity}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Renewal Order Summary */}
                        {selectedAppsForRenewal.length > 0 && renewalValidity && (
                          <Card id="mobile-app-renewal-summary-section">
                            <CardHeader>
                              <CardTitle className="text-indigo-600">🔄 Renewal Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Service Type:</span>
                                  <span className="font-medium">Mobile App Renewal</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Apps Selected:</span>
                                  <span className="font-medium">{selectedAppsForRenewal.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Renewal Validity:</span>
                                  <span className="font-medium">{renewalValidity} Days</span>
                                </div>
                                
                                {(() => {
                                  const basePrice = 1999; // Renewal price per app
                                  const totalBasePrice = basePrice * selectedAppsForRenewal.length;
                                  const discount = renewalValidity === '1080' ? 20 : 0;
                                  const discountAmount = (totalBasePrice * discount) / 100;
                                  let priceAfterDiscount = totalBasePrice - discountAmount;
                                  
                                  // Add Recom Bundle offer discount if applied
                                  const recomOfferDiscount = addRecomOffer ? 3000 : 0;
                                  priceAfterDiscount -= recomOfferDiscount;
                                  
                                  // Calculate GST on pre-TDS amount (18% on discounted price)
                                  const taxAmount = Math.round(priceAfterDiscount * 0.18);
                                  
                                  // Calculate TDS on base price only (10%)
                                  const tdsAmount = formData.deductTds ? Math.round(totalBasePrice * 0.10) : 0;
                                  
                                  // Final amount = discounted price + GST - TDS
                                  const finalAmount = priceAfterDiscount + taxAmount - tdsAmount;
                                  
                                  return (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Base Amount:</span>
                                        <span className="font-medium">₹{totalBasePrice.toLocaleString()}</span>
                                      </div>
                                      {discount > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Renewal Discount ({discount}%):</span>
                                          <span className="font-medium text-green-600">-₹{discountAmount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {recomOfferDiscount > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Recom Bundle Offer:</span>
                                          <span className="font-medium text-green-600">-₹{recomOfferDiscount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">GST (18%):</span>
                                        <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                                      </div>
                                      
                                      {/* TDS Toggle - Inside Mobile App Renewal Order Summary */}
                                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                                        <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={formData.deductTds}
                                            onChange={(e) => handleTdsToggle(e.target.checked)}
                                            className="sr-only peer"
                                          />
                                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                          <span className="ml-3 text-sm font-medium text-gray-700">
                                            {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                          </span>
                                        </label>
                                      </div>
                                      
                                      {formData.deductTds && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">TDS Deduction (10%):</span>
                                          <span className="font-medium text-red-600">-₹{tdsAmount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      
                                      <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                        <span className="text-gray-900">Total Amount:</span>
                                        <span className="text-indigo-600">₹{finalAmount.toLocaleString()}</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Renewal Offers Section */}
                        {selectedAppsForRenewal.length > 0 && renewalValidity && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">🎉 Renewal Offers</h4>
                            <ul className="text-blue-700 text-sm space-y-1">
                              <li>✓ Early renewal discount: Additional 5% off</li>
                              <li>✓ Extended support for renewed apps</li>
                              <li>✓ Priority technical assistance</li>
                              <li>✓ Free app updates and patches</li>
                              <li>✓ Bulk renewal incentives</li>
                            </ul>
                          </div>
                        )}

                        {/* Send Payment Link CTA for Renewal */}
                        {selectedAppsForRenewal.length > 0 && renewalValidity && (
                          <div className="flex justify-center">
                            <Button
                              disabled={(() => {
                                // Mobile app renewal pricing calculation
                                const basePrice = 1999;
                                const quantity = selectedAppsForRenewal.length;
                                const totalBasePrice = basePrice * quantity;
                                const taxAmount = Math.round(totalBasePrice * 0.18);
                                const finalAmount = totalBasePrice + taxAmount;
                                return finalAmount === 0;
                              })()}
                              onClick={() => {
                                const basePrice = 1999;
                                const totalBasePrice = basePrice * selectedAppsForRenewal.length;
                                const discount = renewalValidity === '1080' ? 20 : 0;
                                const discountAmount = (totalBasePrice * discount) / 100;
                                const discountedPrice = totalBasePrice - discountAmount;
                                const taxAmount = Math.round(discountedPrice * 0.18);
                                const finalAmount = discountedPrice + taxAmount;
                                
                                setPaymentLinkData({
                                  customerDetails: {
                                    name: mobileAppCustomerInfo.name,
                                    email: mobileAppCustomerInfo.email,
                                    mobile: mobileAppCustomerInfo.mobile
                                  },
                                  orderSummary: {
                                    productType: "Mobile App - Renewal",
                                    planName: `${selectedAppsForRenewal.length} App Renewal${selectedAppsForRenewal.length > 1 ? 's' : ''}`,
                                    duration: `${renewalValidity} Days`,
                                    basePrice: totalBasePrice,
                                    discountAmount: discountAmount,
                                    discountPercent: discount,
                                    taxAmount: taxAmount,
                                    finalAmount: finalAmount
                                  },
                                  paymentLink: `https://payments.busy.in/mobile-app/renew/${mobileAppSerialNumber}`
                                });
                                setShowPaymentLinkPage(true);
                                setShowCreateForm(false);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg flex items-center space-x-2"
                            >
                              <RefreshCw className="w-5 h-5" />
                              <span>Send Payment Link</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recom Flow (For Recom transaction type) */}
                {formData.transactionType === "Recom" && (
                  <div className="space-y-6">
                    
                    {/* Step 1: Recom Serial Number Input & Validation */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-emerald-900 mb-4">🎯 Enter Recom License Details</h3>
                      
                      <div className="flex items-center space-x-4">
                        <Label className="text-sm font-medium whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            value={recomSerialNumber}
                            onChange={(e) => {
                              setRecomSerialNumber(e.target.value);
                              setErrors(prev => ({ ...prev, recomSerial: "" }));
                              setRecomValidated(false);
                            }}
                            placeholder="Enter Recom license serial number"
                            className={`w-64 ${errors.recomSerial ? "border-red-500" : ""}`}
                            disabled={fetchingRecomDetails || recomValidated}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !fetchingRecomDetails && !recomValidated) {
                                validateRecomSerial();
                              }
                            }}
                          />
                          <Button 
                            type="button"
                            onClick={validateRecomSerial}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
                            disabled={!recomSerialNumber || fetchingRecomDetails || recomValidated}
                          >
                            {fetchingRecomDetails ? (
                              <>
                                <div className="loading-spinner mr-2"></div>
                                Fetching...
                              </>
                            ) : recomValidated ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Validated
                              </>
                            ) : (
                              'Fetch Details'
                            )}
                          </Button>
                          
                          {recomValidated && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={resetRecomFlow}
                              className="text-gray-600"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {errors.recomSerial && (
                        <p className="text-red-500 text-sm mt-2">{errors.recomSerial}</p>
                      )}
                      
                      <p className="text-sm text-emerald-700 mt-2">
                        Enter the license serial number to fetch customer and Product details.
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        💡 <strong>Testing:</strong> Enter <code className="bg-gray-100 px-1 rounded">SER123456</code> for testing
                      </p>
                    </div>

                    {/* Step 2: Customer, Base Product & Current Recom Plan Details */}
                    {recomValidated && recomCustomerInfo && recomBaseProductInfo && recomCurrentPlan && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Customer Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-emerald-600 flex items-center">
                              <User className="w-5 h-5 mr-2" />
                              Customer Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{recomCustomerInfo.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{recomCustomerInfo.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mobile:</span>
                                <span className="font-medium">{recomCustomerInfo.mobile}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Company:</span>
                                <span className="font-medium">{recomCustomerInfo.company}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">GSTIN:</span>
                                <span className="font-medium">{recomCustomerInfo.gstin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{recomCustomerInfo.city}, {recomCustomerInfo.state}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Base Product Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-teal-600 flex items-center">
                              <Package className="w-5 h-5 mr-2" />
                              Base Product Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Product Type:</span>
                                <span className="font-medium">{recomBaseProductInfo.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan Name:</span>
                                <span className="font-medium">{recomBaseProductInfo.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">License Model:</span>
                                <span className="font-medium">{recomBaseProductInfo.licenseModel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{recomBaseProductInfo.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    {recomBaseProductInfo.status}
                                  </span>
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expiry Date:</span>
                                <span className="font-medium">{recomBaseProductInfo.expiryDate}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Current Recom Plan */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-orange-600 flex items-center">
                              <Target className="w-5 h-5 mr-2" />
                              Current Recom Plan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Channel Type:</span>
                                <span className="font-medium">{recomCurrentPlan.channelType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan Name:</span>
                                <span className="font-medium">{recomCurrentPlan.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Order Count:</span>
                                <span className="font-medium">{recomCurrentPlan.orderCount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{recomCurrentPlan.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Remaining Orders:</span>
                                <span className="font-medium text-orange-600">{recomCurrentPlan.remainingOrders.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expiry Date:</span>
                                <span className="font-medium">{recomCurrentPlan.expiryDate}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Step 3: Options Selection (Buy New / Renew / Upgrade) */}
                    {recomValidated && (
                      <div id="recom-options-section" className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Action</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="recomOption"
                              value="buy_new"
                              checked={recomOption === 'buy_new'}
                              onChange={(e) => {
                                setRecomOption(e.target.value);
                                setRecomChannelType('');
                                setSelectedRecomPlan(null);
                              }}
                              className="w-4 h-4 text-emerald-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 flex items-center">
                                <Plus className="w-4 h-4 mr-2 text-emerald-600" />
                                Buy New
                              </div>
                              <div className="text-sm text-gray-600">Purchase additional Recom license</div>
                            </div>
                          </label>
                          
                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="recomOption"
                              value="renew"
                              checked={recomOption === 'renew'}
                              onChange={(e) => {
                                setRecomOption(e.target.value);
                                setRecomChannelType('');
                                setSelectedRecomPlan(null);
                              }}
                              className="w-4 h-4 text-emerald-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 flex items-center">
                                <RefreshCw className="w-4 h-4 mr-2 text-teal-600" />
                                Renew Same Plan
                              </div>
                              <div className="text-sm text-gray-600">Continue with {recomCurrentPlan?.channelType}</div>
                            </div>
                          </label>

                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="recomOption"
                              value="upgrade"
                              checked={recomOption === 'upgrade'}
                              onChange={(e) => {
                                setRecomOption(e.target.value);
                                setRecomChannelType('');
                                setSelectedRecomPlan(null);
                              }}
                              className="w-4 h-4 text-emerald-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 flex items-center">
                                <ArrowUp className="w-4 h-4 mr-2 text-orange-600" />
                                Upgrade to Better Plan
                              </div>
                              <div className="text-sm text-gray-600">Enhanced features and more orders</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Step 4a: Buy New Flow */}
                    {recomValidated && recomOption === 'buy_new' && (
                      <div className="space-y-6">
                        
                        {/* Channel Type Selection */}
                        <div id="recom-plans-section" className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-emerald-900 mb-4">🎯 Select Channel Type</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`flex items-center cursor-pointer p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                              recomChannelType === 'single' 
                                ? "border-emerald-500 bg-emerald-50" 
                                : "border-gray-200"
                            }`}>
                              <input
                                type="radio"
                                name="recomChannelType"
                                value="single"
                                checked={recomChannelType === 'single'}
                                onChange={(e) => setRecomChannelType(e.target.value)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mr-3"
                              />
                              <div>
                                <div className="font-medium text-gray-900">Single Channel</div>
                                <div className="text-sm text-gray-600">One integration channel</div>
                              </div>
                            </label>
                            
                            <label className={`flex items-center cursor-pointer p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                              recomChannelType === 'multi' 
                                ? "border-emerald-500 bg-emerald-50" 
                                : "border-gray-200"
                            }`}>
                              <input
                                type="radio"
                                name="recomChannelType"
                                value="multi"
                                checked={recomChannelType === 'multi'}
                                onChange={(e) => setRecomChannelType(e.target.value)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mr-3"
                              />
                              <div>
                                <div className="font-medium text-gray-900">Multi Channel</div>
                                <div className="text-sm text-gray-600">Multiple integration channels</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Recom Plan Cards */}
                        {recomChannelType && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Select Recom Plan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(() => {
                                // Recom plans based on Excel sheet data
                                const singleChannelPlans = [
                                  { name: "Recom Single MarketPlace 6000 Orders", orders: 6000, price: 3000, duration: "360 Days" },
                                  { name: "Recom Single MarketPlace 12000 Orders", orders: 12000, price: 5000, duration: "360 Days" },
                                  { name: "Recom Single MarketPlace 18000 Orders", orders: 18000, price: 8000, duration: "360 Days" },
                                  { name: "Recom Single MarketPlace 30000 Orders", orders: 30000, price: 12000, duration: "360 Days" }
                                ];
                                
                                const multiChannelPlans = [
                                  { name: "Recom Multi MarketPlace 6000 Orders", orders: 6000, price: 5999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 12000 Orders", orders: 12000, price: 9999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 30000 Orders", orders: 30000, price: 19999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 60000 Orders", orders: 60000, price: 39999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 120000 Orders", orders: 120000, price: 79999, duration: "360 Days" }
                                ];
                                
                                const plans = recomChannelType === 'single' ? singleChannelPlans : multiChannelPlans;
                                
                                return plans.map((plan, index) => (
                                  <div
                                    key={plan.name}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                      selectedRecomPlan?.name === plan.name
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedRecomPlan(plan)}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                      <input
                                        type="radio"
                                        name="recomPlan"
                                        checked={selectedRecomPlan?.name === plan.name}
                                        onChange={() => setSelectedRecomPlan(plan)}
                                        className="w-4 h-4 text-emerald-600"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Orders:</span>
                                        <span className="font-medium">{plan.orders.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{plan.duration}</span>
                                      </div>
                                      <div className="flex justify-between text-lg font-bold">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="text-emerald-600">₹{plan.price.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        {/* TDS toggle moved to Order Summary section */}

                        {/* Buy New Order Summary */}
                        {recomChannelType && selectedRecomPlan && (
                          <>
                            <Card id="recom-order-summary-section">
                              <CardHeader>
                                <CardTitle className="text-emerald-600">🎯 Buy New Order Summary</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Service Type:</span>
                                    <span className="font-medium">Recom License - {recomChannelType === 'single' ? 'Single' : 'Multi'} Channel</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Plan Name:</span>
                                    <span className="font-medium">{selectedRecomPlan.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Order Count:</span>
                                    <span className="font-medium">{selectedRecomPlan.orders.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium">{selectedRecomPlan.duration}</span>
                                  </div>
                                  
                                  {(() => {
                                    const basePrice = selectedRecomPlan.price;
                                    
                                    // Add Recom Bundle offer discount if applied
                                    const recomOfferDiscount = addRecomOffer ? 3000 : 0;
                                    let priceAfterDiscount = basePrice - recomOfferDiscount;
                                    
                                    // Calculate TDS deduction if enabled
                                    const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
                                    const priceAfterTds = priceAfterDiscount - tdsAmount;
                                    
                                    const taxAmount = Math.round(priceAfterTds * 0.18);
                                    const finalAmount = priceAfterTds + taxAmount;
                                    
                                    return (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Base Amount:</span>
                                          <span className="font-medium">₹{basePrice.toLocaleString()}</span>
                                        </div>
                                        {addRecomOffer && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Recom Bundle Offer:</span>
                                            <span className="font-medium text-orange-600">-₹{recomOfferDiscount.toLocaleString()}</span>
                                          </div>
                                        )}
                                        
                                        {/* TDS Toggle - Inside Recom Order Summary */}
                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                          <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                          <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={formData.deductTds}
                                              onChange={(e) => handleTdsToggle(e.target.checked)}
                                              className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 pointer-events-none"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                              {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                            </span>
                                          </label>
                                        </div>
                                        
                                        {formData.deductTds && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">TDS Deduction (10%):</span>
                                            <span className="font-medium text-red-600">-₹{tdsAmount.toLocaleString()}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">GST (18%):</span>
                                          <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                          <span className="text-gray-900">Total Amount:</span>
                                          <span className="text-emerald-600">₹{finalAmount.toLocaleString()}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Recom Offers Section */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                              <h4 className="font-semibold text-emerald-800 mb-2">🎉 Recom Special Offers</h4>
                              <ul className="text-emerald-700 text-sm space-y-1">
                                <li>✓ Free integration support and setup</li>
                                <li>✓ Priority technical assistance</li>
                                <li>✓ Extended order validity period</li>
                                <li>✓ Dedicated account manager for enterprise plans</li>
                              </ul>
                            </div>

                            {/* Send Payment Link CTA */}
                            <div className="flex justify-center">
                              <Button
                                disabled={(() => {
                                  // Recom buy new pricing calculation
                                  const basePrice = selectedRecomPlan?.price || 0;
                                  const taxAmount = Math.round(basePrice * 0.18);
                                  const finalAmount = basePrice + taxAmount;
                                  return finalAmount === 0;
                                })()}
                                onClick={() => {
                                  const basePrice = selectedRecomPlan.price;
                                  const taxAmount = Math.round(basePrice * 0.18);
                                  const finalAmount = basePrice + taxAmount;
                                  
                                  setPaymentLinkData({
                                    customerDetails: {
                                      name: recomCustomerInfo.name,
                                      email: recomCustomerInfo.email,
                                      mobile: recomCustomerInfo.mobile
                                    },
                                    orderSummary: {
                                      productType: "Recom - Buy New",
                                      planName: selectedRecomPlan.name,
                                      duration: selectedRecomPlan.duration,
                                      basePrice: basePrice,
                                      discountAmount: 0,
                                      discountPercent: 0,
                                      taxAmount: taxAmount,
                                      finalAmount: finalAmount
                                    },
                                    paymentLink: `https://payments.busy.in/recom/buy/${recomSerialNumber}`
                                  });
                                  setShowPaymentLinkPage(true);
                                  setShowCreateForm(false);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg flex items-center space-x-2"
                              >
                                <Target className="w-5 h-5" />
                                <span>Send Payment Link</span>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 4b: Renew Same Plan Flow */}
                    {recomValidated && recomOption === 'renew' && (
                      <div className="space-y-6">
                        
                        {/* Renew Order Summary */}
                        <Card id="recom-renew-summary-section">
                          <CardHeader>
                            <CardTitle className="text-teal-600">🔄 Renewal Order Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Service Type:</span>
                                <span className="font-medium">Recom License Renewal</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Current Plan:</span>
                                <span className="font-medium">{recomCurrentPlan?.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Channel Type:</span>
                                <span className="font-medium">{recomCurrentPlan?.channelType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Order Count:</span>
                                <span className="font-medium">{recomCurrentPlan?.orderCount?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">New Validity:</span>
                                <span className="font-medium">360 Days</span>
                              </div>
                              
                              {(() => {
                                const basePrice = 8999; // Renewal price
                                const discount = 10; // 10% renewal discount
                                const discountAmount = (basePrice * discount) / 100;
                                const discountedPrice = basePrice - discountAmount;
                                
                                // Calculate GST on pre-TDS amount (18% on discounted price)
                                const taxAmount = Math.round(discountedPrice * 0.18);
                                
                                // Calculate TDS on base price only (10%)
                                const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
                                
                                // Final amount = discounted price + GST - TDS
                                const finalAmount = discountedPrice + taxAmount - tdsAmount;
                                
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Base Amount:</span>
                                      <span className="font-medium">₹{basePrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Renewal Discount ({discount}%):</span>
                                      <span className="font-medium text-green-600">-₹{discountAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">GST (18%):</span>
                                      <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                                    </div>
                                    
                                    {/* TDS Toggle - Inside Recom Renewal Order Summary */}
                                    <div className="flex justify-between items-center border-t pt-2 mt-2">
                                      <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.deductTds}
                                          onChange={(e) => handleTdsToggle(e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                          {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                        </span>
                                      </label>
                                    </div>
                                    
                                    {formData.deductTds && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">TDS Deduction (10%):</span>
                                        <span className="font-medium text-red-600">-₹{tdsAmount.toLocaleString()}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                      <span className="text-gray-900">Total Amount:</span>
                                      <span className="text-teal-600">₹{finalAmount.toLocaleString()}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Renewal Offers Section */}
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                          <h4 className="font-semibold text-teal-800 mb-2">🎉 Renewal Benefits</h4>
                          <ul className="text-teal-700 text-sm space-y-1">
                            <li>✓ Early renewal discount: 10% off regular price</li>
                            <li>✓ Extended order validity with no interruption</li>
                            <li>✓ Priority support for existing integrations</li>
                            <li>✓ Free migration assistance if needed</li>
                          </ul>
                        </div>

                        {/* Send Payment Link CTA for Renewal */}
                        <div className="flex justify-center">
                          <Button
                            disabled={(() => {
                              // Recom renewal pricing calculation
                              const basePrice = 8999;
                              const discount = 10;
                              const discountAmount = Math.round(basePrice * discount / 100);
                              const discountedPrice = basePrice - discountAmount;
                              const taxAmount = Math.round(discountedPrice * 0.18);
                              const finalAmount = discountedPrice + taxAmount;
                              return finalAmount === 0;
                            })()}
                            onClick={() => {
                              const basePrice = 8999;
                              const discount = 10;
                              const discountAmount = (basePrice * discount) / 100;
                              const discountedPrice = basePrice - discountAmount;
                              const taxAmount = Math.round(discountedPrice * 0.18);
                              const finalAmount = discountedPrice + taxAmount;
                              
                              setPaymentLinkData({
                                customerDetails: {
                                  name: recomCustomerInfo.name,
                                  email: recomCustomerInfo.email,
                                  mobile: recomCustomerInfo.mobile
                                },
                                orderSummary: {
                                  productType: "Recom - Renewal",
                                  planName: recomCurrentPlan.planName,
                                  duration: "360 Days",
                                  basePrice: basePrice,
                                  discountAmount: discountAmount,
                                  discountPercent: discount,
                                  taxAmount: taxAmount,
                                  finalAmount: finalAmount
                                },
                                paymentLink: `https://payments.busy.in/recom/renew/${recomSerialNumber}`
                              });
                              setShowPaymentLinkPage(true);
                              setShowCreateForm(false);
                            }}
                            className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg flex items-center space-x-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            <span>Send Payment Link</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 4c: Upgrade Flow */}
                    {recomValidated && recomOption === 'upgrade' && (
                      <div className="space-y-6">
                        
                        {/* Channel Type Selection for Upgrade */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-orange-900 mb-4">🎯 Select Upgrade Channel Type</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`flex items-center cursor-pointer p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                              recomChannelType === 'single' 
                                ? "border-orange-500 bg-orange-50" 
                                : "border-gray-200"
                            }`}>
                              <input
                                type="radio"
                                name="recomUpgradeChannelType"
                                value="single"
                                checked={recomChannelType === 'single'}
                                onChange={(e) => setRecomChannelType(e.target.value)}
                                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-3"
                              />
                              <div>
                                <div className="font-medium text-gray-900">Single Channel</div>
                                <div className="text-sm text-gray-600">One integration channel</div>
                              </div>
                            </label>
                            
                            <label className={`flex items-center cursor-pointer p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                              recomChannelType === 'multi' 
                                ? "border-orange-500 bg-orange-50" 
                                : "border-gray-200"
                            }`}>
                              <input
                                type="radio"
                                name="recomUpgradeChannelType"
                                value="multi"
                                checked={recomChannelType === 'multi'}
                                onChange={(e) => setRecomChannelType(e.target.value)}
                                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-3"
                              />
                              <div>
                                <div className="font-medium text-gray-900">Multi Channel</div>
                                <div className="text-sm text-gray-600">Multiple integration channels</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Upgrade Plan Cards */}
                        {recomChannelType && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Select Upgrade Plan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(() => {
                                // Show higher tier plans for upgrade based on Excel sheet
                                const singleChannelUpgrades = [
                                  { name: "Recom Single MarketPlace 12000 Orders", orders: 12000, price: 5000, duration: "360 Days" },
                                  { name: "Recom Single MarketPlace 18000 Orders", orders: 18000, price: 8000, duration: "360 Days" },
                                  { name: "Recom Single MarketPlace 30000 Orders", orders: 30000, price: 12000, duration: "360 Days" }
                                ];
                                
                                const multiChannelUpgrades = [
                                  { name: "Recom Multi MarketPlace 12000 Orders", orders: 12000, price: 9999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 30000 Orders", orders: 30000, price: 19999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 60000 Orders", orders: 60000, price: 39999, duration: "360 Days" },
                                  { name: "Recom Multi MarketPlace 120000 Orders", orders: 120000, price: 79999, duration: "360 Days" }
                                ];
                                
                                const plans = recomChannelType === 'single' ? singleChannelUpgrades : multiChannelUpgrades;
                                
                                return plans.map((plan, index) => (
                                  <div
                                    key={plan.name}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                      selectedRecomPlan?.name === plan.name
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedRecomPlan(plan)}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                      <input
                                        type="radio"
                                        name="upgradeRecomPlan"
                                        checked={selectedRecomPlan?.name === plan.name}
                                        onChange={() => setSelectedRecomPlan(plan)}
                                        className="w-4 h-4 text-orange-600"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Orders:</span>
                                        <span className="font-medium">{plan.orders.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{plan.duration}</span>
                                      </div>
                                      <div className="flex justify-between text-lg font-bold">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="text-orange-600">₹{plan.price.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Upgrade Order Summary */}
                        {recomChannelType && selectedRecomPlan && (
                          <>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-orange-600">📈 Upgrade Order Summary</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Upgrading to:</span>
                                    <span className="font-medium">{selectedRecomPlan.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Channel Type:</span>
                                    <span className="font-medium">{recomChannelType === 'single' ? 'Single' : 'Multi'} Channel</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Order Count:</span>
                                    <span className="font-medium">{selectedRecomPlan.orders.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium">{selectedRecomPlan.duration}</span>
                                  </div>
                                  
                                  {(() => {
                                    const basePrice = selectedRecomPlan.price;
                                    const discount = 15; // 15% upgrade discount
                                    const discountAmount = (basePrice * discount) / 100;
                                    const discountedPrice = basePrice - discountAmount;
                                    
                                    // Calculate GST on pre-TDS amount (18% on discounted price)
                                    const taxAmount = Math.round(discountedPrice * 0.18);
                                    
                                    // Calculate TDS on base price only (10%)
                                    const tdsAmount = formData.deductTds ? Math.round(basePrice * 0.10) : 0;
                                    
                                    // Final amount = discounted price + GST - TDS
                                    const finalAmount = discountedPrice + taxAmount - tdsAmount;
                                    
                                    return (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Base Amount:</span>
                                          <span className="font-medium">₹{basePrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Upgrade Discount ({discount}%):</span>
                                          <span className="font-medium text-green-600">-₹{discountAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">GST (18%):</span>
                                          <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                                        </div>
                                        
                                        {/* TDS Toggle - Inside Recom Upgrade Order Summary */}
                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                          <span className="text-gray-600 font-medium">Deduct TDS:</span>
                                          <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={formData.deductTds}
                                              onChange={(e) => handleTdsToggle(e.target.checked)}
                                              className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                              {formData.deductTds ? 'ON (10% deduction)' : 'OFF'}
                                            </span>
                                          </label>
                                        </div>
                                        
                                        {formData.deductTds && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">TDS Deduction (10%):</span>
                                            <span className="font-medium text-red-600">-₹{tdsAmount.toLocaleString()}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                          <span className="text-gray-900">Total Amount:</span>
                                          <span className="text-orange-600">₹{finalAmount.toLocaleString()}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Upgrade Benefits */}
                            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                              <h4 className="font-semibold text-orange-800 mb-2">🎉 Upgrade Benefits</h4>
                              <ul className="text-orange-700 text-sm space-y-1">
                                <li>✓ Enhanced order capacity and processing</li>
                                <li>✓ Priority integration support</li>
                                <li>✓ Advanced analytics and reporting</li>
                                <li>✓ Dedicated technical account manager</li>
                                <li>✓ Custom API rate limits</li>
                              </ul>
                            </div>

                            {/* Send Payment Link CTA for Upgrade */}
                            <div className="flex justify-center">
                              <Button
                                disabled={(() => {
                                  // Recom upgrade pricing calculation
                                  const basePrice = selectedRecomPlan?.price || 0;
                                  const discount = 15;
                                  const discountAmount = Math.round(basePrice * discount / 100);
                                  const discountedPrice = basePrice - discountAmount;
                                  const taxAmount = Math.round(discountedPrice * 0.18);
                                  const finalAmount = discountedPrice + taxAmount;
                                  return finalAmount === 0;
                                })()}
                                onClick={() => {
                                  const basePrice = selectedRecomPlan.price;
                                  const discount = 15;
                                  const discountAmount = (basePrice * discount) / 100;
                                  const discountedPrice = basePrice - discountAmount;
                                  const taxAmount = Math.round(discountedPrice * 0.18);
                                  const finalAmount = discountedPrice + taxAmount;
                                  
                                  setPaymentLinkData({
                                    customerDetails: {
                                      name: recomCustomerInfo.name,
                                      email: recomCustomerInfo.email,
                                      mobile: recomCustomerInfo.mobile
                                    },
                                    orderSummary: {
                                      productType: "Recom - Upgrade",
                                      planName: selectedRecomPlan.name,
                                      duration: selectedRecomPlan.duration,
                                      basePrice: basePrice,
                                      discountAmount: discountAmount,
                                      discountPercent: discount,
                                      taxAmount: taxAmount,
                                      finalAmount: finalAmount
                                    },
                                    paymentLink: `https://payments.busy.in/recom/upgrade/${recomSerialNumber}`
                                  });
                                  setShowPaymentLinkPage(true);
                                  setShowCreateForm(false);
                                }}
                                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg flex items-center space-x-2"
                              >
                                <ArrowUp className="w-5 h-5" />
                                <span>Send Payment Link</span>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Serial Number Input (For other transaction types except New Sales, Renewal/Upgrade, Mobile App, Recom, and Cancel Txn) */}
                {formData.transactionType !== "New Sales" && formData.transactionType !== "Renewal/Upgrade" && formData.transactionType !== "Mobile App" && formData.transactionType !== "Recom" && formData.transactionType !== "Cancel Txn" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center space-x-4">
                      <Label className="text-sm font-medium whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
                      <div className="flex-1 flex items-center space-x-3">
                        <Input
                          value={formData.serialNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                          placeholder="Enter existing license serial number"
                          className="flex-1"
                          required
                        />
                        <Button 
                          type="button"
                          onClick={() => {
                            // TODO: Implement serial number lookup for other transaction types
                            console.log("Fetching details for serial:", formData.serialNumber);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                          disabled={!formData.serialNumber}
                        >
                          Fetch Details
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      Enter the serial number to automatically fetch customer and product details for {formData.transactionType.toLowerCase()}.
                    </p>
                  </div>
                )}

                {/* Prospect Details Accordion */}
                {formData.transactionType === "New Sales" && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Accordion Header */}
                  <div 
                    className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
                      isProspectDetailsOpen ? 'bg-blue-50 border-b border-gray-300' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (isProspectDetailsSaved) {
                        setIsProspectDetailsOpen(!isProspectDetailsOpen);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">Prospect Details</h3>
                      {isProspectDetailsSaved && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProspectDetailsSaved(false);
                            setCustomerValidated(false);
                            setIsProspectDetailsOpen(true);
                          }}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                          title="Edit Prospect Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isProspectDetailsSaved && (
                      <button
                        type="button"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {isProspectDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  
                  {/* Accordion Content */}
                  {isProspectDetailsOpen && (
                  <div className="p-6 bg-white">
                  
                  {/* Prospect Information Fields - For non-CA categories */}
                  {formData.licenseType !== "CA" && (
                    <div className="space-y-4">
                      {/* Row 1: Category, Mobile, Email, Name */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <select
                            id="category"
                            value={formData.licenseType}
                            onChange={(e) => handleLicenseTypeChange(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="Retail">Regular</option>
                            <option value="CA">CA</option>
                            <option value="Accountant">Accountant</option>
                            <option value="GST Practitioner">GSTP</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="mobile">Mobile <span className="text-red-500">*</span></Label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                              +91
                            </span>
                            <Input
                              id="mobile"
                              type="tel"
                              value={formData.customerDetails.mobile}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (value.length <= 10) { // Limit to 10 digits
                                  setFormData(prev => ({
                                    ...prev,
                                    customerDetails: { ...prev.customerDetails, mobile: value }
                                  }));
                                  setCustomerValidated(false);
                                  setErrors(prev => ({ ...prev, mobile: "" }));
                                }
                              }}
                              maxLength={10}
                              required
                              disabled={customerValidated}
                              className={`rounded-l-none ${errors.mobile ? "border-red-500 focus:border-red-500" : ""}`}
                            />
                          </div>
                          {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                        </div>

                        <div>
                          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.customerDetails.email}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                customerDetails: { ...prev.customerDetails, email: e.target.value }
                              }));
                              setCustomerValidated(false);
                              setErrors(prev => ({ ...prev, email: "" }));
                            }}
                            required
                            disabled={customerValidated}
                            className={errors.email ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                          <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="name"
                            value={formData.customerDetails.name}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                customerDetails: { ...prev.customerDetails, name: e.target.value }
                              }));
                              setErrors(prev => ({ ...prev, name: "" }));
                            }}
                            required
                            disabled={customerValidated}
                            className={errors.name ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>
                      </div>

                      {/* Row 2: GSTIN, Company Name, Address, City */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="gstin">
                            GSTIN {formData.licenseType === "GST Practitioner" && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id="gstin"
                            value={formData.customerDetails.gstin}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              if (value.length <= 15) { // Limit to 15 characters
                                setFormData(prev => ({
                                  ...prev,
                                  customerDetails: { ...prev.customerDetails, gstin: value }
                                }));
                                setCustomerValidated(false);
                                setErrors(prev => ({ ...prev, gstin: "" }));
                                
                                // Auto-fill company details for hardcoded GSTIN
                                if (value === '09AAACI5853L2Z5') {
                                  setFormData(prev => ({
                                    ...prev,
                                    customerDetails: {
                                      ...prev.customerDetails,
                                      gstin: value,
                                      company: 'INDIAMART INTERMESH LTD.',
                                      address: '6th Floor, Tower 2, Assotech Business Cresterra, Plot No. 22, Noida, Sector 135',
                                      pincode: '201305',
                                      city: 'Noida',
                                      state: 'Uttar Pradesh',
                                      country: 'India'
                                    }
                                  }));
                                }
                              }
                            }}
                            maxLength={15}
                            required={formData.licenseType === "GST Practitioner"}
                            disabled={customerValidated}
                            className={errors.gstin ? "border-red-500 focus:border-red-500" : ""}
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter GSTIN to auto fill company details</p>
                          {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
                          {formData.customerDetails.gstin.length === 15 && formData.customerDetails.gstin === '09AAACI5853L2Z5' && (
                            <p className="text-sm text-green-600 mt-1">✓ GSTIN validated - Company details auto-filled</p>
                          )}
                          {formData.customerDetails.gstin.length === 15 && formData.customerDetails.gstin !== '09AAACI5853L2Z5' && (
                            <p className="text-sm text-gray-500 mt-1">GSTIN format validated</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="company">Company Name</Label>
                          <Input
                            id="company"
                            value={formData.customerDetails.company}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, company: e.target.value }
                            }))}
                            disabled={customerValidated}
                          />
                        </div>

                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.customerDetails.address}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, address: e.target.value }
                            }))}
                            disabled={customerValidated}
                          />
                        </div>

                        <div>
                          <Label htmlFor="city">City</Label>
                          <Select 
                            value={formData.customerDetails.city} 
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, city: value }
                            }))}
                            disabled={customerValidated}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_CITIES.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 3: Pincode, State */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={formData.customerDetails.pincode}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, pincode: e.target.value }
                            }))}
                            disabled={customerValidated}
                          />
                        </div>

                        <div>
                          <Label htmlFor="state">State</Label>
                          <Select 
                            value={formData.customerDetails.state} 
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, state: value }
                            }))}
                            disabled={customerValidated}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CA Specific Fields */}
                  {formData.licenseType === "CA" && (
                    <div className="space-y-4">
                      {/* Row 1: Category, Mobile, Email, Name */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <select
                            id="category"
                            value={formData.licenseType}
                            onChange={(e) => handleLicenseTypeChange(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="Retail">Regular</option>
                            <option value="CA">CA</option>
                            <option value="Accountant">Accountant</option>
                            <option value="GST Practitioner">GSTP</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="mobile">Mobile <span className="text-red-500">*</span></Label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                              +91
                            </span>
                            <Input
                              id="mobile"
                              type="tel"
                              value={formData.customerDetails.mobile}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (value.length <= 10) { // Limit to 10 digits
                                  setFormData(prev => ({
                                    ...prev,
                                    customerDetails: { ...prev.customerDetails, mobile: value }
                                  }));
                                  setCustomerValidated(false);
                                  setErrors(prev => ({ ...prev, mobile: "" }));
                                }
                              }}
                              maxLength={10}
                              required
                              disabled={customerValidated}
                              className={`rounded-l-none ${errors.mobile ? "border-red-500 focus:border-red-500" : ""}`}
                            />
                          </div>
                          {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                        </div>

                        <div>
                          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.customerDetails.email}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                customerDetails: { ...prev.customerDetails, email: e.target.value }
                              }));
                              setCustomerValidated(false);
                              setErrors(prev => ({ ...prev, email: "" }));
                            }}
                            required
                            disabled={customerValidated}
                            className={errors.email ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                          <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="name"
                            value={formData.customerDetails.name}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                customerDetails: { ...prev.customerDetails, name: e.target.value }
                              }));
                              setErrors(prev => ({ ...prev, name: "" }));
                            }}
                            required
                            disabled={customerValidated}
                            className={errors.name ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>
                      </div>

                      {/* Row 2: Company, GSTIN, City, Pincode */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="company">Company Name</Label>
                          <Input
                            id="company"
                            value={formData.customerDetails.company}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, company: e.target.value }
                            }))}
                            disabled={customerValidated}
                          />
                        </div>

                        <div>
                          <Label htmlFor="gstin">GSTIN</Label>
                          <Input
                            id="gstin"
                            value={formData.customerDetails.gstin}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, gstin: e.target.value.toUpperCase() }
                            }))}
                            disabled={customerValidated}
                            className={errors.gstin ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
                        </div>

                        <div>
                          <Label htmlFor="city">City</Label>
                          <Select 
                            value={formData.customerDetails.city} 
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, city: value }
                            }))}
                            disabled={customerValidated}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_CITIES.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={formData.customerDetails.pincode}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, pincode: e.target.value }
                            }))}
                            disabled={customerValidated}
                          />
                        </div>
                      </div>

                      {/* Row 3: State, Address, CA License No., PO Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Select 
                            value={formData.customerDetails.state} 
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, state: value }
                            }))}
                            disabled={customerValidated}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.customerDetails.address}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              customerDetails: { ...prev.customerDetails, address: e.target.value }
                            }))}
                            disabled={customerValidated}
                          />
                        </div>

                        <div>
                          <Label htmlFor="caLicenseNumber">CA License No. <span className="text-red-500">*</span></Label>
                          <Input
                            id="caLicenseNumber"
                            value={formData.customerDetails.caLicenseNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                              if (value.length <= 6) { // Limit to 6 digits
                                setFormData(prev => ({
                                  ...prev,
                                  customerDetails: { ...prev.customerDetails, caLicenseNumber: value }
                                }));
                                setCustomerValidated(false);
                                setErrors(prev => ({ ...prev, caLicenseNumber: "" }));
                              }
                            }}
                            maxLength={6}
                            required
                            disabled={customerValidated}
                            className={errors.caLicenseNumber ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {errors.caLicenseNumber && <p className="text-red-500 text-sm mt-1">{errors.caLicenseNumber}</p>}
                        </div>

                        <div>
                          <Label htmlFor="poUpload">Upload PO (Optional)</Label>
                          <div className="mt-1">
                            <input
                              id="poUpload"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => setFormData(prev => ({ ...prev, poUpload: e.target.files[0] }))}
                              className="hidden"
                            />
                            <label
                              htmlFor="poUpload"
                              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {formData.poUpload ? formData.poUpload.name : 'Browse Files'}
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save and Continue Button */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      onClick={validateCustomerDetails}
                      disabled={validatingCustomer || customerValidated}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {validatingCustomer ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          Validating...
                        </>
                      ) : customerValidated ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Saved
                        </>
                      ) : (
                        'Save and Continue'
                      )}
                    </Button>
                  </div>
                  </div>
                  )}
                </div>
                )}

                {/* Client References Section - Only show for Accountant license after customer validation and New Sales */}
                {formData.transactionType === "New Sales" && customerValidated && formData.licenseType === "Accountant" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client References</h3>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">Please provide at least 2 client references (first 2 are mandatory)</p>
                      {areMandatoryClientReferencesComplete() ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Ready for Product Selection</span>
                        </div>
                      ) : (
                        <div className="text-sm text-orange-600 font-medium">
                          Complete mandatory references to proceed
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {formData.clientReferences.slice(0, visibleClientReferences).map((client, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              Client Reference {index + 1}
                              {index < 2 && <span className="text-red-500 ml-1">*</span>}
                              {index >= 2 && <span className="text-gray-500 ml-1">(Optional)</span>}
                            </h4>
                            {/* Delete button for optional client references (3, 4, 5) */}
                            {index >= 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeClientReference(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`client-name-${index}`}>
                                Name {index < 2 && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                id={`client-name-${index}`}
                                value={client.name}
                                onChange={(e) => {
                                  const newClientReferences = [...formData.clientReferences];
                                  newClientReferences[index] = { ...newClientReferences[index], name: e.target.value };
                                  setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
                                }}
                                required={index < 2}
                                className={errors[`client-${index}-name`] ? "border-red-500 focus:border-red-500" : ""}
                              />
                              {errors[`client-${index}-name`] && <p className="text-red-500 text-sm mt-1">{errors[`client-${index}-name`]}</p>}
                            </div>

                            <div>
                              <Label htmlFor={`client-email-${index}`}>
                                Email {index < 2 && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                id={`client-email-${index}`}
                                type="email"
                                value={client.email}
                                onChange={(e) => {
                                  const newClientReferences = [...formData.clientReferences];
                                  newClientReferences[index] = { ...newClientReferences[index], email: e.target.value };
                                  setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
                                  
                                  // Validate client references on change for Accountant license
                                  if (formData.licenseType === "Accountant") {
                                    const validation = validateClientReferences();
                                    setErrors(prev => ({ 
                                      ...prev, 
                                      ...validation.errors,
                                      [`clientRef_${index}_email`]: validation.errors[`clientRef_${index}_email`] || ""
                                    }));
                                  }
                                }}
                                required={index < 2}
                                className={errors[`clientRef_${index}_email`] ? "border-red-500 focus:border-red-500" : ""}
                              />
                              {errors[`clientRef_${index}_email`] && <p className="text-red-500 text-sm mt-1">{errors[`clientRef_${index}_email`]}</p>}
                            </div>

                            <div>
                              <Label htmlFor={`client-mobile-${index}`}>
                                Mobile {index < 2 && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                id={`client-mobile-${index}`}
                                value={client.mobile}
                                onChange={(e) => {
                                  const newClientReferences = [...formData.clientReferences];
                                  newClientReferences[index] = { ...newClientReferences[index], mobile: e.target.value };
                                  setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
                                  
                                  // Validate client references on change for Accountant license
                                  if (formData.licenseType === "Accountant") {
                                    const validation = validateClientReferences();
                                    setErrors(prev => ({ 
                                      ...prev, 
                                      ...validation.errors,
                                      [`clientRef_${index}_mobile`]: validation.errors[`clientRef_${index}_mobile`] || ""
                                    }));
                                  }
                                }}
                                required={index < 2}
                                className={errors[`clientRef_${index}_mobile`] ? "border-red-500 focus:border-red-500" : ""}
                              />
                              {errors[`clientRef_${index}_mobile`] && <p className="text-red-500 text-sm mt-1">{errors[`clientRef_${index}_mobile`]}</p>}
                            </div>

                            <div>
                              <Label htmlFor={`client-gstin-${index}`}>GSTIN</Label>
                              <Input
                                id={`client-gstin-${index}`}
                                value={client.gstin}
                                onChange={(e) => {
                                  const newClientReferences = [...formData.clientReferences];
                                  newClientReferences[index] = { ...newClientReferences[index], gstin: e.target.value.toUpperCase() };
                                  setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
                                  
                                  // Validate client references on change for Accountant license
                                  if (formData.licenseType === "Accountant") {
                                    const validation = validateClientReferences();
                                    setErrors(prev => ({ 
                                      ...prev, 
                                      ...validation.errors,
                                      [`clientRef_${index}_gstin`]: validation.errors[`clientRef_${index}_gstin`] || ""
                                    }));
                                  }
                                }}
                                className={errors[`clientRef_${index}_gstin`] ? "border-red-500 focus:border-red-500" : ""}
                              />
                              {errors[`clientRef_${index}_gstin`] && <p className="text-red-500 text-sm mt-1">{errors[`clientRef_${index}_gstin`]}</p>}
                            </div>

                            <div>
                              <Label htmlFor={`client-company-${index}`}>Company Name</Label>
                              <Input
                                id={`client-company-${index}`}
                                value={client.company}
                                onChange={(e) => {
                                  const newClientReferences = [...formData.clientReferences];
                                  newClientReferences[index] = { ...newClientReferences[index], company: e.target.value };
                                  setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
                                }}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`client-address-${index}`}>Address</Label>
                              <Input
                                id={`client-address-${index}`}
                                value={client.address}
                                onChange={(e) => {
                                  const newClientReferences = [...formData.clientReferences];
                                  newClientReferences[index] = { ...newClientReferences[index], address: e.target.value };
                                  setFormData(prev => ({ ...prev, clientReferences: newClientReferences }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add More Client References Button */}
                      {visibleClientReferences < 5 && (
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setVisibleClientReferences(prev => prev + 1)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add More Client Reference ({visibleClientReferences + 1}/5)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Product & Plan Selection - Only show after customer validation for New Sales */}
                {formData.transactionType === "New Sales" && customerValidated && areMandatoryClientReferencesComplete() && (
                  <div className="space-y-6">
                    
                    {/* For Desktop, Mandi, Online, App, Recom, and RDP: Skip this section entirely */}
                    {(formData.productType === "Desktop" || formData.productType === "Mandi" || formData.productType === "Online" || formData.productType === "App" || formData.productType === "Recom" || formData.productType === "RDP") && (
                      <div id="product-type-section" className="hidden">
                        {/* Intentionally hidden - these products skip product selection */}
                      </div>
                    )}

                    {/* For other products: Show Product Selection with Region */}
                    {formData.productType !== "Desktop" && formData.productType !== "Mandi" && formData.productType !== "Online" && formData.productType !== "App" && formData.productType !== "Recom" && formData.productType !== "RDP" && (
                      <div id="product-type-section" className="flex items-center space-x-6">
                        <Label className="text-sm font-medium whitespace-nowrap">Product:</Label>
                        <div className="flex space-x-3">
                          {[
                            { value: "Desktop", label: "Desktop" },
                            { value: "Mandi", label: "Mandi" },
                            { value: "Online", label: "Online" },
                            { value: "App", label: "App" },
                            { value: "Recom", label: "Recom" },
                            { value: "RDP", label: "RDP" }
                          ].map((product) => (
                            <label key={product.value} className={`flex items-center cursor-pointer p-3 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                              formData.productType === product.value 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200"
                            }`}>
                              <input
                                type="radio"
                                name="productType"
                                value={product.value}
                                checked={formData.productType === product.value}
                                onChange={(e) => {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    productType: e.target.value,
                                    licenseModel: "",
                                    duration: "",
                                    accessType: "",
                                    userCount: "",
                                    companyCount: "",
                                    planName: ""
                                  }));
                                  setPlanQuantities({}); // Reset plan quantities when product type changes
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                              />
                              <span className="text-gray-700 font-medium text-sm">{product.label}</span>
                            </label>
                          ))}
                        </div>

                        {/* Region Dropdown in Same Row - Only show for Mandi (but this section won't show for Mandi anymore) */}
                        {formData.productType === "Mandi" && (
                          <div className="flex items-center space-x-3 ml-8">
                            <Label className="text-sm font-medium whitespace-nowrap">Region:</Label>
                            <select
                              value={formData.region}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                region: e.target.value
                              }))}
                              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-green-400 transition-all min-w-[200px]"
                            >
                              <option value="India">India</option>
                              <option value="Indian Subcontinent">Indian Subcontinent</option>
                              <option value="Global">Global</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Desktop Product Configuration */}
                    {formData.productType === "Desktop" && (
                      <div className="space-y-4">
                        {/* Duration Selection for Desktop */}
                        <div className="flex items-center space-x-8">
                          {/* Duration Selection */}
                          <div className="flex items-center space-x-3">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "360", label: "360 Days" },
                                { value: "1080", label: "1080 Days" }
                              ].map((duration) => (
                                <label key={duration.value} className={`flex items-center cursor-pointer px-2 py-1.5 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                  formData.duration === duration.value
                                    ? "border-orange-500 bg-orange-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="duration"
                                    value={duration.value}
                                    checked={formData.duration === duration.value}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        licenseModel: "Subscription", // Set default license model
                                        duration: e.target.value,
                                        planName: ""
                                      }));
                                      setPlanQuantities({}); // Reset plan quantities when duration changes
                                    }}
                                    className="w-3.5 h-3.5 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                    {/* Better 20% OFF styling - inline with the text */}
                                    {duration.value === "1080" && (
                                      <span className="text-[10px] text-green-600 font-semibold">
                                        20% OFF
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Region Selection */}
                          <div className="flex items-center space-x-3">
                            <Label className="text-sm font-medium whitespace-nowrap">Region:</Label>
                            <select
                              value={formData.region}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                region: e.target.value
                              }))}
                              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-green-400 transition-all min-w-[200px]"
                            >
                              <option value="India">India</option>
                              <option value="Indian Subcontinent">Indian Subcontinent</option>
                              <option value="Global">Global</option>
                            </select>
                          </div>
                        </div>

                        {/* Desktop Plans Display - 4 Column Grid with Quantity Controls */}
                        {formData.duration && (
                          <div data-scroll-target="desktop-plans" className="space-y-2">
                            <Label className="text-sm font-medium">Plans:</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {getDesktopPlans(formData.licenseModel, formData.duration).map((plan, index) => {
                                const quantity = planQuantities[plan.name] || 0;
                                const count = planCounts[plan.name] || 0;
                                const isClientServer = plan.name.toLowerCase().includes('client server');
                                return (
                                  <div 
                                    key={plan.name} 
                                    className={`border-2 rounded-lg p-2 transition-all flex flex-col ${
                                      quantity > 0
                                        ? "border-blue-500 bg-blue-50 shadow-md" 
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    {/* Plan Name */}
                                    <div className="text-xs font-medium text-gray-900 mb-1">
                                      {plan.name}
                                    </div>
                                    
                                    {/* Price */}
                                    <div className="flex flex-col mb-auto">
                                      <span className="text-xs font-bold text-blue-600">
                                        ₹{plan.price?.toLocaleString('en-IN') || 'Contact'}
                                      </span>
                                      {/* Show original price (strikethrough) for 1080 day plans */}
                                      {formData.duration === "1080" && plan.discount > 0 && (
                                        <span className="text-[10px] text-gray-500 line-through">
                                          ₹{(plan.basePrice * 3)?.toLocaleString('en-IN')}
                                        </span>
                                      )}
                                    </div>

                                    {/* Controls Row at Bottom */}
                                    <div className="flex items-center justify-between mt-2 pt-1">
                                      {/* Count Control - Show only for Client Server plans when quantity >= 1 */}
                                      {isClientServer && quantity >= 1 ? (
                                        <div className="flex items-center">
                                          <span className="text-[10px] text-gray-600 mr-1">Count:</span>
                                          <div className="flex items-center bg-white rounded border border-gray-300 px-0.5 py-0.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (count > 0) {
                                                  const newCounts = { ...planCounts, [plan.name]: count - 1 };
                                                  setPlanCounts(newCounts);
                                                }
                                              }}
                                              className="text-gray-600 hover:text-red-600 font-bold text-[10px] w-3 h-3 flex items-center justify-center"
                                            >
                                              -
                                            </button>
                                            <span className="text-[10px] font-semibold text-gray-900 min-w-[10px] text-center px-0.5">
                                              {count}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newCounts = { ...planCounts, [plan.name]: count + 1 };
                                                setPlanCounts(newCounts);
                                              }}
                                              className="text-gray-600 hover:text-green-600 font-bold text-[10px] w-3 h-3 flex items-center justify-center"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div></div>
                                      )}

                                      {/* Quantity Counter */}
                                      <div className="flex items-center bg-white rounded border border-gray-300 px-1 py-0.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (quantity > 0) {
                                              const newQuantities = { ...planQuantities, [plan.name]: quantity - 1 };
                                              setPlanQuantities(newQuantities);
                                              // Update planName if quantity becomes 0
                                              if (quantity - 1 === 0 && formData.planName === plan.name) {
                                                setFormData(prev => ({ ...prev, planName: "" }));
                                              }
                                            }
                                          }}
                                          className="text-gray-600 hover:text-red-600 font-bold text-xs w-4 h-4 flex items-center justify-center"
                                        >
                                          -
                                        </button>
                                        <span className="text-xs font-semibold text-gray-900 min-w-[12px] text-center px-1">
                                          {quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newQuantities = { ...planQuantities, [plan.name]: quantity + 1 };
                                            setPlanQuantities(newQuantities);
                                            // Set this plan as selected if it's the first one with quantity
                                            if (quantity === 0) {
                                              setFormData(prev => ({ ...prev, planName: plan.name }));
                                            }
                                          }}
                                          className="text-gray-600 hover:text-green-600 font-bold text-xs w-4 h-4 flex items-center justify-center"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mandi Product Configuration - Same as Desktop */}
                    {formData.productType === "Mandi" && (
                      <div className="space-y-4">
                        {/* Duration Selection for Mandi */}
                        <div className="flex items-center space-x-8">
                          <div className="flex items-center space-x-3">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "360", label: "360 Days" },
                                { value: "1080", label: "1080 Days" }
                              ].map((duration) => (
                                <label key={duration.value} className={`flex items-center cursor-pointer px-2 py-1.5 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                  formData.duration === duration.value
                                    ? "border-orange-500 bg-orange-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="radio"
                                    name="duration"
                                    value={duration.value}
                                    checked={formData.duration === duration.value}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        licenseModel: "Subscription",
                                        duration: e.target.value,
                                        planName: ""
                                      }));
                                      setPlanQuantities({});
                                    }}
                                    className="w-3.5 h-3.5 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                    {duration.value === "1080" && (
                                      <span className="text-[10px] text-green-600 font-semibold">
                                        20% OFF
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Region Selection - Same as Desktop */}
                          <div className="flex items-center space-x-3">
                            <Label className="text-sm font-medium whitespace-nowrap">Region:</Label>
                            <select
                              value={formData.region}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                region: e.target.value
                              }))}
                              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-green-400 transition-all min-w-[200px]"
                            >
                              <option value="India">India</option>
                              <option value="Indian Subcontinent">Indian Subcontinent</option>
                              <option value="Global">Global</option>
                            </select>
                          </div>
                        </div>

                        {/* Mandi Plans Display - Only Saffron and Emerald with User Types */}
                        {formData.duration && (
                          <div data-scroll-target="mandi-plans" className="space-y-2">
                            <Label className="text-sm font-medium">Plans:</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {getDesktopPlans(formData.licenseModel, formData.duration)
                                .filter(plan => {
                                  const planName = plan.name.toLowerCase();
                                  const isSaffronOrEmerald = planName.includes('saffron') || planName.includes('emerald');
                                  const hasUserType = planName.includes('single user') || 
                                                     planName.includes('multi user') || 
                                                     planName.includes('client server');
                                  return isSaffronOrEmerald && hasUserType;
                                })
                                .map((plan, index) => {
                                const quantity = planQuantities[plan.name] || 0;
                                const count = planCounts[plan.name] || 0;
                                const isClientServer = plan.name.toLowerCase().includes('client server');
                                return (
                                  <div 
                                    key={plan.name} 
                                    className={`relative border-2 rounded-lg p-2 transition-all ${
                                      quantity > 0
                                        ? "border-blue-500 bg-blue-50 shadow-md" 
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="text-xs font-medium text-gray-900 mb-1 pr-8">
                                      {plan.name}
                                    </div>
                                    <div className="flex flex-col mb-1">
                                      <span className="text-xs font-bold text-blue-600">
                                        ₹{plan.price?.toLocaleString('en-IN') || 'Contact'}
                                      </span>
                                      {formData.duration === "1080" && plan.discount > 0 && (
                                        <span className="text-[10px] text-gray-500 line-through">
                                          ₹{(plan.basePrice * 3)?.toLocaleString('en-IN')}
                                        </span>
                                      )}
                                    </div>

                                    {/* Count Control - Show only for Client Server plans when quantity >= 1 */}
                                    {isClientServer && quantity >= 1 && (
                                      <div className="mb-1 flex items-center">
                                        <span className="text-[10px] text-gray-600 mr-1">Count:</span>
                                        <div className="flex items-center bg-white rounded border border-gray-300 px-0.5 py-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (count > 0) {
                                                const newCounts = { ...planCounts, [plan.name]: count - 1 };
                                                setPlanCounts(newCounts);
                                              }
                                            }}
                                            className="text-gray-600 hover:text-red-600 font-bold text-[10px] w-3 h-3 flex items-center justify-center"
                                          >
                                            -
                                          </button>
                                          <span className="text-[10px] font-semibold text-gray-900 min-w-[10px] text-center px-0.5">
                                            {count}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newCounts = { ...planCounts, [plan.name]: count + 1 };
                                              setPlanCounts(newCounts);
                                            }}
                                            className="text-gray-600 hover:text-green-600 font-bold text-[10px] w-3 h-3 flex items-center justify-center"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    <div className="absolute bottom-1.5 right-1.5 flex items-center bg-white rounded border border-gray-300 px-1 py-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (quantity > 0) {
                                            const newQuantities = { ...planQuantities, [plan.name]: quantity - 1 };
                                            setPlanQuantities(newQuantities);
                                            if (quantity - 1 === 0 && formData.planName === plan.name) {
                                              setFormData(prev => ({ ...prev, planName: "" }));
                                            }
                                          }
                                        }}
                                        className="text-gray-600 hover:text-red-600 font-bold text-xs w-4 h-4 flex items-center justify-center"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-semibold text-gray-900 min-w-[12px] text-center px-1">
                                        {quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newQuantities = { ...planQuantities, [plan.name]: quantity + 1 };
                                          setPlanQuantities(newQuantities);
                                          if (quantity === 0) {
                                            setFormData(prev => ({ ...prev, planName: plan.name }));
                                          }
                                        }}
                                        className="text-gray-600 hover:text-green-600 font-bold text-xs w-4 h-4 flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Online Product Configuration */}
                    {formData.productType === "Online" && (
                      <div className="space-y-4">
                        {/* All fields in single row */}
                        <div className="flex items-center space-x-6">
                          {/* User Count (Mandatory) - Add/Reduce control */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">User Count:</Label>
                            <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onlineUserCount > 1) {
                                    const newCount = onlineUserCount - 1;
                                    setOnlineUserCount(newCount);
                                    // Auto-update company count to match user count
                                    setOnlineCompanyCount(newCount);
                                  }
                                }}
                                className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                {onlineUserCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCount = onlineUserCount + 1;
                                  setOnlineUserCount(newCount);
                                  // Auto-update company count to match user count
                                  setOnlineCompanyCount(newCount);
                                }}
                                className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Company Count (Mandatory) - Add/Reduce control prefilled with User Count */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Company Count:</Label>
                            <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onlineCompanyCount > 1) {
                                    setOnlineCompanyCount(onlineCompanyCount - 1);
                                  }
                                }}
                                className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                                {onlineCompanyCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setOnlineCompanyCount(onlineCompanyCount + 1);
                                }}
                                className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Database Type - Radio buttons */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Database Type:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "Access", label: "Access" },
                                { value: "Client Server", label: "Client Server" }
                              ].map((dbType) => (
                                <label key={dbType.value} className={`flex items-center cursor-pointer px-3 py-2 border-0 rounded-lg hover:shadow-md transition-all ${
                                  onlineDatabaseType === dbType.value
                                    ? "bg-blue-50" 
                                    : "bg-gray-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="onlineDatabaseType"
                                    value={dbType.value}
                                    checked={onlineDatabaseType === dbType.value}
                                    onChange={(e) => {
                                      setOnlineDatabaseType(e.target.value);
                                      // Set planName to trigger order summary
                                      setFormData(prev => ({ ...prev, planName: `Online ${e.target.value}` }));
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-2"
                                  />
                                  <span className="text-gray-700 font-medium text-sm whitespace-nowrap">{dbType.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Duration Selection for Online - Same as Desktop */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "360", label: "360 Days" },
                                { value: "1080", label: "1080 Days" }
                              ].map((duration) => (
                                <label key={duration.value} className={`flex items-center cursor-pointer px-2 py-1.5 border-0 rounded-lg hover:shadow-md transition-all ${
                                  formData.duration === duration.value
                                    ? "bg-orange-50" 
                                    : "bg-gray-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="onlineDuration"
                                    value={duration.value}
                                    checked={formData.duration === duration.value}
                                    onChange={(e) => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        duration: e.target.value
                                      }));
                                    }}
                                    className="w-3.5 h-3.5 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-xs whitespace-nowrap">{duration.label}</span>
                                    {duration.value === "1080" && (
                                      <span className="text-[10px] text-green-600 font-semibold">
                                        20% OFF
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* App Product Configuration - Direct Flow (No Subscription Validation) */}
                    {formData.productType === "App" && (
                      <div className="space-y-4">
                        {/* Subscription Count (Mandatory) - Add/Reduce control */}
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium whitespace-nowrap">Subscription Count:</Label>
                          <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (appSubscriptionCount > 1) {
                                  setAppSubscriptionCount(appSubscriptionCount - 1);
                                }
                              }}
                              className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                              {appSubscriptionCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAppSubscriptionCount(appSubscriptionCount + 1);
                              }}
                              className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Duration Selection - Same as Desktop */}
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                          <div className="flex space-x-2">
                            {[
                              { value: "360", label: "360 Days" },
                              { value: "1080", label: "1080 Days" }
                            ].map((duration) => (
                              <label key={duration.value} className={`flex items-center cursor-pointer px-2 py-1.5 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                formData.duration === duration.value
                                  ? "border-orange-500 bg-orange-50" 
                                  : "border-gray-200"
                              }`}>
                                <input
                                  type="radio"
                                  name="appDuration"
                                  value={duration.value}
                                  checked={formData.duration === duration.value}
                                  onChange={(e) => {
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      duration: e.target.value,
                                      planName: `App Subscription ${e.target.value} Days` // Set planName for order summary
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                />
                                <div className="flex flex-col">
                                  <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                  {duration.value === "1080" && (
                                    <span className="text-[10px] text-green-600 font-semibold">
                                      20% OFF
                                    </span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* App Usage Information Section - Show after duration is selected */}
                    {formData.productType === "App" && formData.duration && (
                      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-4">
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-3 mb-4 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Currently, you have 20 expired apps. 
                            <span className="text-blue-600 underline cursor-pointer ml-1">
                              Also, expiry date of all active apps will be reset to be same.
                            </span>
                          </p>
                        </div>

                        <h4 className="text-base font-bold text-gray-900 mb-3">Current App Usage Details</h4>
                        
                        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-600 text-white">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold">App ID</th>
                                <th className="px-3 py-2 text-left font-semibold">Type</th>
                                <th className="px-3 py-2 text-left font-semibold">Status</th>
                                <th className="px-3 py-2 text-left font-semibold">Last Used</th>
                                <th className="px-3 py-2 text-left font-semibold">Start Date</th>
                                <th className="px-3 py-2 text-left font-semibold">End Date</th>
                                <th className="px-3 py-2 text-left font-semibold">New End Date</th>
                                <th className="px-3 py-2 text-right font-semibold">New Validity (Days)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Sample data rows - Replace with actual data */}
                              <tr className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-800">4121487662</td>
                                <td className="px-3 py-2 text-gray-800">Paid</td>
                                <td className="px-3 py-2 text-gray-800">Active (Reset)</td>
                                <td className="px-3 py-2 text-gray-800"></td>
                                <td className="px-3 py-2 text-gray-800">30-Dec-25</td>
                                <td className="px-3 py-2 text-gray-800">04-Mar-27</td>
                                <td className="px-3 py-2 text-gray-800">27-Feb-27</td>
                                <td className="px-3 py-2 text-right text-gray-800 font-medium">391</td>
                              </tr>
                              <tr className="border-b border-dotted border-gray-300 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-800">4180148876</td>
                                <td className="px-3 py-2 text-gray-800">Paid</td>
                                <td className="px-3 py-2 text-gray-800">Active (Reset)</td>
                                <td className="px-3 py-2 text-gray-800"></td>
                                <td className="px-3 py-2 text-gray-800">05-Sep-23</td>
                                <td className="px-3 py-2 text-gray-800">04-Mar-27</td>
                                <td className="px-3 py-2 text-gray-800">27-Feb-27</td>
                                <td className="px-3 py-2 text-right text-gray-800 font-medium">391</td>
                              </tr>
                              <tr className="border-b border-dotted border-gray-300 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-800">4121487616</td>
                                <td className="px-3 py-2 text-gray-800">Paid</td>
                                <td className="px-3 py-2 text-gray-800">Active (Reset)</td>
                                <td className="px-3 py-2 text-gray-800"></td>
                                <td className="px-3 py-2 text-gray-800">30-Dec-25</td>
                                <td className="px-3 py-2 text-gray-800">04-Mar-27</td>
                                <td className="px-3 py-2 text-gray-800">27-Feb-27</td>
                                <td className="px-3 py-2 text-right text-gray-800 font-medium">391</td>
                              </tr>
                              <tr className="border-b border-dotted border-gray-300 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-800">4180149214</td>
                                <td className="px-3 py-2 text-gray-800">Paid</td>
                                <td className="px-3 py-2 text-gray-800">Active (Reset)</td>
                                <td className="px-3 py-2 text-gray-800"></td>
                                <td className="px-3 py-2 text-gray-800">05-Sep-23</td>
                                <td className="px-3 py-2 text-gray-800">04-Mar-27</td>
                                <td className="px-3 py-2 text-gray-800">27-Feb-27</td>
                                <td className="px-3 py-2 text-right text-gray-800 font-medium">391</td>
                              </tr>
                              <tr className="border-b border-dotted border-gray-300 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-800">4121487663</td>
                                <td className="px-3 py-2 text-gray-800">Paid</td>
                                <td className="px-3 py-2 text-gray-800">Active (Reset)</td>
                                <td className="px-3 py-2 text-gray-800"></td>
                                <td className="px-3 py-2 text-gray-800">30-Dec-25</td>
                                <td className="px-3 py-2 text-gray-800">04-Mar-27</td>
                                <td className="px-3 py-2 text-gray-800">27-Feb-27</td>
                                <td className="px-3 py-2 text-right text-gray-800 font-medium">391</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 text-sm text-gray-700">
                          <p><strong>Total Active Apps:</strong> 5</p>
                          <p><strong>Total Expired Apps:</strong> 20</p>
                        </div>
                      </div>
                    )}

                    {/* Recom Product Configuration - Market Place Based */}
                    {/* Recom Product Configuration - Direct Flow (No Subscription Validation) */}
                    {formData.productType === "Recom" && (
                      <div className="space-y-4">
                        {/* Market Place Selection */}
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium whitespace-nowrap">Market Place:</Label>
                          <div className="flex space-x-2">
                            {[
                              { value: "Single", label: "Single" },
                              { value: "Multiple", label: "Multiple" }
                            ].map((marketplace) => (
                              <label key={marketplace.value} className={`flex items-center cursor-pointer px-3 py-2 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                recomMarketPlace === marketplace.value
                                  ? "border-blue-500 bg-blue-50" 
                                  : "border-gray-200"
                              }`}>
                                <input
                                  type="radio"
                                  name="recomMarketPlace"
                                  value={marketplace.value}
                                  checked={recomMarketPlace === marketplace.value}
                                  onChange={(e) => {
                                    setRecomMarketPlace(e.target.value);
                                    setPlanQuantities({}); // Reset plan quantities
                                    setFormData(prev => ({ ...prev, planName: "" }));
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-gray-700 font-medium text-sm">{marketplace.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Recom Plans Display - Based on Market Place Selection */}
                        {recomMarketPlace && (
                          <div data-scroll-target="recom-plans" className="space-y-2">
                            <Label className="text-sm font-medium">Number of Orders:</Label>
                        
                        {/* Single Market Place Plans */}
                        {recomMarketPlace === "Single" && (
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { name: "A", orders: "6,000", days: "360" },
                              { name: "B", orders: "12,000", days: "360" },
                              { name: "C", orders: "30,000", days: "360" },
                              { name: "D", orders: "60,000", days: "360" },
                              { name: "E", orders: "120,000", days: "360" }
                            ].map((plan) => {
                              const isSelected = formData.planName === `Recom ${plan.name}`;
                              return (
                                <div 
                                  key={plan.name}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}` }));
                                  }}
                                  className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50 shadow-md" 
                                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                    {plan.name}
                                  </div>
                                  <div className="text-center mt-5">
                                    <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                    <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Multiple Market Place Plans */}
                        {recomMarketPlace === "Multiple" && (
                          <div className="space-y-2">
                            {/* First Row - 5 plans */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "A", orders: "300", days: "21" },
                                { name: "B", orders: "12,000", days: "360" },
                                { name: "C", orders: "30,000", days: "360" },
                                { name: "D", orders: "60,000", days: "360" },
                                { name: "E", orders: "120,000", days: "360" }
                              ].map((plan) => {
                                const isSelected = formData.planName === `Recom ${plan.name}`;
                                return (
                                  <div 
                                    key={plan.name}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}` }));
                                    }}
                                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50 shadow-md" 
                                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                      {plan.name}
                                    </div>
                                    <div className="text-center mt-5">
                                      <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                      <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Second Row - 3 plans */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "F", orders: "FOC - 300", days: "21", isFOC: true },
                                { name: "G", orders: "FOC - 12,000", days: "360", isFOC: true },
                                { name: "H", orders: "12,000", days: "720", isFOC: false }
                              ].map((plan) => {
                                const isSelected = formData.planName === `Recom ${plan.name}`;
                                return (
                                  <div 
                                    key={plan.name}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, planName: `Recom ${plan.name}` }));
                                    }}
                                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50 shadow-md" 
                                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-gray-300 text-gray-700 font-bold text-[10px] flex items-center justify-center rounded">
                                      {plan.name}
                                    </div>
                                    <div className="text-center mt-5">
                                      <div className="text-xs font-semibold text-gray-900">{plan.orders}</div>
                                      <div className="text-[10px] text-gray-600">({plan.days} days)</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                      </div>
                    )}

                    {/* Busy Online Product Configuration */}
                    {formData.productType === "Busy Online" && (
                      <div className="space-y-4">
                        {/* Duration, Access Type, and Customize - All in same row */}
                        <div className="flex items-center space-x-8">
                          {/* Step 1: Duration Selection */}
                          <div className="flex items-center space-x-3">
                            <Label className="text-sm font-medium whitespace-nowrap">Duration:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "360", label: "360 Days" },
                                { value: "90", label: "90 Days" }
                              ].map((duration) => (
                                <label key={duration.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-28 ${
                                  formData.duration === duration.value 
                                    ? "border-orange-500 bg-orange-50" 
                                    : "border-gray-200"
                                }`}>
                                  <input
                                    type="checkbox"
                                    name="duration"
                                    value={duration.value}
                                    checked={formData.duration === duration.value}
                                    onChange={(e) => setFormData(prev => ({ 
                                      ...prev, 
                                      duration: e.target.checked ? duration.value : "",
                                      accessType: "", // Reset access type when duration changes
                                      userCount: "1", // Reset to default
                                      companyCount: "1" // Reset to default
                                    }))}
                                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Step 2: Access Type - Show after duration is selected */}
                          {formData.duration && (
                            <div className="flex items-center space-x-3">
                              <Label className="text-sm font-medium whitespace-nowrap">Access Type:</Label>
                              <div className="flex space-x-2">
                                {[
                                  { value: "Access", label: "Access" },
                                  { value: "Client Server", label: "Client Server" }
                                ].map((access) => (
                                  <label key={access.value} className={`flex items-center cursor-pointer p-2 border-2 rounded-lg hover:shadow-md transition-all w-32 ${
                                    formData.accessType === access.value 
                                      ? "border-purple-500 bg-purple-50" 
                                      : "border-gray-200"
                                  }`}>
                                    <input
                                      type="checkbox"
                                      name="accessType"
                                      value={access.value}
                                      checked={formData.accessType === access.value}
                                      onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        accessType: e.target.checked ? access.value : "",
                                        userCount: "1", // Reset to default when access type changes
                                        companyCount: "1" // Reset to default when access type changes
                                      }))}
                                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 mr-2"
                                    />
                                    <span className="text-gray-700 font-medium text-xs">{access.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 3: User and Company Count - Show after access type is selected */}
                          {formData.accessType && (
                            <div className="flex items-center space-x-4">
                              <Label className="text-sm font-medium whitespace-nowrap">Customize:</Label>
                              
                              {/* User Count Field */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium whitespace-nowrap">Users:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.userCount}
                                  onChange={(e) => setFormData(prev => ({ ...prev, userCount: e.target.value }))}
                                  placeholder="1"
                                  className="w-16"
                                  required
                                />
                              </div>

                              {/* Company Count Field */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium whitespace-nowrap">Companies:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.companyCount}
                                  onChange={(e) => setFormData(prev => ({ ...prev, companyCount: e.target.value }))}
                                  placeholder="1"
                                  className="w-16"
                                  required
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Summary - Show after duration and access type are selected */}
                        {/* Removed the blue banner - order summary will be shown in main order summary section */}
                      </div>
                    )}

                    {/* Mazu Product Configuration */}
                    {formData.productType === "Mazu" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mazu Plans</h3>
                        <p className="text-yellow-700">Plans Coming Soon</p>
                        <p className="text-sm text-yellow-600 mt-2">We are working on exciting Mazu plans. Please check back later!</p>
                      </div>
                    )}

                    {/* RDP Product Configuration */}
                    {/* RDP Product Configuration - Direct Flow (No Subscription Validation) */}
                    {formData.productType === "RDP" && (
                      <div className="space-y-4">
                        {/* RDP Count with Add/Reduce Control */}
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium whitespace-nowrap">RDP:</Label>
                          <div className="flex items-center bg-white rounded border-0 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (rdpCount > 1) {
                                  setRdpCount(rdpCount - 1);
                                }
                              }}
                              className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-base font-semibold text-gray-900 min-w-[30px] text-center px-2">
                              {rdpCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRdpCount(rdpCount + 1);
                                // Set planName to trigger order summary
                                setFormData(prev => ({ ...prev, planName: "RDP Service" }));
                              }}
                              className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary - Only for New Sales flow */}
                {(() => {
                  // Only show for New Sales transaction type
                  if (formData.transactionType !== "New Sales") return false;
                  
                  const busyOnlineValid = formData.productType === "Busy Online" && formData.duration && formData.accessType && validateBusyOnlineCounts().isValid;
                  const onlineValid = formData.productType === "Online" && onlineUserCount >= 1 && onlineCompanyCount >= 1 && onlineDatabaseType && formData.duration;
                  const mandiValid = formData.productType === "Mandi" && formData.duration && Object.values(planQuantities).some(qty => qty > 0);
                  const appValid = formData.productType === "App" && appSubscriptionCount >= 1 && formData.duration;
                  const recomValid = formData.productType === "Recom" && recomMarketPlace && formData.planName;
                  const rdpValid = formData.productType === "RDP" && rdpCount >= 1;
                  const showOrderSummary = (((formData.productType === "Desktop" && formData.planName && calculateDesktopPricing()) || 
                                           mandiValid ||
                                           onlineValid ||
                                           appValid ||
                                           recomValid ||
                                           rdpValid ||
                                           busyOnlineValid) && customerValidated);
                  return showOrderSummary;
                })() && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h4 id="order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                    
                    <div>
                      {/* Invoice-Style Table */}
                      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Quantity</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {/* Generate line items from planQuantities */}
                            {(() => {
                              const lineItems = [];
                              let serialNo = 1;
                              
                              // For Desktop, Mandi products with plan quantities
                              if ((formData.productType === "Desktop" || formData.productType === "Mandi") && formData.duration) {
                                const plans = getDesktopPlans(formData.licenseModel, formData.duration);
                                plans.forEach(plan => {
                                  const quantity = planQuantities[plan.name] || 0;
                                  if (quantity > 0) {
                                    const rate = plan.price;
                                    const amount = rate * quantity;
                                    lineItems.push(
                                      <tr key={plan.name} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                        <td className="px-3 py-2 text-sm text-gray-900">{plan.name}</td>
                                        <td className="px-3 py-2 text-sm text-center text-gray-700">{formData.duration} Days</td>
                                        <td className="px-3 py-2 text-sm text-center text-gray-700">{quantity}</td>
                                        <td className="px-3 py-2 text-sm text-right text-gray-700">₹{rate.toLocaleString('en-IN')}</td>
                                        <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{amount.toLocaleString('en-IN')}</td>
                                      </tr>
                                    );
                                  }
                                });
                              }
                              
                              // For Recom product with single plan selection
                              if (formData.productType === "Recom" && formData.planName && recomMarketPlace) {
                                // Sample pricing for Recom plans
                                const recomPricing = {
                                  "Recom A": 10000,
                                  "Recom B": 20000,
                                  "Recom C": 40000,
                                  "Recom D": 70000,
                                  "Recom E": 120000,
                                  "Recom F": 0, // FOC
                                  "Recom G": 0, // FOC
                                  "Recom H": 30000
                                };
                                const basePrice = recomPricing[formData.planName] || 0;
                                
                                lineItems.push(
                                  <tr key="recom-product" className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      <div>{formData.planName}</div>
                                      <div className="text-xs text-gray-600">Market Place: {recomMarketPlace}</div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700">-</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700">1</td>
                                    <td className="px-3 py-2 text-sm text-right text-gray-700">₹{basePrice.toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{basePrice.toLocaleString('en-IN')}</td>
                                  </tr>
                                );
                              }
                              
                              // For App product with subscription-based model
                              if (formData.productType === "App" && formData.duration) {
                                // Sample pricing for App subscriptions
                                const appPricing = {
                                  "360": 8000,  // Base price for 360 days
                                  "1080": 19200 // Base price for 1080 days (3 years with 20% discount)
                                };
                                const basePrice = appPricing[formData.duration] || 0;
                                const totalPrice = basePrice * appSubscriptionCount;
                                
                                const productName = `App Subscription`;
                                const details = `Subscription ID: ${appSubscriptionId}, Count: ${appSubscriptionCount}`;
                                lineItems.push(
                                  <tr key="app-product" className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      <div>{productName}</div>
                                      <div className="text-xs text-gray-600">{details}</div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700">{formData.duration} Days</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700">{appSubscriptionCount}</td>
                                    <td className="px-3 py-2 text-sm text-right text-gray-700">₹{basePrice.toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</td>
                                  </tr>
                                );
                              }
                              
                              // For Online product with custom fields
                              if (formData.productType === "Online" && onlineDatabaseType && formData.duration) {
                                const pricing = calculateOnlinePricing();
                                if (pricing) {
                                  const productName = `Online - ${onlineDatabaseType}`;
                                  const details = `User Count: ${onlineUserCount}, Company Count: ${onlineCompanyCount}`;
                                  lineItems.push(
                                    <tr key="online-product" className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        <div>{productName}</div>
                                        <div className="text-xs text-gray-600">{details}</div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">{formData.duration} Days</td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">₹{pricing.basePrice.toLocaleString('en-IN')}</td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{pricing.basePrice.toLocaleString('en-IN')}</td>
                                    </tr>
                                  );
                                }
                              }
                              
                              // For Busy Online product with custom fields
                              if (formData.productType === "Busy Online" && formData.duration && formData.accessType) {
                                const pricing = calculateBusyOnlinePricing();
                                if (pricing) {
                                  const productName = `Busy Online - ${formData.accessType}`;
                                  const details = `User Count: ${formData.userCount || 0}, Company Count: ${formData.companyCount || 0}`;
                                  lineItems.push(
                                    <tr key="busy-online-product" className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        <div>{productName}</div>
                                        <div className="text-xs text-gray-600">{details}</div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">{formData.duration} Days</td>
                                      <td className="px-3 py-2 text-sm text-center text-gray-700">1</td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-700">₹{pricing.basePrice.toLocaleString('en-IN')}</td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{pricing.basePrice.toLocaleString('en-IN')}</td>
                                    </tr>
                                  );
                                }
                              }
                              
                              // For RDP product with count-based model
                              if (formData.productType === "RDP" && rdpCount >= 1) {
                                // Sample pricing for RDP
                                const rdpBasePrice = 15000; // Base price per RDP
                                const totalPrice = rdpBasePrice * rdpCount;
                                
                                lineItems.push(
                                  <tr key="rdp-product" className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm text-gray-700">{serialNo++}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      <div>RDP Service</div>
                                      <div className="text-xs text-gray-600">Remote Desktop Protocol</div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700">365 Days</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700">{rdpCount}</td>
                                    <td className="px-3 py-2 text-sm text-right text-gray-700">₹{rdpBasePrice.toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</td>
                                  </tr>
                                );
                              }
                              
                              // Show "No items" message if no line items
                              if (lineItems.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="6" className="px-3 py-4 text-sm text-center text-gray-500 italic">
                                      Select plans and add quantities to see line items
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return lineItems;
                            })()}
                          </tbody>
                        </table>
                        
                        {/* Summary Section */}
                        {(() => {
                          // Calculate totals
                          let subtotal = 0;
                          let discountAmount = 0;
                          let tdsAmount = 0;
                          let gstAmount = 0;
                          let grandTotal = 0;
                          let licenseDiscount = 0; // Define licenseDiscount here
                          
                          // For Online product - Calculate similar to Desktop
                          if (formData.productType === "Online" && onlineDatabaseType && formData.duration) {
                            // Sample pricing structure for Online product
                            const basePricing = {
                              "360_Access": 5000,
                              "360_Client Server": 10000,
                              "1080_Access": 12000,
                              "1080_Client Server": 24000
                            };
                            
                            const priceKey = `${formData.duration}_${onlineDatabaseType}`;
                            const basePrice = basePricing[priceKey] || 0;
                            
                            // Calculate total base price with user and company count multiplication
                            subtotal = basePrice * onlineUserCount * onlineCompanyCount;
                            
                            // Calculate discount if applicable (same as Desktop)
                            licenseDiscount = getDiscountByLicenseType(formData.licenseType);
                            discountAmount = Math.round((subtotal * licenseDiscount) / 100);
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate TDS if enabled (same as Desktop)
                            tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.1) : 0;
                            const afterTds = afterDiscount - tdsAmount;
                            
                            // Calculate GST (same as Desktop)
                            gstAmount = Math.round(afterTds * 0.18);
                            grandTotal = afterTds + gstAmount;
                          }
                          // For App product - Calculate similar to Desktop
                          else if (formData.productType === "App" && formData.duration) {
                            // Sample pricing for App subscriptions
                            const appPricing = {
                              "360": 8000,  // Base price for 360 days
                              "1080": 19200 // Base price for 1080 days (3 years with 20% discount)
                            };
                            const basePrice = appPricing[formData.duration] || 0;
                            
                            // Calculate total base price with subscription count
                            subtotal = basePrice * appSubscriptionCount;
                            
                            // Calculate discount if applicable (same as Desktop)
                            licenseDiscount = getDiscountByLicenseType(formData.licenseType);
                            discountAmount = Math.round((subtotal * licenseDiscount) / 100);
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate TDS if enabled (same as Desktop)
                            tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.1) : 0;
                            const afterTds = afterDiscount - tdsAmount;
                            
                            // Calculate GST (same as Desktop)
                            gstAmount = Math.round(afterTds * 0.18);
                            grandTotal = afterTds + gstAmount;
                          }
                          // For Recom product - Calculate similar to Desktop
                          else if (formData.productType === "Recom" && formData.planName && recomMarketPlace) {
                            // Sample pricing for Recom plans
                            const recomPricing = {
                              "Recom A": 10000,
                              "Recom B": 20000,
                              "Recom C": 40000,
                              "Recom D": 70000,
                              "Recom E": 120000,
                              "Recom F": 0, // FOC
                              "Recom G": 0, // FOC
                              "Recom H": 30000
                            };
                            
                            subtotal = recomPricing[formData.planName] || 0;
                            
                            // Calculate discount if applicable (same as Desktop)
                            licenseDiscount = getDiscountByLicenseType(formData.licenseType);
                            discountAmount = Math.round((subtotal * licenseDiscount) / 100);
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate TDS if enabled (same as Desktop)
                            tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.1) : 0;
                            const afterTds = afterDiscount - tdsAmount;
                            
                            // Calculate GST (same as Desktop)
                            gstAmount = Math.round(afterTds * 0.18);
                            grandTotal = afterTds + gstAmount;
                          }
                          // For Desktop, Mandi with plan quantities
                          else if ((formData.productType === "Desktop" || formData.productType === "Mandi") && formData.duration) {
                            const plans = getDesktopPlans(formData.licenseModel, formData.duration);
                            plans.forEach(plan => {
                              const quantity = planQuantities[plan.name] || 0;
                              if (quantity > 0) {
                                subtotal += plan.price * quantity;
                              }
                            });
                            
                            // Calculate discount if applicable
                            licenseDiscount = getDiscountByLicenseType(formData.licenseType);
                            discountAmount = Math.round((subtotal * licenseDiscount) / 100);
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate TDS if enabled
                            tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.1) : 0;
                            const afterTds = afterDiscount - tdsAmount;
                            
                            // Calculate GST
                            gstAmount = Math.round(afterTds * 0.18);
                            grandTotal = afterTds + gstAmount;
                          }
                          // For Busy Online product - Calculate similar to Desktop
                          else if (formData.productType === "Busy Online" && formData.duration && formData.accessType) {
                            // Sample pricing structure for Busy Online
                            const basePricing = {
                              "360_Access": 3999,
                              "360_Client Server": 7999,
                              "90_Access": 1199,
                              "90_Client Server": 2399
                            };
                            
                            const priceKey = `${formData.duration}_${formData.accessType}`;
                            const basePrice = basePricing[priceKey] || 0;
                            
                            const userCount = Math.max(parseInt(formData.userCount) || 0, 0);
                            const companyCount = Math.max(parseInt(formData.companyCount) || 0, 0);
                            
                            // Calculate total base price
                            subtotal = basePrice * userCount * companyCount;
                            
                            // Calculate discount if applicable (same as Desktop)
                            licenseDiscount = getDiscountByLicenseType(formData.licenseType);
                            discountAmount = Math.round((subtotal * licenseDiscount) / 100);
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate TDS if enabled (same as Desktop)
                            tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.1) : 0;
                            const afterTds = afterDiscount - tdsAmount;
                            
                            // Calculate GST (same as Desktop)
                            gstAmount = Math.round(afterTds * 0.18);
                            grandTotal = afterTds + gstAmount;
                          }
                          // For RDP product - Calculate similar to Desktop
                          else if (formData.productType === "RDP" && rdpCount >= 1) {
                            // Base price for RDP
                            const rdpBasePrice = 15000; // Base price per RDP
                            
                            // Calculate total base price with RDP count
                            subtotal = rdpBasePrice * rdpCount;
                            
                            // Calculate discount if applicable (same as Desktop)
                            licenseDiscount = getDiscountByLicenseType(formData.licenseType);
                            discountAmount = Math.round((subtotal * licenseDiscount) / 100);
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate TDS if enabled (same as Desktop)
                            tdsAmount = formData.deductTds ? Math.round(afterDiscount * 0.1) : 0;
                            const afterTds = afterDiscount - tdsAmount;
                            
                            // Calculate GST (same as Desktop)
                            gstAmount = Math.round(afterTds * 0.18);
                            grandTotal = afterTds + gstAmount;
                          }
                          
                          // Only show summary if there are line items
                          if (subtotal === 0) return null;
                          
                          return (
                            <div className="border-t border-gray-300 bg-gray-50">
                              <div className="px-3 py-2 space-y-2">
                                {/* Total */}
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Total:</span>
                                  <span className="text-sm font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                
                                {/* License Discount */}
                                {licenseDiscount > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">License Discount ({licenseDiscount}%):</span>
                                    <span className="text-sm font-semibold text-green-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                
                                {/* TDS Toggle */}
                                <div className="flex justify-between items-center border-t pt-2">
                                  <span className="text-sm font-medium text-gray-700">Deduct TDS:</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={formData.deductTds}
                                      onChange={(e) => handleTdsToggle(e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-2 text-xs font-medium text-gray-700">
                                      {formData.deductTds ? 'ON' : 'OFF'}
                                    </span>
                                  </label>
                                </div>
                                
                                {/* TDS Deduction */}
                                {formData.deductTds && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">TDS (10%):</span>
                                    <span className="text-sm font-semibold text-red-600">-₹{tdsAmount.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                
                                {/* GST */}
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                                  <span className="text-sm font-semibold text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                                </div>
                                
                                {/* Grand Total */}
                                <div className="flex justify-between items-center border-t pt-2 mt-2">
                                  <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                  <span className="text-lg font-bold text-blue-600">₹{grandTotal.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                    </div>
                  </div>
                )}

                {/* Action Buttons - Only for New Sales flow */}
                {(() => {
                  // Only show for New Sales transaction type
                  if (formData.transactionType !== "New Sales") return false;
                  
                  // Same condition as Order Summary visibility
                  const busyOnlineValid = formData.productType === "Busy Online" && formData.duration && formData.accessType && validateBusyOnlineCounts().isValid;
                  const onlineValid = formData.productType === "Online" && onlineUserCount >= 1 && onlineCompanyCount >= 1 && onlineDatabaseType && formData.duration;
                  const mandiValid = formData.productType === "Mandi" && formData.duration && Object.values(planQuantities).some(qty => qty > 0);
                  const appValid = formData.productType === "App" && appSubscriptionCount >= 1 && formData.duration;
                  const recomValid = formData.productType === "Recom" && recomMarketPlace && formData.planName;
                  const rdpValid = formData.productType === "RDP" && rdpCount >= 1;
                  const showOrderSummary = (((formData.productType === "Desktop" && formData.planName && calculateDesktopPricing()) || 
                                           mandiValid ||
                                           onlineValid ||
                                           appValid ||
                                           recomValid ||
                                           rdpValid ||
                                           busyOnlineValid) && customerValidated);
                  
                  return showOrderSummary && (
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || (() => {
                        // Check if final amount is 0 to disable Send Payment Link
                        if (formData.productType === "Desktop" || formData.productType === "Mandi") {
                          // For Desktop, Mandi - check if any plan has quantity > 0
                          const hasValidPlans = Object.values(planQuantities).some(qty => qty > 0);
                          if (!hasValidPlans) return true;
                          return false; // Enable button if plans are selected
                        } else if (formData.productType === "Recom") {
                          // For Recom - check if a plan is selected
                          if (!formData.planName || !recomMarketPlace) return true;
                          return false; // Enable button if plan and marketplace are selected
                        } else if (formData.productType === "App") {
                          // For App - check if all fields are filled
                          if (appSubscriptionCount < 1 || !formData.duration) {
                            return true;
                          }
                          return false;
                        } else if (formData.productType === "Online") {
                          // For Online - check if all required fields are filled
                          if (!onlineDatabaseType || !formData.duration || onlineUserCount < 1 || onlineCompanyCount < 1) {
                            return true;
                          }
                          return false;
                        } else if (formData.productType === "RDP") {
                          // For RDP - check if count is at least 1
                          if (rdpCount < 1) return true;
                          return false;
                        } else if (formData.productType === "Busy Online" && formData.duration && formData.accessType) {
                          const validation = validateBusyOnlineCounts();
                          if (!validation.isValid) return true; // Disable if validation fails
                          const basePrice = calculateBusyOnlinePrice();
                          const finalAmount = Math.round(basePrice * 1.18);
                          return finalAmount === 0;
                        }
                        return false;
                      })()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Send Payment Link'
                      )}
                    </Button>
                  </div>
                  );
                })()}
              </form>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Transactions Table - Only show when not creating a new transaction */}
        {!showCreateForm && (
        <div className="w-full max-w-none">
          {/* Old filter tabs removed - now using header filters */}

          <div>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="w-full text-sm border-collapse" style={{ fontFamily: 'Roboto Flex, sans-serif' }}>
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('customer_name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Customer</span>
                          {getSortIcon('customer_name')}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('team_name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Partner</span>
                          {getSortIcon('team_name')}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('salesperson')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Generated By</span>
                          {getSortIcon('salesperson')}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('product_type')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product & Plan</span>
                          {getSortIcon('product_type')}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('final_amount')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Amount</span>
                          {getSortIcon('final_amount')}
                        </div>
                      </th>
                      <th
                        className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('payment_method')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Payment Method</span>
                          {getSortIcon('payment_method')}
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '14px' }}>
                    {filteredTransactions.map((transaction, index) => (
                      <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                        {/* Date */}
                        <td className="py-3 px-4">
                          <div className="leading-tight">
                            <p className="text-gray-900 font-medium text-sm">{formatDate(transaction.created_at).dateMonth}</p>
                            <p className="text-gray-600 text-xs">{formatDate(transaction.created_at).year}</p>
                          </div>
                        </td>
                        {/* Customer - Contact Name, Company Name, City */}
                        <td className="py-3 px-4">
                          <div 
                            className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                            onClick={() => {
                              if (transaction.status === 'Draft') {
                                // For Draft status: Redirect to Generate Payment Link page with pre-filled data
                                setShowCreateForm(true);
                                // Pre-fill form with saved prospect details from draft transaction
                                setFormData(prev => ({
                                  ...prev,
                                  transactionType: "New Sales",
                                  productType: transaction.product_type || "Desktop",
                                  customerDetails: {
                                    mobile: transaction.customer_mobile || "",
                                    name: transaction.customer_name || "",
                                    email: transaction.customer_email || "",
                                    company: transaction.customer_company || "",
                                    gstin: transaction.customer_gstin || "",
                                    city: transaction.customer_city || "",
                                    pincode: transaction.customer_pincode || "",
                                    address: transaction.customer_address || "",
                                    state: transaction.customer_state || "",
                                    country: transaction.customer_country || "India",
                                    caPanNo: transaction.customer_ca_pan || "",
                                    caLicenseNumber: transaction.customer_ca_license || ""
                                  }
                                }));
                                // Set customer as validated since we're pre-filling from draft
                                setCustomerValidated(true);
                              } else {
                                // For all other statuses: Show order details modal
                                setSelectedTransaction(transaction);
                                setShowOrderSummaryModal(true);
                              }
                            }}
                          >
                            <p className="font-medium text-blue-600 text-sm hover:text-blue-800 truncate max-w-[200px]" title={transaction.customer_name}>{transaction.customer_name}</p>
                            <p className="text-gray-700 text-xs font-medium">{transaction.customer_mobile || '9999999999'}</p>
                            {transaction.customer_company && (
                              <p className="text-gray-600 text-xs truncate max-w-[200px]" title={transaction.customer_company}>{transaction.customer_company}</p>
                            )}
                            {transaction.customer_city && (
                              <p className="text-gray-500 text-xs">{transaction.customer_city}</p>
                            )}
                          </div>
                        </td>
                        {/* Partner - Inside Sales (Delhi Office), Inside Sales (3i), etc. */}
                        <td className="py-3 px-4">
                          <p className="text-gray-900 text-sm">
                            {(() => {
                              const partnerNames = ['Inside Sales (Delhi Office)', 'Inside Sales (3i)', 'Inside Sales (VMS Sec 2)', 'Inside Sales (Allset Chennai)'];
                              return partnerNames[index % partnerNames.length];
                            })()}
                          </p>
                        </td>
                        {/* Generated By - User Name (visible to Team Leader/ASM and above) */}
                        <td className="py-3 px-4">
                          <p className="text-gray-900 text-sm">
                            {transaction.salesperson?.name || 'System'}
                          </p>
                        </td>
                        {/* Product & Plan - Desktop Reg SS 1 Y format */}
                        <td className="py-3 px-4">
                          {transaction.status === 'Draft' ? (
                            <p className="text-gray-500 text-sm">-</p>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {(() => {
                                  const productNames = ['Standard - Client Server', 'Basic - Single User', 'Standard - Single User', 'Mobile App', 'Online', 'Mandi'];
                                  return productNames[index % productNames.length];
                                })()}
                              </p>
                              <p className="text-gray-600 text-xs">
                                {transaction.license_type} {transaction.plan_details?.model || ''} {transaction.plan_details?.duration || ''}
                              </p>
                            </div>
                          )}
                        </td>
                        {/* Amount */}
                        <td className="py-3 px-4">
                          {transaction.status === 'Draft' ? (
                            <p className="text-gray-500 text-sm">-</p>
                          ) : (
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{formatCurrency(transaction.final_amount)}</p>
                              {transaction.discount_percent > 0 && (
                                <p className="text-green-600 text-xs">{transaction.discount_percent}% off</p>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Status - Initiated, Pending, Received, Failed, Expired, Cancelled, Draft, Inv Generated, Inv Pending */}
                        <td className="py-3 px-4 text-center">
                          {(() => {
                            const status = transaction.status;
                            let badgeClass = 'bg-gray-100 text-gray-800';
                            let statusText = status;
                            
                            // Map statuses to display text
                            if (status === 'Success') {
                              const invoiceStatus = getInvoiceStatus?.(transaction) || 'Generated';
                              statusText = invoiceStatus === 'Generated' ? 'Inv Generated' : 'Inv Pending';
                              badgeClass = invoiceStatus === 'Generated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                            } else if (status === 'Initiated') {
                              badgeClass = 'bg-blue-100 text-blue-800';
                              statusText = 'Initiated';
                            } else if (status === 'Pending') {
                              badgeClass = 'bg-yellow-100 text-yellow-800';
                              statusText = 'Pending';
                            } else if (status === 'Failed') {
                              badgeClass = 'bg-red-100 text-red-800';
                              statusText = 'Failed';
                            } else if (status === 'Expired') {
                              badgeClass = 'bg-orange-100 text-orange-800';
                              statusText = 'Expired';
                            } else if (status === 'Cancelled') {
                              badgeClass = 'bg-gray-200 text-gray-800';
                              statusText = 'Cancelled';
                            } else if (status === 'Draft') {
                              badgeClass = 'bg-purple-100 text-purple-800';
                              statusText = 'Draft';
                            }

                            return (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                                {statusText}
                              </span>
                            );
                          })()}
                        </td>
                        
                        {/* Payment Method - UPI, Debit Card, Netbanking */}
                        <td className="py-3 px-4">
                          {transaction.status === 'Draft' ? (
                            <p className="text-gray-500 text-sm">-</p>
                          ) : (
                            <p className="text-gray-900 text-sm">
                              {(() => {
                                const paymentMethods = ['UPI', 'Debit Card', 'Netbanking'];
                                return paymentMethods[index % paymentMethods.length];
                              })()}
                            </p>
                          )}
                        </td>
                        
                        {/* Actions - Resend, WhatsApp, Three Dots Menu */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1">
                            {/* Resend Payment Link */}
                            <button
                              onClick={() => {
                                console.log('Resend payment link for:', transaction.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                              title="Resend Payment Link"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            
                            {/* WhatsApp */}
                            <button
                              onClick={() => {
                                window.open(`https://wa.me/91${transaction.customer_mobile}`, '_blank');
                              }}
                              className="p-1.5 rounded hover:bg-green-50"
                              title="Send via WhatsApp"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                            </button>
                            
                            {/* Three Dots Menu - Download Invoice, Send Invoice, Cancel */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === transaction.id ? null : transaction.id);
                                }}
                                className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-50"
                                title="More actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {openMenuId === transaction.id && (
                                <div 
                                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    {/* Approve PO */}
                                    <button
                                      onClick={() => {
                                        console.log('Approve PO for:', transaction.id);
                                        alert('PO Approved for transaction: ' + transaction.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Approve PO</span>
                                    </button>
                                    
                                    {/* Reject PO */}
                                    <button
                                      onClick={() => {
                                        console.log('Reject PO for:', transaction.id);
                                        alert('PO Rejected for transaction: ' + transaction.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Reject PO</span>
                                    </button>
                                    
                                    {/* Divider */}
                                    <div className="border-t border-gray-200 my-1"></div>
                                    
                                    {/* Download Invoice */}
                                    <button
                                      onClick={() => {
                                        console.log('Download invoice for:', transaction.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>Download Invoice</span>
                                    </button>
                                    
                                    {/* Send Invoice */}
                                    <button
                                      onClick={() => {
                                        console.log('Send invoice for:', transaction.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <Mail className="w-4 h-4" />
                                      <span>Send Invoice</span>
                                    </button>
                                    
                                    {/* Cancel Link */}
                                    <button
                                      onClick={() => {
                                        console.log('Cancel Link for transaction:', transaction.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Cancel Link</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

              {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You have unsaved changes that will be lost if you continue. What would you like to do?
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={proceedWithoutSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
              </Button>
              
              <Button
                onClick={() => {
                  setShowWarningModal(false);
                  setPendingNavigation(null);
                  setNavigationType(null);
                }}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Modal */}
      {showOrderSummaryModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowOrderSummaryModal(false)}>
          <div className="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              <button
                onClick={() => setShowOrderSummaryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Customer Information */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-gray-600 font-bold">Name:</span>
                  <span className="font-medium text-gray-900">{selectedTransaction.customer_name}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Company:</span>
                  <span className="text-gray-900">{selectedTransaction.customer_company || 'N/A'}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Mobile:</span>
                  <span className="text-gray-900">{selectedTransaction.customer_mobile || 'N/A'}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Email:</span>
                  <span className="text-gray-900">{selectedTransaction.customer_email || 'N/A'}</span>
                </div>
              </div>

              {/* Order Detail */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-gray-600 font-bold">Payment ID:</span>
                  <span className="font-medium text-gray-900">{selectedTransaction.id}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Date:</span>
                  <span className="text-gray-900">{new Date(selectedTransaction.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Status:</span>
                  <span className={`font-medium ${
                    selectedTransaction.status === 'Success' ? 'text-green-600' :
                    selectedTransaction.status === 'Pending' ? 'text-yellow-600' :
                    selectedTransaction.status === 'Failed' ? 'text-red-600' :
                    selectedTransaction.status === 'Expired' ? 'text-orange-600' :
                    selectedTransaction.status === 'Cancelled' ? 'text-gray-600' :
                    'text-blue-600'
                  }`}>{selectedTransaction.status}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Order ID:</span>
                  <span className="font-medium text-gray-900">{selectedTransaction.id || 'ORD-' + Math.floor(Math.random() * 100000)}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 font-bold">Payment Method:</span>
                  <span className="text-gray-900">
                    {(() => {
                      const paymentMethods = ['UPI', 'Debit Card', 'Net Banking'];
                      const index = selectedTransaction.id ? selectedTransaction.id.length % 3 : 0;
                      return paymentMethods[index];
                    })()}
                  </span>
                </div>
              </div>

              {/* Order Summary Table */}
              <div>
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">S.No</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Duration</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Quantity</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Rate</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-700">1</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{selectedTransaction.plan_name || selectedTransaction.product_type || 'Busy Desktop Subscription'}</td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700">{selectedTransaction.duration ? `${selectedTransaction.duration} Days` : '360 Days'}</td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700">1</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-700">₹{(selectedTransaction.base_amount || 12000).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{(selectedTransaction.base_amount || 12000).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Summary Section */}
                  <div className="border-t border-gray-300 bg-gray-50 p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total:</span>
                        <span className="text-sm font-semibold text-gray-900">₹{(selectedTransaction.base_amount || 12000).toLocaleString('en-IN')}</span>
                      </div>
                      
                      {selectedTransaction.discount_amount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Discount ({selectedTransaction.discount_percent}%):</span>
                          <span className="text-sm font-medium text-green-600">-₹{selectedTransaction.discount_amount?.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">TDS Deduction:</span>
                        <span className="text-sm font-medium text-orange-600">
                          {selectedTransaction.tds_amount > 0 ? `-₹${selectedTransaction.tds_amount?.toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">GST (18%):</span>
                        <span className="text-sm font-medium text-gray-900">₹{(selectedTransaction.tax_amount || 2160).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-base font-bold text-gray-900">Grand Total:</span>
                        <span className="text-base font-bold text-blue-600">₹{(selectedTransaction.final_amount || 14160).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

              {/* Payment Link Section */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Link Status</h3>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      // Calculate if link is expired (assuming 7 days validity)
                      const createdDate = new Date(selectedTransaction.created_at);
                      const validTillDate = new Date(createdDate);
                      validTillDate.setDate(validTillDate.getDate() + 7);
                      const isExpired = new Date() > validTillDate;
                      
                      if (isExpired) {
                        return (
                          <>
                            <span className="text-sm text-red-600 font-medium">
                              Expired On: {validTillDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <button className="ml-4 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
                              Extend For 7 Days
                            </button>
                          </>
                        );
                      } else {
                        const daysRemaining = Math.ceil((validTillDate - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <>
                            <span className="text-sm text-green-600 font-medium">
                              Valid Till: {validTillDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({daysRemaining} days left)
                            </span>
                            <div className="ml-4 flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const paymentLink = `https://payment.example.com/pay/${selectedTransaction.id}`;
                                  navigator.clipboard.writeText(paymentLink);
                                  alert('Payment link copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Payment Link
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('Are you sure you want to extend the payment link validity by 3 days?')) {
                                    console.log('Extending payment link validity for transaction:', selectedTransaction.id);
                                    alert('Payment link validity has been extended by 3 days!');
                                    // TODO: Add API call to extend validity in backend
                                    // Example: await axios.post(`${BACKEND_URL}/api/transactions/${selectedTransaction.id}/extend-validity`, { days: 3 });
                                  }
                                }}
                                className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Extend by 7 days
                              </button>
                            </div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
                </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={() => setShowOrderSummaryModal(false)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {showAdvancedFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAdvancedFilter(false)}>
          <div className="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Advanced Filters</h2>
              <button
                onClick={() => setShowAdvancedFilter(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Partner Name (Generated By) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Partner Name
                  </label>
                  <select
                    value={advancedFilters.partnerName}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, partnerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="Inside Sales (Delhi Office)">Inside Sales (Delhi Office)</option>
                    <option value="Inside Sales (3i)">Inside Sales (3i)</option>
                    <option value="Inside Sales (VMS Sec 2)">Inside Sales (VMS Sec 2)</option>
                    <option value="Inside Sales (Allset Chennai)">Inside Sales (Allset Chennai)</option>
                  </select>
                </div>

                {/* 2. Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={advancedFilters.status}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Success">Payment Success</option>
                    <option value="Payment Failed">Payment Failed</option>
                    <option value="PO Approved">PO Approved</option>
                    <option value="PO Rejected">PO Rejected</option>
                    <option value="PO Pending">PO Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* 3. Generated By (Employee Name – Partner Name) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Generated By
                  </label>
                  <select
                    value={advancedFilters.generatedBy}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, generatedBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="Rajesh Kumar – Inside Sales (Delhi Office)">Rajesh Kumar – Inside Sales (Delhi Office)</option>
                    <option value="Priya Sharma – Inside Sales (3i)">Priya Sharma – Inside Sales (3i)</option>
                    <option value="Amit Patel – Inside Sales (VMS Sec 2)">Amit Patel – Inside Sales (VMS Sec 2)</option>
                    <option value="Neha Singh – Inside Sales (Allset Chennai)">Neha Singh – Inside Sales (Allset Chennai)</option>
                    <option value="System – Auto Generated">System – Auto Generated</option>
                  </select>
                </div>

                {/* 4. Transaction Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={advancedFilters.transactionType}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, transactionType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="New">New</option>
                    <option value="Renew">Renew</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Add / Reduce Count">Add / Reduce Count</option>
                    <option value="Upgrade to Online">Upgrade to Online</option>
                  </select>
                </div>

                {/* 5. Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={advancedFilters.category}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="Regular">Regular</option>
                    <option value="CA">CA</option>
                    <option value="Accountant">Accountant</option>
                    <option value="GSTP">GSTP</option>
                  </select>
                </div>

                {/* 6. Product */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product
                  </label>
                  <select
                    value={advancedFilters.product}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, product: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Online">Online</option>
                    <option value="App">App</option>
                    <option value="Mandi">Mandi</option>
                    <option value="RDP">RDP</option>
                    <option value="Mazu">Mazu</option>
                    <option value="Recom">Recom</option>
                  </select>
                </div>

                {/* 7. Link Validity - From Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link Validity From
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.linkValidityFrom}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, linkValidityFrom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 8. Link Validity - To Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link Validity To
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.linkValidityTo}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, linkValidityTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setAdvancedFilters({
                      partnerName: '',
                      status: '',
                      generatedBy: '',
                      transactionType: '',
                      category: '',
                      product: '',
                      linkValidityFrom: '',
                      linkValidityTo: ''
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowAdvancedFilter(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Type Change Warning Dialog */}
      {showLicenseChangeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-[61]">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">License Type Change Warning</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Changing to <strong>{pendingLicenseType}</strong> license will reset your customer validation. 
              You'll need to re-validate customer details with the new license-specific requirements.
            </p>
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={confirmLicenseTypeChange}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white relative z-[62]"
              >
                Continue with {pendingLicenseType} License
              </Button>
              
              <Button
                onClick={cancelLicenseTypeChange}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 relative z-[62]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[71]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Edit className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Customer Details</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Transaction Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-medium text-gray-900 ml-2">{selectedTransaction.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium text-gray-900 ml-2">{selectedTransaction.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mobile:</span>
                      <span className="font-medium text-gray-900 ml-2">{selectedTransaction.customer_mobile}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium text-gray-900 ml-2">{selectedTransaction.product_type}</span>
                    </div>
                  </div>
                </div>

                {/* Optional Details Form */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Optional Customer Details</h4>
                  <p className="text-sm text-gray-600">Add additional information to enhance customer relationship and improve service delivery.</p>
                  
                  {/* Invoice Generation Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 text-sm font-medium">
                      📋 Invoice will be generated only after these details are complete
                    </p>
                  </div>
                  
                  {/* Required Customer Details */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-3">Required Customer Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editFormData.name}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Customer name"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Email address"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editFormData.company}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Company name"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <Input
                          value={editFormData.gstin}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                          placeholder="GSTIN number"
                          className="w-full"
                          maxLength={15}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Complete Address <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          value={editFormData.address}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter complete business address"
                          rows={3}
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editFormData.city}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editFormData.pincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 6) {
                              setEditFormData(prev => ({ ...prev, pincode: value }));
                            }
                          }}
                          placeholder="Pincode"
                          className="w-full"
                          maxLength={6}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editFormData.state}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <Input
                          value={editFormData.country}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Country"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Additional Details */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Additional Information (Optional)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Phone Number
                        </label>
                        <Input
                          value={editFormData.alternateNumber}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, alternateNumber: e.target.value }))}
                          placeholder="Enter alternate phone number"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type
                        </label>
                        <Input
                          value={editFormData.businessType}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, businessType: e.target.value }))}
                          placeholder="e.g., Retail, Manufacturing, Services"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Landmark
                        </label>
                        <Input
                          value={editFormData.landmark}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, landmark: e.target.value }))}
                          placeholder="Nearby landmark"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Contact Time
                        </label>
                        <Input
                          value={editFormData.preferredContactTime}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, preferredContactTime: e.target.value }))}
                          placeholder="e.g., 10 AM - 6 PM"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referral Source
                        </label>
                        <Input
                          value={editFormData.referralSource}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, referralSource: e.target.value }))}
                          placeholder="How did they find us?"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes / Comments
                        </label>
                        <Textarea
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes about this customer"
                          rows={3}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveCustomerDetails}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                  >
                    Save Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 relative z-[81]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Details Saved Successfully</h3>
              </div>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {selectedTransaction && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    ✅ Customer details have been successfully updated for transaction <strong>{selectedTransaction.id}</strong>
                  </p>
                </div>

                {/* Invoice Generation Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Generate Invoice</h4>
                  <p className="text-sm text-gray-600">
                    All required customer details are now complete. You can generate the invoice for this transaction.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Invoice Details:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-blue-700">Customer:</span>
                        <span className="font-medium text-blue-900 ml-2">{editFormData.name}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Company:</span>
                        <span className="font-medium text-blue-900 ml-2">{editFormData.company}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Product:</span>
                        <span className="font-medium text-blue-900 ml-2">{selectedTransaction.product_type}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Amount:</span>
                        <span className="font-medium text-blue-900 ml-2">{formatCurrency(selectedTransaction.final_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedTransaction(null);
                    }}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={generateInvoice}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                  >
                    Generate Invoice
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Invoice Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Email Invoice</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Send invoice for transaction <strong>{emailFormData.transactionId}</strong> to customer
              </p>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Customer Email</Label>
                  <Input
                    type="email"
                    value={emailFormData.customerEmail}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="customer@example.com"
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedTransaction(null);
                  setEmailFormData({ customerEmail: '', transactionId: '' });
                }}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Handle email sending
                  console.log('Sending invoice via email to:', emailFormData.customerEmail);
                  console.log('Transaction ID:', emailFormData.transactionId);
                  // In real implementation, this would call API to send email
                  
                  // Close modal
                  setShowEmailModal(false);
                  setSelectedTransaction(null);
                  setEmailFormData({ customerEmail: '', transactionId: '' });
                }}
                disabled={!emailFormData.customerEmail}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 disabled:bg-gray-400"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TDS Confirmation Modal */}
      {showTdsConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm TDS Deduction</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                You are about to enable TDS deduction which will:
              </p>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• Deduct 10% from the base price as TDS</li>
                <li>• Update the final amount calculation</li>
                <li>• Show TDS deduction in order summary</li>
              </ul>
              <p className="text-gray-600 mt-3 text-sm">
                Do you want to proceed with TDS deduction?
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={cancelTdsDeduction}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmTdsDeduction}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
              >
                Confirm TDS Deduction
              </Button>
            </div>
          </div>
        </div>
      )}
            </div>
          ) : (
            // Other Menu Content (Placeholder)
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {menuItems.find(m => m.id === activeMenu) && 
                      React.createElement(menuItems.find(m => m.id === activeMenu).icon, { className: "w-8 h-8 text-gray-400" })
                    }
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {menuItems.find(m => m.id === activeMenu)?.name}
                  </h3>
                  <p className="text-gray-600">
                    This section is under construction
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
      
      {/* Payment Link Modal */}
      {showPaymentLinkModal && paymentLinkData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Payment Link Generated</h2>
              <button
                onClick={() => setShowPaymentLinkModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Success Message with Email and Mobile */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 mb-2">Payment link has been successfully generated and sent on:</p>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>Email: <span className="font-medium">{paymentLinkData.customerDetails.email}</span></p>
                      <p>Mobile: <span className="font-medium">+91 {paymentLinkData.customerDetails.mobile}</span></p>
                    </div>
                  </div>
                </div>
                </div>

              {/* Payment Link Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentLinkData.paymentLink}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentLinkData.paymentLink);
                      // Could add a toast notification here
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPaymentLinkModal(false);
                    setShowCreateForm(false);
                    setActiveMenu('dashboard');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setShowPaymentLinkModal(false);
                    // Reset form for new payment link
                    resetForm();
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Another Payment Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;