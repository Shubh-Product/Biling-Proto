import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, Eye, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import axios from "axios";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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
      country: "India"
    },
    productType: "",
    planName: "",
    discountPercent: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchProducts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  };

  // Auto-apply discount based on license type
  const getDiscountForLicenseType = (licenseType) => {
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

  const calculatePricing = () => {
    const planDetails = getPlanDetails(formData.productType, formData.planName);
    const basePrice = planDetails.price || 0;
    
    // Auto-apply discount based on license type
    const autoDiscountPercent = getDiscountForLicenseType(formData.licenseType);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerDetails.name || !formData.customerDetails.email || !formData.productType || !formData.planName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Create customer
      const customerResponse = await axios.post(`${API}/customers`, formData.customerDetails);
      const customerId = customerResponse.data.id;

      // Calculate pricing with auto discount
      const pricing = calculatePricing();

      // Create transaction
      const transactionData = {
        transaction_type: "New Sales", // All transactions are new sales now
        customer_id: customerId,
        customer_name: formData.customerDetails.name,
        license_type: formData.licenseType,
        product_type: formData.productType,
        plan_details: {
          plan_name: formData.planName,
          base_price: pricing.basePrice,
          features: pricing.planDetails.features || []
        },
        base_amount: pricing.basePrice,
        discount_percent: pricing.discountPercent,
        discount_amount: pricing.discountAmount,
        tax_amount: pricing.taxAmount,
        final_amount: pricing.finalAmount
      };

      const transactionResponse = await axios.post(`${API}/transactions`, transactionData);
      const transactionId = transactionResponse.data.id;

      // Send payment link
      await axios.patch(`${API}/transactions/${transactionId}/payment-link`);

      toast.success("Transaction created successfully!");
      
      // Reset form and refresh transactions
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
          country: "India"
        },
        productType: "",
        planName: "",
        discountPercent: 0
      });
      setShowCreateForm(false);
      fetchTransactions();

      // Navigate to payment page
      navigate(`/payment/${transactionId}`);

    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("GSTIN")) {
        toast.error("Customer with this GSTIN already exists");
      } else {
        toast.error("Failed to create transaction");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Success: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-gray-100 text-gray-800"
    };
    
    return statusConfig[status] || statusConfig.Pending;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BIPL Sales Portal</h1>
                <p className="text-sm text-gray-600">Internal Dashboard</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Sale</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Create Transaction Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* License Type */}
                <div>
                  <Label className="text-base font-semibold">License Type</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: "Retail", label: "Retail License", discount: "No discount", color: "border-gray-200" },
                      { value: "CA", label: "CA License", discount: "80% discount", color: "border-green-200 bg-green-50" },
                      { value: "Accountant", label: "Accountant License", discount: "50% discount", color: "border-blue-200 bg-blue-50" }
                    ].map((license) => (
                      <label key={license.value} className={`flex flex-col cursor-pointer p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                        formData.licenseType === license.value 
                          ? "border-blue-500 bg-blue-50" 
                          : license.color
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <input
                            type="radio"
                            name="licenseType"
                            value={license.value}
                            checked={formData.licenseType === license.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, licenseType: e.target.value }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-gray-900">{license.label}</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-7">
                          {license.discount}
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* Discount Information */}
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>Auto-discount applied:</strong>
                      {formData.licenseType === "CA" && " 80% discount for CA License"}
                      {formData.licenseType === "Accountant" && " 50% discount for Accountant License"}
                      {formData.licenseType === "Retail" && " No discount for Retail License"}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.customerDetails.name}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerDetails: { ...prev.customerDetails, name: e.target.value }
                          }))}
                          placeholder="Customer name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.customerDetails.email}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerDetails: { ...prev.customerDetails, email: e.target.value }
                          }))}
                          placeholder="customer@company.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          value={formData.customerDetails.mobile}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerDetails: { ...prev.customerDetails, mobile: e.target.value }
                          }))}
                          placeholder="9876543210"
                        />
                      </div>

                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.customerDetails.company}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerDetails: { ...prev.customerDetails, company: e.target.value }
                          }))}
                          placeholder="Company name"
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
                          placeholder="27ABCDE1234F1Z5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.customerDetails.city}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerDetails: { ...prev.customerDetails, city: e.target.value }
                          }))}
                          placeholder="City"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product & Plan Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product & Plan</h3>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold">Product Type *</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.keys(products).map((productType) => (
                          <label key={productType} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                            <input
                              type="radio"
                              name="productType"
                              value={productType}
                              checked={formData.productType === productType}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                productType: e.target.value, 
                                planName: "" 
                              }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 font-medium">{productType}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.productType && (
                      <div>
                        <Label className="text-base font-semibold">Plan *</Label>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getAvailablePlans(formData.productType).map((plan) => (
                            <label key={plan.name} className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                              <input
                                type="radio"
                                name="planName"
                                value={plan.name}
                                checked={formData.planName === plan.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                                className="w-4 h-4 mt-1 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{plan.name}</div>
                                <div className="text-sm text-blue-600 font-semibold">
                                  ₹{plan.price?.toLocaleString('en-IN') || 'Contact for pricing'}
                                </div>
                                {plan.features && plan.features.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {plan.features.slice(0, 2).join(", ")}
                                    {plan.features.length > 2 && "..."}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discountPercent}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            discountPercent: Number(e.target.value) 
                          }))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                {pricing && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Price Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Base Amount:</span>
                        <p className="font-semibold">₹{pricing.basePrice.toLocaleString('en-IN')}</p>
                      </div>
                      {pricing.discountAmount > 0 && (
                        <div>
                          <span className="text-gray-600">Discount:</span>
                          <p className="font-semibold text-green-600">-₹{pricing.discountAmount.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">GST (18%):</span>
                        <p className="font-semibold">₹{pricing.taxAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Final Amount:</span>
                        <p className="font-bold text-lg text-blue-900">₹{pricing.finalAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
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
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create & Send Payment Link'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? "Try adjusting your search criteria" : "Get started by creating your first transaction"}
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Sale
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-blue-600">
                            {transaction.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.customer_name}</p>
                            <p className="text-sm text-gray-500">{transaction.license_type} License</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.product_type}</p>
                            <p className="text-sm text-gray-500">{transaction.plan_details.plan_name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{formatCurrency(transaction.final_amount)}</p>
                          {transaction.discount_percent > 0 && (
                            <p className="text-sm text-green-600">{transaction.discount_percent}% discount</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusBadge(transaction.status)} px-2 py-1 text-xs rounded-full`}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{formatDate(transaction.created_at)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {transaction.status === 'Pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/payment/${transaction.id}`)}
                              >
                                Pay Now
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;