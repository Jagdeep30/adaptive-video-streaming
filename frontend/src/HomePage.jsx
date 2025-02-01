import UploadFile from './UploadFile'
import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className='selection-menu'>
      <h1>WELCOME,</h1>
      <UploadFile />
      <span style={{"color":"#00b6ff", fontWeight:"bold"}}>or</span>
      <button className='video-link-btn'><Link to="/video">Watch a Video</Link></button>
    </div>
  )
}

export default HomePage