#!/usr/bin/env python3
"""
Specific tests for the review request focusing on:
1. Payment Link API Testing
2. Customer Validation API Testing  
3. Transaction Creation Flow
4. Products API Testing
"""

import requests
import json
import sys
from datetime import datetime

class ReviewSpecificTester:
    def __init__(self):
        self.base_url = "https://region-chooser.preview.emergentagent.com/api"
        self.tests_passed = 0
        self.tests_failed = 0
        
    def log_test(self, test_name, success, details=""):
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
            if details:
                print(f"   {details}")
        else:
            self.tests_failed += 1
            print(f"❌ {test_name}")
            if details:
                print(f"   {details}")
    
    def test_payment_link_api(self):
        """Test POST /api/transactions/{id}/payment-link endpoint"""
        print("\n🔍 1. PAYMENT LINK API TESTING")
        print("-" * 40)
        
        # First create a transaction
        customer_data = {
            "mobile": "9876543999",
            "name": "Payment Link Test Customer",
            "email": "paymenttest@example.com",
            "company": "Payment Test Company",
            "gstin": "27PAYMENT123Z",
            "city": "Mumbai",
            "pincode": "400001",
            "address": "Payment Test Address",
            "state": "Maharashtra"
        }
        
        # Create customer
        response = requests.post(f"{self.base_url}/customers", json=customer_data)
        if response.status_code != 200:
            self.log_test("Create customer for payment link test", False, f"Status: {response.status_code}")
            return
            
        customer_id = response.json()['id']
        
        # Create transaction
        transaction_data = {
            "transaction_type": "New Sales",
            "customer_id": customer_id,
            "customer_name": "Payment Link Test Customer",
            "license_type": "Retail",
            "product_type": "Desktop",
            "plan_details": {
                "plan_name": "Basic Single User",
                "base_price": 9999.0,
                "is_multi_user": False,
                "features": ["Basic accounting", "GST filing"]
            },
            "base_amount": 9999.0,
            "discount_percent": 0.0,
            "discount_amount": 0.0,
            "tax_amount": 1799.82,
            "final_amount": 11798.82
        }
        
        response = requests.post(f"{self.base_url}/transactions", json=transaction_data)
        if response.status_code != 200:
            self.log_test("Create transaction for payment link test", False, f"Status: {response.status_code}")
            return
            
        transaction_id = response.json()['id']
        self.log_test("Create transaction for payment link test", True, f"Transaction ID: {transaction_id}")
        
        # Test payment link endpoint
        response = requests.patch(f"{self.base_url}/transactions/{transaction_id}/payment-link")
        success = response.status_code == 200
        
        if success:
            data = response.json()
            details = f"Message: {data.get('message')}, Expires in: {data.get('expires_in')} seconds"
            self.log_test("POST /api/transactions/{id}/payment-link", True, details)
            
            # Verify payment link expiry and status
            if data.get('expires_in') == 900:  # 15 minutes
                self.log_test("Payment link expiry verification", True, "15 minutes (900 seconds)")
            else:
                self.log_test("Payment link expiry verification", False, f"Expected 900, got {data.get('expires_in')}")
                
        else:
            self.log_test("POST /api/transactions/{id}/payment-link", False, f"Status: {response.status_code}")
            
        # Test payment processing flow
        payment_data = {
            "transaction_id": transaction_id,
            "payment_method": "card",
            "card_details": {
                "card_number": "4111111111111111",
                "expiry": "12/25",
                "cvv": "123"
            }
        }
        
        response = requests.post(f"{self.base_url}/transactions/{transaction_id}/payment", json=payment_data)
        success = response.status_code == 200
        
        if success:
            data = response.json()
            details = f"Success: {data.get('success')}, License: {data.get('license_number')}"
            self.log_test("Payment processing flow", True, details)
        else:
            self.log_test("Payment processing flow", False, f"Status: {response.status_code}")
    
    def test_customer_validation_api(self):
        """Test POST /api/customers/validate endpoint"""
        print("\n🔍 2. CUSTOMER VALIDATION API TESTING")
        print("-" * 40)
        
        # Test with conflicting values as specified in review
        conflicting_data = {
            "mobile": "9953879832",
            "email": "arihant.mnnit@gmail.com",
            "gstin": "09AAACI5853L2Z5"
        }
        
        response = requests.post(f"{self.base_url}/customers/validate", json=conflicting_data)
        success = response.status_code == 200
        
        if success:
            data = response.json()
            conflict_fields = data.get('conflict_fields', [])
            existing_licenses = data.get('existing_licenses', [])
            
            details = f"Conflict fields: {conflict_fields}, Existing licenses: {len(existing_licenses)}"
            self.log_test("POST /api/customers/validate with conflicting data", True, details)
            
            # Verify proper conflict_fields and existing_licenses structure
            if isinstance(conflict_fields, list):
                self.log_test("Conflict fields structure verification", True, f"Array with {len(conflict_fields)} conflicts")
            else:
                self.log_test("Conflict fields structure verification", False, "Not an array")
                
            if isinstance(existing_licenses, list):
                self.log_test("Existing licenses structure verification", True, f"Array with {len(existing_licenses)} licenses")
            else:
                self.log_test("Existing licenses structure verification", False, "Not an array")
        else:
            self.log_test("POST /api/customers/validate with conflicting data", False, f"Status: {response.status_code}")
        
        # Test with various combinations of fields
        test_combinations = [
            {"mobile": "9876543210"},
            {"email": "test@example.com"},
            {"gstin": "27ABCDE1234F1Z5"},
            {"mobile": "9876543210", "email": "test@example.com"},
            {"ca_pan_no": "ABCDE1234F", "ca_license_number": "CA123456789"}
        ]
        
        for i, combo in enumerate(test_combinations):
            response = requests.post(f"{self.base_url}/customers/validate", json=combo)
            success = response.status_code == 200
            self.log_test(f"Validation combination {i+1}: {list(combo.keys())}", success)
    
    def test_transaction_creation_flow(self):
        """Test POST /api/transactions for creating new transactions"""
        print("\n🔍 3. TRANSACTION CREATION FLOW")
        print("-" * 40)
        
        # Create a test customer first
        customer_data = {
            "mobile": "9876543888",
            "name": "Transaction Test Customer",
            "email": "transactiontest@example.com",
            "company": "Transaction Test Company",
            "gstin": "27TRANSACTION1Z",
            "city": "Bangalore",
            "pincode": "560001",
            "address": "Transaction Test Address",
            "state": "Karnataka"
        }
        
        response = requests.post(f"{self.base_url}/customers", json=customer_data)
        if response.status_code != 200:
            self.log_test("Create customer for transaction test", False, f"Status: {response.status_code}")
            return
            
        customer_id = response.json()['id']
        self.log_test("Create customer for transaction test", True, f"Customer ID: {customer_id}")
        
        # Test different transaction types
        transaction_types = [
            {
                "name": "Desktop Perpetual",
                "data": {
                    "transaction_type": "New Sales",
                    "customer_id": customer_id,
                    "customer_name": "Transaction Test Customer",
                    "license_type": "Retail",
                    "product_type": "Desktop",
                    "plan_details": {
                        "plan_name": "Enterprise Multi User",
                        "base_price": 57999.0,
                        "is_multi_user": True,
                        "features": ["Complete suite", "Advanced features", "Premium support", "Multi user"]
                    },
                    "base_amount": 57999.0,
                    "discount_percent": 10.0,
                    "discount_amount": 5799.9,
                    "tax_amount": 9395.84,
                    "final_amount": 61594.94
                }
            },
            {
                "name": "Desktop Subscription",
                "data": {
                    "transaction_type": "New Sales",
                    "customer_id": customer_id,
                    "customer_name": "Transaction Test Customer",
                    "license_type": "Retail",
                    "product_type": "Desktop",
                    "plan_details": {
                        "plan_name": "Emerald Single User - Regular",
                        "base_price": 9999.0,
                        "is_multi_user": False,
                        "features": ["Premium features", "24/7 support", "Custom reports", "Single user", "Per year"]
                    },
                    "base_amount": 9999.0,
                    "discount_percent": 0.0,
                    "discount_amount": 0.0,
                    "tax_amount": 1799.82,
                    "final_amount": 11798.82
                }
            },
            {
                "name": "Busy Online",
                "data": {
                    "transaction_type": "New Sales",
                    "customer_id": customer_id,
                    "customer_name": "Transaction Test Customer",
                    "license_type": "Retail",
                    "product_type": "Busy Online",
                    "plan_details": {
                        "plan_name": "SQL - Annual",
                        "base_price": 16800.0,
                        "is_multi_user": False,
                        "features": ["1 company", "SQL database", "Cloud storage", "Per year"]
                    },
                    "base_amount": 16800.0,
                    "discount_percent": 0.0,
                    "discount_amount": 0.0,
                    "tax_amount": 3024.0,
                    "final_amount": 19824.0
                }
            }
        ]
        
        for transaction_type in transaction_types:
            response = requests.post(f"{self.base_url}/transactions", json=transaction_type["data"])
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"ID: {data.get('id')}, Status: {data.get('status')}, Amount: ₹{data.get('final_amount')}"
                self.log_test(f"Create {transaction_type['name']} transaction", True, details)
                
                # Verify proper validation and data storage
                if data.get('status') == 'Pending':
                    self.log_test(f"{transaction_type['name']} - Status validation", True, "Status set to Pending")
                else:
                    self.log_test(f"{transaction_type['name']} - Status validation", False, f"Expected Pending, got {data.get('status')}")
                    
            else:
                self.log_test(f"Create {transaction_type['name']} transaction", False, f"Status: {response.status_code}")
    
    def test_products_api(self):
        """Test GET /api/products to ensure plan data is properly structured"""
        print("\n🔍 4. PRODUCTS API TESTING")
        print("-" * 40)
        
        response = requests.get(f"{self.base_url}/products")
        success = response.status_code == 200
        
        if not success:
            self.log_test("GET /api/products", False, f"Status: {response.status_code}")
            return
            
        data = response.json()
        self.log_test("GET /api/products", True, f"Retrieved {len(data)} product categories")
        
        # Check that Desktop Perpetual and Subscription plans have correct pricing
        expected_products = {
            "Desktop Perpetual": {
                "Basic Single User": 9999,
                "Enterprise Multi User": 57999
            },
            "Desktop Subscription": {
                "Blue Single User": 4999,
                "Emerald Multi User": 24999
            },
            "Busy Online": {
                "Access - Annual": 10800,
                "SQL - Annual": 16800
            }
        }
        
        for product_name, expected_plans in expected_products.items():
            if product_name in data:
                self.log_test(f"Product category: {product_name}", True, f"Found with {len(data[product_name].get('Plans', {}))} plans")
                
                plans = data[product_name].get('Plans', {})
                for plan_name, expected_price in expected_plans.items():
                    if plan_name in plans:
                        actual_price = plans[plan_name].get('price')
                        if actual_price == expected_price:
                            self.log_test(f"{product_name} - {plan_name} pricing", True, f"₹{actual_price}")
                        else:
                            self.log_test(f"{product_name} - {plan_name} pricing", False, f"Expected ₹{expected_price}, got ₹{actual_price}")
                    else:
                        self.log_test(f"{product_name} - {plan_name} availability", False, "Plan not found")
            else:
                self.log_test(f"Product category: {product_name}", False, "Category not found")
    
    def run_all_tests(self):
        """Run all review-specific tests"""
        print("🚀 REVIEW-SPECIFIC API TESTING")
        print("=" * 60)
        print("Testing enhanced payment link functionality and client validation features")
        print("=" * 60)
        
        self.test_payment_link_api()
        self.test_customer_validation_api()
        self.test_transaction_creation_flow()
        self.test_products_api()
        
        # Summary
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 60)
        print(f"📊 REVIEW TEST RESULTS")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_failed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print("=" * 60)
        
        if self.tests_failed == 0:
            print("🎉 ALL REVIEW REQUIREMENTS PASSED!")
            return 0
        else:
            print("⚠️  Some tests failed - Review implementation needed")
            return 1

if __name__ == "__main__":
    tester = ReviewSpecificTester()
    sys.exit(tester.run_all_tests())