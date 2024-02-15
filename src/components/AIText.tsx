import React, { useState, useEffect, Dispatch, SetStateAction, useImperativeHandle, forwardRef, useRef } from 'react';
import parse from 'html-react-parser';
import { IHighlight } from 'react-pdf-highlighter';

interface AITextProps {
  id: number;
  highlight: IHighlight;
  ref: React.ForwardedRef<any>;
  taskAfterTextFilled: ()=> void;
}

const TEXT_DISPLAY_INTERVAL = 30;
const AI_CURSOR = parse('&#9724;');

const AIText: React.FC<AITextProps> = forwardRef((props: AITextProps, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [curComment, setCurComment] = useState<string>('');
  const comment = props.highlight.comment?.text ;
  const highlight = props.highlight;
  const isCalledNext = useRef(false);// isCalledTaskAfterTextFilled

  const updateHash = (highlight: IHighlight) => {
    document.location.hash = `highlight-${highlight.id}`;
  };

  useEffect(() => {
    // console.log('comment', comment);
    if (comment === null || comment === undefined || isCalledNext.current) {
      if (!isCalledNext.current){
        isCalledNext.current = true;
        props.taskAfterTextFilled();
      } 
      return;
    }
    //
    let interval: NodeJS.Timer;
    const aiCursor = curComment.length % 4 === 0 ? AI_CURSOR : '';
    if (curComment.length < comment.length) {
      interval = setInterval(() => setCurComment(() => comment.slice(0, curComment.length + 1) + aiCursor), TEXT_DISPLAY_INTERVAL);
    } else if (curComment.length === comment.length){
      interval = setInterval(() => setCurComment(() => comment.slice(0, curComment.length)), TEXT_DISPLAY_INTERVAL);
    }
    // Generate next AIText
    if (curComment.length >= comment.length){
      isCalledNext.current = true;
      props.taskAfterTextFilled();
    }
    return () => clearInterval(interval);
  }, [curComment, props, comment]);

  useImperativeHandle(ref, () => ({
  }));
  
  useEffect(()=>{
    contentRef.current?.scrollIntoView();
  }, [curComment]);
  return (
    <>
      <li
        key={props.id}
        className="sidebar__highlight"
        onClick={() => {
          updateHash(highlight);
        }}
      >
        <div>
          <h1 className='whitespace-pre-wrap text-black break-words'>{curComment}</h1>
          {highlight.content.text ? (
            <blockquote style={{ marginTop: "0.5rem", backgroundColor: "#ffe28f" }}>
              {`${highlight.content.text.slice(0, 50).trim()}…`}
            </blockquote>
          ) : null}
          {highlight.content.image ? (
            <div
              className="highlight__image"
              style={{ marginTop: "0.5rem" }}
            >
              <img src={highlight.content.image} alt={"Screenshot"} />
            </div>
          ) : null}
        </div>
        <div 
          className="highlight__location"
          ref={contentRef}
          >
          Page {highlight.position.pageNumber}
        </div>
      </li>
    </>
  );
});

export default AIText;
