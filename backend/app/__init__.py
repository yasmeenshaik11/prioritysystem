from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt
from .routes.auth import auth_bp
from .routes.complaints import complaints_bp
from .routes.officer import officer_bp
from .routes.notifications import notifications_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)
    
    # Enable CORS for web frontend (Vercel & localhost)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
    app.register_blueprint(officer_bp, url_prefix='/api/officer')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    @app.get('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'Emergency AI Complaint Priority Engine',
            'database': app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0],
            'version': '2.0.0'
        })

    @app.get('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"[Database Error during create_all]: {e}")

    return app
