import json
import os
from database import get_supabase

def seed_products():
    # Read products from resource.md (which is a JSON array)
    try:
        with open("../resource.md", "r") as f:
            products_data = json.load(f)
    except Exception as e:
        print(f"Error reading resource.md: {e}")
        return

    # Add extra fields for a premium experience
    categories = ["Kitchen", "Stationery", "Footwear", "Accessories", "Stationery", "Electronics", "Accessories", "Home", "Kitchen", "Electronics"]
    
    formatted_products = []
    for i, p in enumerate(products_data):
        formatted_products.append({
            "name": p["name"],
            "price": float(p["price"]),
            "description": p["description"],
            "category": categories[i] if i < len(categories) else "General",
            "image": p["image"],
            "rating": 4.5, # Default rating
            "stock": 20,   # Default stock
            "is_new": i < 3,
            "is_popular": i % 3 == 0
        })

    supabase = get_supabase()
    if not supabase:
        print("Supabase client not initialized. Check your .env file.")
        return

    print("Cleaning existing products...")
    # Supabase doesn't have a truncate, but we can delete if we have the right permissions
    # For now, let's just insert. If the table has a unique constraint on name or id, it might fail.
    # We'll try to delete all first.
    try:
        supabase.table("products").delete().neq("id", 0).execute()
    except Exception as e:
        print(f"Note: Could not delete existing products (maybe table is empty or RLS): {e}")

    print(f"Uploading {len(formatted_products)} products to Supabase...")
    try:
        response = supabase.table("products").insert(formatted_products).execute()
        if response.data:
            print(f"Successfully seeded {len(response.data)} products!")
        else:
            print("Error seeding products: No data returned.")
    except Exception as e:
        print(f"Error seeding products: {e}")

if __name__ == "__main__":
    seed_products()
