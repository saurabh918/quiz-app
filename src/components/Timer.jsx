import React, { useEffect, useState } from 'react'
import useSound from 'use-sound'
import wrong from '../assets/wrong.mp3'

const Timer = ({setTimeUp,qNumber}) => {
  const [timer,setTimer] = useState(30);

  const [wrongAns] = useSound(wrong)

  useEffect(() => {
    if(timer === 0) {
        setTimeUp(true)
        wrongAns()
    }
    const interval = setInterval(() => {
        setTimer(prev => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  },[setTimeUp,timer])

  useEffect(() => {
    setTimer(30)
  },[qNumber])

  return timer
}

export default Timer