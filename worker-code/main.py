import json
import os
from math import e
import platform
from typing import override
import boto3
from aws_lambda_typing.events import S3Event
import boto3.utils
from urllib.parse import unquote_plus
from dotenv import load_dotenv

# import aioboto3
# import asyncio
# from mypy_boto3_sqs import SQSClient
# import aioboto3.resources

load_dotenv()

sqsClient = boto3.client(
    service_name='sqs', 
    region_name=os.getenv("AWS_REGION"), 
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY")
)

ecsClient = boto3.client(
    service_name='ecs',
    region_name=os.getenv("AWS_REGION"), 
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY")
)

sqsQueueUrl = "https://sqs.us-east-1.amazonaws.com/594843356659/TempRawVideoS3Queue"
# sqsQueue = sqsClient.get_queue_by_name(QueueName='TempRawVideoS3Queue')

def pollQueue():

    while True:
        try:
            response = sqsClient.receive_message(
                QueueUrl=sqsQueueUrl,
                MaxNumberOfMessages=1, 
                WaitTimeSeconds=20)

            if not response.get("Messages",None):
                print("No message in queue")
                continue
            
            # got the event/messages from sqs queue
            for message in response.get("Messages"):
                print(message)

                # validate & parse the event
                if not message.get("Body", None):
                    continue

                event: S3Event = json.loads(message.get("Body", ""))
                print(event)

                #deleting the test event and continue polling
                if "Service" in event and "Event" in event and event.get("Event") == "s3:TestEvent": 
                    sqsClient.delete_message(
                        QueueUrl=sqsQueueUrl,
                        ReceiptHandle=message.receiptHandler
                    )
                    continue

                for record in event.get("Records"):
                    s3 = record.get("s3", {})
                    bucket = s3.get("bucket", {})
                    key = s3.get("object", {}).get("key", "")
                    print("bucket is -> "+ str(bucket))
                    print("key is -> "+str(key))
                    name_split = key.split("%7C%7C")
                    if len(name_split) == 0:
                        sqsClient.delete_message(
                            QueueUrl=sqsQueueUrl,
                            ReceiptHandle=message.get("ReceiptHandle","")
                        )
                        raise Exception("Filename not valid")

                    filename = name_split[1]
                    uniqueId = name_split[0]
                    # spin the docket container
                    ecsClient.run_task(
                        taskDefinition='video-transcoder',
                        launchType='FARGATE',
                        cluster='dev',
                        platformVersion='LATEST',
                        networkConfiguration={
                            'awsvpcConfiguration':{
                                'subnets': [
                                    'subnet-029dcd250e80c9a11',
                                    'subnet-0bf40c06b3d15ced3',
                                    'subnet-0f604769538ed5829',
                                    'subnet-0242a7b1ff6934939',
                                    'subnet-0faa522ca97da1ea6',
                                    'subnet-0b97eda774fbb4206'
                                ],
                                'securityGroups':['sg-086ad755607b618d7'],
                                'assignPublicIp':"ENABLED"
                            }
                        },
                        overrides={
                            'containerOverrides':[
                                {
                                        'name': 'video-transcoder', #container name
                                        'environment': [
                                            {'name':"BUCKET_NAME", 'value': bucket.get('name')},
                                            {'name':'KEY', 'value': unquote_plus(key)},
                                            {'name':"VIDEO_CODE", 'value': uniqueId},
                                            {'name':"MONGO_URI", 'value': os.getenv("MONGO_URI")},
                                            {'name':"AWS_REGION", 'value': os.getenv("AWS_REGION")},
                                            {'name':"AWS_ACCESS_KEY", 'value': os.getenv("AWS_ACCESS_KEY")},
                                            {'name':"AWS_SECRET_KEY", 'value': os.getenv("AWS_SECRET_KEY")},
                                            {'name':"PRODUCTION_BUCKET", 'value': os.getenv("PRODUCTION_BUCKET")},

                                        ] #environment vairables for docker container
                                }
                            ]
                        }
                    )

                    # delete the message from queue ( means you are accepting to process the event after the docker has run successfully, so delete it so not other worket picks it up )
                    sqsClient.delete_message(
                        QueueUrl=sqsQueueUrl,
                        ReceiptHandle=message.get("ReceiptHandle","")
                    )
        except Exception as e:
            print("Error Occured->" + str(e))

pollQueue()