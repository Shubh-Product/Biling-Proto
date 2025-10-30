import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, CheckCircle, XCircle, Clock, ArrowLeft, Smartphone, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import axios from "axios";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerPayment = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Mock payment form data
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    upiId: "",
    bankAccount: ""
  });

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === "pending") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, paymentStatus]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const transactionResponse = await axios.get(`${API}/transactions/${transactionId}`);
      const transactionData = transactionResponse.data;
      setTransaction(transactionData);

      // Fetch customer details
      const customerResponse = await axios.get(`${API}/customers/${transactionData.customer_id}`);
      setCustomer(customerResponse.data);

      // Set initial payment status
      setPaymentStatus(transactionData.payment_status.toLowerCase());
      if (transactionData.license_number) {
        setLicenseNumber(transactionData.license_number);
      }

    } catch (error) {
      console.error("Error fetching transaction details:", error);
      // Removed toast popup
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!paymentMethod) {
      // Removed toast popup
      return;
    }

    try {
      setPaymentLoading(true);
      
      const paymentData = {
        transaction_id: transactionId,
        payment_method: paymentMethod,
        card_details: paymentMethod === "card" ? paymentForm : null
      };

      const response = await axios.post(`${API}/transactions/${transactionId}/payment`, paymentData);
      
      if (response.data.success) {
        setPaymentStatus("success");
        setLicenseNumber(response.data.license_number);
        // Removed toast popup
      } else {
        setPaymentStatus("failed");
        // Removed toast popup
      }

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      // Removed toast popup
    } finally {
      setPaymentLoading(false);
    }
  };

  const retryPayment = () => {
    setPaymentStatus("pending");
    setTimeLeft(900); // Reset timer
  };

  const cancelPayment = () => {
    setPaymentStatus("cancelled");
    // Removed toast popup
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!transaction || !customer) {
    return (
      <div className="payment-container">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">The payment link may have expired or is invalid.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (paymentStatus === "success") {
    return (
      <div className="payment-container text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">Your transaction has been completed successfully.</p>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Transaction ID:</span>
                <span className="font-mono text-blue-600">{transaction.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount Paid:</span>
                <span className="font-bold text-green-600">{formatCurrency(transaction.final_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">License Number:</span>
                <span className="font-mono text-blue-600">{licenseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Product:</span>
                <span>{transaction.product_type} - {transaction.plan_details.plan_name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            License has been sent to your registered email address. Please check your inbox.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
          <Button variant="outline" className="w-full">
            Download License
          </Button>
        </div>
      </div>
    );
  }

  // Failed Screen
  if (paymentStatus === "failed") {
    return (
      <div className="payment-container text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">Your payment could not be processed. Please try again.</p>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Transaction ID:</span>
                <span className="font-mono text-blue-600">{transaction.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span className="font-bold">{formatCurrency(transaction.final_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant="destructive">Failed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={retryPayment} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Cancelled Screen
  if (paymentStatus === "cancelled") {
    return (
      <div className="payment-container text-center">
        <Clock className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">You have cancelled the payment process.</p>
        
        <div className="space-y-3">
          <Button onClick={retryPayment} className="w-full">
            Resume Payment
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Main Payment Screen
  return (
    <div className="payment-container">
      {/* Timer */}
      {timeLeft > 0 ? (
        <div className="countdown-timer">
          <Clock className="w-5 h-5 inline mr-2" />
          <span className="countdown-text">
            Payment link expires in: {formatTime(timeLeft)}
          </span>
        </div>
      ) : (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Payment link has expired. Please contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
        <p className="text-gray-600">Secure payment for your software license</p>
      </div>

      {/* Customer & Transaction Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {customer.name}</div>
              <div><strong>Email:</strong> {customer.email}</div>
              <div><strong>Company:</strong> {customer.company}</div>
              <div><strong>GSTIN:</strong> {customer.gstin}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Product:</strong> {transaction.product_type}</div>
              <div><strong>Plan:</strong> {transaction.plan_details.plan_name}</div>
              <div><strong>Base Amount:</strong> {formatCurrency(transaction.base_amount)}</div>
              {transaction.discount_amount > 0 && (
                <div className="text-green-600">
                  <strong>Discount:</strong> -{formatCurrency(transaction.discount_amount)}
                </div>
              )}
              <div><strong>GST (18%):</strong> {formatCurrency(transaction.tax_amount)}</div>
              <div className="border-t pt-2 font-bold text-lg">
                <strong>Total Amount:</strong> {formatCurrency(transaction.final_amount)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { id: "card", name: "Credit/Debit Card", icon: CreditCard },
              { id: "upi", name: "UPI Payment", icon: Smartphone },
              { id: "netbanking", name: "Net Banking", icon: Wallet }
            ].map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm font-medium text-center">{method.name}</p>
                </div>
              );
            })}
          </div>

          {/* Payment Form */}
          {paymentMethod === "card" && (
            <div className="space-y-4">
              <h4 className="font-semibold">Card Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentForm.expiryDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="Enter name as on card"
                    value={paymentForm.cardholderName}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "upi" && (
            <div className="space-y-4">
              <h4 className="font-semibold">UPI Details</h4>
              <div>
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@upi"
                  value={paymentForm.upiId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, upiId: e.target.value }))}
                />
              </div>
            </div>
          )}

          {paymentMethod === "netbanking" && (
            <div className="space-y-4">
              <h4 className="font-semibold">Net Banking</h4>
              <div>
                <Label>Select Bank</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sbi">State Bank of India</SelectItem>
                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                    <SelectItem value="icici">ICICI Bank</SelectItem>
                    <SelectItem value="axis">Axis Bank</SelectItem>
                    <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={processPayment}
          disabled={!paymentMethod || paymentLoading || timeLeft <= 0}
          className="flex-1 btn-primary"
        >
          {paymentLoading ? (
            <>
              <div className="loading-spinner mr-2"></div>
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {formatCurrency(transaction.final_amount)}
            </>
          )}
        </Button>
        
        <Button variant="outline" onClick={cancelPayment} className="flex-1">
          Cancel Payment
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          Your payment is secured with 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
};

export default CustomerPayment;