import toast from "react-hot-toast";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function Dropzone({ title = "file", onData }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.addEventListener("load", (e) => {
        try {
          const data = JSON.parse(e.target.result);

          onData(data);
        } catch (err) {
          toast.error("Invalid JSON file!");
        }
      });
      reader.readAsText(file);
    },
    [onData],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className="border border-dashed border-blue-500 px-4 py-10 text-center rounded-xl"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the {title} here ...</p>
      ) : (
        <p>
          Drag 'n' drop the {title} here, or click to select a {title}
        </p>
      )}
    </div>
  );
}
