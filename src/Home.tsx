import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import GroupUpload from "./components/GroupUpload";
// import { testHighlights } from "./test-highlights";

import {openIDB, IDB_PDF_NOTE, PdfNoteStores, addDataIDB, getAllDataIDB} from './utils/indexedDB';
import { uniqueFileName } from "./utils/strings";
// import { API_CHECK_PDF } from "./data/constants";
// import useIndexedDB, { IDB__HIGHLIGHT_RESULTS } from "./hooks/useIndexDB";

import "react-toastify/dist/ReactToastify.css";

const PAGE_TITLE = "Consistency Check Demo";
const MAX_PROMPT_LENGTH = 1000;
const MIN_PROMPT_LENGTH = 20;

type ExtractType = "extract_type_block" | "extract_type_sentence";

export default function Home() {
  const navigate = useNavigate();

  // const {addData, getAllData} = useIndexedDB({dbName: IDB__HIGHLIGHT_RESULTS, storeName: "note_requested"});

  const toastId = useRef<number | string>(0);
  const targetPdfFile = useRef<File | undefined>();
  const refPdfFiles = useRef<File[] | undefined>(); // References Pdf file
  const [sScore, setSScore] = useState<number>(0);
  const [topKMaches, setTopKMaches] = useState<number>(1);
  const [extractType, setExtractType] =
    useState<ExtractType>("extract_type_block");
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT);

  const onResetPrompt = () => {
    setPromptText(DEFAULT_PROMPT);
  };

  const onInputPrompt = (e: any) => {
    setPromptText(e.target.value);
  };

  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);

  const updateTargetPdf = (files: File[] | undefined) => {
    targetPdfFile.current = files ? files[0] : undefined;
  };

  const updateRefPdf = (files: File[] | undefined) => {
    refPdfFiles.current = files;
  };

  const onTopKMachesChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newTopK = parseInt(e.target.value);
    let minTopK = parseInt(e.target.min);
    let maxTopK = parseInt(e.target.max);
    if (isNaN(newTopK)) {
      newTopK = minTopK;
    }
    if (newTopK < minTopK) {
      newTopK = minTopK;
    }
    if (newTopK > maxTopK) {
      newTopK = maxTopK;
    }

    setTopKMaches(newTopK);
  };

  const onSScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newSScore = parseFloat(e.target.value);
    let minSScore = parseFloat(e.target.min);
    let maxSScore = parseFloat(e.target.max);
    if (isNaN(newSScore)) {
      newSScore = minSScore;
    }
    if (newSScore < minSScore) {
      newSScore = minSScore;
    }
    if (newSScore > maxSScore) {
      newSScore = maxSScore;
    }

    setSScore(newSScore);
  };

  const onExtractTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtractType(
      e.target.value === "extract_type_block"
        ? "extract_type_block"
        : "extract_type_sentence"
    );
  };

  // const updateLocalStorage = (hls: Record<string, Array<IHighlight>>) => {
  //   clearHightlights();
  //   setSavedHighlights(hls);
  // };

  const onSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!targetPdfFile.current) {
      alert("Please chose target pdf!");
      return;
    }
    if (!refPdfFiles.current) {
      alert("Please add reference pdfs!");
      return;
    }
    if (
      promptText.length < MIN_PROMPT_LENGTH ||
      promptText.length > MAX_PROMPT_LENGTH
    ) {
      alert(
        `Prompt length must in [${MIN_PROMPT_LENGTH},${MAX_PROMPT_LENGTH}]`
      );
      return;
    }

    setSubmitDisabled(true);
    const targetFilename = uniqueFileName(targetPdfFile.current?.name);

    const requestData = {
      extract_type: extractType === "extract_type_block" ? "block" : "sentence",
      similarity_score: sScore.toString(),
      top_k: topKMaches.toString(),
      prompt: promptText,
      target_file: targetPdfFile.current,
      references_file: refPdfFiles.current,
    }

    toastId.current = toast.loading("Loading the result...");
    // Save request to database
    // Mocking
    await delay(1000);
    toast.update(toastId.current, {
      render: "Process success",
      type: "success",
      isLoading: false,
    });
    // Store pdf file
    // const db = await openIDB(IDB_PDF_NOTE, PdfNoteStores.pdfFile);
    // console.log('db created', db);
    // await addDataIDB(db, PdfNoteStores.pdfFile,{
    //   filename: targetFilename,
    //   blob: targetPdfFile.current,
    // },""
    // );
    // //
    // await getAllDataIDB(db, PdfNoteStores.pdfFile);
    // Navigate without createObjectURL
    navigate(
      `/viewer?filename=${encodeURIComponent(targetFilename)}`,
      {
        replace: false,
        state: requestData,
      }
    );
    // Navigate using createObjectUrl
    // navigate(
    //   `/viewer?filename=${encodeURIComponent(
    //     targetFilename
    //   )}&url=${URL.createObjectURL(targetPdfFile.current)}`,
    //   {
    //     replace: false,
    //     state: requestData,
    //   }
    // );
  };

  return (
    <>
      <div className="flex flex-col items-stretch	justify-self-center mx-40 min-w-[700px]">
        <h1 className="my-5 text-violet-700 text-4xl font-extrabold leading-none tracking-tigh md:text-5xl lg:text-6xl dark:text-white text-center">
          {PAGE_TITLE}
        </h1>
        <div className="flex flex-row gap-x-4">
          <GroupUpload
            className=""
            groupLabel="Target PDF"
            updateData={updateTargetPdf}
            isMultiple={false}
            id="target-pdf"
          />
          <GroupUpload
            className=""
            groupLabel="References PDF"
            updateData={updateRefPdf}
            isMultiple={true}
            id="references-pdf"
          />
        </div>
        {/* inputs */}
        <div className="flex flex-col">
          <label
            htmlFor="similarity_score"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Extract Type
          </label>
          <div className="flex">
            <div className="mb-[0.125rem] block min-h-[1.5rem] pl-[1.5rem]">
              <input
                className="mr-2"
                type="radio"
                name="extract_type"
                id="extract_type_block"
                value="extract_type_block"
                onChange={onExtractTypeChange}
                checked={extractType === "extract_type_block"}
              />
              <label className="text-black" htmlFor="extract_type_block">
                Block
              </label>
            </div>
            <div className="mb-[0.125rem] block min-h-[1.5rem] pl-[1.5rem]">
              <input
                className="mr-2"
                type="radio"
                name="extract_type"
                id="extract_type_sentence"
                value="extract_type_sentence"
                onChange={onExtractTypeChange}
                checked={extractType === "extract_type_sentence"}
              />
              <label className="text-black" htmlFor="extract_type_sentence">
                Sentence
              </label>
            </div>
          </div>

          <div className="flex flex-row gap-x-4">
            <div className="w-1/2">
              <label
                htmlFor="similarity_score"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Similarity Score
              </label>
              <input
                type="number"
                step={0.1}
                max={0.9}
                min={0}
                value={sScore}
                onChange={onSScoreChange}
                name="similarity_score"
                id="similarity_score"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>

            <div className="w-1/2">
              <label
                htmlFor="topk-matches"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Top K Matches
              </label>
              <input
                type="number"
                step={1}
                max={10}
                min={1}
                value={topKMaches}
                onChange={onTopKMachesChanges}
                name="topk-matches"
                id="topk-matches"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        {/* Prompt text */}
        <div className="group-label flex flex-col" data-content="Prompt">
          <textarea
            className="text-black flex-auto p-2"
            rows={7}
            maxLength={MAX_PROMPT_LENGTH}
            minLength={MIN_PROMPT_LENGTH}
            value={promptText}
            onInput={onInputPrompt}
          />
          <div className="text-black self-end">
            {promptText.length}/{MAX_PROMPT_LENGTH}
          </div>
          <button
            className="text-white mt-2 w-full bg-purple-700 hover:bg-purple-800 hover:disabled:bg-purple-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 focus:outline-none dark:focus:ring-purple-800"
            onClick={onResetPrompt}
            // disabled={submitDisabled}
          >
            Reset
          </button>
        </div>

        <button
          className="text-white mt-2 w-full bg-purple-700 hover:bg-purple-800 hover:disabled:bg-purple-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 focus:outline-none dark:focus:ring-purple-800"
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          Submit
        </button>
      </div>
      <ToastContainer />
    </>
  );
}

