import { useRef } from 'react'
import videojs from 'video.js'
import VideoPlayer from './VideoPlayer'
import qalitySelectorHls from 'videojs-quality-selector-hls'

export const WatchVideoHLS = (props) => {
    videojs.registerPlugin('qalitySelectorHls',qalitySelectorHls);
    const playerRef = useRef(null)
    const videoURL = props.videoSrc
    const playerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
        {
        src: videoURL,
        type: "Application/x-mpegURL"
        }
    ]
    }

    const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.qalitySelectorHls()
    
    // You can handle player events here, for example:
    player.on("waiting", () => {
        videojs.log("player is waiting");
    });

    player.on("dispose", () => {
        videojs.log("player will dispose");
    });
    };
    
    return (
        <>
            <VideoPlayer 
                options={playerOptions}
                onReady={handlePlayerReady}
            />
        </>
    )
}

export default WatchVideoHLS