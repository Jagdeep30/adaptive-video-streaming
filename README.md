# 📽️ Video Streaming Pipeline with AWS, Node.js, Docker, and FFmpeg  

An end-to-end video processing pipeline that allows users to upload videos, automatically transcodes them into multiple resolutions using AWS services, and streams them via HLS (adaptive bitrate streaming).  

## 🚀 Overview  
This project enables users to upload video files via a frontend, processes the videos using a backend service with AWS (S3, ECS, EventBridge, and SQS), and provides a unique video code for streaming via HLS.  

### 📊 Tech Stack  
- **Frontend:** React, HTML, CSS, JavaScript  
- **Backend:** Node.js, Express.js, MongoDB  
- **Cloud Services:** AWS (S3, ECS Fargate, SQS, EventBridge)  
- **Video Processing:** FFmpeg, Docker  
- **Database:** MongoDB (hosted on MongoDB Atlas)  
- **Containerization:** Docker  

---

## 🎯 Features  
- ✅ **Video Upload:** Simple drag-and-drop upload interface (React)  
- ✅ **Automatic Transcoding:** Video files are converted to multiple resolutions using FFmpeg  
- ✅ **HLS Streaming:** Supports adaptive bitrate streaming (`.m3u8` playlist)  
- ✅ **Unique Video Code:** Each uploaded video is assigned a unique code for sharing  
- ✅ **Cloud-Native:** Fully serverless and scalable architecture on AWS  
- ✅ **Real-Time Polling:** Backend polls SQS to process uploads automatically  

---

## 🛠️ Architecture  

```plaintext
Frontend (React) → AWS S3 (Video Upload) → SQS (Event Trigger)
→ ECS Fargate (Docker with FFmpeg) → S3 (Output Storage)
→ MongoDB (Stores Video Metadata) → User (HLS Video Streaming)
```

## 📂 Project Structure
📁 video-streaming-pipeline  
├── 📁 frontend                # React App for Uploading Videos  
├── 📁 backend                 # Node.js Service  
├── 📁 backend                 # Worker Code 


## 🎉 How It Works
1. 📤 Upload Video: User uploads a file via the React interface.
2. 📩 S3 Event: S3 triggers an event to the SQS queue.
3. 📡 Polling: The Node.js worker polls SQS for new messages.
4. 🚀 ECS Task: If a message is found, the worker triggers an ECS Fargate task.
5. 🎞️ Transcoding: The ECS task (Docker container with FFmpeg) processes the video into .m3u8 segments.
6. 📂 Store Results: Outputs are uploaded to a different S3 bucket.
7. 🗂️ Metadata Logging: MongoDB stores the video code for future streaming.
8. 🎥 Stream: Users can stream videos using the video code via HLS.
