import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, Eye, CheckCircle, CreditCard, Smartphone, ArrowLeft, Check, Trash2, AlertTriangle, RotateCcw, Save, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Upload, Download, Copy, RefreshCw, User, Package, Target, Edit, Share, Mail, LayoutDashboard, Users, FileText, HelpCircle, MessageSquare, Shield, Wallet, Menu, X, Bell } from "lucide-react";
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
    transactionType: "New Sales",
    licenseType: "Retail",
    serialNumber: "",
    productType: "",
    region: "India", // Default region
    licenseModel: "", // Perpetual or Subscription for Desktop
    duration: "", // 360 or 1080 for Desktop, 360 or 90 for Busy Online
    accessType: "", // Access or Client Server for Busy Online
    userCount: "1", // Default to 1 user
    companyCount: "1", // Default to 1 company
    deductTds: false, // TDS deduction toggle, default off
    recomOfferAdded: false, // Recom Bundle offer toggle
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
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('upgrade1080'); // 'upgrade1080', 'recom', 'mobileapp'

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
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown]);

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
    if (formData.productType !== "Desktop" || !formData.planName) {
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
    
    setShowPaymentLinkPage(true);
    setShowCreateForm(false);
  };

  // Serial Number Validation for Renewal/Upgrade
  const validateSerialNumber = async () => {
    if (!serialNumber.trim()) {
      setErrors(prev => ({ ...prev, serialNumber: "Please enter a serial number" }));
      return;
    }

    setFetchingSerialDetails(true);
    setErrors(prev => ({ ...prev, serialNumber: "" }));

    try {
      // Simulate API call to validate serial number and fetch details
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Mock validation logic - in real implementation, this would be an API call
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
        return;
      }

      if (!serialData.eligible) {
        setErrors(prev => ({ 
          ...prev, 
          serialNumber: serialData.reason || "Not eligible for renewal or upgrade" 
        }));
        setSerialValidated(false);
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
              id: "APP001",
              name: "Busy Analytics",
              type: "FOC",
              status: "Active",
              expiryDate: "2024-12-31"
            },
            {
              id: "APP002", 
              name: "Inventory Manager",
              type: "Paid",
              status: "Active",
              expiryDate: "2024-11-30"
            },
            {
              id: "APP003",
              name: "Sales Tracker",
              type: "Paid", 
              status: "Expired",
              expiryDate: "2024-08-31"
            },
            {
              id: "APP004",
              name: "Report Generator",
              type: "FOC",
              status: "Active", 
              expiryDate: "2024-12-31"
            },
            {
              id: "APP005",
              name: "Customer Portal",
              type: "Paid",
              status: "Active",
              expiryDate: "2024-10-31"
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
    const orderSummaryVisible = (((formData.productType === "Desktop" && formData.planName && calculateDesktopPricing()) || 
                                 (formData.productType === "RDP" && formData.planName && calculateRDPPricing()) ||
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
        // Validation successful - auto-select first product and first plan
        setErrors({});
        setCustomerValidated(true);
        
        // Auto-select first product and its first plan
        const firstProduct = getFirstProductType();
        const firstPlan = firstProduct ? getFirstPlan(firstProduct) : "";
        
        setFormData(prev => ({
          ...prev,
          productType: firstProduct,
          planName: firstPlan
        }));

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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowPaymentLinkPage(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

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
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{paymentLinkData.customerDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{paymentLinkData.customerDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{paymentLinkData.customerDetails.mobile}</span>
                </div>
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
              // Initialize invoice form with existing customer data
              setInvoiceFormData({
                mobile: paymentLinkData.customerDetails.mobile || '',
                email: paymentLinkData.customerDetails.email || '',
                gstin: '',
                companyName: '',
                customerName: paymentLinkData.customerDetails.name || '',
                address: '',
                pincode: '',
                city: '',
                state: ''
              });
              setShowPaymentLinkPage(false);
              setShowDummyPaymentPage(true);
            }}
            className="bg-green-600 hover:bg-green-700 px-8 py-2"
          >
            Proceed to Pay (dummy)
          </Button>
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
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{formData.customerDetails.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{formData.customerDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">+91 {formData.customerDetails.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{formData.productType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{formData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">License Type:</span>
                  <span className="font-medium">{formData.licenseType}</span>
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
  }

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
                onClick={() => setActiveMenu(item.id)}
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
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Page Title with Navigation */}
              <div className="flex items-center space-x-2">
                {/* Always show clickable Dashboard link for Payments */}
                {activeMenu === 'payments' && (
                  <>
                    <button
                      onClick={() => handleNavigationAttempt(() => setShowCreateForm(false), 'dashboard')}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      BIPL Sales Portal
                    </button>
                    {showCreateForm && (
                      <>
                        <span className="text-gray-400">/</span>
                        <span className="text-xl font-semibold text-gray-900">Generate Payment Link</span>
                      </>
                    )}
                  </>
                )}
                {activeMenu !== 'payments' && (
                  <h1 className="text-xl font-semibold text-gray-900">
                    {menuItems.find(m => m.id === activeMenu)?.name}
                  </h1>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                {activeMenu === 'payments' && !showCreateForm && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by Mobile, Email, GSTIN, Payment ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                    />
                  </div>
                )}

                {/* Menu Toggle */}
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>

                {/* Switch To User Dropdown */}
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Switch To User</option>
                </select>

                {/* Notification Icons */}
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                </button>

                {/* User Avatar */}
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  S
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          {activeMenu === 'payments' ? (
            // Payments Content (BIPL Sales Portal)
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              {/* Action Buttons - Shown only on dashboard view */}
              {!showCreateForm && (
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {/* Export Button */}
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-300 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>
                  
                  {/* Generate Payment Link Button */}
                  <Button 
                    onClick={() => handleNavigationAttempt(() => setShowCreateForm(!showCreateForm))}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Payment Link</span>
                  </Button>
                </div>
              )}
              
              {/* Back Button - Shown in Create Form */}
              {showCreateForm && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigationAttempt(() => setShowCreateForm(false), 'dashboard')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Back to BIPL Sales Portal Dashboard</span>
                  </Button>
                </div>
              )}
        {/* Create Transaction Form */}
        {showCreateForm && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* License Type */}
                {/* Transaction Type Tabs - Step 1 */}
                <div className="border-b border-gray-200">
                  <div className="flex space-x-1">
                    {[
                      { value: "New Sales", label: "New Sale", icon: "📝" },
                      { value: "Renewal/Upgrade", label: "Renewal", icon: "🔄" },
                      { value: "Mobile App", label: "Upgrade", icon: "📱" },
                      { value: "Recom", label: "Offers", icon: "🎁" }
                    ].map((tab) => {
                      const isActive = formData.transactionType === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => {
                            const newTransactionType = tab.value;
                            
                            // Reset journey for specific transaction types
                            if (['Renewal/Upgrade', 'Mobile App', 'Recom', 'Bundle Offer'].includes(newTransactionType)) {
                              // Reset all form data and states
                              setFormData({
                                transactionType: newTransactionType,
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
                              // Reset renewal/upgrade flow states
                              resetRenewalFlow();
                              // Reset mobile app flow states
                              resetMobileAppFlow();
                              // Reset recom flow states
                              resetRecomFlow();
                            } else {
                              // For "New Sales", just update transaction type
                              setFormData(prev => ({ ...prev, transactionType: newTransactionType }));
                            }
                          }}
                          className={`px-6 py-3 text-sm font-semibold transition-all ${
                            isActive
                              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent'
                          }`}
                        >
                          <span className="mr-2">{tab.icon}</span>
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Universal TDS Toggle removed - now inside Order Summary sections */}

                {/* Renewal/Upgrade Flow (For Renewal/Upgrade transaction type) */}
                {formData.transactionType === "Renewal/Upgrade" && (
                  <div className="space-y-6">
                    
                    {/* Step 1: Serial Number Input & Validation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter License Details</h3>
                      
                      <div className="flex items-center space-x-4">
                        <Label className="text-base font-semibold whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            value={serialNumber}
                            onChange={(e) => {
                              setSerialNumber(e.target.value);
                              setErrors(prev => ({ ...prev, serialNumber: "" }));
                              setSerialValidated(false);
                            }}
                            placeholder="Enter existing license serial number"
                            className={`w-64 ${errors.serialNumber ? "border-red-500" : ""}`}
                            disabled={fetchingSerialDetails || serialValidated}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !fetchingSerialDetails && !serialValidated) {
                                validateSerialNumber();
                              }
                            }}
                          />
                          <Button 
                            type="button"
                            onClick={validateSerialNumber}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                            disabled={!serialNumber || fetchingSerialDetails || serialValidated}
                          >
                            {fetchingSerialDetails ? (
                              <>
                                <div className="loading-spinner mr-2"></div>
                                Fetching...
                              </>
                            ) : serialValidated ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Validated
                              </>
                            ) : (
                              'Fetch Details'
                            )}
                          </Button>
                          
                          {serialValidated && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={resetRenewalFlow}
                              className="text-gray-600"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {errors.serialNumber && (
                        <p className="text-red-500 text-sm mt-2">{errors.serialNumber}</p>
                      )}
                      
                      <p className="text-sm text-blue-700 mt-2">
                        Enter the serial number to fetch customer and current product details for renewal or upgrade.
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        💡 <strong>Testing:</strong> Enter <code className="bg-gray-100 px-1 rounded">SER123456</code> for testing
                      </p>
                    </div>

                    {/* Step 2: Customer & Product Details (Show after successful validation) */}
                    {serialValidated && currentCustomerInfo && currentProductInfo && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Customer Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-green-600">Customer Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{currentCustomerInfo.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{currentCustomerInfo.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mobile:</span>
                                <span className="font-medium">{currentCustomerInfo.mobile}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Company:</span>
                                <span className="font-medium">{currentCustomerInfo.company}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">GSTIN:</span>
                                <span className="font-medium">{currentCustomerInfo.gstin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">City:</span>
                                <span className="font-medium">{currentCustomerInfo.city}, {currentCustomerInfo.state}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Current Product Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-blue-600">Current Product Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Product Type:</span>
                                <span className="font-medium">{currentProductInfo.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan Name:</span>
                                <span className="font-medium">{currentProductInfo.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">License Model:</span>
                                <span className="font-medium">{currentProductInfo.licenseModel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{currentProductInfo.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expiry Date:</span>
                                <span className="font-medium text-orange-600">{currentProductInfo.expiryDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    {currentProductInfo.status}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Step 3: Options Selection (Renew vs Upgrade) */}
                    {serialValidated && (
                      <div id="renewal-options-section" className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Option</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="renewalOption"
                              value="renew"
                              checked={renewalOption === 'renew'}
                              onChange={(e) => {
                                setRenewalOption(e.target.value);
                                setSelectedUpgradePlan(null);
                              }}
                              className="w-4 h-4 text-blue-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Renew same plan</div>
                              <div className="text-sm text-gray-600">Continue with {currentProductInfo?.planName}</div>
                            </div>
                          </label>
                          
                          <label className="flex items-center cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-100 transition-all">
                            <input
                              type="radio"
                              name="renewalOption"
                              value="upgrade"
                              checked={renewalOption === 'upgrade'}
                              onChange={(e) => {
                                setRenewalOption(e.target.value);
                                setSelectedUpgradePlan(null);
                              }}
                              className="w-4 h-4 text-blue-600 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Upgrade to a better plan</div>
                              <div className="text-sm text-gray-600">Choose from enhanced plans with additional features</div>
                            </div>
                          </label>
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
                            <Label className="text-base font-semibold whitespace-nowrap">Product <span className="text-red-500">*</span>:</Label>
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
                                  <Label className="text-base font-semibold whitespace-nowrap">License Model <span className="text-red-500">*</span>:</Label>
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
                                    <Label className="text-base font-semibold whitespace-nowrap">Duration <span className="text-red-500">*</span>:</Label>
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
                                  <Label className="text-base font-semibold whitespace-nowrap pt-3">Plan <span className="text-red-500">*</span>:</Label>
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
                                  <Label className="text-base font-semibold whitespace-nowrap">Duration <span className="text-red-500">*</span>:</Label>
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
                                    <Label className="text-base font-semibold whitespace-nowrap">Access Type <span className="text-red-500">*</span>:</Label>
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
                                      <Label className="text-base font-semibold whitespace-nowrap">User Count <span className="text-red-500">*</span>:</Label>
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
                                      <Label className="text-base font-semibold whitespace-nowrap">Company Count <span className="text-red-500">*</span>:</Label>
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
                                  <Label className="text-base font-semibold whitespace-nowrap">Deduct TDS:</Label>
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
                                <Label className="text-base font-semibold whitespace-nowrap pt-3">Plan <span className="text-red-500">*</span>:</Label>
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
                                  <Label className="text-base font-semibold whitespace-nowrap">Deduct TDS:</Label>
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
                        <Label className="text-base font-semibold whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
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
                              <Label className="text-base font-semibold whitespace-nowrap">No. of Apps <span className="text-red-500">*</span>:</Label>
                              <Input
                                type="number"
                                value={mobileAppCount}
                                onChange={(e) => setMobileAppCount(e.target.value)}
                                min="1"
                                className="w-20"
                                placeholder="1"
                              />
                            </div>
                            
                            {/* Validity Selection */}
                            <div className="flex items-center space-x-3">
                              <Label className="text-base font-semibold whitespace-nowrap">Validity <span className="text-red-500">*</span>:</Label>
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
                              <Label className="text-base font-semibold whitespace-nowrap">Validity <span className="text-red-500">*</span>:</Label>
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
                        <Label className="text-base font-semibold whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
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
                      <Label className="text-base font-semibold whitespace-nowrap">Serial Number <span className="text-red-500">*</span>:</Label>
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

                {/* Prospect Details */}
                {formData.transactionType === "New Sales" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospect Details</h3>
                  
                  {/* Prospect Information Fields - For non-CA categories */}
                  {formData.licenseType !== "CA" && (
                    <div className="space-y-4">
                      {/* Row 1: Category, Mobile, Email, Name */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="category" className="text-base font-semibold">Category</Label>
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
                          <Label htmlFor="category" className="text-base font-semibold">Category</Label>
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
                    
                    {/* Product Selection with Region Dropdown in Same Row */}
                    <div id="product-type-section" className="flex items-center space-x-6">
                      <Label className="text-base font-semibold whitespace-nowrap">Product <span className="text-red-500">*</span>:</Label>
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

                      {/* Region Dropdown in Same Row */}
                      <div className="flex items-center space-x-3 ml-8">
                        <Label className="text-base font-semibold whitespace-nowrap">Region <span className="text-red-500">*</span>:</Label>
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

                    {/* Desktop Product Configuration */}
                    {formData.productType === "Desktop" && (
                      <div className="space-y-4">
                        {/* Duration Selection for Desktop */}
                        <div className="flex items-center space-x-8">
                          {/* Duration Selection */}
                          <div className="flex items-center space-x-3">
                            <Label className="text-base font-semibold whitespace-nowrap">Duration <span className="text-red-500">*</span>:</Label>
                            <div className="flex space-x-2">
                              {[
                                { value: "360", label: "360 Days" },
                                { value: "1080", label: "1080 Days" }
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
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        licenseModel: "Subscription", // Set default license model
                                        duration: e.target.checked ? duration.value.split(' ')[0] : "",
                                        planName: ""
                                      }));
                                      setPlanQuantities({}); // Reset plan quantities when duration changes
                                    }}
                                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-gray-700 font-medium text-xs">{duration.label}</span>
                                    {/* Better 20% OFF styling - inline with the text */}
                                    {duration.value === "1080" && (
                                      <span className="text-xs text-green-600 font-semibold">
                                        20% OFF
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Plans Display - 4 Column Grid with Quantity Controls */}
                        {formData.duration && (
                          <div data-scroll-target="desktop-plans" className="space-y-3">
                            <Label className="text-base font-semibold">Plans <span className="text-red-500">*</span>:</Label>
                            <div className="grid grid-cols-4 gap-3">
                              {getDesktopPlans(formData.licenseModel, formData.duration).map((plan, index) => {
                                const quantity = planQuantities[plan.name] || 0;
                                return (
                                  <div 
                                    key={plan.name} 
                                    className={`border-2 rounded-lg p-3 transition-all ${
                                      quantity > 0
                                        ? "border-blue-500 bg-blue-50 shadow-md" 
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="space-y-2">
                                      {/* Plan Name */}
                                      <div className="text-xs font-medium text-gray-900 min-h-[32px] flex items-center">
                                        {plan.name}
                                      </div>
                                      
                                      {/* Price */}
                                      <div className="flex flex-col space-y-1">
                                        <span className="text-sm font-bold text-blue-600">
                                          ₹{plan.price?.toLocaleString('en-IN') || 'Contact'}
                                        </span>
                                        {/* Show original price (strikethrough) for 1080 day plans */}
                                        {formData.duration === "1080" && plan.discount > 0 && (
                                          <span className="text-xs text-gray-500 line-through">
                                            ₹{(plan.basePrice * 3)?.toLocaleString('en-IN')}
                                          </span>
                                        )}
                                      </div>

                                      {/* Quantity Counter */}
                                      <div className="flex items-center justify-between bg-white rounded border border-gray-300 px-2 py-1">
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
                                          className="text-gray-600 hover:text-red-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                        >
                                          -
                                        </button>
                                        <span className="text-sm font-semibold text-gray-900 min-w-[20px] text-center">
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
                                          className="text-gray-600 hover:text-green-600 font-bold text-lg w-6 h-6 flex items-center justify-center"
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

                    {/* Busy Online Product Configuration */}
                    {formData.productType === "Busy Online" && (
                      <div className="space-y-4">
                        {/* Duration, Access Type, and Customize - All in same row */}
                        <div className="flex items-center space-x-8">
                          {/* Step 1: Duration Selection */}
                          <div className="flex items-center space-x-3">
                            <Label className="text-base font-semibold whitespace-nowrap">Duration <span className="text-red-500">*</span>:</Label>
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
                              <Label className="text-base font-semibold whitespace-nowrap">Access Type <span className="text-red-500">*</span>:</Label>
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
                              <Label className="text-base font-semibold whitespace-nowrap">Customize:</Label>
                              
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
                    {formData.productType === "RDP" && (
                      <div className="space-y-6">
                        {/* RDP Plan Selection */}
                        <div className="flex items-start space-x-6">
                          <Label className="text-base font-semibold whitespace-nowrap pt-3">Plan <span className="text-red-500">*</span>:</Label>
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
                      </div>
                    )}

                    {/* Promotional Offers - Moved to End */}
                    {formData.productType && !["Mazu", "RDP"].includes(formData.productType) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Mobile App Promotion */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Smartphone className="w-4 h-4 text-green-600" />
                            <h3 className="font-semibold text-green-800 text-sm">Special Promotion</h3>
                          </div>
                          <p className="text-green-700 text-xs">
                            <strong>Mobile App worth ₹2,499 Free for 1 Year</strong>
                          </p>
                          <p className="text-green-600 text-xs mt-1">
                            Included with all purchases
                          </p>
                        </div>

                        {/* Recom Bundle Offer - Informational Only */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <h3 className="font-semibold text-orange-800 text-sm">Recom Bundle Offer</h3>
                          </div>
                          <p className="text-orange-700 text-xs font-medium">
                            Valid Only Till Tomorrow
                          </p>
                          <p className="text-orange-600 text-xs">
                            Get ₹3,000 off on your Recom Purchase
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                {(() => {
                  const busyOnlineValid = formData.productType === "Busy Online" && formData.duration && formData.accessType && validateBusyOnlineCounts().isValid;
                  const showOrderSummary = ((formData.productType === "Desktop" && formData.planName && calculateDesktopPricing()) || 
                                           (formData.productType === "RDP" && formData.planName && calculateRDPPricing()) ||
                                           busyOnlineValid) && customerValidated;
                  return showOrderSummary;
                })() && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h4 id="order-summary-section" className="text-xl font-bold text-blue-900 mb-4">Order Summary</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Details */}
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Customer Information</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{formData.customerDetails.name || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{formData.customerDetails.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mobile:</span>
                            <span className="font-medium">{formData.customerDetails.mobile}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">License Type:</span>
                            <span className="font-medium">{formData.licenseType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product & Pricing Details */}
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Product & Pricing</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product:</span>
                            <span className="font-medium">{formData.productType}</span>
                          </div>
                          
                          {/* Desktop Plan Details */}
                          {formData.productType === "Desktop" && formData.planName && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan:</span>
                                <span className="font-medium">{formData.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">License Model:</span>
                                <span className="font-medium">{formData.licenseModel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{formData.duration} Days</span>
                              </div>
                              {calculateDesktopPricing() && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Base Amount:</span>
                                  <span className="font-medium">₹{calculateDesktopPricing().basePrice.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Busy Online Details */}
                          {formData.productType === "Busy Online" && formData.accessType && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Service:</span>
                                <span className="font-medium">Busy Online {formData.accessType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{formData.duration} Days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Users:</span>
                                <span className="font-medium">{formData.userCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Companies:</span>
                                <span className="font-medium">{formData.companyCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Base Amount:</span>
                                <span className="font-medium">₹{calculateBusyOnlinePrice().toLocaleString('en-IN')}</span>
                              </div>
                            </>
                          )}

                          {/* RDP Plan Details */}
                          {formData.productType === "RDP" && formData.planName && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Plan:</span>
                                <span className="font-medium">{formData.planName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">365 Days</span>
                              </div>
                              {calculateRDPPricing() && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Base Amount:</span>
                                  <span className="font-medium">₹{calculateRDPPricing().basePrice.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Common pricing calculations */}
                          {(calculateDesktopPricing() || calculateRDPPricing() || formData.productType === "Busy Online") && (
                            <>
                              {/* Desktop Discounts */}
                              {calculateDesktopPricing() && calculateDesktopPricing().discountAmount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Discount ({calculateDesktopPricing().discountPercent}%):</span>
                                  <span className="font-medium text-green-600">-₹{calculateDesktopPricing().discountAmount.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              
                              {/* RDP Discounts */}
                              {calculateRDPPricing() && calculateRDPPricing().discountAmount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Discount ({calculateRDPPricing().discountPercent}%):</span>
                                  <span className="font-medium text-green-600">-₹{calculateRDPPricing().discountAmount.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              
                              {/* Recom Bundle Offer Discount */}
                              {addRecomOffer && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Recom Bundle Offer:</span>
                                  <span className="font-medium text-orange-600">-₹3,000</span>
                                </div>
                              )}
                              
                              {/* TDS Toggle - Inside Order Summary */}
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
                              
                              {/* TDS Deduction - For all product types when enabled */}
                              {formData.deductTds && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">TDS Deduction (10%):</span>
                                  <span className="font-medium text-red-600">
                                    -₹{(
                                      formData.productType === "Desktop" ? calculateDesktopPricing()?.tdsAmount || 0 :
                                      formData.productType === "RDP" ? calculateRDPPricing()?.tdsAmount || 0 :
                                      formData.productType === "Busy Online" ? calculateBusyOnlinePricing()?.tdsAmount || 0 :
                                      0
                                    ).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex justify-between">
                                <span className="text-gray-600">GST (18%):</span>
                                <span className="font-medium">₹{(
                                  formData.productType === "Busy Online" ? calculateBusyOnlinePricing()?.taxAmount || 0 :
                                  formData.productType === "RDP" ? calculateRDPPricing()?.taxAmount || 0 :
                                  calculateDesktopPricing()?.taxAmount || 0
                                ).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="text-gray-900 font-semibold">Final Amount:</span>
                                <span className="font-bold text-lg text-blue-900">
                                  ₹{(
                                    formData.productType === "Busy Online" ? calculateBusyOnlinePricing()?.finalAmount || 0 :
                                    formData.productType === "RDP" ? calculateRDPPricing()?.finalAmount || 0 :
                                    calculateDesktopPricing()?.finalAmount || 0
                                  ).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(() => {
                  // Same condition as Order Summary visibility
                  const busyOnlineValid = formData.productType === "Busy Online" && formData.duration && formData.accessType && validateBusyOnlineCounts().isValid;
                  const showOrderSummary = (((formData.productType === "Desktop" && formData.planName && calculateDesktopPricing()) || 
                                           (formData.productType === "RDP" && formData.planName && calculateRDPPricing()) ||
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
                        if (formData.productType === "Desktop" || formData.productType === "RDP") {
                          const pricing = formData.productType === "Desktop" ? calculateDesktopPricing() : calculateRDPPricing();
                          return pricing?.finalAmount === 0;
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
        )}

        {/* Transactions Table - Only show when not creating a new transaction */}
        {!showCreateForm && (
        <div className="w-full max-w-none">
          {/* Filter Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'upgrade1080', label: '1080 Upgrade Opp.', count: get1080DayUpgradeOpportunities().length },
              { id: 'recom', label: 'Recom Bundle', count: getRecomBundleOpportunities().length },
              { id: 'mobileapp', label: 'Mobile Bundle', count: getMobileAppBundleOpportunities().length }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedQuickFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedQuickFilter === filter.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedQuickFilter === filter.id
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

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
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="text-left py-3 px-4 font-semibold">
                        <input type="checkbox" className="w-4 h-4 rounded" />
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {getSortIcon('created_at')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">Customer Details</th>
                      <th className="text-left py-3 px-4 font-semibold">Sold By</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('product_type')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product & Plan</span>
                          {getSortIcon('product_type')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th
                        className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-blue-800"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, index) => (
                      <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <input type="checkbox" className="w-4 h-4 rounded" />
                        </td>
                        {/* Date */}
                        <td className="py-3 px-4">
                          <div className="leading-tight">
                            <p className="text-gray-900 font-medium text-sm">{formatDate(transaction.created_at).dateMonth}</p>
                            <p className="text-gray-600 text-xs">{formatDate(transaction.created_at).year}</p>
                          </div>
                        </td>
                        {/* Customer Details with Serial No. after City */}
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{transaction.customer_name}</p>
                            <div className="flex items-center space-x-1">
                              <p className="text-gray-500 text-xs">{transaction.customer_city}</p>
                              {(transaction.status === 'Success') && (
                                <button
                                  onClick={() => window.open(successTransactionUrl, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs whitespace-nowrap"
                                >
                                  #{transaction.id.replace('TXN-', '')}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Sold By */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 text-sm">
                            {transaction.team_name || (transaction.is_inside_sales ? 'Inside' : 'Chennai Centre')}
                          </p>
                        </td>
                        {/* Name */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 text-sm">
                            {transaction.salesperson?.name || 'N/A'}
                          </p>
                        </td>
                        {/* Product & Plan */}
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{transaction.product_type}</p>
                            <p className="text-gray-500 text-xs">{transaction.plan_details.plan_name}</p>
                            <p className="text-gray-500 text-xs">{transaction.license_type}</p>
                          </div>
                        </td>
                        {/* Amount */}
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{formatCurrency(transaction.final_amount)}</p>
                            {transaction.discount_percent > 0 && (
                              <p className="text-green-600 text-xs">{transaction.discount_percent}% off</p>
                            )}
                          </div>
                        </td>
                        {/* Status - Badge Style */}
                        <td className="py-3 px-4 text-center">
                          {(() => {
                            // For Success transactions, show Invoice status instead
                            if (transaction.status === 'Success') {
                              const invoiceStatus = getInvoiceStatus(transaction);
                              return (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  invoiceStatus === 'Generated' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {invoiceStatus}
                                </span>
                              );
                            }
                            
                            const statusInfo = getStatusDisplay(transaction);
                            let badgeClass = 'bg-gray-100 text-gray-800';
                            
                            if (statusInfo.text.includes('Pending')) {
                              badgeClass = 'bg-yellow-100 text-yellow-800';
                            } else if (statusInfo.text.includes('Failed')) {
                              badgeClass = 'bg-red-100 text-red-800';
                            } else if (statusInfo.text.includes('Due')) {
                              badgeClass = 'bg-orange-100 text-orange-800';
                            } else if (statusInfo.text.includes('Active')) {
                              badgeClass = 'bg-green-100 text-green-800';
                            }

                            return (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                                {statusInfo.text.replace('\n', ' ')}
                              </span>
                            );
                          })()}
                        </td>
                        {/* Actions - Icon Style */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Email Icon */}
                            <button
                              onClick={() => {
                                setEmailFormData({
                                  customerEmail: 'customer@example.com',
                                  transactionId: transaction.id
                                });
                                setSelectedTransaction(transaction);
                                setShowEmailModal(true);
                              }}
                              className="text-gray-600 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                              title="Send email"
                            >
                              <Mail className="w-5 h-5" />
                            </button>
                            
                            {/* Phone Icon */}
                            <button
                              onClick={() => {
                                console.log('Call customer:', transaction.salesperson?.mobile);
                              }}
                              className="text-gray-600 hover:text-green-600 p-1.5 rounded hover:bg-green-50"
                              title="Call customer"
                            >
                              <Smartphone className="w-5 h-5" />
                            </button>
                            
                            {/* Clock/Schedule Icon */}
                            <button
                              onClick={() => {
                                console.log('Schedule follow-up for:', transaction.id);
                              }}
                              className="text-gray-600 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50"
                              title="Schedule follow-up"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
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
    </div>
  );
};

export default Dashboard;