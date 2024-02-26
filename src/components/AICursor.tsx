import React, { useState, useEffect } from 'react';

import parse from "html-react-parser";

// interface AICursorProps {
//   isBlinking: boolean;
// }

const AI_CURSOR = parse("&#9724;") as string;
const BLINKING_INTERVAL = 300; 

const AICursor = () => {
  const [isShowCursor, setIsShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('blinking');
      setIsShowCursor(isShowCursor => !isShowCursor);
      clearInterval(interval);
    }, BLINKING_INTERVAL);

    return () => clearInterval(interval);
  }, [isShowCursor]);

  return <div className="text-black" style={{whiteSpace: 'pre-wrap'}}> {isShowCursor && AI_CURSOR}</div>;
};

export default AICursor;
