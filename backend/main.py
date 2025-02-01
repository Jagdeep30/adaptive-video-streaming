import uvicorn
from video import routes as video_routes
from fastapi import FastAPI
from dotenv import load_dotenv
from db import connectToDB
from fastapi.middleware.cors import CORSMiddleware

load_dotenv("/Learning/Video Streaming service/backend/.env")

# client = connectToDB()
app = FastAPI()

# declaring a list of allowed origins
origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173"
]

# configuring the cors middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"]
)

app.include_router(video_routes.router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080)
