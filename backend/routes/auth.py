from flask import Blueprint, request, jsonify
from utils.db import get_supabase_client
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Real-time login using Supabase."""
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
        
    try:
        supabase = get_supabase_client()
        response = supabase.table("users").select("*").eq("email", email).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({'error': 'User not found'}), 404
            
        user_record = response.data[0]
        
        # Simple password check for demo (In prod, use bcrypt/Supabase Auth)
        if user_record['password_hash'] != password:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        user = {
            'id': user_record['id'],
            'email': user_record['email'],
            'name': user_record['full_name'],
            'role': user_record['role']
        }
        
        token = f"jwt_{user['role']}_{uuid.uuid4().hex[:8]}"
            
        return jsonify({
            'user': user,
            'token': token
        }), 200
    except Exception as e:
        print(f"[SmartShield] Login error: {e}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Real-time registration using Supabase."""
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', 'New Member')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
    try:
        supabase = get_supabase_client()
        
        # Check if user exists
        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            return jsonify({'error': 'Email already registered'}), 409
            
        # Create user ID
        is_admin = 'admin' in email
        worker_id = f"ADM-{uuid.uuid4().hex[:4].upper()}" if is_admin else f"WRK-{uuid.uuid4().hex[:4].upper()}"
        
        user_record = {
            'id': worker_id,
            'email': email,
            'password_hash': password, # Plain text for demo
            'full_name': name,
            'role': 'admin' if is_admin else 'worker'
        }
        
        supabase.table("users").insert(user_record).execute()
        
        user = {
            'id': worker_id,
            'email': email,
            'name': name,
            'role': user_record['role']
        }
        
        token = f"jwt_{user['role']}_{uuid.uuid4().hex[:8]}"
            
        return jsonify({
            'user': user,
            'token': token
        }), 201
    except Exception as e:
        print(f"[SmartShield] Registration error: {e}")
        return jsonify({'error': str(e)}), 500
