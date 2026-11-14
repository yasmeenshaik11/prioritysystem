import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    print(f"Starting Emergency AI Backend on port {port} (debug={debug})...")
    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=False)
