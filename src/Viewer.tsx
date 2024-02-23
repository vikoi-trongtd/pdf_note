import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "./react-pdf-highlighter";

import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";
// import { testHighlights as _testHighlights } from "./test-highlights";
import { Spinner } from "./components/Spinner";
import { Sidebar } from "./components/Sidebar";

import "./styles/Viewer.css";
import useLocalStorage, { LSI__HIGHLIGHT } from "./hooks/useLocalStorage";

// const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment?.text ? (
    <div
      className="Highlight__popup"
      style={{ width: "500px", height: "500px" }}
    >
      {comment.emoji} {comment.text}
    </div>
  ) : null;

// const PRIMARY_PDF_URL = "http://192.168.1.107:9007/results/test.pdf";
const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";

const Viewer: React.FC = () => {
  const [savedHighlights, ,] = useLocalStorage(LSI__HIGHLIGHT);

  const rsData = useRef(
    useLocation().state as Record<string, Array<IHighlight>>
  );
  if (!rsData.current) {
    rsData.current = savedHighlights() as Record<string, Array<IHighlight>>;
  }
  console.log("rsData", rsData.current);

  const [url, setUrl] = useState<string>(
    new URLSearchParams(document.location.search).get("url") || PRIMARY_PDF_URL
  );
  const [highlights, setHighlights] = useState<Array<IHighlight>>(
    rsData.current[url] ? [...rsData.current[url]] : []
  );
  const [aiHighlights, setAIHighlights] = useState<Array<IHighlight>>([]);

  console.log("highlight ", highlights);

  const scrollViewerTo = useRef<(highlight: any) => void>(() => {});

  const getHighlightById = useCallback(
    (id: string) => {
      return highlights.find((highlight) => highlight.id === id);
    },
    [highlights]
  );

  const scrollToHighlightFromHash = useCallback(() => {
    const highlight = getHighlightById(parseIdFromHash());

    scrollToHighlight(highlight);
  }, [getHighlightById]);

  const scrollToHighlight = (highlight: IHighlight | undefined) => {
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  };

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);

    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false
      );
    };
  }, [scrollToHighlightFromHash]);

  const addHighlight = (highlight: NewHighlight) => {
    console.log("Saving highlight", highlight);
    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const addAIHighlight = useCallback((hl: IHighlight) => {
    console.log("Saving AIhighlight", hl);
    // Scroll pdf side
    // scrollToHighlight(hl);
    setAIHighlights((hls) => [...hls, hl]);
  }, []);

  const updateHighlight = (
    highlightId: string,
    position: Object,
    content: Object
  ) => {
    console.log("Updating highlight", highlightId, position, content);

    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      })
    );
  };

  return (
    <div className="App flex h-[95vh]">
      <div className="flex bg-violet-50 text-violet-700">
        <Link to={"/"}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        </Link>
      </div>

      <Sidebar highlights={highlights} addAIHighlight={addAIHighlight} />

      <div style={{ height: "100vh", width: "75vw", position: "relative" }}>
        <PdfLoader url={url} beforeLoad={<Spinner />}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={resetHash}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo;
                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={(comment) => {
                    addHighlight({ content, position, comment });
                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !Boolean(
                  highlight.content && highlight.content.image
                );

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
                );

                return (
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={(popupContent) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                    children={component}
                  />
                );
              }}
              highlights={aiHighlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
};

export default Viewer;
