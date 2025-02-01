from pydantic import BaseModel
from bson.objectid import ObjectId

class SuccessResponseSchema(BaseModel):
    message: str
    success: bool
    data: dict
    statusCode: int

class ErrorResponseSchema(BaseModel):
    statusCode: int
    message: str

class GetVideoUrlModel(BaseModel):
    _id: ObjectId
    videoCode: str
    masterURL: str
