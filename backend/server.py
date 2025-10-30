from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TransactionType(str, Enum):
    NEW_SALES = "New Sales"
    UPGRADE = "Upgrade"
    RENEWAL = "Renewal"
    RECOM = "Recom"
    MOBILE_APP = "Mobile App"

class LicenseType(str, Enum):
    RETAIL = "Retail"
    CA = "CA"

class ProductType(str, Enum):
    DESKTOP = "Desktop"
    MOBILE = "Mobile"
    BUSY_ONLINE = "Busy Online"
    RECOM = "Recom"

class TransactionStatus(str, Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    PENDING = "Pending"
    CANCELLED = "Cancelled"

class PaymentStatus(str, Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    PENDING = "Pending"
    CANCELLED = "Cancelled"

# Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mobile: str
    name: str
    email: str
    company: str
    gstin: str
    city: str
    pincode: str
    address: str
    state: str
    country: str = "India"
    ca_pan_no: Optional[str] = None
    ca_license_number: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    mobile: str
    name: str
    email: str
    company: str
    gstin: str
    city: str
    pincode: str
    address: str
    state: str
    country: str = "India"
    ca_pan_no: Optional[str] = None
    ca_license_number: Optional[str] = None

class PlanDetails(BaseModel):
    plan_name: str
    base_price: float
    is_multi_user: bool = False
    features: List[str] = []

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_type: TransactionType
    customer_id: str
    customer_name: str
    license_type: Optional[LicenseType] = None
    product_type: ProductType
    plan_details: PlanDetails
    base_amount: float
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    final_amount: float
    status: TransactionStatus
    payment_status: PaymentStatus = PaymentStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payment_link_sent_at: Optional[datetime] = None
    payment_completed_at: Optional[datetime] = None
    license_number: Optional[str] = None
    manager_approval_required: bool = False

class TransactionCreate(BaseModel):
    transaction_type: TransactionType
    customer_id: str
    customer_name: str
    license_type: Optional[LicenseType] = None
    product_type: ProductType
    plan_details: PlanDetails
    base_amount: float
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    final_amount: float
    license_number: Optional[str] = None

class PaymentRequest(BaseModel):
    transaction_id: str
    payment_method: str
    card_details: Optional[Dict[str, Any]] = None

class LicenseDetails(BaseModel):
    license_number: str
    customer_name: str
    product_type: ProductType
    plan_name: str
    expiry_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('payment_link_sent_at'), str):
        item['payment_link_sent_at'] = datetime.fromisoformat(item['payment_link_sent_at'])
    if isinstance(item.get('payment_completed_at'), str):
        item['payment_completed_at'] = datetime.fromisoformat(item['payment_completed_at'])
    return item

# Routes
@api_router.get("/")
async def root():
    return {"message": "Internal Sales Portal API"}

# Customer routes
@api_router.post("/customers/validate")
async def validate_customer(validation_data: dict):
    """
    Validate customer details and check for existing licenses
    """
    existing_licenses = []
    conflict_fields = []
    
    # Build search criteria and track which fields have conflicts
    search_criteria = []
    field_mapping = {}
    
    if validation_data.get("email"):
        search_criteria.append({"email": validation_data["email"]})
        field_mapping["email"] = "email"
    
    if validation_data.get("mobile"):
        search_criteria.append({"mobile": validation_data["mobile"]})
        field_mapping["mobile"] = "mobile"
    
    if validation_data.get("gstin"):
        search_criteria.append({"gstin": validation_data["gstin"]})
        field_mapping["gstin"] = "gstin"
    
    if validation_data.get("ca_pan_no"):
        search_criteria.append({"ca_pan_no": validation_data["ca_pan_no"]})
        field_mapping["ca_pan_no"] = "ca_pan_no"
    
    if validation_data.get("ca_license_number"):
        search_criteria.append({"ca_license_number": validation_data["ca_license_number"]})
        field_mapping["ca_license_number"] = "ca_license_number"
    
    if search_criteria:
        # Find customers matching any of the criteria
        existing_customers = await db.customers.find({"$or": search_criteria}).to_list(100)
        
        # Track which fields have conflicts
        for customer in existing_customers:
            for field, field_name in field_mapping.items():
                if field_name in customer and customer[field_name] == validation_data.get(field):
                    if field_name not in conflict_fields:
                        conflict_fields.append(field_name)
            
            # Find licenses for this customer
            customer_licenses = await db.licenses.find({"customer_name": customer["name"]}).to_list(100)
            for license_data in customer_licenses:
                existing_licenses.append({
                    "license_number": license_data["license_number"],
                    "customer_name": license_data["customer_name"],
                    "product_type": license_data["product_type"],
                    "plan_name": license_data["plan_name"],
                    "is_active": license_data.get("is_active", True),
                    "created_at": license_data["created_at"],
                    "matched_field": field_name
                })
    
    return {
        "existing_licenses": existing_licenses,
        "conflict_fields": conflict_fields,
        "total_found": len(existing_licenses),
        "validation_status": "failed" if existing_licenses else "passed"
    }

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate):
    # Check for duplicate GSTIN
    if customer_data.gstin:
        existing = await db.customers.find_one({"gstin": customer_data.gstin})
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this GSTIN already exists")
    
    customer = Customer(**customer_data.dict())
    customer_dict = prepare_for_mongo(customer.dict())
    await db.customers.insert_one(customer_dict)
    return customer

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**parse_from_mongo(customer))

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find().to_list(1000)
    return [Customer(**parse_from_mongo(customer)) for customer in customers]

