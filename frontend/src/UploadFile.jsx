import { useRef, useState } from "react"
import axios from 'axios'
import Loader from './Loader'

export const BASE_URL = 'http://127.0.0.1:8080'

export const UploadFile = () => {
    const fileInputRef = useRef()
    const [isLoading, setIsLoading] = useState(false)

    async function handleFileUpload(file) {
        setIsLoading(true)
        const formData = new FormData()
        formData.append("video_file", file)
        try{
        const response = await axios.post(`${BASE_URL}/video`, formData, {
            "headers": {
                "Content-Type": "multipart/form-data"
            }
        })
        setIsLoading(false)
        console.log(response)
        if (response.data.statusCode == 201) {
            alert(`File Uploaded Successfully, please save this code for uploaded video: ${response.data.data.video_code}`)
            return
        }
        alert(response.data.message)
        }
        catch(e){
            console.log(e);
            setIsLoading(false)
        }
    }

    const handleChange = (event) => {
        const uploadedFile = event.target.files[0]
        console.log(uploadedFile);

        //validating if it is a valid video file
        if (uploadedFile.type != "video/mp4") {
            alert("Please upload a valid video file")
            fileInputRef.current.value = null
            return
        }
        if (uploadedFile.name && uploadedFile.name.includes("|")) {
            alert("Filename can't contain \"|\"")
            fileInputRef.current.value = null
            return
        }

        handleFileUpload(uploadedFile)

    }
    return (
        <>
            <div>
                <button type='submit' onClick={() => fileInputRef.current.click()}>
                    Upload File
                </button>
                <input onChange={handleChange} accept='video/mp4' multiple={false} ref={fileInputRef} type='file' hidden />
            </div>
            {isLoading && <Loader />}
            {/* <Loader /> */}
        </>
    )
}

export default UploadFile