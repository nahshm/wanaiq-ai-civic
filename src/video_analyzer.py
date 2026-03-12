import os
import tempfile
import torch
from transformers import pipeline
from moviepy.editor import VideoFileClip
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class VideoAnalyzer:
    def __init__(self):
        # Use a more specific model for better performance if possible
        self.transcription_model_name = "openai/whisper-base"
        self.sentiment_model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        self._transcription_pipeline = None
        self._sentiment_analysis_pipeline = None

    @property
    def transcription_pipeline(self):
        if self._transcription_pipeline is None:
            logging.info(f"Loading transcription model: {self.transcription_model_name}")
            self._transcription_pipeline = pipeline("automatic-speech-recognition", model=self.transcription_model_name)
        return self._transcription_pipeline

    @property
    def sentiment_analysis_pipeline(self):
        if self._sentiment_analysis_pipeline is None:
            logging.info(f"Loading sentiment analysis model: {self.sentiment_model_name}")
            self._sentiment_analysis_pipeline = pipeline("sentiment-analysis", model=self.sentiment_model_name)
        return self._sentiment_analysis_pipeline

    def transcribe_audio(self, audio_path):
        logging.info(f"Transcribing audio from: {audio_path}")
        transcription = self.transcription_pipeline(audio_path)
        return transcription["text"]

    def analyze_sentiment(self, text):
        logging.info("Analyzing sentiment of the transcription.")
        sentiment = self.sentiment_analysis_pipeline(text)
        return sentiment

    def analyze_video(self, video_path):
        if not os.path.exists(video_path):
            logging.error(f"Video file not found: {video_path}")
            return None

        # Use a temporary file for the extracted audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_audio_file:
            audio_path = tmp_audio_file.name

        try:
            logging.info(f"Extracting audio from {video_path} to {audio_path}")
            with VideoFileClip(video_path) as video:
                if video.audio is None:
                    logging.warning(f"Video file {video_path} has no audio track.")
                    return {"transcription": "", "sentiment": None}
                video.audio.write_audiofile(audio_path, codec='pcm_s16le')

            # Transcribe audio
            transcription = self.transcribe_audio(audio_path)

            # Analyze sentiment
            sentiment = self.analyze_sentiment(transcription) if transcription else None

            return {
                "transcription": transcription,
                "sentiment": sentiment
            }
        except Exception as e:
            logging.error(f"Failed to analyze video {video_path}: {e}", exc_info=True)
            return None
        finally:
            # Clean up the temporary audio file
            if os.path.exists(audio_path):
                os.remove(audio_path)
                logging.info(f"Cleaned up temporary audio file: {audio_path}")


# Example usage
if __name__ == "__main__":
    # Create a dummy video file for testing if it doesn't exist
    if not os.path.exists("output_video.mp4"):
        print("Creating a dummy video file 'output_video.mp4' for testing.")
        # This requires ffmpeg to be installed and in the PATH
        os.system("ffmpeg -f lavfi -i testsrc=size=1280x720:rate=30 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t 5 -c:v libx264 -c:a aac -shortest output_video.mp4")

    analyzer = VideoAnalyzer()
    analysis = analyzer.analyze_video("output_video.mp4")
    if analysis:
        print("Transcription:", analysis["transcription"])
        print("Sentiment:", analysis["sentiment"])
    else:
        print("Video analysis failed.")
