import asyncio
import os
import uuid
import json
import logging
from quart import Quart, request, jsonify, websocket
from quart_cors import cors
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from supabase import create_client, Client

from video_analyzer import VideoAnalyzer
from audio_manager import AudioManager
from audio_streaming import AudioStreaming, pcs
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png', 'gif'}

app = Quart(__name__)
app = cors(app, allow_origin="*") # In production, restrict this to your frontend's origin
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize managers
video_analyzer = VideoAnalyzer()
audio_manager = AudioManager()

# Initialize Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/posts/create', methods=['POST'])
async def create_post():
    """
    Handles creation of a new post with optional media files.
    Accepts multipart/form-data.
    """
    form = await request.form
    files = await request.files

    post_data_str = form.get('postData')
    if not post_data_str:
        return jsonify({"error": "Missing postData"}), 400

    try:
        post_data = json.loads(post_data_str)
        logging.info(f"Received post data: {post_data}")

        # Upload media to Supabase Storage
        media_files = files.getlist('media')
        media_urls = []
        for file in media_files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_id = str(uuid.uuid4())
                file_path = f"posts/{file_id}_{filename}"
                
                # Upload file content
                file_content = await file.read()
                supabase.storage.from_("media").upload(file=file_content, path=file_path, file_options={"content-type": file.content_type})
                
                # Get public URL
                public_url_data = supabase.storage.from_("media").get_public_url(file_path)
                media_urls.append(public_url_data)
                logging.info(f"Uploaded media file to: {public_url_data}")

        # Prepare data for insertion into the 'posts' table
        # This assumes you have a user_id available, e.g., from a JWT token.
        # For now, we'll use a placeholder.
        user_id = post_data.get('userId', str(uuid.uuid4())) # Replace with actual user ID
        
        post_to_insert = {**post_data, "media_urls": media_urls, "author_id": user_id}
        
        # Insert post data into Supabase table
        data, count = supabase.table('posts').insert(post_to_insert).execute()
        logging.info(f"Inserted post into database: {data}")

        return jsonify({"message": "Post created successfully", "post": data[1][0]}), 201
    except Exception as e:
        logging.error(f"Error creating post: {e}", exc_info=True)
        return jsonify({"error": "Failed to create post"}), 500

@app.route('/api/posts/<post_id>', methods=['GET'])
async def get_post(post_id):
    """
    Retrieves a single post by its ID, along with author and community info.
    """
    try:
        # Query the post and join related data from profiles and communities
        # The select query fetches the post and related columns from other tables.
        # profiles(username, avatar_url) fetches the author's details.
        # communities(name, avatar_url) fetches the community's details.
        query = supabase.table('posts').select('*, author:profiles(username, avatar_url), community:communities(name, avatar_url)').eq('id', post_id).single()
        data, count = query.execute()

        if not data[1]:
            return jsonify({"error": "Post not found"}), 404

        return jsonify(data[1]), 200
    except Exception as e:
        logging.error(f"Error fetching post {post_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch post"}), 500

if __name__ == "__main__":
    # For development, run the Quart application.
    # The default port is 5000, which matches the frontend API calls.
    # Use debug=True to get more detailed error messages and auto-reloading.
    app.run(host="0.0.0.0", port=5000, debug=True)

@app.route('/api/videos/upload', methods=['POST'])
async def upload_video():
    """
    Handles video file uploads.
    Saves the video and triggers background analysis.
    """
    if 'file' not in await request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = (await request.files)['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        video_id = str(uuid.uuid4())
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{video_id}_{filename}")
        await file.save(save_path)

        # In a production app, this should be a background task (e.g., using Celery)
        logging.info(f"File saved to {save_path}. Starting analysis.")
        asyncio.create_task(run_video_analysis(save_path))

        return jsonify({
            "message": "File uploaded successfully. Analysis in progress.",
            "video_id": video_id,
            "filename": filename
        }), 202
    
    return jsonify({"error": "File type not allowed"}), 400

async def run_video_analysis(video_path):
    """A wrapper to run the synchronous analysis in an executor."""
    loop = asyncio.get_event_loop()
    analysis_result = await loop.run_in_executor(
        None, video_analyzer.analyze_video, video_path
    )
    if analysis_result:
        logging.info(f"Analysis complete for {video_path}: {analysis_result}")
        # Here you would save the analysis_result to your database
    else:
        logging.error(f"Analysis failed for {video_path}")

@app.route('/api/videos', methods=['GET'])
async def get_videos():
    """
    Returns a list of available videos.
    """
    # In a real app, this would query the database.
    # For now, we'll list files from the upload folder.
    videos = [f for f in os.listdir(UPLOAD_FOLDER) if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))]
    return jsonify(videos)

@app.websocket('/ws/baraza/<space_id>')
async def baraza_stream_ws(space_id):
    """
    WebSocket endpoint for Baraza audio WebRTC signaling.
    """
    audio_path = os.path.join(UPLOAD_FOLDER, space_id)  # Example: space_id is the filename or identifier
    audio_track = audio_manager.get_stream_track(space_id, audio_path)

    if not audio_track:
        logging.error(f"Baraza space {space_id} not found or failed to create audio track.")
        return

    streamer = AudioStreaming(audio_track)
    pcs.add(streamer)
    logging.info(f"New listener for Baraza space {space_id}. Total listeners: {len(pcs)}")

    try:
        while True:
            message = await websocket.receive()
            data = json.loads(message)
            if data["type"] == "offer":
                response = await streamer.handle_offer(data["sdp"], data["type"])
                await websocket.send(json.dumps(response))
    except asyncio.CancelledError:
        logging.info(f"Listener for Baraza space {space_id} disconnected.")
    finally:
        if streamer in pcs:
            await streamer.stop_stream()
            pcs.remove(streamer)
