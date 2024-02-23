import React, { useState } from "react";

import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";

import FileCard from "./FileCard";

import "../styles/GroupUpload.css";

interface GroupUploadProps {
  updateData: (files: File[] | undefined) => void;
  isMultiple?: boolean;
  id?: string;
  groupLabel: string;
  className?: string;
}

const GroupUpload = (props: GroupUploadProps) => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [shouldHighlight, setShouldHighlight] = useState(false);

  const preventDefaultHandler = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onSelectedFile = (filesSelected: FileList | null) => {
    if (filesSelected) {
      let filesSecArr = [];

      for (let i = 0; i < filesSelected.length; i++) {
        if (filesSelected[i].name.endsWith(".pdf")) {
          filesSecArr.push(filesSelected[i]);
        }
      }
      if (!props.isMultiple) {
        filesSecArr = [filesSecArr[0]];
      }
      setFiles(filesSecArr);
      props.updateData(filesSecArr);
    }
  };

  const fileListComponent = (files: File[] | null) => {
    const fileListC = [];
    if (files) {
      if (files[0]) {
        fileListC.push(<FileCard key={0} fileName={files[0].name}></FileCard>);
      }
      if (props.isMultiple) {
        for (let i = 1; i < files.length; i++) {
          fileListC.push(
            <FileCard key={i} fileName={files[i].name}></FileCard>
          );
        }
      }
    }
    return fileListC;
  };

  return (
    <div
      className={
        classNames({
          // "justify-center": true,
          "flex flex-col flex-start p-2 cursor-pointer": true,
          "text-violet-500 rounded-lg": true,
          border: true,
          "transition-colors": true,
        }) + ` group-label w-[50%] ${props.className}`
      }
      style={{
        paddingTop: "30px",
      }}
      data-content={props.groupLabel}
    >
      <input
        type="file"
        id={props.id}
        className="sr-only"
        multiple={props.isMultiple}
        accept=".pdf"
        onChange={(e) => {
          onSelectedFile(e.target.files);
        }}
      />
      <label
        htmlFor={props.id}
        className={classNames({
          "shrink-0 h-20": true,
          "p-4 grid place-content-center cursor-pointer": true,
          "text-violet-500 rounded-lg": true,
          "border border-dashed ": true,
          "transition-colors": true,
          "border-violet-500 bg-violet-100": shouldHighlight,
          "border-violet-100 bg-violet-50": !shouldHighlight,
        })}
        style={{
          minHeight: "100px",
        }}
        onDragOver={(e) => {
          preventDefaultHandler(e);
          setShouldHighlight(true);
        }}
        onDragEnter={(e) => {
          preventDefaultHandler(e);
          setShouldHighlight(true);
        }}
        onDragLeave={(e) => {
          preventDefaultHandler(e);
          setShouldHighlight(false);
        }}
        onDrop={(e) => {
          preventDefaultHandler(e);
          // UI logic, get only one file from the drop
          const filesDroped = e.dataTransfer.files;
          onSelectedFile(filesDroped);
          setShouldHighlight(false);
          // Do logic businesses
        }}
      >
        <div className="flex flex-col items-center">
          <CloudArrowUpIcon className="w-10 h-10" />
          <span>
            <span>Choose a File</span> or drag it here
          </span>
        </div>
      </label>

      <div className="mt-2 overflow-auto h-36">{fileListComponent(files)}</div>
    </div>
  );
};

export default GroupUpload;
