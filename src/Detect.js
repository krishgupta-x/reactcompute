// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";
import "./Detect.css";
import { drawRect, drawRect3, drawText } from "./utilities";
import 'onsenui/css/onsen-css-components.css';
import { Toolbar, BackButton } from 'react-onsenui';

import {saveAs} from 'file-saver';

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { BsInfoCircleFill } from 'react-icons/bs';

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }

function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
        setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

//const isLandscape = size.height <= size.width;
//const ratio = isLandscape ? size.width / size.height : size.height / size.width;


function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
      width: undefined,
      height: undefined,
    });

    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
          // Set window width/height to state
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
}


const HtmlTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} enterTouchDelay={0}/>
)) (({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#f5f5f9',
      color: 'rgba(0, 0, 0, 0.87)',
      maxWidth: 220,
      font: "Sans Serif",
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid #dadde9',
    },
}));

function App() {
    const { height, width } = useWindowDimensions();
    //const [width, height] = useWindowSize();
    //const [widthT, heightT] = throttled({ fps: 60 });
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const detectFlag = useRef(true);
    const boxes = useRef(null);
    const params = useLocation();
    let navigate = useNavigate();

    var first = true;

    const [interval1, setInterval1] = useState("");
    const [interval2, setInterval2] = useState("");

    const [flag, setFlag] = useState(false);
    const [fps, setFPS] = useState("Loading Predictions");

    const [counter, setCounter] = useState(0);
    const [screenshot, setScreenshot] = useState(null);

    const [open, setOpen] = useState(false);
    var detectsNeeded = 20;
    var message = "";

    const [state, setState] = useState({
        current: "",
        token: "",
        url: "",
        apikey: "",
        apisecret: "",
        labels: "",
        modelIndex: "",
        labelIndex: "",
        experi: "",
        run: "",
        image: "",
    });

    var t0 = 0, t1 = 0;

    var img;

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const handleDevices = React.useCallback(
        mediaDevices => {
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"))
        }, [setDevices]
    );

    React.useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        }, [handleDevices]
    );
    //multi camera end ---

    function readyCall() {
        if (params.state === null) {
            navigate("/detect");
        }
        else {
            t0 = performance.now();
            state.current = params.state.current;
            state.token = params.state.token;
            state.url = params.state.url;
            state.apikey = params.state.apikey;
            state.apisecret = params.state.apisecret;
            state.labels = params.state.label;
            state.modelIndex = params.state.modelIndex;
            state.labelIndex = params.state.labelIndex;
            state.experi = params.state.experi;
            state.run = params.state.run;
            state.image = params.state.response;
            message = "Detected " + params.state.label;
            console.log(state);
            runFunc();
        }
    }

    function handleBack() {
        setFlag(true);
        console.log(interval2);
        clearInterval(interval1);
        clearInterval(interval2);
        var current = state.current;
        var token = state.token;
        var url = state.url.substring(8);
        var apikey = state.apikey;
        var apisecret = state.apisecret;
        navigate("/detect", {
            state: {
                current,
                token,
                url,
                apikey,
                apisecret,
            },
        });
    }

    const runFunc = async() => {
        setInterval1(setInterval(() => {
            if (detectFlag.current === true) {
                detect();
            }
        }, 100));
    };

    useEffect(() => {
        if (counter >= detectsNeeded) {
            setFPS("Detected " + state.labels.join(", "));
            setOpen(true)
        } else {
            setOpen(false)
        }
      }, [counter]);

    const drawBoxes = async() => {
        setInterval2(setInterval(() => {
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            const ctx = canvasRef.current.getContext("2d");
            //drawRect3(ctx);

            if(boxes.current && !flag && !open) {
                var newboxes = {
                    image: {
                        width: boxes.current.image.width,
                        height: boxes.current.image.height
                    },
                    predictions: []
                };
                for(var i = 0; i < boxes.current.predictions.length; i++){
                    if(state.labels.includes(boxes.current.predictions[i].name)){
                        newboxes.predictions.push(boxes.current.predictions[i]);
                    }
                }
                if(newboxes.predictions.length > 0){
                    drawRect(newboxes, ctx);
                    drawRect(ctx);
                }
            }
        }, 0));
    }

    const detect = async() => {
        detectFlag.current = false;
        if(
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null &&
            webcamRef.current.video.readyState === 4
        ){
            const screen = webcamRef.current.getScreenshot();
            setScreenshot(screen);
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;

            // video height/width
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            // canvas height/width
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            const api = await predictions(screen);
            if(first){
                t1 = performance.now();
                setFPS("Load Time: " +(t1 - t0).toFixed(3) + " ms");
                first = false;
            }
            if(api != "error") {
                boxes.current = api;
            }
            if(boxes.current !== undefined && boxes.current.predictions !== undefined && boxes.current.predictions.length !== 0){
                if(state.labels.every(r => boxes.current.predictions.some(e => e.name === r))){
                    if(counter < detectsNeeded) setCounter((counter) => counter + 1);
                }
            }
            else setCounter(0)
            ///console.log(counter)
        }
        detectFlag.current = true;
    };

    async function downloadImage() {
        const blob = await screenshot.blob();
        saveAs(blob, 'image.jpg');
    }

    async function predictions(imageSrc) {
        const image = await fetch(imageSrc);
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });
        saveAs(file, 'image.jpg');

        let formData = new FormData();
        formData.set('image', file);
        //console.log("predicts");
        //console.log(state.url + "/api/ar/data/experiments/" + state.experi + "/run/" + state.run + "/infer");
		return axios.post(state.url + "/api/ar/data/experiments/" + state.experi + "/run/" + state.run + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + state.token
            }
		}).then((response) => response.data).catch(error => console.log());
    }

    useEffect(() => { drawBoxes() }, []);
    useEffect(() => { readyCall() }, []);

    return (
        <>
            <div style={{
                display: "block",
                width: "100%",
            }}>
                <Toolbar modifier="material" style={{}}>
                    <div className="left">
                        <BackButton onClick={navigate("/")}> Model Selection </BackButton>
                    </div>
                    <div style={{ paddingRight: 20 }} className="right">Predictions: {counter}</div>
                </Toolbar>
            </div>
            {fps === 'Loading Predictions' &&
                <div style={{position: "fixed", top: "50%", transform: "translateY(-50%)", left: "50%", right: "50%"}} className="spinner-container">
                    <div className="loading-spinner"></div>
                    <div className="percent">{fps}</div>
                </div>
            }
            <div className="screen">
                <div style={{position: "relative", zIndex: "3",}}>
                    <HtmlTooltip placement="left" title={<Typography color="inherit">{fps}</Typography>}>
                        <div style={{float: "right", bottom: "0px", marginRight: "1%", marginTop: "1%", height: "40px", width: "40px"}}>
                            <BsInfoCircleFill style={{height: "40px", width: "40px", color: "rgb(23, 43, 77)", backgroundColor: "white", borderRadius: "50%"}}/>
                        </div>
                    </HtmlTooltip>
                </div>
                {state.image !== "" && <div class="container">
                    <img src={state.image} style={{}}/>
                </div>}
                {(counter < detectsNeeded) ? (
                    <Webcam
                        ref={webcamRef}
                        muted={true}
                        //height={size.height}
                        //width={size.width}
                        //video={{ facingMode: "user"}}
                        //video={{ facingMode: { exact: "environment" } }}
                        videoConstraints={{ deviceId,
                            width: { min: 640, ideal: 1920, max: 1920 },
                            height: { min: 400, ideal: 1080 },
                            aspectRatio: 1.777777778,
                            frameRate: { max: 30 },
                            facingMode: { exact: "environment" }
                        }}
                        screenshotFormat="image/jpeg"
                        style={{
                            position: "fixed",
                            width: "100%",
                            height: "100%",
                            left: "0%",
                            objectFit: "cover",
                            objectPosition: "center"
                        }}
                        //className="webcamCapture"
                        /*
                        style={{
                            position: "absolute",
                            marginLeft: "auto",
                            marginRight: "auto",
                            left: 0,
                            right: 0,
                            //width: 640,
                            //height: 800,
                        }} */
                    />
                ) : (
                    <img src={screenshot} alt="screenshot" style={{
                        position: "fixed",
                        width: "100%",
                        height: "100%",
                        left: "0%",
                        objectFit: "cover",
                        objectPosition: "center"
                    }}/>
                )}
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "fixed",
                        left: "0%",
                        objectFit: "cover",
                        objectPosition: "center",
                        width: "100%",
                        height: "100%",
                    }}
                />
                {open === true ?
                    <div style={{zIndex: "2", position: "fixed", justifyContent: "center", textAlign: "center", verticalAlign: "middle"}}
                        className="ending">
                        <div className="title">{"Detected"}</div>
                    </div> : null}
            </div>
        </>
    );
}

export default App;