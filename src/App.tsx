/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import cocoSsd from "@tensorflow-models/coco-ssd";

import "./App.css";
import { draw } from "./draw";

declare global {
  interface Window {
    model: cocoSsd.ObjectDetection;
  }
}

function App() {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>();
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<any>();
  const [modal, setModal] = useState<cocoSsd.ObjectDetection>();
  const [source, setSource] = useState<"image" | "webcam">();
  const [height, setHeight] = useState(20);
  const [width, setWidth] = useState(20);
  const [loadedImage, setLoadedImage] = useState("");
  const [init, setInit] = useState(true);
  const [detectedNames, setDetectedNames] = useState<string[]>();

  useEffect(() => {
    if (!window["model"]) window.location.reload();
    else setInit(false);
  }, []);

  // Main function
  const runCoco = useCallback(() => {
    // 3. TODO - Load network
    try {
      const net = window["model"];
      setModal(net);
    } catch (err) {
      console.log(err, cocoSsd);
    }
    //  Loop and detect hands
  }, []);

  const weHaveSomething =
    (typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef?.current?.video?.readyState === 4) ||
    loadedImage;

  const detect = useCallback(
    async (net?: cocoSsd.ObjectDetection) => {
      if (!net) return;
      // Check data is available
      if (weHaveSomething) {
        // Get Video Properties
        if (
          webcamRef.current !== null &&
          webcamRef?.current?.video?.readyState === 4
        ) {
          videoRef.current = webcamRef.current.video;
          setWidth(webcamRef.current.video.videoWidth);
          setHeight(webcamRef.current.video.videoHeight);

          // Set video width
          webcamRef.current.video.width = width;
          webcamRef.current.video.height = height;
        } // Set canvas height and width
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        // 4. TODO - Make Detections
        if (videoRef.current && source === "webcam") {
          const obj = await net.detect(videoRef.current);
          // console.log(obj);
          setDetectedNames(obj.map((o) => o.class));

          // Draw mesh
          const ctx = canvasRef?.current.getContext("2d");

          // 5. TODO - Update drawing utility
          draw(obj, ctx);
        } else if (imageRef.current && source === "image") {
          const obj = await net.detect(imageRef.current);
          // console.log(obj);
          setDetectedNames(obj.map((o) => o.class));
          // Draw mesh
          const ctx = canvasRef?.current.getContext("2d");

          // 5. TODO - Update drawing utility
          draw(obj, ctx);
        }
        // drawSomething(obj, ctx)
      }
    },
    [height, source, weHaveSomething, width]
  );

  useEffect(() => {
    setInterval(() => {
      (async () => {
        await detect(modal);
      })();
    }, 100);
  }, [detect, modal]);

  useEffect(() => {
    runCoco();
  }, [runCoco]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      setLoadedImage(URL.createObjectURL(files[0]));
    }
  };

  const imageLoad = (e: any) => {
    setHeight(e.target.offsetWidth as number);
    setWidth(e.target.offsetHeight as number);
  };

  return init ? (
    <div>Getting things ready...</div>
  ) : (
    <>
      <div>
        <button onClick={() => setSource("webcam")}>WebCom</button>
        <button onClick={() => setSource("image")}>Image</button>
        {source === "image" && (
          <input type="file" onChange={handleFileChange} />
        )}
      </div>
      <div>
        {detectedNames?.length &&
          detectedNames.map((name, i) => <p key={i}>{name}</p>)}
      </div>
      {source === "webcam" ? (
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            // zindex: 9,
            width: "40rem",
            height: "50rem",
          }}
        />
      ) : source === "image" ? (
        <div>
          {loadedImage ? (
            <img
              ref={imageRef}
              id="img"
              src={loadedImage}
              crossOrigin="anonymous"
              onLoad={imageLoad}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                // zindex: 9,
                width: "40rem",
                height: "50rem",
              }}
            />
          ) : null}
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          // zindex: 8,
          width: "40rem",
          height: "50rem",
        }}
      />
    </>
  );
}

export default App;
