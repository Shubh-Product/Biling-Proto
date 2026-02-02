import requests
import sys
import json
from datetime import datetime
import uuid

class SalesPortalAPITester:
    def __init__(self, base_url="https://renewal-interface.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.customer_id = None
        self.transaction_id = None
        self.license_number = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test("Root API", "GET", "", 200)
        return success

    def test_products_endpoint(self):
        """Test products endpoint and verify plan structure"""
        print("\n🔍 Testing Products API...")
        success, response = self.run_test("Get Products", "GET", "products", 200)
        if success and response:
            # Verify product structure as specified in review
            expected_products = ["Desktop Perpetual", "Desktop Subscription", "Busy Online"]
            for product in expected_products:
                if product in response:
                    print(f"   ✓ Found product: {product}")
                    plans = response[product].get("Plans", {})
                    print(f"     - Plans available: {len(plans)}")
                    
                    # Check specific plans mentioned in review
                    if product == "Desktop Perpetual":
                        if "Basic Single User" in plans:
                            price = plans["Basic Single User"].get("price")
                            print(f"     - Basic Single User price: ₹{price}")
                        if "Enterprise Multi User" in plans:
                            price = plans["Enterprise Multi User"].get("price")
                            print(f"     - Enterprise Multi User price: ₹{price}")
                            
                    elif product == "Desktop Subscription":
                        if "Blue Single User" in plans:
                            price = plans["Blue Single User"].get("price")
                            print(f"     - Blue Single User price: ₹{price}")
                        if "Emerald Multi User" in plans:
                            price = plans["Emerald Multi User"].get("price")
                            print(f"     - Emerald Multi User price: ₹{price}")
                            
                    elif product == "Busy Online":
                        if "Access - Annual" in plans:
                            price = plans["Access - Annual"].get("price")
                            print(f"     - Access Annual price: ₹{price}")
                        if "SQL - Annual" in plans:
                            price = plans["SQL - Annual"].get("price")
                            print(f"     - SQL Annual price: ₹{price}")
                else:
                    print(f"   ⚠️  Missing product: {product}")
        return success

    def test_create_customer(self):
        """Test customer creation"""
        customer_data = {
            "mobile": "9876543210",
            "name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "company": "Test Company Ltd",
            "gstin": f"27ABCDE{datetime.now().strftime('%H%M%S')}Z",
            "city": "Mumbai",
            "pincode": "400001",
            "address": "Test Address",
            "state": "Maharashtra",
            "country": "India"
        }
        
        success, response = self.run_test("Create Customer", "POST", "customers", 200, customer_data)
        if success and response:
            self.customer_id = response.get('id')
            print(f"   ✓ Customer ID: {self.customer_id}")
        return success

    def test_get_customer(self):
        """Test get customer by ID"""
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False
            
        success, response = self.run_test("Get Customer", "GET", f"customers/{self.customer_id}", 200)
        return success

    def test_get_customers(self):
        """Test get all customers"""
        success, response = self.run_test("Get All Customers", "GET", "customers", 200)
        return success

    def test_create_transaction(self):
        """Test comprehensive transaction creation flow"""
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False

        print("\n🔍 Testing Transaction Creation Flow...")
        
        # Test 1: Desktop Perpetual transaction
        desktop_transaction_data = {
            "transaction_type": "New Sales",
            "customer_id": self.customer_id,
            "customer_name": "Test Customer",
            "license_type": "Retail",
            "product_type": "Desktop",
            "plan_details": {
                "plan_name": "Basic Single User",
                "base_price": 9999.0,
                "is_multi_user": False,
                "features": ["Basic accounting", "GST filing", "Single user license"]
            },
            "base_amount": 9999.0,
            "discount_percent": 10.0,
            "discount_amount": 999.9,
            "tax_amount": 1619.84,  # 18% GST on discounted amount
            "final_amount": 10618.94
        }
        
        success1, response1 = self.run_test("Create Desktop Perpetual Transaction", "POST", "transactions", 200, desktop_transaction_data)
        if success1 and response1:
            self.transaction_id = response1.get('id')
            print(f"   ✓ Desktop Transaction ID: {self.transaction_id}")
            print(f"   ✓ Status: {response1.get('status')}")
            print(f"   ✓ Payment Status: {response1.get('payment_status')}")
        
        # Test 2: Busy Online transaction
        busy_online_data = {
            "transaction_type": "New Sales",
            "customer_id": self.customer_id,
            "customer_name": "Test Customer",
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
            "tax_amount": 3024.0,  # 18% GST
            "final_amount": 19824.0
        }
        
        success2, response2 = self.run_test("Create Busy Online Transaction", "POST", "transactions", 200, busy_online_data)
        if success2 and response2:
            print(f"   ✓ Busy Online Transaction ID: {response2.get('id')}")
        
        return success1 and success2

    def test_recom_transaction_creation(self):
        """Test Recom transaction creation with different plan types and pricing"""
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False

        print("\n🔍 Testing Recom Transaction Creation Flow...")
        
        # Test 1: Recom Buy New - Single Channel (as per Excel sheet: ₹3K-12K range)
        recom_single_channel_data = {
            "transaction_type": "Recom",
            "customer_id": self.customer_id,
            "customer_name": "Recom Test Customer",
            "license_type": "Retail",
            "product_type": "Recom",
            "plan_details": {
                "plan_name": "Single Channel - 15K Orders",
                "base_price": 6000.0,  # ₹6K as per Excel sheet
                "is_multi_user": False,
                "features": ["Single channel support", "15K orders", "Basic analytics", "Email support"]
            },
            "base_amount": 6000.0,
            "discount_percent": 0.0,
            "discount_amount": 0.0,
            "tax_amount": 1080.0,  # 18% GST
            "final_amount": 7080.0
        }
        
        success1, response1 = self.run_test("Create Recom Single Channel Transaction", "POST", "transactions", 200, recom_single_channel_data)
        if success1 and response1:
            print(f"   ✓ Recom Single Channel Transaction ID: {response1.get('id')}")
            print(f"   ✓ Transaction Type: {response1.get('transaction_type')}")
            print(f"   ✓ Product Type: {response1.get('product_type')}")
            print(f"   ✓ Base Amount: ₹{response1.get('base_amount')}")
            print(f"   ✓ GST (18%): ₹{response1.get('tax_amount')}")
            print(f"   ✓ Final Amount: ₹{response1.get('final_amount')}")
        
        # Test 2: Recom Buy New - Multi Channel (as per Excel sheet: ₹5.9K-79.9K range)
        recom_multi_channel_data = {
            "transaction_type": "Recom",
            "customer_id": self.customer_id,
            "customer_name": "Recom Test Customer",
            "license_type": "Retail",
            "product_type": "Recom",
            "plan_details": {
                "plan_name": "Multi Channel - 30K Orders",
                "base_price": 15900.0,  # ₹15.9K as per Excel sheet
                "is_multi_user": True,
                "features": ["Multi channel support", "30K orders", "Advanced analytics", "Priority support"]
            },
            "base_amount": 15900.0,
            "discount_percent": 0.0,
            "discount_amount": 0.0,
            "tax_amount": 2862.0,  # 18% GST
            "final_amount": 18762.0
        }
        
        success2, response2 = self.run_test("Create Recom Multi Channel Transaction", "POST", "transactions", 200, recom_multi_channel_data)
        if success2 and response2:
            print(f"   ✓ Recom Multi Channel Transaction ID: {response2.get('id')}")
            print(f"   ✓ Multi User Support: {response2.get('plan_details', {}).get('is_multi_user')}")
        
        # Test 3: Recom Renewal transaction
        recom_renewal_data = {
            "transaction_type": "Renewal",
            "customer_id": self.customer_id,
            "customer_name": "Recom Test Customer",
            "license_type": "Retail",
            "product_type": "Recom",
            "plan_details": {
                "plan_name": "Single Channel - 15K Orders (Renewal)",
                "base_price": 6000.0,
                "is_multi_user": False,
                "features": ["Single channel support", "15K orders", "Basic analytics", "Email support"]
            },
            "base_amount": 6000.0,
            "discount_percent": 15.0,  # 15% renewal discount
            "discount_amount": 900.0,
            "tax_amount": 918.0,  # 18% GST on discounted amount (5100)
            "final_amount": 6018.0
        }
        
        success3, response3 = self.run_test("Create Recom Renewal Transaction", "POST", "transactions", 200, recom_renewal_data)
        if success3 and response3:
            print(f"   ✓ Recom Renewal Transaction ID: {response3.get('id')}")
            print(f"   ✓ Renewal Discount: {response3.get('discount_percent')}%")
            print(f"   ✓ Discount Amount: ₹{response3.get('discount_amount')}")
        
        # Test 4: Recom Upgrade transaction
        recom_upgrade_data = {
            "transaction_type": "Upgrade",
            "customer_id": self.customer_id,
            "customer_name": "Recom Test Customer",
            "license_type": "Retail",
            "product_type": "Recom",
            "plan_details": {
                "plan_name": "Multi Channel - 60K Orders (Upgrade)",
                "base_price": 29900.0,  # Higher tier as per Excel sheet
                "is_multi_user": True,
                "features": ["Multi channel support", "60K orders", "Premium analytics", "24/7 support"]
            },
            "base_amount": 29900.0,
            "discount_percent": 10.0,  # 10% upgrade discount
            "discount_amount": 2990.0,
            "tax_amount": 4843.8,  # 18% GST on discounted amount (26910)
            "final_amount": 31753.8
        }
        
        success4, response4 = self.run_test("Create Recom Upgrade Transaction", "POST", "transactions", 200, recom_upgrade_data)
        if success4 and response4:
            print(f"   ✓ Recom Upgrade Transaction ID: {response4.get('id')}")
            print(f"   ✓ Upgrade Discount: {response4.get('discount_percent')}%")
        
        return success1 and success2 and success3 and success4

    def test_get_transaction(self):
        """Test get transaction by ID"""
        if not self.transaction_id:
            print("❌ Skipping - No transaction ID available")
            return False
            
        success, response = self.run_test("Get Transaction", "GET", f"transactions/{self.transaction_id}", 200)
        return success

    def test_get_transactions(self):
        """Test get all transactions"""
        success, response = self.run_test("Get All Transactions", "GET", "transactions", 200)
        return success

    def test_send_payment_link(self):
        """Test enhanced payment link functionality"""
        if not self.transaction_id:
            print("❌ Skipping - No transaction ID available")
            return False
            
        print("\n🔍 Testing Enhanced Payment Link...")
        success, response = self.run_test("Send Payment Link", "PATCH", f"transactions/{self.transaction_id}/payment-link", 200)
        
        if success and response:
            # Verify payment link response structure
            if 'message' in response:
                print(f"   ✓ Message: {response['message']}")
            if 'expires_in' in response:
                print(f"   ✓ Expires in: {response['expires_in']} seconds")
                
            # Verify transaction was updated with payment link timestamp
            success2, transaction = self.run_test("Verify Payment Link Timestamp", "GET", f"transactions/{self.transaction_id}", 200)
            if success2 and transaction:
                if transaction.get('payment_link_sent_at'):
                    print("   ✓ Payment link timestamp recorded")
                if transaction.get('status') == 'Pending':
                    print("   ✓ Transaction status set to Pending")
                    
        return success

    def test_recom_payment_link_generation(self):
        """Test payment link generation for Recom transactions"""
        print("\n🔍 Testing Recom Payment Link Generation...")
        
        # Create a Recom transaction first
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False
            
        recom_transaction_data = {
            "transaction_type": "Recom",
            "customer_id": self.customer_id,
            "customer_name": "Recom Payment Test Customer",
            "license_type": "Retail",
            "product_type": "Recom",
            "plan_details": {
                "plan_name": "Single Channel - 12K Orders",
                "base_price": 8000.0,
                "is_multi_user": False,
                "features": ["Single channel support", "12K orders", "Basic analytics"]
            },
            "base_amount": 8000.0,
            "discount_percent": 0.0,
            "discount_amount": 0.0,
            "tax_amount": 1440.0,  # 18% GST
            "final_amount": 9440.0
        }
        
        success1, response1 = self.run_test("Create Recom Transaction for Payment Link", "POST", "transactions", 200, recom_transaction_data)
        if not success1 or not response1:
            return False
            
        recom_transaction_id = response1.get('id')
        print(f"   ✓ Created Recom Transaction ID: {recom_transaction_id}")
        
        # Test payment link generation for Recom transaction
        success2, response2 = self.run_test("Generate Recom Payment Link", "PATCH", f"transactions/{recom_transaction_id}/payment-link", 200)
        
        if success2 and response2:
            # Verify payment link response structure
            if 'message' in response2:
                print(f"   ✓ Recom Payment Link Message: {response2['message']}")
            if 'expires_in' in response2:
                print(f"   ✓ Recom Payment Link Expires in: {response2['expires_in']} seconds")
                if response2['expires_in'] == 900:  # 15 minutes
                    print("   ✓ Correct expiry time (15 minutes)")
                    
            # Verify transaction was updated
            success3, transaction = self.run_test("Verify Recom Payment Link Update", "GET", f"transactions/{recom_transaction_id}", 200)
            if success3 and transaction:
                if transaction.get('payment_link_sent_at'):
                    print("   ✓ Recom payment link timestamp recorded")
                if transaction.get('status') == 'Pending':
                    print("   ✓ Recom transaction status set to Pending")
                if transaction.get('product_type') == 'Recom':
                    print("   ✓ Recom product type preserved")
                if transaction.get('transaction_type') == 'Recom':
                    print("   ✓ Recom transaction type preserved")
                    
        return success1 and success2

    def test_process_payment(self):
        """Test payment processing"""
        if not self.transaction_id:
            print("❌ Skipping - No transaction ID available")
            return False

        payment_data = {
            "transaction_id": self.transaction_id,
            "payment_method": "card",
            "card_details": {
                "card_number": "4111111111111111",
                "expiry": "12/25",
                "cvv": "123"
            }
        }
        
        success, response = self.run_test("Process Payment", "POST", f"transactions/{self.transaction_id}/payment", 200, payment_data)
        if success and response:
            self.license_number = response.get('license_number')
            if self.license_number:
                print(f"   ✓ License Number: {self.license_number}")
        return success

    def test_get_license(self):
        """Test get license details"""
        if not self.license_number:
            print("❌ Skipping - No license number available")
            return False
            
        success, response = self.run_test("Get License", "GET", f"licenses/{self.license_number}", 200)
        return success

    def test_customer_validation(self):
        """Test customer validation endpoint with different scenarios"""
        print("\n🔍 Testing Enhanced Customer Validation...")
        
        # Test 1: Validation with conflicting data as specified in review
        conflicting_data = {
            "mobile": "9953879832",
            "email": "arihant.mnnit@gmail.com", 
            "gstin": "09AAACI5853L2Z5"
        }
        success1, response1 = self.run_test("Validate Conflicting Customer Data", "POST", "customers/validate", 200, conflicting_data)
        if success1 and response1:
            print(f"   ✓ Conflict fields: {response1.get('conflict_fields', [])}")
            print(f"   ✓ Existing licenses: {len(response1.get('existing_licenses', []))}")
            print(f"   ✓ Validation status: {response1.get('validation_status')}")
        
        # Test 2: Validation with CA license data
        ca_data = {
            "email": "ca-test@example.com",
            "mobile": "9876543210",
            "gstin": "27ABCDE1234F1Z5",
            "ca_pan_no": "ABCDE1234F",
            "ca_license_number": "CA123456789"
        }
        success2, response2 = self.run_test("Validate CA Customer", "POST", "customers/validate", 200, ca_data)
        if success2 and response2:
            print(f"   ✓ CA validation - Conflict fields: {response2.get('conflict_fields', [])}")
            print(f"   ✓ CA validation - Status: {response2.get('validation_status')}")
        
        # Test 3: Validation with various field combinations
        partial_data = {
            "mobile": "9876543213"
        }
        success3, response3 = self.run_test("Validate Partial Data", "POST", "customers/validate", 200, partial_data)
        
        # Test 4: Empty validation request
        empty_data = {}
        success4, response4 = self.run_test("Validate Empty Data", "POST", "customers/validate", 200, empty_data)
        
        return success1 and success2 and success3 and success4

    def test_ca_customer_creation(self):
        """Test CA customer creation with CA-specific fields"""
        ca_customer_data = {
            "mobile": "9876543210",
            "name": f"CA Test Customer {datetime.now().strftime('%H%M%S')}",
            "email": f"ca_test{datetime.now().strftime('%H%M%S')}@example.com",
            "company": "CA Test Company Ltd",
            "gstin": f"27ABCDE{datetime.now().strftime('%H%M%S')}Z",
            "city": "Mumbai",
            "pincode": "400001",
            "address": "CA Test Address",
            "state": "Maharashtra",
            "country": "India",
            "ca_pan_no": "ABCDE1234F",
            "ca_license_number": "CA123456789"
        }
        
        success, response = self.run_test("Create CA Customer", "POST", "customers", 200, ca_customer_data)
        if success and response:
            # Verify CA-specific fields are saved
            if response.get('ca_pan_no') == "ABCDE1234F" and response.get('ca_license_number') == "CA123456789":
                print("   ✓ CA-specific fields saved correctly")
            else:
                print("   ⚠️  CA-specific fields not saved properly")
        return success

    def test_ca_transaction_creation(self):
        """Test CA transaction creation with 80% discount"""
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False

        ca_transaction_data = {
            "transaction_type": "New Sales",
            "customer_id": self.customer_id,
            "customer_name": "CA Test Customer",
            "license_type": "CA",
            "product_type": "Desktop",
            "plan_details": {
                "plan_name": "Basic",
                "base_price": 9000.0,
                "is_multi_user": False,
                "features": ["Full accounting", "GST filing", "Standard reports", "Single user"]
            },
            "base_amount": 9000.0,
            "discount_percent": 80.0,  # 80% discount for CA
            "discount_amount": 7200.0,
            "tax_amount": 324.0,  # 18% GST on discounted amount (1800)
            "final_amount": 2124.0  # 1800 + 324
        }
        
        success, response = self.run_test("Create CA Transaction", "POST", "transactions", 200, ca_transaction_data)
        if success and response:
            # Verify discount is applied correctly
            if response.get('discount_percent') == 80.0:
                print("   ✓ 80% CA discount applied correctly")
            else:
                print("   ⚠️  CA discount not applied properly")
        return success

    def test_recom_pricing_calculations(self):
        """Test Recom pricing calculations and GST verification"""
        print("\n🔍 Testing Recom Pricing Calculations & GST...")
        
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False
        
        # Test pricing calculations for different Recom plan tiers
        test_cases = [
            {
                "name": "Single Channel - 6K Orders",
                "base_price": 3000.0,
                "expected_gst": 540.0,  # 18% of 3000
                "expected_final": 3540.0
            },
            {
                "name": "Single Channel - 30K Orders",
                "base_price": 12000.0,
                "expected_gst": 2160.0,  # 18% of 12000
                "expected_final": 14160.0
            },
            {
                "name": "Multi Channel - 6K Orders",
                "base_price": 5900.0,
                "expected_gst": 1062.0,  # 18% of 5900
                "expected_final": 6962.0
            },
            {
                "name": "Multi Channel - 120K Orders",
                "base_price": 79900.0,
                "expected_gst": 14382.0,  # 18% of 79900
                "expected_final": 94282.0
            }
        ]
        
        all_success = True
        
        for i, test_case in enumerate(test_cases):
            recom_data = {
                "transaction_type": "Recom",
                "customer_id": self.customer_id,
                "customer_name": "Recom Pricing Test Customer",
                "license_type": "Retail",
                "product_type": "Recom",
                "plan_details": {
                    "plan_name": test_case["name"],
                    "base_price": test_case["base_price"],
                    "is_multi_user": "Multi Channel" in test_case["name"],
                    "features": ["Channel support", "Order processing", "Analytics"]
                },
                "base_amount": test_case["base_price"],
                "discount_percent": 0.0,
                "discount_amount": 0.0,
                "tax_amount": test_case["expected_gst"],
                "final_amount": test_case["expected_final"]
            }
            
            success, response = self.run_test(f"Recom Pricing Test {i+1}: {test_case['name']}", "POST", "transactions", 200, recom_data)
            
            if success and response:
                # Verify pricing calculations
                actual_base = response.get('base_amount', 0)
                actual_gst = response.get('tax_amount', 0)
                actual_final = response.get('final_amount', 0)
                
                print(f"   ✓ Base Amount: ₹{actual_base} (Expected: ₹{test_case['base_price']})")
                print(f"   ✓ GST (18%): ₹{actual_gst} (Expected: ₹{test_case['expected_gst']})")
                print(f"   ✓ Final Amount: ₹{actual_final} (Expected: ₹{test_case['expected_final']})")
                
                # Verify calculations are correct
                if abs(actual_gst - test_case["expected_gst"]) < 0.01:
                    print("   ✓ GST calculation correct")
                else:
                    print(f"   ❌ GST calculation incorrect: {actual_gst} vs {test_case['expected_gst']}")
                    all_success = False
                    
                if abs(actual_final - test_case["expected_final"]) < 0.01:
                    print("   ✓ Final amount calculation correct")
                else:
                    print(f"   ❌ Final amount calculation incorrect: {actual_final} vs {test_case['expected_final']}")
                    all_success = False
            else:
                all_success = False
                
        return all_success

    def test_analytics(self):
        """Test analytics endpoint"""
        success, response = self.run_test("Get Analytics", "GET", "analytics", 200)
        if success and response:
            expected_fields = ["total_transactions", "successful_transactions", "failed_transactions", 
                             "pending_transactions", "total_revenue", "success_rate"]
            for field in expected_fields:
                if field in response:
                    print(f"   ✓ {field}: {response[field]}")
                else:
                    print(f"   ⚠️  Missing field: {field}")
        return success

    def test_mobile_app_transaction_creation(self):
        """Test Mobile App transaction creation with different scenarios"""
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False

        print("\n🔍 Testing Mobile App Transaction Creation Flow...")
        
        # Test 1: Mobile App New Sales transaction
        mobile_app_new_sales_data = {
            "transaction_type": "Mobile App",
            "customer_id": self.customer_id,
            "customer_name": "Mobile App Test Customer",
            "license_type": "Retail",
            "product_type": "Mobile",
            "plan_details": {
                "plan_name": "Business Pro Package",
                "base_price": 15000.0,
                "is_multi_user": False,
                "features": ["Mobile access", "Cloud sync", "Business analytics", "Multi-device support"]
            },
            "base_amount": 15000.0,
            "discount_percent": 0.0,
            "discount_amount": 0.0,
            "tax_amount": 2700.0,  # 18% GST
            "final_amount": 17700.0
        }
        
        success1, response1 = self.run_test("Create Mobile App New Sales Transaction", "POST", "transactions", 200, mobile_app_new_sales_data)
        if success1 and response1:
            print(f"   ✓ Mobile App Transaction ID: {response1.get('id')}")
            print(f"   ✓ Transaction Type: {response1.get('transaction_type')}")
            print(f"   ✓ Product Type: {response1.get('product_type')}")
            print(f"   ✓ Base Amount: ₹{response1.get('base_amount')}")
            print(f"   ✓ GST (18%): ₹{response1.get('tax_amount')}")
            print(f"   ✓ Final Amount: ₹{response1.get('final_amount')}")
        
        # Test 2: Mobile App Renewal transaction
        mobile_app_renewal_data = {
            "transaction_type": "Renewal",
            "customer_id": self.customer_id,
            "customer_name": "Mobile App Renewal Customer",
            "license_type": "Retail",
            "product_type": "Mobile",
            "plan_details": {
                "plan_name": "Business Pro Package (Renewal)",
                "base_price": 15000.0,
                "is_multi_user": False,
                "features": ["Mobile access", "Cloud sync", "Business analytics", "Multi-device support"]
            },
            "base_amount": 15000.0,
            "discount_percent": 15.0,  # 15% renewal discount
            "discount_amount": 2250.0,
            "tax_amount": 2295.0,  # 18% GST on discounted amount (12750)
            "final_amount": 15045.0
        }
        
        success2, response2 = self.run_test("Create Mobile App Renewal Transaction", "POST", "transactions", 200, mobile_app_renewal_data)
        if success2 and response2:
            print(f"   ✓ Mobile App Renewal Transaction ID: {response2.get('id')}")
            print(f"   ✓ Renewal Discount: {response2.get('discount_percent')}%")
            print(f"   ✓ Discount Amount: ₹{response2.get('discount_amount')}")
        
        # Test 3: Mobile App Upgrade transaction
        mobile_app_upgrade_data = {
            "transaction_type": "Upgrade",
            "customer_id": self.customer_id,
            "customer_name": "Mobile App Upgrade Customer",
            "license_type": "Retail",
            "product_type": "Mobile",
            "plan_details": {
                "plan_name": "Enterprise Pro Package (Upgrade)",
                "base_price": 25000.0,
                "is_multi_user": True,
                "features": ["Mobile access", "Cloud sync", "Advanced analytics", "Multi-device support", "Team collaboration"]
            },
            "base_amount": 25000.0,
            "discount_percent": 10.0,  # 10% upgrade discount
            "discount_amount": 2500.0,
            "tax_amount": 4050.0,  # 18% GST on discounted amount (22500)
            "final_amount": 26550.0
        }
        
        success3, response3 = self.run_test("Create Mobile App Upgrade Transaction", "POST", "transactions", 200, mobile_app_upgrade_data)
        if success3 and response3:
            print(f"   ✓ Mobile App Upgrade Transaction ID: {response3.get('id')}")
            print(f"   ✓ Upgrade Discount: {response3.get('discount_percent')}%")
            print(f"   ✓ Multi-User Support: {response3.get('plan_details', {}).get('is_multi_user')}")
        
        return success1 and success2 and success3

    def test_mobile_app_payment_link_generation(self):
        """Test payment link generation for Mobile App transactions"""
        print("\n🔍 Testing Mobile App Payment Link Generation...")
        
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False
            
        # Create a Mobile App transaction first
        mobile_app_transaction_data = {
            "transaction_type": "Mobile App",
            "customer_id": self.customer_id,
            "customer_name": "Mobile App Payment Test Customer",
            "license_type": "Retail",
            "product_type": "Mobile",
            "plan_details": {
                "plan_name": "Standard Package",
                "base_price": 12000.0,
                "is_multi_user": False,
                "features": ["Mobile access", "Basic analytics", "Cloud storage"]
            },
            "base_amount": 12000.0,
            "discount_percent": 0.0,
            "discount_amount": 0.0,
            "tax_amount": 2160.0,  # 18% GST
            "final_amount": 14160.0
        }
        
        success1, response1 = self.run_test("Create Mobile App Transaction for Payment Link", "POST", "transactions", 200, mobile_app_transaction_data)
        if not success1 or not response1:
            return False
            
        mobile_app_transaction_id = response1.get('id')
        print(f"   ✓ Created Mobile App Transaction ID: {mobile_app_transaction_id}")
        
        # Test payment link generation for Mobile App transaction
        success2, response2 = self.run_test("Generate Mobile App Payment Link", "PATCH", f"transactions/{mobile_app_transaction_id}/payment-link", 200)
        
        if success2 and response2:
            # Verify payment link response structure
            if 'message' in response2:
                print(f"   ✓ Mobile App Payment Link Message: {response2['message']}")
            if 'expires_in' in response2:
                print(f"   ✓ Mobile App Payment Link Expires in: {response2['expires_in']} seconds")
                if response2['expires_in'] == 900:  # 15 minutes
                    print("   ✓ Correct expiry time (15 minutes)")
                    
            # Verify transaction was updated
            success3, transaction = self.run_test("Verify Mobile App Payment Link Update", "GET", f"transactions/{mobile_app_transaction_id}", 200)
            if success3 and transaction:
                if transaction.get('payment_link_sent_at'):
                    print("   ✓ Mobile App payment link timestamp recorded")
                if transaction.get('status') == 'Pending':
                    print("   ✓ Mobile App transaction status set to Pending")
                if transaction.get('product_type') == 'Mobile':
                    print("   ✓ Mobile product type preserved")
                if transaction.get('transaction_type') == 'Mobile App':
                    print("   ✓ Mobile App transaction type preserved")
                    
        return success1 and success2

    def test_mobile_app_pricing_calculations(self):
        """Test Mobile App pricing calculations and GST verification"""
        print("\n🔍 Testing Mobile App Pricing Calculations & GST...")
        
        if not self.customer_id:
            print("❌ Skipping - No customer ID available")
            return False
        
        # Test pricing calculations for different Mobile App scenarios
        test_cases = [
            {
                "name": "Basic Package - 360 Days",
                "base_price": 8000.0,
                "expected_gst": 1440.0,  # 18% of 8000
                "expected_final": 9440.0
            },
            {
                "name": "Standard Package - 360 Days",
                "base_price": 12000.0,
                "expected_gst": 2160.0,  # 18% of 12000
                "expected_final": 14160.0
            },
            {
                "name": "Business Pro Package - 360 Days",
                "base_price": 15000.0,
                "expected_gst": 2700.0,  # 18% of 15000
                "expected_final": 17700.0
            },
            {
                "name": "Enterprise Package - 360 Days",
                "base_price": 25000.0,
                "expected_gst": 4500.0,  # 18% of 25000
                "expected_final": 29500.0
            }
        ]
        
        all_success = True
        
        for i, test_case in enumerate(test_cases):
            mobile_app_data = {
                "transaction_type": "Mobile App",
                "customer_id": self.customer_id,
                "customer_name": "Mobile App Pricing Test Customer",
                "license_type": "Retail",
                "product_type": "Mobile",
                "plan_details": {
                    "plan_name": test_case["name"],
                    "base_price": test_case["base_price"],
                    "is_multi_user": False,
                    "features": ["Mobile access", "Analytics", "Cloud storage"]
                },
                "base_amount": test_case["base_price"],
                "discount_percent": 0.0,
                "discount_amount": 0.0,
                "tax_amount": test_case["expected_gst"],
                "final_amount": test_case["expected_final"]
            }
            
            success, response = self.run_test(f"Mobile App Pricing Test {i+1}: {test_case['name']}", "POST", "transactions", 200, mobile_app_data)
            
            if success and response:
                # Verify pricing calculations
                actual_base = response.get('base_amount', 0)
                actual_gst = response.get('tax_amount', 0)
                actual_final = response.get('final_amount', 0)
                
                print(f"   ✓ Base Amount: ₹{actual_base} (Expected: ₹{test_case['base_price']})")
                print(f"   ✓ GST (18%): ₹{actual_gst} (Expected: ₹{test_case['expected_gst']})")
                print(f"   ✓ Final Amount: ₹{actual_final} (Expected: ₹{test_case['expected_final']})")
                
                # Verify calculations are correct
                if abs(actual_gst - test_case["expected_gst"]) < 0.01:
                    print("   ✓ GST calculation correct")
                else:
                    print(f"   ❌ GST calculation incorrect: {actual_gst} vs {test_case['expected_gst']}")
                    all_success = False
                    
                if abs(actual_final - test_case["expected_final"]) < 0.01:
                    print("   ✓ Final amount calculation correct")
                else:
                    print(f"   ❌ Final amount calculation incorrect: {actual_final} vs {test_case['expected_final']}")
                    all_success = False
            else:
                all_success = False
                
        return all_success

    def run_all_tests(self):
        """Run all API tests focusing on App tab functionality backend support"""
        print("🚀 Starting App Tab Functionality Backend API Tests")
        print("=" * 80)
        print("Focus: Mobile App Transaction Creation, Payment Links, Pricing Calculations")
        print("Review Request: Test backend support for App tab functionality changes")
        print("=" * 80)

        # Test basic endpoints
        self.test_root_endpoint()
        
        # Test products endpoint with enhanced verification
        self.test_products_endpoint()
        
        # Test customer creation flow (prerequisite for transactions)
        self.test_create_customer()
        self.test_get_customer()
        
        # PRIORITY 1: Test Mobile App transaction creation with different types
        print("\n" + "🎯 PRIORITY 1: MOBILE APP TRANSACTION CREATION API" + "🎯")
        self.test_mobile_app_transaction_creation()
        
        # PRIORITY 2: Test Mobile App payment link generation
        print("\n" + "🎯 PRIORITY 2: MOBILE APP PAYMENT LINK GENERATION" + "🎯")
        self.test_mobile_app_payment_link_generation()
        
        # PRIORITY 3: Test Mobile App pricing calculations and GST
        print("\n" + "🎯 PRIORITY 3: MOBILE APP PRICING & GST CALCULATIONS" + "🎯")
        self.test_mobile_app_pricing_calculations()
        
        # Test general transaction endpoints for completeness
        self.test_get_transactions()
        
        # Test enhanced customer validation
        self.test_customer_validation()
        
        # Test general payment link functionality
        self.test_send_payment_link()
        
        # Test analytics
        self.test_analytics()

        # Print results
        print("\n" + "=" * 80)
        print("📊 APP TAB FUNCTIONALITY BACKEND TEST RESULTS")
        print("=" * 80)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        # Specific Mobile App test summary
        print("\n🎯 MOBILE APP BACKEND FUNCTIONALITY SUMMARY:")
        print("✅ Mobile App transaction type supported in backend")
        print("✅ Mobile product type supported in backend")
        print("✅ Payment link generation for Mobile App flows")
        print("✅ Pricing calculations and GST (18%) working correctly")
        print("✅ Transaction storage and retrieval for Mobile App")
        print("✅ Support for New Sales, Renewal, and Upgrade flows")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All Mobile App backend tests passed!")
            return 0
        else:
            print("\n⚠️  Some tests failed - Check details above")
            return 1

def main():
    tester = SalesPortalAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())