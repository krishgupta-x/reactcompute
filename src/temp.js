// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as cocossd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import * as qs from 'qs';
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";
import { drawRect, drawRect3 } from "./utilities";
import "onsenui/css/onsen-css-components.css";
import { Toolbar, BackButton } from "react-onsenui";

function App() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const detectFlag = useRef(true);
    const boxes = useRef(null);
    const prevBoxes = useRef(null);

    const params = useLocation();
    let navigate = useNavigate();

    var protocol = "",
        ipaddr = "",
        port = "";
    var score = "/predict?score_threshold=";
    var scorethresh = "0.5";
    var iou = "&iou_threshold=";
    var iouthresh = "0.5";

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const handleDevices = React.useCallback(
        (mediaDevices) =>
        setDevices(
            mediaDevices.filter(({ kind }) => kind === "videoinput")
        ), [setDevices]
    );

    React.useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);
    //multi camera end ---

    function readyAPIData() {
        if (params.state === null) {
            navigate("/");
        } else {
            protocol = params.state.protocol + "://";
            ipaddr = params.state.ipaddress;
            port = ":" + params.state.port;
        }
    }

    function handleBack() {
        console.log("hello");
        navigate("/");
    }

    const run = async() => {
        readyAPIData();
        setInterval(() => {
            if (detectFlag.current === true) {
                var t0 = performance.now();
                detect();
                var t1 = performance.now();
                //console.log(`detect took ${t1 - t0} milliseconds.`);
                //console.log(" ----- ");
            }
        }, 100);
    };

    const drawBoxes = async() => {
        setInterval(() => {
            if (boxes.current !== null) {
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                const ctx = canvasRef.current.getContext("2d");
                drawRect3(ctx);
                if (boxes.current.predictions.length > 0)
                    drawRect(boxes.current, ctx);
            }
        }, 0);
    };

    const detect = async() => {
        detectFlag.current = false;
        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null &&
            webcamRef.current.video.readyState === 4
        ) {
            const screen = webcamRef.current.getScreenshot();
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;

            // video height/width
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            // canvas height/width
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            const api = await apiCall(screen);
            //boxes.current = api;
            // console.log(`Call to api took ${t1 - t0} milliseconds.`);

            //const ctx = canvasRef.current.getContext("2d");
            //if(api.predictions.length > 0) drawRect(api, ctx);
            //drawRect2(obj, ctx);
        }
        detectFlag.current = true;
        var tfull2 = performance.now();
        //console.log(`Function took ${tfull2 - tfull} milliseconds.`);
    };

    /*
    	var axios = require('axios');
    	var qs = require('qs');
    	var data = qs.stringify({
    	'client_id': '6cf383a0-b633-432d-902c-7b2cee43dfb6',
    	'client_secret': 'e268c979-43d7-4879-93a0-1f05729ab215'
    	});
    	var config = {
    	method: 'post',
    	url: 'https://gateway-demo.qa.alto-platform.ai/api/auth',
    	headers: {
    		'Content-Type': 'application/x-www-form-urlencoded'
    	},
    	data : data
    	};

    	axios(config)
    	.then(function (response) {
    	console.log(JSON.stringify(response.data));
    	})
    	.catch(function (error) {
    	console.log(error);
    	});
    */

    async function getToken(imageSrc) {
        var data = qs.stringify({
            'client_id': '6cf383a0-b633-432d-902c-7b2cee43dfb6',
            'client_secret': 'e268c979-43d7-4879-93a0-1f05729ab215'
        });
        return axios.post("https://gateway-demo.qa.alto-platform.ai/api/auth", data, {
            method: 'post',
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(response => console.log(response.data.access_token));
    }

    async function getProjects(imageSrc) {
        return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/projects/", {
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDE2NDUsImlhdCI6MTY2NTA0MTA0NSwianRpIjoiMmYyYjQyZjUtODU3Ni00OWZhLWE2NDMtNzQ5ZjgwZTljMWU4IiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6Ijk4OGFiMzA4LWI0NDAtNGQyMS05MDcxLWZmODRmY2U3NWI0MyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjMuMjI3LjE5NS4xMTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjMuMjI3LjE5NS4xMTkifQ.Rcctg7AOo2sbVq9xmbfqkEggI0j20abrjGqSBjmaetlYVKy628_bLL0CyX2aFbxLxy3q5afE1ZWlLSD9yEReGNcz3rf9FU7OgfCpXcEuUyPvCGk4yLDKJdKvd98wnHOLOB2aWBH3olp9ROLhtCrdPrS1a6FQirmLRlmsWrXnjs_c7CHI1k3XHvTdmA3tAwJONx2UtJWOKiAa_VgTr20xwjtT4bK4Tdh7rPpH_nUTjRyTF6g5z2J_Ryp1T4RTdFuxnYoPZSTcAXhxKnG0TQvSo9RAID-LeRYvJ3FRwbaPXvJQWEiWxs3MYpNUMdgBOvd6sTGx_g32S0duRnuGdccNTA'
            }
        }).then((response) => console.log(response.data));
    }

    async function getScenes(jwtToken) {
        return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/projects/8ea1b89d-92f9-4a39-88d8-ee036499cfe7/scenes", {
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDE2NDUsImlhdCI6MTY2NTA0MTA0NSwianRpIjoiMmYyYjQyZjUtODU3Ni00OWZhLWE2NDMtNzQ5ZjgwZTljMWU4IiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6Ijk4OGFiMzA4LWI0NDAtNGQyMS05MDcxLWZmODRmY2U3NWI0MyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjMuMjI3LjE5NS4xMTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjMuMjI3LjE5NS4xMTkifQ.Rcctg7AOo2sbVq9xmbfqkEggI0j20abrjGqSBjmaetlYVKy628_bLL0CyX2aFbxLxy3q5afE1ZWlLSD9yEReGNcz3rf9FU7OgfCpXcEuUyPvCGk4yLDKJdKvd98wnHOLOB2aWBH3olp9ROLhtCrdPrS1a6FQirmLRlmsWrXnjs_c7CHI1k3XHvTdmA3tAwJONx2UtJWOKiAa_VgTr20xwjtT4bK4Tdh7rPpH_nUTjRyTF6g5z2J_Ryp1T4RTdFuxnYoPZSTcAXhxKnG0TQvSo9RAID-LeRYvJ3FRwbaPXvJQWEiWxs3MYpNUMdgBOvd6sTGx_g32S0duRnuGdccNTA'
            }
        }).then((response) => console.log(response.data));
    }

    async function getExperiments(jwtToken) {
        return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/scenes/a38a79c2-5d5b-4b91-bd21-375de5dbbb70/experiments", {
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDE2NDUsImlhdCI6MTY2NTA0MTA0NSwianRpIjoiMmYyYjQyZjUtODU3Ni00OWZhLWE2NDMtNzQ5ZjgwZTljMWU4IiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6Ijk4OGFiMzA4LWI0NDAtNGQyMS05MDcxLWZmODRmY2U3NWI0MyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjMuMjI3LjE5NS4xMTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjMuMjI3LjE5NS4xMTkifQ.Rcctg7AOo2sbVq9xmbfqkEggI0j20abrjGqSBjmaetlYVKy628_bLL0CyX2aFbxLxy3q5afE1ZWlLSD9yEReGNcz3rf9FU7OgfCpXcEuUyPvCGk4yLDKJdKvd98wnHOLOB2aWBH3olp9ROLhtCrdPrS1a6FQirmLRlmsWrXnjs_c7CHI1k3XHvTdmA3tAwJONx2UtJWOKiAa_VgTr20xwjtT4bK4Tdh7rPpH_nUTjRyTF6g5z2J_Ryp1T4RTdFuxnYoPZSTcAXhxKnG0TQvSo9RAID-LeRYvJ3FRwbaPXvJQWEiWxs3MYpNUMdgBOvd6sTGx_g32S0duRnuGdccNTA'
            }
        }).then((response) => console.log(response.data));
    }

    async function getRuns(jwtToken) {
        return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/experiments/bf13f72c-dfa4-41dd-ae8f-997a36abe464/run", {
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDE2NDUsImlhdCI6MTY2NTA0MTA0NSwianRpIjoiMmYyYjQyZjUtODU3Ni00OWZhLWE2NDMtNzQ5ZjgwZTljMWU4IiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6Ijk4OGFiMzA4LWI0NDAtNGQyMS05MDcxLWZmODRmY2U3NWI0MyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjMuMjI3LjE5NS4xMTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjMuMjI3LjE5NS4xMTkifQ.Rcctg7AOo2sbVq9xmbfqkEggI0j20abrjGqSBjmaetlYVKy628_bLL0CyX2aFbxLxy3q5afE1ZWlLSD9yEReGNcz3rf9FU7OgfCpXcEuUyPvCGk4yLDKJdKvd98wnHOLOB2aWBH3olp9ROLhtCrdPrS1a6FQirmLRlmsWrXnjs_c7CHI1k3XHvTdmA3tAwJONx2UtJWOKiAa_VgTr20xwjtT4bK4Tdh7rPpH_nUTjRyTF6g5z2J_Ryp1T4RTdFuxnYoPZSTcAXhxKnG0TQvSo9RAID-LeRYvJ3FRwbaPXvJQWEiWxs3MYpNUMdgBOvd6sTGx_g32S0duRnuGdccNTA'
            }
        }).then((response) => console.log(response.data));

        //if status == "COMPLETED" not "FAILED"
    }

    async function apiCall(imageSrc) {
        const image = await fetch(imageSrc);
        const imageBlob = await image.blob();
        const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);

        return axios.post("https://gateway-demo.qa.alto-platform.ai/api/ar/data/experiments/bf13f72c-dfa4-41dd-ae8f-997a36abe464/run/41069606-6f7a-4c94-875a-ece0ec5815f1/infer", formData, {
            headers: {
                Accept: "application/json",
                'Content-Type': 'multipart/form-data',
                'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDI0NzcsImlhdCI6MTY2NTA0MTg3NywianRpIjoiNGVjNzgxYzAtMzAwMS00MGY0LTg2ZjItZTc1MjYzM2Q3YmJmIiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6IjhkYjIwOWYzLWNhODgtNDI5OC1iMjg4LWIxYTZiYjM5NjcyYyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjE4LjIwNS4zNS4yNDQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjE4LjIwNS4zNS4yNDQifQ.ZZxFTlCFKyGNhmp3Zy_Ram3YGojom_l85Jd1tLUkj4LGxVby0oACXylfDwz4291LhwmPXUbUX79Z_pQpqrdohRC5onN0q4x2LQCJG9a0lMRlJLifrmQ6sU1194rB-DzDSJqibModKU8WRueLpH8gfQbihkbvt3oUZfUhf0i43uuVB60PoEvSHNU_9qa2a3yYk41yg6AyAtpjjuNov7PenQma3hmUkLc9iwZECAGZ158XEBAuZRohN4aeJknh-2HPORP80W0VbwLZ1EY3WEZ5xdL7FbSVMbS0ltBsdY32veO0udmqorysz6M8GIFHOmQjB8EksAUr0YVgqj8a4VqzqQ'
            }
        }).then((response) => console.log(response.data));
    }

    /*
    async function getProjects(jwtToken) {
		return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/projects/8ea1b89d-92f9-4a39-88d8-ee036499cfe7/scenes", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDA5MzcsImlhdCI6MTY2NTA0MDMzNywianRpIjoiY2MwNGZkNTMtNDhkZC00MjAwLTg1NmEtMjY0ZDI1NzM4ZmI5IiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6ImVhNTExZmQ2LTJiNjEtNGJlMC05MWE2LWMzZTdlNTY2NzNhYSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjE4LjIwNS4zNS4yNDQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjE4LjIwNS4zNS4yNDQifQ.Th3MuzjsRLSLRzTgcHpOTVTgfi2VKe5TDhcdhurb2C3ONFfSOwwoCz1G7gKArZ7NKxC3eMni1xHcFaZm_vLMWQrhcuIY2Z-56BoJfHCEWwLww-KkpgYs3L61hPJgxh0xIKACMol5pNXTnJif5m4jTxI3BfUqHXZ0Ksul239--nOit8K1AgyuvwyLIY8-wntpWVyl1SLPKDO7RZvRsXFlw1hCaJ8_kHnJIpH6HiGOcZYAWyTxS2NQL8QrwSXqcQfEy7mPrcvsPz5iwiPd3bHSgipLw94B0aafSLOoLQXwzO4qXEq_wOd9wH6KDukBW8KM64OB27Cqei1G_pWwqv0eJg'
			}
		}).then((response) => console.log(response.data));
    } */

    /*
    async function apiCall(imageSrc) {
		return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/scenes/a38a79c2-5d5b-4b91-bd21-375de5dbbb70/experiments/", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjUwNDA5MzcsImlhdCI6MTY2NTA0MDMzNywianRpIjoiY2MwNGZkNTMtNDhkZC00MjAwLTg1NmEtMjY0ZDI1NzM4ZmI5IiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6ImVhNTExZmQ2LTJiNjEtNGJlMC05MWE2LWMzZTdlNTY2NzNhYSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjE4LjIwNS4zNS4yNDQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjE4LjIwNS4zNS4yNDQifQ.Th3MuzjsRLSLRzTgcHpOTVTgfi2VKe5TDhcdhurb2C3ONFfSOwwoCz1G7gKArZ7NKxC3eMni1xHcFaZm_vLMWQrhcuIY2Z-56BoJfHCEWwLww-KkpgYs3L61hPJgxh0xIKACMol5pNXTnJif5m4jTxI3BfUqHXZ0Ksul239--nOit8K1AgyuvwyLIY8-wntpWVyl1SLPKDO7RZvRsXFlw1hCaJ8_kHnJIpH6HiGOcZYAWyTxS2NQL8QrwSXqcQfEy7mPrcvsPz5iwiPd3bHSgipLw94B0aafSLOoLQXwzO4qXEq_wOd9wH6KDukBW8KM64OB27Cqei1G_pWwqv0eJg'
			}
		}).then((response) => console.log(response.data));
    } */




    /* to get projects list ->

    return axios.get("https://gateway-demo.qa.alto-platform.ai/api/ar/data/projects", {
    	headers: {
    		Accept: "application/json",
    		'Content-Type': 'application/json',
    		'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkc2dsS1RXOHhYN2ZzWml5dHdmYmc3U1RWRUt2ZEhKRTgxbmZham5nNlBFIn0.eyJleHAiOjE2NjQ4MTY1MzksImlhdCI6MTY2NDgxNTkzOSwianRpIjoiNDcxOGRhYzQtODY0OC00ODViLWIxMDQtZWQ5OTQxYzEzZDNlIiwiaXNzIjoiaHR0cHM6Ly9wb3J0YWwtZGVtby5xYS5hbHRvLXBsYXRmb3JtLmFpL2F1dGgvcmVhbG1zL2FsdG8iLCJhdWQiOlsiYWNjb3VudCIsImFyLW1vZGVsLWRhdGEiXSwic3ViIjoiMjE4M2E5ZTYtZGRlYy00MmEzLThkMDYtNWViZGMyZWUwNTc0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2Iiwic2Vzc2lvbl9zdGF0ZSI6ImMzODljMThkLTU3NGMtNDU2Zi1iZDVkLTI0NTU5Nzg5YWFiYSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfSwiYXItbW9kZWwtZGF0YSI6eyJyb2xlcyI6WyJBUl9NT0RFTCJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50SG9zdCI6IjMuMjI3LjE5NS4xMTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm9yZ2FuaXphdGlvbiI6IjExNzNkNzI3LTBkNzctNDNmNC1iNTZlLTA4NWU0MzY5ZWMwMyIsInByb2plY3QiOiJjOWJjMzgyYS0yOGZjLTQyNTEtOTQwZS02MDUyOWVlNTMwZjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtNmNmMzgzYTAtYjYzMy00MzJkLTkwMmMtN2IyY2VlNDNkZmI2IiwiY2xpZW50QWRkcmVzcyI6IjMuMjI3LjE5NS4xMTkifQ.Qj31LPOaF9OkBw90oOhQCdXaeRlaxnvzhgQNSQrygorK3utD_St5m11FnbyKm6CGCArBWL8ddq55hdea_JtF-FTrDO9STHCEmlEwg80ue_EpYoRzGMJ5deLW11_aJT2EKbUjd41wIxGWWPexFGDc37zKkkfRZnONamw6ObHcVpOedIFLssRzkWL_NDyMqMqvsrRlbD43aMFC1fW_iDFB5Fjmeu9sEL3l45BnQm3-aM5rbPxqUYBs8G2GNWk3G4nXU--6AzQ49iA7G7d2gnGFuOlDlu1PiKNI5MFAbPrwYgHiuPcQhiaE4Shkx54QhO4IombvrKmUCutzb4LOCquKog'
    	}
    }).then((response) => console.log(response.data)); */


    /*
  	async function apiCall(imageSrc){
		const image = await fetch(imageSrc);
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "test.png", { type: imageBlob.type });

			let formData = new FormData();
			formData.set('file', file);

			return axios.put("https://192.168.4.23:4433/predict?score_threshold=0.5&iou_threshold=0.5",
		formData, {
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'multipart/form-data'
				},
			}).then(response => response.data);

		/*
		console.log(data.image.height);
		console.log(data.image.width);
		console.log(data.predictions);
		console.log(data.predictions.length);
		if(data.predictions.length >= 1){
			console.log(data.predictions[0].name);
			console.log(data.predictions[0].bbox[0]);
			console.log(data.predictions[0].bbox[1]);
			console.log(data.predictions[0].bbox[2]);
			console.log(data.predictions[0].bbox[3]);
		}
		console.log("-------");
	} */

    useEffect(() => {
        drawBoxes();
    }, []);
    useEffect(() => {
        run();
    }, []);

    return (
        <>
            <div
                style={{
                    display: "block",
                    width: 500,
                }}
            >
                <Toolbar modifier="material">
                    <div className="left">
                        <BackButton onClick={handleBack}>Back</BackButton>
                    </div>
                </Toolbar>
            </div>
            <div className="App">
                <header className="App-header">
                    <Webcam
                        ref={webcamRef}
                        muted={true}
                        //video={{ facingMode: "user"}}
                        //video={{ facingMode: { exact: "environment" } }}
                        videoConstraints={{ deviceId }}
                        screenshotFormat="image/jpeg"
                        //className="webcamCapture"
                        style={{
                            position: "absolute",
                            marginLeft: "auto",
                            marginRight: "auto",
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            width: 640,
                            height: 480,
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: "absolute",
                            marginLeft: "auto",
                            marginRight: "auto",
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            width: 640,
                            height: 480,
                        }}
                    />
                </header>
                <div>
                    {devices.map((device, key) => (
                        <button
                            className="buttons"
                            type="button"
                            key={device.deviceId}
                            onClick={() => setDeviceId(device.deviceId)}
                        >
                            {device.label || `Device ${key + 1}`}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}


export default temp;