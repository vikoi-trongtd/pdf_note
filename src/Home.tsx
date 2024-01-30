import React, { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';


import GroupUpload from "./components/GroupUpload";
import { testHighlights } from "./test-highlights";

type ExtractType = 'extract_type_block' | 'extract_type_sentence';

export default function Home() {
  const navigate = useNavigate();

  const toastId = useRef<number | string>(0)
  const targetPdfFile = useRef<File | undefined>();
  const refPdfFiles = useRef<File[] | undefined>(); // References Pdf file
  const [sScore, setSScore] = useState<number>(0);
  const [extractType, setExtractType] = useState<ExtractType>('extract_type_block');

  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);

  const updateTargetPdf = (files: File[] | undefined) => {
    targetPdfFile.current = files ? files[0] : undefined;
  }

  const updateRefPdf = (files: File[] | undefined) => {
    refPdfFiles.current = files;
  }

  const onSScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newSScore = parseFloat(e.target.value);
    if (isNaN(newSScore)) {
      newSScore = 0;
    }
    if (newSScore > 0.9) {
      newSScore = 0.9;
    }
    if (newSScore < 0) {
      newSScore = 0;
    }

    setSScore(newSScore);
  }

  const onExtractTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtractType(e.target.value === 'extract_type_block' ? 'extract_type_block' : 'extract_type_sentence');
  }

  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!targetPdfFile.current) {
      alert('Please chose target pdf!');
      return;
    }
    if (!refPdfFiles.current) {
      alert('Please add reference pdfs!');
      return
    }

    setSubmitDisabled(true);

    var myHeaders = new Headers();
    myHeaders.append("accept", "application/json");

    var formdata = new FormData();
    formdata.append("extract_type", "block");
    formdata.append("similarity_score", sScore.toString());
    formdata.append("target_file", targetPdfFile.current as Blob, targetPdfFile.current?.name);
    refPdfFiles.current?.forEach((file) => {
      formdata.append("references_file", file, file.name);
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: formdata,
      redirect: 'follow'
    } as RequestInit;

    toastId.current = toast.loading("Loading...")
    // navigate('/viewer', { replace: true, state: testHighlights });
    fetch("http://192.168.1.107:9007/upload", requestOptions)
      .then(response => response.text())
      .then(result => {
        console.log('rs', result);
        toast.update(toastId.current, { render: "All is good", type: "success", isLoading: false });
        navigate('/viewer', { replace: true, state: {} });
      })
      .catch(error => {
        alert('Error: ' + error)
      }).finally(()=> setSubmitDisabled(false));
    // try{
    //   // const res = await fetch("http://192.168.1.107:9007/upload", requestOptions);
    //   const res = testHighlights;

    //   // if (!res.ok) {
    //   //   alert('Server error');
    //   //   return;
    //   // }
    //   // const data = await res.json();
    //   // navigate('/viewer',{replace: true, state: testHighlights})
    //   navigate('/viewer',{replace: true, state: {}})
    // } catch(e){
    //   alert(e);
    // }
  }

  return (
    <>
      <div className="flex flex-col items-stretch	justify-self-center mx-40 min-w-[700px]">
        <div className="flex flex-row gap-x-4">
          <GroupUpload
            className=""
            groupLabel="Target PDF" updateData={updateTargetPdf} isMultiple={false} id="target-pdf" />
          <GroupUpload
            className=""
            groupLabel="References PDF" updateData={updateRefPdf} isMultiple={true} id="references-pdf" />
        </div>

        <div className="flex flex-col">
          <label htmlFor="similarity_score" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                checked={extractType === 'extract_type_block'} />
              <label
                className="text-black"
                htmlFor="extract_type_block">
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
                checked={extractType === 'extract_type_sentence'} />
              <label
                className="text-black"
                htmlFor="extract_type_sentence">
                Sentence
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="similarity_score" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Similarity Score</label>
            <input type="number" step={0.1} max={0.9} value={sScore} onChange={onSScoreChange}
              name="similarity_score" id="similarity_score" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
          </div>
        </div>

        <button
          className="text-white mt-2 w-full bg-purple-700 hover:bg-purple-800 hover:disabled:bg-purple-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 focus:outline-none dark:focus:ring-purple-800"
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          Submit
        </button>
      </div>

    </>
  );
}
