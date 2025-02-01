const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3")
const fs = require("node:fs/promises")
const fsOld = require("node:fs")
const path = require("node:path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegC = require("ffmpeg")
const { v4: uuidv4 } = require("uuid")
const child_process = require("node:child_process")
const mongoose = require('mongoose')

let masterHLSContent = ``
const BUCKET_NAME = process.env.BUCKET_NAME
const KEY = process.env.KEY
const uniqueId = process.env.VIDEO_CODE
const MONGO_URI = process.env.MONGO_URI
const AWS_REGION = process.env.AWS_REGION
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY
const PRODUCTION_BUCKET = process.env.PRODUCTION_BUCKET
const RESOLUTIONS = [
    {id: 1, name: "1080p", width: 1920, height: 1080, audioBitrate: "192k", videoBitrate: "5M", bandwidth: "5000000"},
    {id: 2, name: "720p", width: 1280, height: 720, audioBitrate: "128k", videoBitrate: "3M", bandwidth: "3000000"},
    {id: 3, name: "480p", width: 854, height: 480, audioBitrate: "96k", videoBitrate: "1.5M", bandwidth: "1500000"},
]

const resolutionIDMAP = (() => {
    const idmap = {}
    RESOLUTIONS.map((resolution, index) => {
        idmap[resolution.name] = index
    })

    return idmap
})();

console.log(resolutionIDMAP);

const s3Client = new S3Client({
    region:AWS_REGION,
    credentials:{
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY
    }
})

const videoUploadSchema = new mongoose.Schema({
    videoCode: String,
    masterURL: String
})

const videoUploadModel = mongoose.model("VideoCode", videoUploadSchema)

async function init(){
    try{
        await mongoose.connect(MONGO_URI)
        //download the video file from s3
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: KEY
        })

        const res = await s3Client.send(command)
        const originalVideoPath = 'original-video.mp4'
        
        await fs.writeFile(originalVideoPath, res.Body)
        const originalVideoFilePath = path.resolve(originalVideoPath)
        
        //start the transcoding
        // const uniqueId = uuidv4()
        console.log("unique id generated is this -> "+uniqueId);
        // console.log("path.resolve is this for unique id -> "+uniqueId));
        await fs.mkdir(`./${uniqueId}`)

        for(resolution of RESOLUTIONS){
            await fs.mkdir(`./${uniqueId}/${resolution.name}`, {recursive:true})
            console.log(`Directory created -> ./${uniqueId}/${resolution.name}`)
        }


        
        console.log("create directory result is success")
    

        const ffmpegScaleArgumentString = generateffmpegScaleArguments(RESOLUTIONS)
        const ffmpegResolutionMapingString = generateffmpegResolutionMapings(RESOLUTIONS, uniqueId)

        //SAMPLE COMMAND
        //ffmpeg -i "/app/original-video.mp4" -filter_complex "[0:v]split=3[v1][v2][v3];[v1]scale=w=1920:h=1080[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=854:h=480[v3out]" -map "[v1out]" -map 0:a? -c:v:0 libx264 -b:v:0 5M -c:a aac -b:a:0 192k -hls_time 10 -hls_segment_filename "/app/output/1080p/1080p_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "/app/output/1080p/1080p.m3u8" -map "[v2out]" -map 0:a? -c:v:1 libx264 -b:v:1 3M -c:a aac -b:a:1 128k -hls_time 10 -hls_segment_filename "/app/output/720p/720p_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "/app/output/720p/720p.m3u8" -map "[v3out]" -map 0:a? -c:v:2 libx264 -b:v:2 1.5M -c:a aac -b:a:2 96k -hls_time 10 -hls_segment_filename "/app/output/480p/480p_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "/app/output/480p/480p.m3u8" -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" -master_pl_name "/app/output/master.m3u8"


        const ffmpegCommand = `ffmpeg -i "${originalVideoFilePath}" -filter_complex "[0:v]split=3[v1][v2][v3];${ffmpegScaleArgumentString}"${ffmpegResolutionMapingString}`

        console.log("ffmpeg command is ->   "+ffmpegCommand);
        

        result = child_process.execSync(ffmpegCommand)
        console.log("ffmpeg command run result is this -> "+result);

        // const transcodedVideoPutCommand = new PutObjectCommand({
        //     Bucket: "production-videos.jagdeep.singh",
        //     Key: ,
        //     Body: fsOld.createReadStream(path.resolve(uniqueId))
        // })
        // console.log("resolved path for folder is ->>> "+path.resolve(uniqueId));
        masterHLSContent = `#EXTM3U\n#EXT-X-VERSION:3\n`
        
        await uploadFolderToS3(folderPath = `./${uniqueId}`)

        console.log(`master hls content is -----> ${masterHLSContent}`);
        

        // await fsOld.writeFileSync(`./master.m3u8`, masterHLSContent)

        await s3Client.send(new PutObjectCommand({
            Bucket: PRODUCTION_BUCKET,
            Key: `${uniqueId}/master.m3u8`,
            Body: masterHLSContent
        }))
        // console.log(`master file upload response -----> ${response}`)
        // NEED TO ADD THIS FILE TO DATABASE ALSO
        const videoData = await videoUploadModel.create({
            videoCode: `video_parser_${uniqueId}`,
            masterURL: `https://s3.${AWS_REGION}.amazonaws.com/${PRODUCTION_BUCKET}/${uniqueId}/master.m3u8`
        })
        console.log("master file uploaded successfully");
        
        // https://s3.us-east-1.amazonaws.com/production-videos.jagdeep.singh/5a28689c-7ca0-44a9-85f5-7e3bdfcd8afd/master.m3u8
        
        // USED FOR DIRECTLY GENERATING A TRANSCODED VIDED FROM FLUENT FFMPEG
        // return new Promise((resolve) => {
        //     ffmpeg(originalVideoFilePath)
        //     .output(output)
        //     .withVideoCodec("libx264")
        //     .withAudioCodec("aac")
        //     .withSize(${resolution.width}x${resolution.height})
        //     .on("start", () => {
        //         console.log(${resolution.width}x${resolution.height})
        //     })
        //     .on("end", async () => {
        //         //upload the processed video in s3 bucket
        //         const videoPutCommand = new PutObjectCommand({
        //             Bucket: "production-videos.jagdeep.singh",
        //             Key: output,
        //             Body: fsOld.createReadStream(path.resolve(output))
        //         })

        //         await s3Client.send(videoPutCommand)
        //         console.log(Transcoded video uploaded successfully: ${output})
        //         resolve()
        //     })
        //     .format("mp4")
        //     .run()
        // })
    // })

    // await Promise.all(promises)
    }
    catch (err){
        console.log("error occured->  "+err);
        
    }
}