# Transaction routes
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate):
    transaction_dict = transaction_data.dict()
    transaction_dict['status'] = TransactionStatus.PENDING  # Set default status
    transaction = Transaction(**transaction_dict)
    transaction_dict = prepare_for_mongo(transaction.dict())
    await db.transactions.insert_one(transaction_dict)
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    transactions = await db.transactions.find().sort("created_at", -1).to_list(1000)
    return [Transaction(**parse_from_mongo(transaction)) for transaction in transactions]

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Transaction(**parse_from_mongo(transaction))

@api_router.patch("/transactions/{transaction_id}/payment-link")
async def send_payment_link(transaction_id: str):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = {
        "payment_link_sent_at": datetime.now(timezone.utc).isoformat(),
        "status": TransactionStatus.PENDING
    }
    
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    return {"message": "Payment link sent successfully", "expires_in": 900}  # 15 minutes

@api_router.post("/transactions/{transaction_id}/payment")
async def process_payment(transaction_id: str, payment_data: PaymentRequest):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Mock payment processing
    import random
    payment_success = random.choice([True, True, True, False])  # 75% success rate
    
    if payment_success:
        license_number = f"LIC-{str(uuid.uuid4())[:8].upper()}"
        update_data = {
            "status": TransactionStatus.SUCCESS,
            "payment_status": PaymentStatus.SUCCESS,
            "payment_completed_at": datetime.now(timezone.utc).isoformat(),
            "license_number": license_number
        }
        
        # Create license record
        license_data = {
            "license_number": license_number,
            "customer_name": transaction["customer_name"],
            "product_type": transaction["product_type"],
            "plan_name": transaction["plan_details"]["plan_name"],
            "expiry_date": None if transaction["product_type"] == "Desktop" else datetime.now(timezone.utc).isoformat(),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.licenses.insert_one(license_data)
        
    else:
        update_data = {
            "status": TransactionStatus.FAILED,
            "payment_status": PaymentStatus.FAILED
        }
    
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    return {
        "success": payment_success,
        "license_number": update_data.get("license_number"),
        "message": "Payment processed successfully" if payment_success else "Payment failed"
    }

# License routes
@api_router.get("/licenses/{license_number}", response_model=LicenseDetails)
async def get_license(license_number: str):
    license_data = await db.licenses.find_one({"license_number": license_number})
    if not license_data:
        raise HTTPException(status_code=404, detail="License not found")
    return LicenseDetails(**parse_from_mongo(license_data))

# Product and plan data
@api_router.get("/products")
async def get_products():
    return {
        "Desktop Perpetual": {
            "Plans": {
                "Basic Single User": {"price": 9999, "features": ["Basic accounting", "GST filing", "Single user license"]},
                "Basic Multi User": {"price": 24999, "features": ["Basic accounting", "GST filing", "Multi user license"]},
                "Standard Single User - Regular": {"price": 14999, "features": ["Advanced accounting", "GST filing", "Standard reports", "Single user"]},
                "Standard Single User - SQL": {"price": 9999, "features": ["Advanced accounting", "GST filing", "SQL database", "Single user"]},
                "Standard Multi User": {"price": 39999, "features": ["Advanced accounting", "GST filing", "Standard reports", "Multi user"]},
                "Enterprise Single User - Regular": {"price": 19999, "features": ["Complete suite", "Advanced features", "Premium support", "Single user"]},
                "Enterprise Single User - SQL": {"price": 13999, "features": ["Complete suite", "Advanced features", "SQL database", "Single user"]},
                "Enterprise Multi User": {"price": 57999, "features": ["Complete suite", "Advanced features", "Premium support", "Multi user"]}
            }
        },
        "Desktop Subscription": {
            "Plans": {
                "Blue Single User": {"price": 4999, "features": ["Cloud sync", "Mobile access", "Basic reports", "Single user", "Per year"]},
                "Blue Multi User": {"price": 12499, "features": ["Cloud sync", "Mobile access", "Basic reports", "Multi user", "Per year"]},
                "Saffron Single User - Regular": {"price": 6999, "features": ["Advanced features", "Priority support", "Advanced reports", "Single user", "Per year"]},
                "Saffron Single User - SQL": {"price": 4999, "features": ["Advanced features", "Priority support", "SQL database", "Single user", "Per year"]},
                "Saffron Multi User": {"price": 17999, "features": ["Advanced features", "Priority support", "Advanced reports", "Multi user", "Per year"]},
                "Emerald Single User - Regular": {"price": 9999, "features": ["Premium features", "24/7 support", "Custom reports", "Single user", "Per year"]},
                "Emerald Single User - SQL": {"price": 6499, "features": ["Premium features", "24/7 support", "SQL database", "Single user", "Per year"]},
                "Emerald Multi User": {"price": 24999, "features": ["Premium features", "24/7 support", "Custom reports", "Multi user", "Per year"]}
            }
        },
        "Busy Online": {
            "Plans": {
                "Access - Quarterly": {"price": 4500, "features": ["1 company", "Cloud storage", "Per quarter"]},
                "Access - Annual": {"price": 10800, "features": ["1 company", "Cloud storage", "Per year"]},
                "SQL - Quarterly": {"price": 5250, "features": ["1 company", "SQL database", "Cloud storage", "Per quarter"]},
                "SQL - Annual": {"price": 16800, "features": ["1 company", "SQL database", "Cloud storage", "Per year"]}
            }
        }
    }

# Analytics
@api_router.get("/analytics")
async def get_analytics():
    total_transactions = await db.transactions.count_documents({})
    successful_transactions = await db.transactions.count_documents({"status": TransactionStatus.SUCCESS})
    failed_transactions = await db.transactions.count_documents({"status": TransactionStatus.FAILED})
    pending_transactions = await db.transactions.count_documents({"status": TransactionStatus.PENDING})
    
    # Calculate totals by type
    new_sales = await db.transactions.count_documents({"transaction_type": TransactionType.NEW_SALES})
    upgrades = await db.transactions.count_documents({"transaction_type": TransactionType.UPGRADE})
    renewals = await db.transactions.count_documents({"transaction_type": TransactionType.RENEWAL})
    
    # Calculate revenue
    successful_transactions_data = await db.transactions.find({"status": TransactionStatus.SUCCESS}).to_list(1000)
    total_revenue = sum(transaction.get("final_amount", 0) for transaction in successful_transactions_data)
    
    return {
        "total_transactions": total_transactions,
        "successful_transactions": successful_transactions,
        "failed_transactions": failed_transactions,
        "pending_transactions": pending_transactions,
        "new_sales": new_sales,
        "upgrades": upgrades,
        "renewals": renewals,
        "total_revenue": total_revenue,
        "success_rate": round((successful_transactions / total_transactions * 100), 2) if total_transactions > 0 else 0
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()