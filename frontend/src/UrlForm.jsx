import { useEffect, useRef, useState } from "react"
import WatchVideoHLS from "./WatchVideoHLS"
import axios from "axios"
import { BASE_URL } from "./UploadFile"

export const UrlForm = () => {
    const [videoSrc, setVideoSrc] = useState()
    const [videoCodeState, setVideoCodeState] = useState(false)
    const inputRef = useRef()

    const handleClick = async () => {
        const videoCode = inputRef.current.value
        // setVideoCodeState(videoCode)
        try {
            // async function fetchData() {
            debugger
                const response = await fetchVideoSrc(videoCode)
                console.log("response before is this ->>>>>>>>>>>>>>>>" + JSON.stringify(response.data));
                
                if (response.data.statusCode != 200) {
                    setVideoCodeState(null)
                    throw Error(response.data.message)
                }
                console.log("response is " + response.data.data.videoURL);
                setVideoCodeState(true)
                setVideoSrc(response.data.data.videoURL)
            // } 
            // fetchData()
        } catch (error) {
            alert(`Error occured: ${error.message}`)
            return
        }
    }

    const fetchVideoSrc = async (videoCode) => {
        return await axios.get(`${BASE_URL}/video/${videoCode}`)
    }

    // useEffect(() => {
        
    // }, [videoCodeState])
    return (
        <>
            <div className="form">
                <input type="text" name="videoUrl" id="videoUrl" placeholder="Enter video code..." ref={inputRef} className="input-ele" />
                <button onClick={handleClick}>Watch</button>
            </div>

            {
                videoCodeState && <WatchVideoHLS videoSrc={videoSrc} />
            }
        </>
    )
}

export default UrlForm