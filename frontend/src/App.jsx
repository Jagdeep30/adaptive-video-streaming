import { Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import './App.css'
import UrlForm from './UrlForm'


function App() {
  return (
    <>
      <div>
          <Routes>
            <Route path='/' element={<HomePage/>}/>
            <Route path='/video' element={<UrlForm/>}/>
          </Routes>
      </div>
    </>
  )
}

export default App
