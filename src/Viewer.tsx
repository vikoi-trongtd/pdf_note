import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "react-pdf-highlighter";
// import { browserHistory } from 'react-router';

import type { IHighlight, NewHighlight } from "react-pdf-highlighter";
// import { testHighlights as _testHighlights } from "./test-highlights";
import { Spinner } from "./components/Spinner";
import { Sidebar } from "./components/Sidebar";

// import useLocalStorage, { LSI__HIGHLIGHT } from "./hooks/useLocalStorage";
import { API_CHECK_PDF } from "./data/constants";
import {
  IDB_PDF_NOTE,
  PdfNoteStores,
  addDataIDB,
  getAllDataIDB,
  openIDB,
} from "./utils/indexedDB";

// const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;
import "react-toastify/dist/ReactToastify.css";
import "./styles/Viewer.css";

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

const Viewer: React.FC = () => {
  const viewerState = useRef(useLocation().state);

  const toastId = useRef<number | string>(0);
  // Use for cancel stream when we dont need it.
  // In this case: change url => cancel the stream
  const [streamHlReader, setStreamReader] = useState<any>(undefined);

  const [targetFileUrl, setTargetFileUrl] = useState<string>("");

  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [isGotAllHightlight, setIsGotAllHighlight] = useState<boolean>(false);
  // Current AI highlight is generating
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

  const addHighlight = (highlight: NewHighlight) => {
    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const addAIHighlight = useCallback((hl: IHighlight) => {
    // live-scroll pdf view side
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

  // Get highlights data
  useEffect(() => {
    // Get highlights from local browser db (IndexedDB)
    const getSavedHighlights = async (
      uniqueFilename: string
    ): Promise<IHighlight[] | null> => {
      const db = await openIDB(IDB_PDF_NOTE, PdfNoteStores.highlightResult);
      if (!db) {
        return null;
      }
      const listSavedHighlights = await getAllDataIDB(
        db,
        PdfNoteStores.highlightResult
      );
      if (Array.isArray(listSavedHighlights)) {
        const requestInfo = listSavedHighlights.find(
          (highlightInfo) => highlightInfo.filename === uniqueFilename
        );
        if (requestInfo) {
          console.log("request info", requestInfo);
          return requestInfo.highlights as IHighlight[];
        }
      }
      return null;
    };

    // highlights was stored before => use it
    // highlights was NOT stored before => fetch highlights data
    const getHighlightsData = async (requestData: any) => {
      // Get highlights from local browser db (IndexedDb)
      const filenameRequest: string =
        new URLSearchParams(document.location.search).get("filename") || "";
      console.log("filename request from current url: ", filenameRequest);
      const hls = await getSavedHighlights(filenameRequest);
      console.log("Highlights from local browser db (IndexedDB): ", hls);
      if (!requestData) {
        return;
      }
      // For pdf viewer
      setTargetFileUrl(URL.createObjectURL(requestData.target_file));
      if (hls && hls.length > 0) {
        setHighlights(hls);
        return;
      }
      //
      console.log("request data", requestData);
      const formdata = new FormData();
      formdata.append("extract_type", requestData.extract_type);
      formdata.append("similarity_score", requestData.similarity_score);
      formdata.append("top_k", requestData.top_k);
      formdata.append("prompt", requestData.prompt);
      formdata.append("target_file", requestData.target_file);
      requestData.references_file.forEach((file: any) => {
        formdata.append("references_file", file, file.name);
      });

      const requestOptions = {
        method: "POST",
        body: formdata,
        redirect: "follow",
        keepalive: true,
      } as RequestInit;
      try {
        toastId.current = toast.loading("Uploading data to server...");
        const response = await fetch(API_CHECK_PDF, requestOptions);
        console.log("response", response);
        if (response.ok) {
          if (toastId.current) {
            toast.update(toastId.current, {
              render: `Upload to server done, wait AI...`,
              type: "success",
              isLoading: false,
              autoClose: 5000,
            });
          }
        } else {
          toast.update(toastId.current, {
            render: `Call server fail!`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
        // Read stream of highlights from response
        // using backtracking technique
        const reader = response.body?.getReader();
        setStreamReader(reader);
        const decodeStream = async () => {
          if (!reader) {
            return;
          }

          const { value, done } = await reader.read();

          if (done) {
            console.log("Got all hightlights from server");
            setIsGotAllHighlight(true);
            return;
          }

          const hlStr = new TextDecoder().decode(value);
          let hl: IHighlight | undefined;
          try {
            hl = JSON.parse(hlStr) as IHighlight;
          } catch (err) {}

          if (hl) {
            console.log("New highlight from server", hl);
            setHighlights((highlights) => [...highlights, hl as IHighlight]);
          }
          // Read next chunk
          decodeStream();
        };
        decodeStream();
      } catch (err) {
        console.log("Fetch data from server error: ", err);
        if (toastId.current) {
          toast.update(toastId.current, {
            render: `...`,
            type: "info",
            isLoading: false,
            autoClose: 1,
          });
        }
      }
    };

    if (viewerState.current) {
      console.log("Start get hightlights");
      if (viewerState.current.extract_type) {
        getHighlightsData(viewerState.current);
      }
    }

    return () => {
      // Cleanup code, if needed
    };
  }, []);

  // Scroll To Highlight From Hash of the current url
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

  // Cancel the fetch stream reader when user change/leave this page.
  useEffect(() => {
    return () => {
      console.log("Start cancel received highlights from server");
      if (streamHlReader) {
        console.log("Canceling received highlights from server");
        streamHlReader.cancel();
        console.log("Canceled received highlights from server");
      }
    };
  }, [streamHlReader]);

  // Save highlights to IndexDB when got all highlights from server
  useEffect(() => {
    const filenameRequest: string =
      new URLSearchParams(document.location.search).get("filename") || "";
    if (filenameRequest && isGotAllHightlight) {
      console.log(
        "Start store highlights result to IndexedDB done.",
        highlights
      );
      const saveHighlightsToIndexedDB = async (targetFilename: string) => {
        const db = await openIDB(IDB_PDF_NOTE, PdfNoteStores.highlightResult);
        if (db) {
          await addDataIDB(
            db,
            PdfNoteStores.highlightResult,
            {
              filename: targetFilename,
              highlights: highlights,
            },
            ""
          );
          console.log("Stored highlights result to IndexedDB done.");
        }
        // await getAllDataIDB(db, PdfNoteStores.pdfFile);
      };
      saveHighlightsToIndexedDB(filenameRequest);
    }
  }, [highlights, isGotAllHightlight]);

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

      <Sidebar
        highlights={highlights}
        addAIHighlight={addAIHighlight}
        isGotAllHighlight={isGotAllHightlight}
      />

      <div style={{ height: "100vh", width: "75vw", position: "relative" }}>
        {/* use key key={targetFileUrl} to force create new PdfLoader 
            when targetFileUrl is change.
            If not use, PdfLoader not reload the pdf respectively.
        */}
        <PdfLoader
          key={targetFileUrl}
          url={targetFileUrl}
          beforeLoad={<Spinner />}
        >
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

      <ToastContainer />
    </div>
  );
};

export default Viewer;
