import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Quiz from './components/Quiz'
import Timer from './components/Timer'
import Start from './components/Start'

function App() {

  const [playerName,setPlayerName] = useState(null)
  const [qNumber,setQNumber] = useState(1)
  const [timeUp,setTimeUp] = useState(false)
  const [prize,setPrize] = useState("$ 0")

  const gkQuestions = [
    {
      id: 1,
      question: "What is the largest country in the world by land area?",
      answers: [
        { text: "Russia", correct: true },
        { text: "China", correct: false },
        { text: "United States", correct: false },
        { text: "Canada", correct: false   
   }
      ]
    },
    {
      id: 2,
      question: "Who painted the Mona Lisa?",
      answers: [
        { text: "Leonardo da Vinci", correct: true },
        { text: "Pablo Picasso", correct: false },
        { text: "Vincent van Gogh", correct: false },
        { text: "Michelangelo", correct: false   
   }
      ]
    },
    {
      id: 3,
      question: "What is the capital of Australia?",
      answers: [
        { text: "Sydney", correct: false },
        { text: "Melbourne", correct: false },
        { text: "Canberra", correct: true },
        { text: "Brisbane", correct: false }
      ]
    },
    {
      id:   
   4,
      question: "Who wrote the play \"Romeo and Juliet\"?",
      answers: [
        { text: "William Shakespeare", correct: true },
        { text: "Jane Austen", correct: false },
        { text: "Charles Dickens", correct: false },
        { text: "Mark Twain", correct: false   
   }
      ]
    },
    {
      id: 5,
      question: "Which planet is known as the Red Planet?",
      answers: [
        { text: "Mars", correct: true },
        { text: "Venus", correct: false },
        { text: "Jupiter", correct: false },
        { text: "Saturn", correct: false   
   }
      ]
    },
    {
      id: 6,
      question: "What is the largest ocean in the world?",
      answers: [
        { text: "Pacific Ocean", correct: true },
        { text: "Atlantic Ocean", correct: false },
        { text: "Indian Ocean", correct: false },
        { text: "Arctic Ocean", correct: false   
   }
      ]
    },
    {
      id:   
   7,
      question: "Who invented the light bulb?",
      answers: [
        { text: "Thomas Edison", correct: true },
        { text: "Nikola Tesla", correct: false },
        { text: "Benjamin Franklin", correct: false },
        { text: "Alexander Graham Bell", correct: false   
   }
      ]
    },
    {
      id: 8,
      question: "What is the chemical symbol for gold?",
      answers: [
        { text: "Au", correct: true },
        { text: "Ag", correct: false },
        { text:   
   "Fe", correct: false },
        { text: "Cu", correct: false }
      ]
    },
    {
      id: 9,
      question: "What is the tallest mountain in the world?",
      answers: [
        { text: "Mount Everest", correct: true },
        { text: "K2", correct: false },
        { text: "Mount Kilimanjaro", correct: false   
   },
        { text: "Denali", correct: false }
      ]
    },
    {
      id: 10,
      question: "Who painted the Sistine Chapel ceiling?",
      answers: [
        { text: "Michelangelo", correct: true },
        { text: "Leonardo da Vinci", correct: false },
        { text:   
   "Raphael", correct: false },
        { text: "Rembrandt", correct: false }
      ]
    },
    {
      id: 11,
      question: "What is the largest country in Africa?",
      answers: [
        { text: "Algeria", correct: false },
        { text: "Democratic Republic of Congo", correct: true },
        { text: "Nigeria", correct: false },
        { text: "South Africa", correct: false }
      ]
    },
    {
      id: 12,
      question: "Who wrote the Harry Potter series?",
      answers: [
        { text: "J.K. Rowling", correct: true },
        { text: "Stephen King", correct: false },
        { text: "Dan Brown", correct: false },
        { text: "Terry Pratchett", correct: false }
      ]
    },
    {
      id: 13,
      question: "What is the official language of India?",
      answers: [
        { text: "English", correct: false },
        { text: "Hindi", correct: true },
        { text: "Tamil", correct: false },
        { text: "Bengali", correct: false }
      ]
    },
    {
      id: 14,
      question: "What is the capital of the United States?",
      answers: [
        { text: "New York City", correct: false },
        { text: "Los Angeles", correct: false },
        { text: "Washington, D.C.", correct: true },
        { text: "Chicago", correct: false }
      ]
    },
    {
      id: 15,
      question: "What is the largest mammal in the world?",
      answers: [
        { text: "Blue Whale", correct: true },
        { text: "African Elephant", correct: false },
        { text: "Giraffe", correct: false },
        { text: "Hippopotamus", correct: false }
      ]
    }
  ];

  const prizeMilestone = useMemo(() => 
     [
      {id: 1, amount: '$ 100'},
      {id: 2, amount: '$ 200'},
      {id: 3, amount: '$ 300'},
      {id: 4, amount: '$ 500'},
      {id: 5, amount: '$ 1000'},
      {id: 6, amount: '$ 2000'},
      {id: 7, amount: '$ 4000'},
      {id: 8, amount: '$ 8000'},
      {id: 9, amount: '$ 16000'},
      {id: 10, amount: '$ 32000'},
      {id: 11, amount: '$ 64000'},
      {id: 12, amount: '$ 125000'},
      {id: 13, amount: '$ 250000'},
      {id: 14, amount: '$ 500000'},
      {id: 15, amount: '$ 1000000'},
    ].reverse()
  , [])

  const handleEndGame = () => {
    setPlayerName(null)
    setTimeUp(false)
    setQNumber(1)
  }

  useEffect(() => {
    qNumber > 1 && setPrize(prizeMilestone.find((item) => item.id === qNumber - 1).amount)
  }, [prizeMilestone,qNumber])

  return (
    <div className="app">
      {playerName ? (
        <>
          <div className="main">
        {timeUp ? (
          <div className='resultText'>
            <h1>You won: {prize}</h1>
            <button className='endButton' onClick={handleEndGame}>End</button>
          </div>
        ) : (
          <>
            <div className="top">
              <div className="timer">
                <Timer timeUp={timeUp} setTimeUp={setTimeUp} qNumber={qNumber} />
              </div>
              <div className="playerName">
                <h4>Player: {playerName}</h4>
              </div>
            </div>
            <div className="bottom">
              <Quiz data={gkQuestions} setTimeUp={setTimeUp} qNumber={qNumber} setQNumber={setQNumber} totalQuestions={gkQuestions.length} />
            </div>
          </>
        ) }
      </div>
      {
        !timeUp && (
          <div className="milestone">
        <ul className="prizeList">
          {
            prizeMilestone.map((item) => {
              return (
                <li key={item.id} className={qNumber === item.id ? 'prizeListItem active' : 'prizeListItem'}>
                  <span className='prizeListItemNumber'>{item.id}</span>
                  <span className='prizeListItemAmount'>{item.amount}</span>
                </li>
              )
            })
          }
        </ul>
      </div>
        )
      }
        </>
      ) : <Start setPlayerName={setPlayerName} />}
      
    </div>
  )
}

export default App
