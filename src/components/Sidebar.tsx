import React, { useCallback, useEffect, useState, useRef } from "react";
import { IHighlight } from "react-pdf-highlighter";
import AIText from "./AIText";
import AICursor from "./AICursor";

interface Props {
  isGotAllHighlight: boolean;
  highlights: Array<IHighlight>;
  addAIHighlight: (newHighlight: IHighlight) => void;
}

export function Sidebar({
  isGotAllHighlight,
  highlights,
  addAIHighlight,
}: Props) {
  const childAITextRef = useRef();
  const lastChildRef = useRef<HTMLDivElement>(null);
  const [isAITextRunning, setIsAITextRunning] = useState<boolean>(false);
  const [listAIText, setListAIText] = useState<JSX.Element[]>([]);
  const [nChild, setNChild] = useState(0);
  const addChild = useCallback((hl: IHighlight) => {
    // Use the `React.memo` to memoize the child components
    setIsAITextRunning(true);

    const MemoizedChild = React.memo(AIText);

    setListAIText((prevChildren) => [
      ...prevChildren,
      <MemoizedChild
        key={prevChildren.length}
        ref={childAITextRef}
        id={prevChildren.length}
        highlight={hl}
        scrollToBottom={() => {
          lastChildRef.current?.scrollIntoView();
        }}
        afterTextFilled={() => {
          setIsAITextRunning(false);
          setNChild((nChild) => nChild + 1);
        }}
      />,
    ]);
  }, []);

  useEffect(() => {
    if (nChild < highlights.length && !isAITextRunning) {
      setIsAITextRunning(true);
      addAIHighlight(highlights[nChild]);
      addChild(highlights[nChild]);
    }
  }, [addAIHighlight, addChild, highlights, isAITextRunning, nChild]);

  return (
    <div className="sidebar" style={{ width: "25vw" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <p>
          <small>
            To create area highlight hold ⌥ Option key (Alt), then click and
            drag.
          </small>
        </p>
      </div>

      <ul>{listAIText.map((AIText) => AIText)}</ul>
      {/* <div className="text-yellow-950">Trongtd</div> */}
      {!isGotAllHighlight && !isAITextRunning ? <AICursor /> : null}
      <div ref={lastChildRef}></div>
    </div>
  );
}
