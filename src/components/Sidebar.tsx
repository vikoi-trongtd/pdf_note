import React, { useCallback, useEffect, useState, useRef } from "react";
import { IHighlight } from "../react-pdf-highlighter";
import AIText from "./AIText";

interface Props {
  highlights: Array<IHighlight>;
  addAIHighlight: (newHighlight: IHighlight)=>void;
}

export function Sidebar({
  highlights,
  addAIHighlight
}: Props) {
  const [listAIText, setListAIText] = useState<JSX.Element[]>([]);
  const childAITextRef = useRef();
  const [nChild, setNChild] = useState(0);
  const addChild = useCallback((hl: IHighlight) => {
    // console.log('nChild ', nChild);
    // Use the `React.memo` to memoize the child components
    const MemoizedChild = React.memo(AIText);

    setListAIText((prevChildren) => [
      ...prevChildren,
      <MemoizedChild
        key={prevChildren.length}
        ref={childAITextRef}
        id={prevChildren.length}
        highlight={hl}
        afterTextFilled={()=> setNChild(nChild=> nChild+1)}
      />,
    ]);

    }, []);

  useEffect(() => {
    if (nChild < highlights.length) {
      addAIHighlight(highlights[nChild])
      addChild(highlights[nChild]);
    }
  }, [addAIHighlight, addChild, highlights, nChild]);

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
