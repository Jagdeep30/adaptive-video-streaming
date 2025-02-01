import { DNA } from "react-loader-spinner"
import Modal from "react-modal"

const Loader = () => {
    Modal.setAppElement("body")
    return(
        <>
            <Modal isOpen={true} style={
                {
                    "content":{
                        // opacity:"1 !important",
                        backgroundColor:"#242424", 
                        height:"200px", 
                        width:"200px",
                        position:"none",
                        border:"none",
                        outline:"none",
                        inset:"0",
                        display:"flex",
                        flexDirection:"column",
                        alignItems:"center",
                        justifyContent:"center",
                        borderRadius:"10%",
                        // filter:"blur(2px)"
                    },
                    "overlay":{
                        // opacity:"0.9",
                        backgroundColor:"black", 
                        display:"flex", 
                        alignItems:"center", 
                        justifyContent:"center",
                    }
                }
                    }>
                <DNA height={100}/>
                <div>Uploading...</div>
            </Modal>
        </>
    )
}

export default Loader