// SAMPLE COMMAND
// ffmpeg -i "/app/original-video.mp4" -filter_complex "[0:v]split=3[v1][v2][v3];[v1]scale=w=1920:h=1080[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=854:h=480[v3out]" -map "[v1out]" -map 0:a? -c:v:0 libx264 -b:v:0 5M -c:a aac -b:a:0 192k -hls_time 10 -hls_segment_filename "/app/output/1080p/1080p_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "/app/output/1080p/1080p.m3u8" -map "[v2out]" -map 0:a? -c:v:1 libx264 -b:v:1 3M -c:a aac -b:a:1 128k -hls_time 10 -hls_segment_filename "/app/output/720p/720p_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "/app/output/720p/720p.m3u8" -map "[v3out]" -map 0:a? -c:v:2 libx264 -b:v:2 1.5M -c:a aac -b:a:2 96k -hls_time 10 -hls_segment_filename "/app/output/480p/480p_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "/app/output/480p/480p.m3u8" -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" -master_pl_name "/app/output/master.m3u8"



function generateffmpegScaleArguments(Resolutions){
    resultString = ""
    Resolutions.map(resolution => {
        resultString += `[v${resolution.id}]scale=w=${resolution.width}:h=${resolution.height}[v${resolution.id}out];`
    })

    return resultString
}

function generateffmpegResolutionMapings(Resolutions, uniqueId){
    resultString = ""
    Resolutions.map(resolution => {
        resultString += ` -map "[v${resolution.id}out]" -map 0:a? -c:v:${resolution.id-1} libx264 -b:v:${resolution.id-1} ${resolution.videoBitrate} -c:a aac -b:a:${resolution.id-1} ${resolution.audioBitrate} -hls_time 10 -hls_segment_filename "./${uniqueId}/${resolution.name}/${resolution.name}_segment%03d.ts" -hls_playlist_type vod -hls_playlist 1 "./${uniqueId}/${resolution.name}/${resolution.name}.m3u8"`
    })

    return resultString
}

async function uploadFolderToS3(folderPath = '/app'){
    const files = await fs.readdir(folderPath)

    console.log(`Processing folder: ${folderPath}`);
    
    console.log("files are -> >>> "+files);
    

    // (err, files)=>{
    if(files == undefined){
        console.log("Empty directory");
        // throw err
        return
    }
    if(!files || files.length==0){
        console.log(
            "Empty directory"
        )
        return
    }

    for( const filename of files ){

        // get file path
        const filePath = `${folderPath}/${filename}`

        // check if folder and call recursively for this folder
        if(fsOld.statSync(filePath).isDirectory()){
            console.log(`Entering folder: ${filePath}`);
            
            await uploadFolderToS3(filePath)
            continue
        }


        //reading file content
        const fileContent = await fs.readFile(filePath)

        console.log("File content read successfullly")
    

        // (error, fileContent)=>{
            //if unable to read file content, throw exception
        if(fileContent == undefined || fileContent.length == 0){
            console.log("File not found or file is empty");
            // throw error
            return
        }

        await s3Client.send(new PutObjectCommand({
            Bucket: PRODUCTION_BUCKET,
            Key: `${folderPath.replace('./',"")}/${filename}`,
            Body: fileContent
        }))

        if(filename.includes(".m3u8")){
            console.log("entered for editing master file");
            
            const resolutionObj = RESOLUTIONS.at(resolutionIDMAP[filename.replace(".m3u8","")])
            masterHLSContent += `#EXT-X-STREAM-INF:BANDWIDTH=${resolutionObj.bandwidth},RESOLUTION=${resolutionObj.width}x${resolutionObj.height}\n${resolutionObj.name}/${resolutionObj.name}.m3u8`
            masterHLSContent += `\n`
            console.log(`master file is this after updating ->>> ${masterHLSContent}`);
            
        }
    }
}




init()