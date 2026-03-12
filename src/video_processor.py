import cv2
import os
from moviepy.editor import VideoFileClip
from pydub import AudioSegment
import tempfile

class VideoProcessor:
    def __init__(self, input_path, output_path):
        self.input_path = input_path
        self.output_path = output_path

    def compress_video(self, target_resolution=(1280, 720), target_bitrate="5000k"):
        # Compress video using OpenCV
        cap = cv2.VideoCapture(self.input_path)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(self.output_path, fourcc, 30.0, target_resolution)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            resized_frame = cv2.resize(frame, target_resolution)
            out.write(resized_frame)

        cap.release()
        out.release()

    def optimize_audio(self):
        # Optimize audio using pydub
        temp_audio_path = tempfile.mktemp(suffix='.wav')
        video = VideoFileClip(self.input_path)
        video.audio.write_audiofile(temp_audio_path)

        audio = AudioSegment.from_wav(temp_audio_path)
        normalized_audio = audio.normalize()
        normalized_audio.export(temp_audio_path, format="wav")

        final_video = video.set_audio(AudioFileClip(temp_audio_path))
        final_video.write_videofile(self.output_path, codec='libx264', audio_codec='aac')

        os.remove(temp_audio_path)

    def process_video(self):
        self.compress_video()
        self.optimize_audio()

# Example usage
if __name__ == "__main__":
    processor = VideoProcessor("input_video.mp4", "output_video.mp4")
    processor.process_video()
