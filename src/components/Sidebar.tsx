import React, { useCallback, useEffect, useState, FC, useRef, LegacyRef, forwardRef } from "react";
import { Highlight, IHighlight } from "../react-pdf-highlighter";
import AIText from "./AIText";

interface Props {
  highlights: Array<IHighlight>;
}

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

export function Sidebar({
  highlights,
}: Props) {
  const [listAIText, setListAIText] = useState<JSX.Element[]>([]);
  const childAITextRef = useRef();
  const [nChild, setNChild] = useState(0);

  const addChild = useCallback((nChild: number) => {
    // console.log('nChild ', nChild);
    // Use the `React.memo` to memoize the child components
    const MemoizedChild = React.memo(AIText);

    setListAIText((prevChildren) => [
      ...prevChildren,
      <MemoizedChild
        key={prevChildren.length}
        ref={childAITextRef}
        id={prevChildren.length}
        highlight={highlights[nChild]}
        taskAfterTextFilled={()=> setNChild(nChild=> nChild+1)}
      />,
    ]);

    }, [highlights]);

  useEffect(() => {
    if (nChild < highlights.length) {
      addChild(nChild);
    }
  }, [addChild, highlights.length, nChild]);

  return (
    <div className="sidebar" style={{ width: "25vw" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
        </h2>

        <p>
          <small>
            To create area highlight hold ⌥ Option key (Alt), then click and
            drag.
          </small>
        </p>
      </div>

      <ul>{listAIText.map((AIText) => AIText)}</ul>
    </div>
  );
}
