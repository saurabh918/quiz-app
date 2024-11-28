import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSound from 'use-sound';
import play from '../assets/play.mp3';
import correct from '../assets/correct.mp3';
import wrong from '../assets/wrong.mp3';
import celebrate from '../assets/celebration.mp3';

const Quiz = ({ data, setTimeUp, qNumber, setQNumber, totalQuestions, setAnsClicked }) => {
  const [question, setQuestion] = useState(null);
  const [selectedAns, setSelectedAns] = useState(null);
  const [answerStates, setAnswerStates] = useState({});

  const [startPlay] = useSound(play);
  const [correctAns] = useSound(correct);
  const [wrongAns] = useSound(wrong);
  const [celebrateSound] = useSound(celebrate);

  useEffect(() => {
    startPlay();
  }, [startPlay]);

  useEffect(() => {
    setQuestion(data[qNumber - 1]);
  }, [data, qNumber]);

  const delayTime = (duration, cb) => {
    setTimeout(() => {
      cb();
    }, duration);
  };

  const handleClick = (ans) => {
    setSelectedAns(ans);
    setAnsClicked(true);
    
    setAnswerStates((prev) => ({
      ...prev,
      [ans.text]: "answer active",
    }));
    
    delayTime(3000, () => {
      setAnswerStates((prev) => ({
        ...prev,
        [ans.text]: ans.correct ? "answer right" : "answer wrong",
      }));
    });

    // Handle answer correctness after additional delay
    delayTime(5000, () => {
      if (ans.correct) {
        if (qNumber === totalQuestions) {
          delayTime(1000, () => {
            setTimeUp(true);
            celebrateSound();
          });
        } else {
          correctAns();
        }

        delayTime(1000, () => {
          setQNumber((prev) => prev + 1);
          setSelectedAns(null);
        });
      } else {
        delayTime(1000, () => {
          wrongAns();
          setTimeUp(true);
        });
      }
    });
  };

  return (
    <div className="quiz">
      <div className="question">{question?.question}</div>
      <div className="answers">
        {question?.answers.map((item) => {
          const buttonClass = answerStates[item.text] || 'answer'; // Default to 'answer' if not set
          return (
            <button
              key={uuidv4()}
              disabled={selectedAns}
              className={selectedAns === item ? "answer active" : buttonClass}
              onClick={() => handleClick(item)}
            >
              {item.text}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Quiz;
