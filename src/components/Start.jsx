import React from 'react'
import { useRef } from 'react'

const Start = ({setPlayerName}) => {
  const inputRef = useRef()
  const handleClick = () => {
    inputRef.current.value && setPlayerName(inputRef.current.value)
  }
  return (
    <div className='start'>
      <input type="text" placeholder='Enter your name' className='startBox' ref={inputRef} />
      <button className='startBtn' onClick={handleClick}>Start</button>
    </div>
  )
}

export default Start