const DEFAULT_PROMPT = `Write less than 200 words to explain why <text1> and <text2> have the same topic (high similarity) and are relative. Provide a Python string only.
Please do not mention <text1> and <text2> again in the response.
<text1>
    {text}
<text2>
    {ref_text}
`;

const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// const dataTest1 :Record<string, Array<IHighlight>> = {
// const dataTest1 = {
//   "http://192.168.1.107:9007/results/test.pdf": [
//       {
//           "content": {
//               "text": "Development and training of the neural network model."
//           },
//           "position": {
//               "pageNumber": 3,
//               "rects": [
//                   {
//                       "x1": 228.43191176470583,
//                       "y1": 288.72030303030317,
//                       "x2": 565.1701967230391,
//                       "y2": 303.81515151515157,
//                       "width": 810,
//                       "height": 1200
//                   }
//               ],
//               "boundingRect": {
//                   "x1": 228.43191176470583,
//                   "y1": 288.72030303030317,
//                   "x2": 565.1701967230391,
//                   "y2": 303.81515151515157,
//                   "width": 810,
//                   "height": 1200,
//                   "pageNumber": 3
//               }
//           },
//           "comment": {
//               "text": "Reference text: This section describes the training regime for our models. \n \n Reference path: paper.pdf \n \n Reference page: 6 \n \n Explaination: Both strings discuss the process of preparing a model for machine learning tasks. The first string explicitly mentions the development and training of a neural network model, which is a type of machine learning model. The second string refers to the training regime for models, which implies the process of training a model to improve its performance. The training regime could include various steps such as data preprocessing, model selection, and model evaluation. Therefore, both strings are related as they discuss the same topic of model training in machine learning.\n                                    ",
//               "comment": "🔥"
//           },
//           "id": "1123"
//       }
//   ]
// }
