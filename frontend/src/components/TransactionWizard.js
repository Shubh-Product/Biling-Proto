import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import axios from "axios";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TransactionWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    transactionType: "",
    licenseType: "",
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
      country: "India"
    },
    productType: "",
    planName: "",
    planDetails: {},
    basePrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxAmount: 0,
    finalAmount: 0,
    managerApprovalRequired: false
  });

  const [errors, setErrors] = useState({});
  const [duplicateCustomer, setDuplicateCustomer] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Removed toast popup
    }
  };

  const steps = [
    { id: 1, name: "Transaction Type", description: "Select transaction type" },
    { id: 2, name: "Customer Details", description: "Enter customer information" },
    { id: 3, name: "Product & Plan", description: "Choose product and plan" },
    { id: 4, name: "Payment Link", description: "Review and send payment link" }
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.transactionType) newErrors.transactionType = "Transaction type is required";
        if (formData.transactionType === "New Sales" && !formData.licenseType) {
          newErrors.licenseType = "License type is required for new sales";
        }
        break;

      case 2:
        const { customerDetails } = formData;
        if (!customerDetails.mobile) newErrors.mobile = "Mobile number is required";
        else if (!/^[6-9]\d{9}$/.test(customerDetails.mobile)) {
          newErrors.mobile = "Enter valid mobile number";
        }
        
        if (!customerDetails.name) newErrors.name = "Name is required";
        if (!customerDetails.email) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
          newErrors.email = "Enter valid email address";
        }
        
        if (!customerDetails.company) newErrors.company = "Company name is required";
        if (!customerDetails.gstin) newErrors.gstin = "GSTIN is required";
        else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(customerDetails.gstin)) {
          newErrors.gstin = "Enter valid GSTIN format";
        }
        
        if (!customerDetails.city) newErrors.city = "City is required";
        if (!customerDetails.pincode) newErrors.pincode = "Pincode is required";
        if (!customerDetails.address) newErrors.address = "Address is required";
        if (!customerDetails.state) newErrors.state = "State is required";
        break;

      case 3:
        if (!formData.productType) newErrors.productType = "Product type is required";
        if (!formData.planName) newErrors.planName = "Plan selection is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 2) {
      // Check for duplicate GSTIN
      await checkDuplicateCustomer();
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const checkDuplicateCustomer = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      const existingCustomer = response.data.find(
        customer => customer.gstin === formData.customerDetails.gstin
      );
      setDuplicateCustomer(!!existingCustomer);
    } catch (error) {
      console.error("Error checking duplicate customer:", error);
    }
  };

  const calculatePricing = (productType, planName, planDetails) => {
    let basePrice = planDetails.price || 0;
    const discountAmount = formData.discountPercent > 0 
      ? (basePrice * formData.discountPercent) / 100 
      : 0;
    
    const discountedPrice = basePrice - discountAmount;
    const taxAmount = discountedPrice * 0.18; // 18% GST
    const finalAmount = discountedPrice + taxAmount;

    setFormData(prev => ({
      ...prev,
      basePrice,
      discountAmount,
      taxAmount: Math.round(taxAmount),
      finalAmount: Math.round(finalAmount),
      managerApprovalRequired: formData.discountPercent > 20
    }));
  };

  const handleProductPlanChange = (productType, planName) => {
    const planDetails = getPlanDetails(productType, planName);
    setFormData(prev => ({
      ...prev,
      productType,
      planName,
      planDetails
    }));
    calculatePricing(productType, planName, planDetails);
  };

  const handleDiscountChange = (discountPercent) => {
    setFormData(prev => ({ ...prev, discountPercent }));
    calculatePricing(formData.productType, formData.planName, formData.planDetails);
  };

  const getPlanDetails = (productType, planName) => {
    if (!products[productType]) return {};
    
    // Navigate through nested structure to find plan details
    const productData = products[productType];
    for (const category in productData) {
      if (productData[category][planName]) {
        return productData[category][planName];
      }
    }
    return {};
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

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create customer first
      const customerResponse = await axios.post(`${API}/customers`, formData.customerDetails);
      const customerId = customerResponse.data.id;

      // Create transaction
      const transactionData = {
        transaction_type: formData.transactionType,
        customer_id: customerId,
        customer_name: formData.customerDetails.name,
        license_type: formData.licenseType || null,
        product_type: formData.productType,
        plan_details: {
          plan_name: formData.planName,
          base_price: formData.basePrice,
          features: formData.planDetails.features || []
        },
        base_amount: formData.basePrice,
        discount_percent: formData.discountPercent,
        discount_amount: formData.discountAmount,
        tax_amount: formData.taxAmount,
        final_amount: formData.finalAmount
      };

      const transactionResponse = await axios.post(`${API}/transactions`, transactionData);
      const transactionId = transactionResponse.data.id;

      // Send payment link
      await axios.patch(`${API}/transactions/${transactionId}/payment-link`);

      // Removed toast popup
      navigate(`/payment/${transactionId}`);

    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("GSTIN")) {
        setDuplicateCustomer(true);
        setCurrentStep(2);
        // Removed toast popup
      } else {
        // Removed toast popup
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Select Transaction Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["New Sales", "Upgrade", "Renewal"].map((type) => (
            <div
              key={type}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.transactionType === type
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                setFormData(prev => ({ ...prev, transactionType: type, licenseType: "" }));
                setErrors({}); // Clear any existing errors
              }}
            >
              <h3 className="font-semibold text-gray-900">{type}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {type === "New Sales" && "Create new customer license"}
                {type === "Upgrade" && "Upgrade existing license"}
                {type === "Renewal" && "Renew existing license"}
              </p>
            </div>
          ))}
        </div>

        {formData.transactionType === "New Sales" && (
          <div className="space-y-4">
            <Label>License Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Retail", "CA"].map((type) => (
                <div
                  key={type}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.licenseType === type
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, licenseType: type }))}
                >
                  <h3 className="font-semibold text-gray-900">{type} License</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {type === "Retail" && "Standard business license"}
                    {type === "CA" && "Chartered Accountant license"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.transactionType && (
          <p className="text-red-500 text-sm">{errors.transactionType}</p>
        )}
        {errors.licenseType && (
          <p className="text-red-500 text-sm">{errors.licenseType}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicateCustomer && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              A customer with this GSTIN already exists in the system.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              value={formData.customerDetails.mobile}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, mobile: e.target.value }
              }))}
              placeholder="Enter mobile number"
              className={errors.mobile ? "border-red-500" : ""}
            />
            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.customerDetails.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, name: e.target.value }
              }))}
              placeholder="Enter full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.customerDetails.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, email: e.target.value }
              }))}
              placeholder="Enter email address"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              value={formData.customerDetails.company}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, company: e.target.value }
              }))}
              placeholder="Enter company name"
              className={errors.company ? "border-red-500" : ""}
            />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
          </div>

          <div>
            <Label htmlFor="gstin">GSTIN *</Label>
            <Input
              id="gstin"
              value={formData.customerDetails.gstin}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, gstin: e.target.value.toUpperCase() }
              }))}
              placeholder="Enter GSTIN"
              className={errors.gstin ? "border-red-500" : ""}
            />
            {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
          </div>

          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.customerDetails.city}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, city: e.target.value }
              }))}
              placeholder="Enter city"
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>

          <div>
            <Label htmlFor="pincode">Pincode *</Label>
            <Input
              id="pincode"
              value={formData.customerDetails.pincode}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, pincode: e.target.value }
              }))}
              placeholder="Enter pincode"
              className={errors.pincode ? "border-red-500" : ""}
            />
            {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.customerDetails.state}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customerDetails: { ...prev.customerDetails, state: e.target.value }
              }))}
              placeholder="Enter state"
              className={errors.state ? "border-red-500" : ""}
            />
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address *</Label>
          <textarea
            id="address"
            value={formData.customerDetails.address}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              customerDetails: { ...prev.customerDetails, address: e.target.value }
            }))}
            placeholder="Enter complete address"
            className={`form-input min-h-[80px] ${errors.address ? "border-red-500" : ""}`}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Product & Plan Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Product Type *</Label>
          <Select 
            value={formData.productType} 
            onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                productType: value, 
                planName: "",
                planDetails: {},
                basePrice: 0
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(products).map((productType) => (
                <SelectItem key={productType} value={productType}>
                  {productType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType}</p>}
        </div>

        {formData.productType && (
          <div>
            <Label>Plan *</Label>
            <Select 
              value={formData.planName} 
              onValueChange={(value) => handleProductPlanChange(formData.productType, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {getAvailablePlans(formData.productType).map((plan) => (
                  <SelectItem key={plan.name} value={plan.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{plan.name}</span>
                      <span className="text-gray-500 ml-4">
                        ₹{plan.price?.toLocaleString('en-IN') || 'Contact for pricing'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planName && <p className="text-red-500 text-sm mt-1">{errors.planName}</p>}
          </div>
        )}

        {formData.planName && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Plan Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span className="font-semibold">₹{formData.basePrice.toLocaleString('en-IN')}</span>
                </div>
                {formData.planDetails.features && (
                  <div>
                    <span className="font-medium">Features:</span>
                    <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                      {formData.planDetails.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                placeholder="Enter discount percentage"
              />
              {formData.managerApprovalRequired && (
                <div className="mt-2">
                  <Badge variant="destructive">Manager Approval Required</Badge>
                  <p className="text-sm text-red-600 mt-1">
                    Discounts over 20% require manager approval before processing.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Price Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span>₹{formData.basePrice.toLocaleString('en-IN')}</span>
                </div>
                {formData.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({formData.discountPercent}%):</span>
                    <span>-₹{formData.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{formData.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between font-semibold text-lg text-blue-900">
                  <span>Final Amount:</span>
                  <span>₹{formData.finalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review & Send Payment Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {formData.customerDetails.name}</div>
              <div><strong>Email:</strong> {formData.customerDetails.email}</div>
              <div><strong>Mobile:</strong> {formData.customerDetails.mobile}</div>
              <div><strong>Company:</strong> {formData.customerDetails.company}</div>
              <div><strong>GSTIN:</strong> {formData.customerDetails.gstin}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Type:</strong> {formData.transactionType}</div>
              {formData.licenseType && <div><strong>License:</strong> {formData.licenseType}</div>}
              <div><strong>Product:</strong> {formData.productType}</div>
              <div><strong>Plan:</strong> {formData.planName}</div>
              <div><strong>Final Amount:</strong> ₹{formData.finalAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {formData.managerApprovalRequired && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              This transaction requires manager approval due to high discount percentage.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Payment Link Details</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Payment link will be sent to customer's email and SMS</li>
            <li>• Link will expire in 15 minutes</li>
            <li>• Customer will receive transaction confirmation upon successful payment</li>
            <li>• License will be automatically generated and sent</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Transaction</h1>
          <p className="text-gray-600 mt-1">Create a new sales transaction</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`wizard-step ${currentStep === step.id ? "active" : ""} ${
              currentStep > step.id ? "completed" : ""
            }`}
          >
            <div className="wizard-step-circle">
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <div className="wizard-step-label">
              <div className="font-medium">{step.name}</div>
              <div className="text-xs">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Send Payment Link
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TransactionWizard;