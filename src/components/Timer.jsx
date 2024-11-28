import React, { useEffect, useState } from 'react'
import useSound from 'use-sound'
import wrong from '../assets/wrong.mp3'

const Timer = ({setTimeUp,qNumber,ansClicked,setAnsClicked}) => {
  const [timer,setTimer] = useState(30);

  const [wrongAns] = useSound(wrong)

  useEffect(() => {
    if(timer === 0) {
        setTimeUp(true)
        wrongAns()
    }
    let interval;
    if(!ansClicked) {
      interval = setInterval(() => {
        if(!ansClicked) {
          setTimer(prev => prev - 1)
        }
    }, 1000)
    }
    
    return () => clearInterval(interval)
  },[setTimeUp,timer])

  useEffect(() => {
    setTimer(30)
    setAnsClicked(false)
  },[qNumber])

  return timer
}

export default Timer