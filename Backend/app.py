import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_supabase

app = Flask(__name__)
CORS(app)

def json_response(status="success", data=None, message=""):
    """Standardized JSON response format"""
    response = {"status": status}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    return jsonify(response)

@app.route('/products')
def get_products():
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    sort = request.args.get('sort', 'newest').strip()
    
    try:
        min_price = request.args.get('minPrice', type=float)
        max_price = request.args.get('maxPrice', type=float)
    except ValueError:
        return json_response("error", message="Invalid price format"), 400

    supabase = get_supabase()
    if not supabase:
        return json_response("error", message="Database connection failed"), 500

    try:
        # Start building the query
        query = supabase.table("products").select("*")

        if search:
            query = query.ilike("name", f"%{search}%")

        if category:
            query = query.eq("category", category)

        if min_price is not None:
            query = query.gte("price", min_price)

        if max_price is not None:
            query = query.lte("price", max_price)

        # Sorting Logic
        if sort == 'price-low':
            query = query.order("price", desc=False)
        elif sort == 'price-high':
            query = query.order("price", desc=True)
        elif sort == 'popular':
            query = query.order("is_popular", desc=True).order("rating", desc=True)
        elif sort == 'newest':
            query = query.order("created_at", desc=True)
        else:
            query = query.order("id", desc=True)

        response = query.execute()
        return json_response("success", data=response.data)

    except Exception as e:
        # Log to server console only, do not expose stack trace
        print(f"[Database Error]: {str(e)}")
        return json_response("error", message="An internal server error occurred while fetching products"), 500

@app.route('/categories')
def get_categories():
    supabase = get_supabase()
    if not supabase:
        return json_response("error", message="Database connection failed"), 500
    
    try:
        # Fetch only unique categories
        response = supabase.table("products").select("category").execute()
        categories = list(set([item['category'] for item in response.data if item.get('category')]))
        categories.sort()
        return json_response("success", data=categories)
    except Exception as e:
        print(f"[Database Error]: {str(e)}")
        return json_response("error", message="An internal server error occurred while fetching categories"), 500

@app.route('/health')
def health():
    return json_response("success", data={
        "status": "healthy", 
        "database_connected": get_supabase() is not None
    })

@app.errorhandler(404)
def not_found(error):
    return json_response("error", message="Resource not found"), 404

@app.errorhandler(500)
def server_error(error):
    return json_response("error", message="Internal server error"), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    # Note: debug=True should be False in production
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    app.run(host='0.0.0.0', port=port, debug=debug_mode)