import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("booknest.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB at %s", settings.MONGODB_URI)
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.DB_NAME]
    
    # Create indexes for collections
    await create_indexes()
    logger.info("MongoDB connected successfully.")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

async def create_indexes():
    db = db_instance.db
    # Users unique email index
    await db.users.create_index("email", unique=True)
    # Refresh tokens index
    await db.refresh_tokens.create_index("token", unique=True)
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    # Books indexes
    await db.books.create_index("owner_id")
    await db.books.create_index([("title", "text"), ("author", "text")])
    # Shelves index
    await db.shelves.create_index("owner_id")
    # Shelf shares index
    await db.shelf_shares.create_index([("shelf_id", 1), ("user_id", 1)], unique=True)
    # Lendings unique book index (single borrower rule)
    await db.lendings.create_index("book_id", unique=True)
    await db.lendings.create_index("borrower_id")
    await db.lendings.create_index("lender_id")
    # Activity log index
    await db.activity_logs.create_index([("user_id", 1), ("created_at", -1)])

def get_database():
    return db_instance.db
