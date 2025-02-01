from fastapi import APIRouter, File, UploadFile
from .models import SuccessResponseSchema, ErrorResponseSchema, GetVideoUrlModel
from db import connectToDB
import boto3
import logging
import os
from fastapi import exceptions
import uuid

router = APIRouter(tags=["video"])
client = connectToDB()
db = client.get_database("video-streaming")
collection = db.get_collection("videocodes")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__ )

@router.get('/video/{videoCode}')
async def getVideo(videoCode: str):
    parsed_code = f"video_parser_{videoCode}"
    try:
        response = collection.find_one({"videoCode": parsed_code})
        videoResp = GetVideoUrlModel.model_validate(response)
        # logger.info(f"response is _---------------------> {response}")
        return SuccessResponseSchema(message="", success=True, data={"videoURL":videoResp.masterURL}, statusCode=200)
    except Exception as e:
        print(f"Error occured-> {e}")
        return ErrorResponseSchema(statusCode=500, message=str(e))
    

@router.post('/video')
async def uploadVideoFile(video_file: UploadFile = File(...)):
    # print(video_file)
    # return SuccessResponseSchema(message="good", success=True, data={video_file}, statusCode=200)
    try:
        if not video_file:
            raise exceptions.HTTPException(500, "No file found")
        if video_file.content_type != "video/mp4":
            raise exceptions.HTTPException(500, "Not a mp4 video file")
        
        uniqueId = uuid.uuid4()
        # filename = video_file.filename.replace(".mp4","")
        
        s3Client  = boto3.client(
            service_name='s3', 
            region_name=os.getenv("aws_region"), 
            aws_access_key_id=os.getenv("aws_access_key_id"),
            aws_secret_access_key=os.getenv("aws_secret_access_key")
        )
        response = s3Client.put_object(Bucket=os.getenv("S3_BUCKET_NAME"), Key=f"{uniqueId}||{video_file.filename}", Body=video_file.file)
        logger.info("File uploaded successfully")
        return SuccessResponseSchema(message="File uploaded, will be processed shortly", success=True, data={"video_code": uniqueId}, statusCode=201)

    except Exception as e:
        logger.error(e)
        return ErrorResponseSchema(statusCode=500, message=e)