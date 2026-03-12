import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class VideoStorage:
    def __init__(self, bucket_name="videos"):
        self.bucket_name = bucket_name

    def upload_video(self, file_path, file_name):
        with open(file_path, "rb") as f:
            response = supabase.storage.from_(self.bucket_name).upload(file_name, f)
        return response

    def get_video_url(self, file_name):
        response = supabase.storage.from_(self.bucket_name).get_public_url(file_name)
        return response

    def delete_video(self, file_name):
        response = supabase.storage.from_(self.bucket_name).remove([file_name])
        return response

# Example usage
if __name__ == "__main__":
    storage = VideoStorage()
    upload_response = storage.upload_video("output_video.mp4", "example_video.mp4")
    print("Upload response:", upload_response)

    video_url = storage.get_video_url("example_video.mp4")
    print("Video URL:", video_url)

    delete_response = storage.delete_video("example_video.mp4")
    print("Delete response:", delete_response)
