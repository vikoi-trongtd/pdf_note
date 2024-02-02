import React, { useState, useEffect } from 'react';
import parse from 'html-react-parser';

interface AITextProps {
  displayText: string;
}

const TEXT_DISPLAY_INTERVAL = 50;
const AI_CURSOR = parse('&#9724;');

const AIText: React.FC<AITextProps> = (props) => {
  const [curText, setText] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timer;
    const aiCursor = curText.length % 4 === 0 ? AI_CURSOR : '';
    if (curText.length < props.displayText.length) {
      interval = setInterval(() => setText(() => props.displayText.slice(0, curText.length + 1) + aiCursor), TEXT_DISPLAY_INTERVAL);
    } else if (curText.length === props.displayText.length){
      interval = setInterval(() => setText(() => props.displayText.slice(0, curText.length)), TEXT_DISPLAY_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [curText]);

  return (
    <div>
      <h1 className='whitespace-pre-wrap text-black'>{curText}</h1>
    </div>
  );
};

export default AIText;
