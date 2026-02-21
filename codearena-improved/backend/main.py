from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import sys

from routers.judge import bp as judge_bp
from routers.ai import bp as ai_bp
from routers import duels
from core.config import settings


def create_app():
    app = Flask(__name__)
    
    print("🚀 CodeArena AI Backend starting...")
    print(f"   Judge0 URL: {settings.JUDGE0_URL}")
    
    # Configure CORS
    CORS(
        app,
        origins=[
            "http://localhost:3000",
            "http://frontend:3000",
            settings.FRONTEND_URL,
        ],
        supports_credentials=True,
    )
    
    # Initialize SocketIO for WebSocket support
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    # Register WebSocket handlers
    duels.register_socketio(app, socketio)
    
    # Register blueprints
    app.register_blueprint(judge_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(duels.bp)
    
    # Health check endpoint
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "CodeArena AI v2"}), 200
    
    # Root endpoint
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({"message": "CodeArena AI Backend v2", "docs": "/api/docs"}), 200
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request"}), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app, socketio


if __name__ == "__main__":
    app, socketio = create_app()
    print("👋 Starting Flask development server...")
    socketio.run(app, host="127.0.0.1", port=8000, debug=True)

