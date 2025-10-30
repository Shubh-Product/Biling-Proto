import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, CheckCircle, XCircle, Clock, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import axios from "axios";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchRecentTransactions();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Removed toast popup
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data.slice(0, 10)); // Get recent 10 transactions
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Removed toast popup
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchRecentTransactions()]);
    setRefreshing(false);
    // Removed toast popup
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Success: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      Failed: { variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      Pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      Cancelled: { variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" }
    };
    
    return statusConfig[status] || statusConfig.Pending;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      "New Sales": "text-blue-600",
      "Upgrade": "text-purple-600",
      "Renewal": "text-green-600"
    };
    return colors[type] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600 mt-1">Track your sales performance and metrics</p>
          </div>
        </div>
        
        <div className="analytics-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="analytics-card primary">
              <div className="loading-spinner mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Track your sales performance and metrics</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <div className="loading-spinner mr-2"></div>
          ) : (
            <RefreshCcw className="w-4 h-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="analytics-grid">
        <div className="analytics-card primary">
          <div className="flex items-center justify-between">
            <div>
              <div className="analytics-value">{analytics?.total_transactions || 0}</div>
              <div className="analytics-label">Total Transactions</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="analytics-card success">
          <div className="flex items-center justify-between">
            <div>
              <div className="analytics-value">{analytics?.success_rate || 0}%</div>
              <div className="analytics-label">Success Rate</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="analytics-card primary">
          <div className="flex items-center justify-between">
            <div>
              <div className="analytics-value">{formatCurrency(analytics?.total_revenue || 0)}</div>
              <div className="analytics-label">Total Revenue</div>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="analytics-card success">
          <div className="flex items-center justify-between">
            <div>
              <div className="analytics-value">{analytics?.successful_transactions || 0}</div>
              <div className="analytics-label">Successful Sales</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">New Sales</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{analytics?.new_sales || 0}</div>
                  <div className="text-sm text-gray-600">transactions</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Upgrades</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{analytics?.upgrades || 0}</div>
                  <div className="text-sm text-gray-600">transactions</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Renewals</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{analytics?.renewals || 0}</div>
                  <div className="text-sm text-gray-600">transactions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="font-medium text-gray-900">Successful</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-900">{analytics?.successful_transactions || 0}</div>
                  <div className="text-sm text-gray-600">completed</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                  <span className="font-medium text-gray-900">Pending</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-900">{analytics?.pending_transactions || 0}</div>
                  <div className="text-sm text-gray-600">in progress</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-3" />
                  <span className="font-medium text-gray-900">Failed</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-900">{analytics?.failed_transactions || 0}</div>
                  <div className="text-sm text-gray-600">unsuccessful</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600">Start creating transactions to see analytics data here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className="font-mono text-sm text-blue-600">
                          {transaction.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-gray-900">
                          {transaction.customer_name}
                        </div>
                      </td>
                      <td>
                        <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {transaction.product_type}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.plan_details.plan_name}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(transaction.final_amount)}
                        </div>
                      </td>
                      <td>
                        <Badge 
                          {...getStatusBadge(transaction.status)}
                          className={getStatusBadge(transaction.status).className}
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">
                          {formatDate(transaction.created_at)}
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

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Transaction Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {analytics?.total_transactions > 0 
                ? formatCurrency(analytics.total_revenue / analytics.total_transactions)
                : formatCurrency(0)
              }
            </div>
            <p className="text-sm text-gray-600">Per successful transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {analytics?.success_rate || 0}%
            </div>
            <p className="text-sm text-gray-600">Payment success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-900">System Operational</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">All services running normally</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;