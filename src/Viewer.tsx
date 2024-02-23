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
import { API_CHECK_PDF } from "./data/constants";

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

  const viewerState = useRef(useLocation().state);

  const url: string =
    new URLSearchParams(document.location.search).get("url") || PRIMARY_PDF_URL;
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [isGotAllHightlight, setIsGotAllHighlight] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (requestData: any) => {
      const myHeaders = new Headers();
      myHeaders.append("accept", "application/json");
      const formdata = new FormData();
      formdata.append(
        "extract_type", requestData.extract_type
      );
      formdata.append("similarity_score", requestData.similarity_score);
      formdata.append("top_k", requestData.top_k);
      formdata.append("prompt", requestData.prompt);
      formdata.append(
        "target_file",
        requestData.target_file as Blob,
      );

      requestData.references_file.forEach((file:any) => {
        formdata.append("references_file", file, file.name);
      });
  
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
        keepalive: true,
      } as RequestInit;

      const response = await fetch(API_CHECK_PDF, requestOptions);
      const reader = response.body?.getReader();
      const decodeStream = async () => {
        if (!reader) {
          return;
        }

        const { value, done } = await reader.read();

        if (done) {
          console.log('Got all hightlights');
          setIsGotAllHighlight(true);
          return;
        }

        const hlStr = new TextDecoder().decode(value);
        let hl: IHighlight | undefined;
        try {
          hl = JSON.parse(hlStr) as IHighlight;
        } catch (err) {}

        if (hl) {
          console.log('New highlight from server', hl);
          setHighlights((highlights) => [...highlights, hl as IHighlight]);
        }
        // Read next chunk
        decodeStream();
      };

      decodeStream();
    };

    if (viewerState.current) {
      console.log('Start get hightlights');
      fetchData(viewerState.current);
    }

    return () => {
      // Cleanup code, if needed
    };
  }, []);

  if (!viewerState.current) {
    viewerState.current = savedHighlights() as Record<
      string,
      Array<IHighlight>
    >;
  }

  const [aiHighlights, setAIHighlights] = useState<Array<IHighlight>>([]);

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
    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const addAIHighlight = useCallback((hl: IHighlight) => {
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

      <Sidebar highlights={highlights} addAIHighlight={addAIHighlight} isGotAllHighlight={isGotAllHightlight}/>

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
