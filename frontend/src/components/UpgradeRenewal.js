import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle, AlertCircle, ArrowRight, RefreshCw, TrendingUp, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import axios from "axios";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UpgradeRenewal = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseDetails, setLicenseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState({});
  const [operationType, setOperationType] = useState(""); // "upgrade" or "renewal"
  
  // Renewal/Upgrade form data
  const [formData, setFormData] = useState({
    newPlan: "",
    newPlanDetails: {},
    basePrice: 0,
    proRataAmount: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxAmount: 0,
    finalAmount: 0,
    managerApprovalRequired: false
  });

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

  const searchLicense = async () => {
    if (!licenseNumber.trim()) {
      // Removed toast popup
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API}/licenses/${licenseNumber}`);
      setLicenseDetails(response.data);
      setStep(2);
      // Removed toast popup
    } catch (error) {
      console.error("Error fetching license:", error);
      if (error.response?.status === 404) {
        // Removed toast popup
      } else {
        // Removed toast popup
      }
    } finally {
      setLoading(false);
    }
  };

  const selectOperation = (type) => {
    setOperationType(type);
    setStep(3);
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

  const calculatePricing = (planName) => {
    const planDetails = getPlanDetails(licenseDetails.product_type, planName);
    let basePrice = planDetails.price || 0;
    
    // Calculate pro-rata for upgrades
    let proRataAmount = 0;
    if (operationType === "upgrade") {
      const currentPlanDetails = getPlanDetails(licenseDetails.product_type, licenseDetails.plan_name);
      const currentPrice = currentPlanDetails.price || 0;
      const remainingDays = 365; // Mock calculation
      proRataAmount = Math.max(0, ((basePrice - currentPrice) * remainingDays) / 365);
      basePrice = proRataAmount;
    }

    const discountAmount = formData.discountPercent > 0 
      ? (basePrice * formData.discountPercent) / 100 
      : 0;
    
    const discountedPrice = basePrice - discountAmount;
    const taxAmount = discountedPrice * 0.18; // 18% GST
    const finalAmount = discountedPrice + taxAmount;

    setFormData(prev => ({
      ...prev,
      newPlan: planName,
      newPlanDetails: planDetails,
      basePrice,
      proRataAmount,
      discountAmount,
      taxAmount: Math.round(taxAmount),
      finalAmount: Math.round(finalAmount),
      managerApprovalRequired: formData.discountPercent > 20
    }));
  };

  const processUpgradeRenewal = async () => {
    try {
      setLoading(true);

      // Create transaction for upgrade/renewal
      const transactionData = {
        transaction_type: operationType === "upgrade" ? "Upgrade" : "Renewal",
        customer_id: "existing", // In real app, get from license details
        customer_name: licenseDetails.customer_name,
        product_type: licenseDetails.product_type,
        plan_details: {
          plan_name: formData.newPlan,
          base_price: formData.basePrice,
          features: formData.newPlanDetails.features || []
        },
        base_amount: formData.basePrice,
        discount_percent: formData.discountPercent,
        discount_amount: formData.discountAmount,
        tax_amount: formData.taxAmount,
        final_amount: formData.finalAmount,
        license_number: licenseNumber
      };

      const response = await axios.post(`${API}/transactions`, transactionData);
      const transactionId = response.data.id;

      // Send payment link
      await axios.patch(`${API}/transactions/${transactionId}/payment-link`);

      // Removed toast popup
      navigate(`/payment/${transactionId}`);

    } catch (error) {
      console.error("Error processing upgrade/renewal:", error);
      // Removed toast popup
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Enter License Number
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="licenseNumber">License Number</Label>
          <div className="flex space-x-3 mt-2">
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
              placeholder="Enter license number (e.g., LIC-ABC12345)"
              className="flex-1"
            />
            <Button 
              onClick={searchLicense} 
              disabled={loading || !licenseNumber.trim()}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">License Format</h4>
          <p className="text-sm text-blue-800">
            License numbers typically follow the format: LIC-XXXXXXXX
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Example: LIC-AB12CD34, LIC-XY56ZW78
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            License Details Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">License Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>License Number:</strong> {licenseDetails.license_number}</div>
                <div><strong>Customer:</strong> {licenseDetails.customer_name}</div>
                <div><strong>Product:</strong> {licenseDetails.product_type}</div>
                <div><strong>Current Plan:</strong> {licenseDetails.plan_name}</div>
                <div><strong>Status:</strong> 
                  <Badge className={`ml-2 ${licenseDetails.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {licenseDetails.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Dates</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Created:</strong> {formatDate(licenseDetails.created_at)}</div>
                <div><strong>Expiry:</strong> {formatDate(licenseDetails.expiry_date)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all"
              onClick={() => selectOperation("renewal")}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 mx-auto">
                <RefreshCw className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-center text-gray-900 mb-2">Renewal</h3>
              <p className="text-sm text-gray-600 text-center">
                Renew the existing license with the same plan or change to a different plan
              </p>
              <div className="mt-4 text-center">
                <Badge variant="outline">Extends validity period</Badge>
              </div>
            </div>

            <div
              className="p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all"
              onClick={() => selectOperation("upgrade")}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-center text-gray-900 mb-2">Upgrade</h3>
              <p className="text-sm text-gray-600 text-center">
                Upgrade to a higher plan with additional features and benefits
              </p>
              <div className="mt-4 text-center">
                <Badge variant="outline">Pro-rata billing</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => {
    const availablePlans = getAvailablePlans(licenseDetails.product_type);
    const currentPlan = licenseDetails.plan_name;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {operationType === "upgrade" ? (
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              ) : (
                <Calendar className="w-5 h-5 mr-2 text-green-600" />
              )}
              {operationType === "upgrade" ? "Upgrade Plan" : "Renewal Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Current Plan</h4>
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentPlan}</span>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>

            <div>
              <Label>
                {operationType === "upgrade" ? "Select New Plan" : "Renewal Plan"}
              </Label>
              <Select 
                value={formData.newPlan} 
                onValueChange={calculatePricing}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => {
                    // For renewals, show all plans. For upgrades, only show higher-tier plans
                    const isUpgradeOption = operationType === "renewal" || plan.price > getPlanDetails(licenseDetails.product_type, currentPlan).price;
                    
                    return isUpgradeOption ? (
                      <SelectItem key={plan.name} value={plan.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{plan.name}</span>
                          <span className="text-gray-500 ml-4">
                            ₹{plan.price?.toLocaleString('en-IN') || 'Contact for pricing'}
                          </span>
                        </div>
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>

            {formData.newPlan && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Selected Plan Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plan Name:</span>
                      <span className="font-semibold">{formData.newPlan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {operationType === "upgrade" ? "Pro-rata Amount:" : "Annual Price:"}
                      </span>
                      <span className="font-semibold">₹{formData.basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    {formData.newPlanDetails.features && (
                      <div>
                        <span className="font-medium">Features:</span>
                        <ul className="list-disc list-inside mt-1 text-blue-800">
                          {formData.newPlanDetails.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {operationType === "upgrade" && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Pro-rata billing: You'll be charged only for the remaining period based on the price difference.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercent}
                    onChange={(e) => {
                      const discountPercent = Number(e.target.value);
                      setFormData(prev => ({ ...prev, discountPercent }));
                      calculatePricing(formData.newPlan);
                    }}
                    placeholder="Enter discount percentage"
                    className="mt-2"
                  />
                  {formData.discountPercent > 20 && (
                    <div className="mt-2">
                      <Badge variant="destructive">Manager Approval Required</Badge>
                      <p className="text-sm text-red-600 mt-1">
                        Discounts over 20% require manager approval.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">Price Breakdown</h4>
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
                    <div className="border-t border-green-300 pt-2 flex justify-between font-semibold text-lg text-green-900">
                      <span>Final Amount:</span>
                      <span>₹{formData.finalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {formData.newPlan && (
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button 
              onClick={processUpgradeRenewal}
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
                  Proceed to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upgrade & Renewal</h1>
          <p className="text-gray-600 mt-1">Upgrade or renew existing licenses</p>
        </div>
      </div>

      {/* Progress Indicators */}
      {step > 1 && (
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="ml-2 text-sm font-medium text-green-700">License Found</span>
          </div>
          {step > 2 && (
            <>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="ml-2 text-sm font-medium text-green-700">Operation Selected</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default UpgradeRenewal;