// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import { Platform } from 'react-native';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as qs from 'qs';
import axios from "axios";
import "./App.css";
import "./circle.css"
import "onsenui/css/onsen-css-components.css";
import { Toolbar, BackButton, List } from "react-onsenui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faCircle,
  faCheckCircle,
  faPlus,
  faHelicopterSymbol,
  faLeftLong,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";
import Uploady from "@rpldy/uploady";
import { getMockSenderEnhancer } from "@rpldy/mock-sender";
import UploadButton from "@rpldy/upload-button";
import UploadDropZone from "@rpldy/upload-drop-zone";
import { useItemFinishListener } from "@rpldy/uploady";
import UploadPreview from "@rpldy/upload-preview";
import Select, {components} from 'react-select';
import MySelect from "./components/MySelect";
import makeAnimated from 'react-select/animated';
import { options } from "./components/data.ts";

var response = "";

const animatedComponents = makeAnimated();

const MyComponent = () => {
    useItemFinishListener((item) => {
        console.log(`item ${item.id} finished uploading, response was: `, item.uploadResponse, item.uploadStatus);
        response = item.uploadResponse.data.data.link;
    });
};

const Option = props => {
    return (
      <div style={{ textAlign: "left" }}>
        <components.Option {...props}>
            <div className="options-container">
                <input
                    type="checkbox"
                    checked={props.isSelected}
                    onChange={() => null}
                    style={{marginRight: "5px"}}
                />{" "}
                <label style={{paddingLeft: "5px", fontFamily: 'Source Sans Pro',
                    fontStyle: "normal",
                    fontSize: "14px", fontWeight: 500, color: "black"}}>{props.label}</label>
            </div>
        </components.Option>
      </div>
    );
  };

const styles = {
    multiValue: styles => {
        return {
            ...styles,
            backgroundColor: "papayawhip",
            fontFamily: 'Source Sans Pro',
            fontStyle: "normal",
            fontSize: "18px",
            fontWeight: 500,
            color: "black",
        };
    }
};

const PreviewContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    img {
        width: 250px;
        background-color: black;
        border: 4px;
        border-style: solid;
        border-color: gray;
    }
`;

function App() {
    const params = useLocation();
    let navigate = useNavigate();

    //--- handle multiple cameras
    const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);

    const [isActive, setIsActive] = useState(Array(100).fill(0));

    const [state, setState] = useState({
        current: "",
        token: "",
        modelIndex: -1,
        labelIndex: -1,
        url: "",
        apikey: "",
        apisecret: "",
        label: "",
        experi: "",
        run: "",
    });

    const handleDevices = React.useCallback(
        (mediaDevices) =>
            setDevices(
                mediaDevices.filter(({ kind }) => kind === "videoinput")
            ),
        [setDevices]
    );

    React.useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);
    //multi camera end ---

    const [items, setItems] = useState([]);
    const [projectArr, setProjectArr] = useState([]);
    const [labelsArr, setLabelsArr] = useState([]);
    const [selectedLabels, setSelectedLabels] = useState([]);

    const [checked, setChecked] = useState(false);
    const [values, setValues] = useState([]);
    const [percent, setPercent] = useState(0);
    const [total, setTotal] = useState(1);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setPercent(0);
        setProjectArr(JSON.parse(window.localStorage.getItem("projectArr")));
    }, []);

    useEffect(() => {
        console.log(projectArr);
        window.localStorage.setItem("projectArr", JSON.stringify(projectArr));
    }, [projectArr]);

    async function readyCloud(){
        if(params.state === null) navigate("/");
        setChecked(false);
        setValues([]);
        //console.log(params.state.url);
        state.url = "https://" + params.state.url;
        state.apikey = params.state.apikey
        state.apisecret = params.state.apisecret;
        state.current = "Models";
        console.log()
        console.log(window.localStorage.getItem("projectArr"))
        console.log(window.localStorage.getItem("projectArr") === "[]")
        if(!window.localStorage.getItem("projectArr") || window.localStorage.getItem("projectArr") === "[]" || true){
            console.log("bye")
            var token = await getToken();
            if(token == "error") state.current = "Error";
            else {
                state.token = token.trim();
                var projects = [];
                var data = await getProjects(state.token);
                setTotal(data.length);
                if(data == "error") state.current = "Error";
                else {
                    for(var i = 0; i < data.length; i++) {
                        setPercent((percent) => percent + 1);
                        var projectID = data[i].id;
                        var scene = await scenes(projectID);
                        for(var j = 0; j < scene.length; j++){
                            if(scene[j].productionModel.experimentID && scene[j].productionModel.runID){
                                var run = await runs(scene[j].productionModel.experimentID);
                                if(run.length >= 1){
                                    var label = await labels(scene[j].productionModel.experimentID, scene[j].productionModel.runID)
                                    if(label !== "error"){
                                        var date = new Date(run[0].completed.slice(0, -1));
                                        var newdate = date.getDate() + " " + monthNames[date.getMonth()].substring(0, 3) + ", " + date.getFullYear();
                                        projects.push({
                                            id: projectID,
                                            name: data[i].name,
                                            scenes: {
                                                id: scene[j].id,
                                                name: scene[j].name,
                                                experiId: scene[j].productionModel.experimentID,
                                                runId: scene[j].productionModel.runID,
                                                model: scene[j].name,
                                                map: run[0].map,
                                                completed: newdate,
                                                labels: label
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                    setIsLoading(false);
                    updateProjects(projects);
                    console.log(projects);
                }
            }
        }
        else {
            setIsLoading(false);
        }
    }

    async function scenes(projectID){
        var data = await getScenes(state.token, projectID);
        if(data == "error") state.current = "Error";
        var scene = [];
        for(var i = 0; i < data.length; i++) {
            scene.push({
                id: data[i].id,
                name: data[i].name,
                productionModel: {
                    experimentID: data[i].productionModel.experimentId,
                    runID: data[i].productionModel.runId,
                }
            })
        }
        return scene;
    }

    async function runs(experimentID){
        var data = await getRuns(state.token, experimentID);
        if(data == "error") state.current = "Error";
        var runs = []
        for(var i = 0; i < data.length; i++) {
            runs.push({
                id: data[i].id,
                map: data[i].validationMap,
                completed: data[i].completedAt
            })
        }
        return runs;
    }

    async function labels(experimentID, runID){
        var data = await getLabels(state.token, experimentID, runID);
        if(data === "error"){
            //state.current = "Error";
            return data;
        }
        return data.confusionMatrix.labels;
    }

    const run = async () => {
        readyCloud();
    };

    async function getToken() {
		var data = qs.stringify({
			'client_id': state.apikey,
			'client_secret': state.apisecret
		});
        return axios.post(state.url + "/api/auth", data,
		{
			method: 'post',
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/x-www-form-urlencoded'
			},
        }).then(response => response.data.access_token).catch(error => "error");
    }

    async function getProjects(token) {
       // console.log(state.url);
		return axios.get(state.url + "/api/ar/data/projects/", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then((response) => response.data).catch(error => "error");
    }

    async function getScenes(token, projectID) {
        return axios.get(state.url + "/api/ar/data/projects/" + projectID + "/scenes", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getRuns(token, experimentID) {
		return axios.get(state.url + "/api/ar/data/experiments/" + experimentID + "/run", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getLabels(token, experiment, run) {
		return axios.get(state.url + "/api/ar/data/experiments/" + experiment + "/run/" + run + "/metrics", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    const updateProjects = (newItems) => {
        setProjectArr(newItems);
    }

    const handleClick = async (index) => {
        /*
        if(state.current == "Projects"){
            //document.body.scrollTop = document.documentElement.scrollTop = 0;
            sceneData(index, false);
        }
        else if(state.current == "Scenes"){
            //document.body.scrollTop = document.documentElement.scrollTop = 0;
            var length = experisData(index, false);
            console.log(length);
            for(var i = 0; i < length; i++){
                runDataLoad(i);
            }
        }
        else if(state.current == "Models"){
            runDataLoad(index);
            var tmp = isActive.map((obj, index2) => {
                return index2 === index ? (obj === 1 ? 0: 1) : 0;
            });
            setIsActive(tmp);
        }
        else {
            predictData(index, false);
        } */
        if(state.current == "Models"){
            //runDataLoad(index);
            var tmp = isActive.map((obj, index2) => {
                return index2 === index ? (obj === 1 ? 0: 1) : 0;
            });
            setIsActive(tmp);
        }
        else {
            var tmp = isActive.map((obj, index2) => {
                return index2 === index ? (obj === 1 ? 0: 1) : 0;
            });
            setIsActive(tmp);
        }
    };

    const handleSelect = () => {
        if(state.current == "Models"){
            var index = isActive.indexOf(1);
            if(index != -1){
                state.current = "Labels";
                //console.log(projectArr[index]);
                state.modelIndex = index;
                options.splice(0, options.length);
                projectArr[index].scenes.labels.forEach(item =>
                    options.push({
                        value: item,
                        label: item,
                    })
                );
                setLabelsArr(projectArr[index].scenes.labels);
                setIsActive(Array(100).fill(0));
            }
        }
        else {
            /*
            var index = isActive.indexOf(1);
            if(index != -1){
                state.labelIndex = index;
                state.label = labelsArr[index];
                console.log(response);
                //if(open && response !== "")
                predict();
            } */
            console.log(selectedLabels);
            if(selectedLabels.length != 0){
                var newsel = [];
                for(var i = 0; i < selectedLabels.length; i++){
                    newsel.push(selectedLabels[i].value)
                }
                state.label = newsel;
                console.log(response);
                predict();
            }
        }
    }

    const handleLabelChange = selected => {
        if(selectedLabels.length === options.length - 1) console.log("hello");
        setValues(selected)
        setSelectedLabels(selected);
        setChecked(selected.length === options.length ? true : false);
    };

    const checkbox = () => {
        const isChecked = !checked;
        setChecked(isChecked);
        setSelectedLabels(isChecked ? options : []);
        setValues(isChecked ? options: []);
    }

    async function predict(){
        //warm up api call:
        const image = await fetch("logo192.png");
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);
	    axios.post(state.url + "/api/ar/data/experiments/" + projectArr[state.modelIndex].scenes.experiId + "/run/" + projectArr[state.modelIndex].scenes.runId + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + state.token
            }
		});

        var current = state.current;
        var token = state.token;
        /*
        {var clickIndex = state.clickIndex;
        var project = state.project;
        var projectItems = state.projectItems;
        var scene = state.scene;
        var sceneItems = state.sceneItems;
        var experiment = state.experiment;
        var experimentItems = state.experimentItems;
        var run = state.run;
        var runItems = state.runItems;} */
        var url = state.url;
        var apikey = state.apikey;
        var apisecret = state.apisecret;
        var label = state.label;
        var modelIndex = state.modelIndex;
        var labelIndex = state.labelIndex;
        var experi = projectArr[state.modelIndex].scenes.experiId;
        var run = projectArr[state.modelIndex].scenes.runId;
        console.log(response);
        navigate("/run", {
            state: {
                current,
                token,
                /*
                {
                clickIndex,
                project,
                projectItems,
                scene,
                sceneItems,
                experiment,
                experimentItems,
                run,
                runItems,
                } */
                url,
                apikey,
                apisecret,
                label,
                modelIndex,
                labelIndex,
                experi,
                run,
                response
            },
        });
    }

    const handleBack = () => {
        state.current = "Models";
        setProjectArr(projectArr.slice());
        console.log("hello");
        setIsActive(Array(100).fill(0));
    }

    useEffect(() => {
        run();
    }, []);

    return (
        <div className="App2">
            <div style={{ display: "block" }}>
                <Toolbar modifier="material">
                    <div className="left">
                        {state.current !== "Models" &&
                            <BackButton onClick={() => handleBack()}>Model Selection</BackButton>
                        }
                        {state.current === "Models" &&
                            <BackButton onClick={() => navigate("/")}>Login</BackButton>
                        }
                    </div>
                </Toolbar>
            </div>

            <div className="app-background">
                <div className="main-container">
                    <div className="project-container">
                        <div className="title-container">
                            <div className="project-title">{state.current === "Models" ? "Select Model" :
                                (state.current === "Labels" ? "Detection" : state.current)}
                            </div>
                        </div>
                        {state.current === "Labels" &&
                            <>
                                <div className="select-container">
                                    <MySelect
                                        placeholder="Select Label"
                                        styles={styles}
                                        closeMenuOnSelect={false}
                                        hideSelectedOptions={true}
                                        components={{ Option, animatedComponents }}
                                        isMulti
                                        isSearchable={false}
                                        options={options}
                                        value={values}
                                        onChange={handleLabelChange}
                                    />
                                    <div className="options-container" style={{ paddingTop: "10px", justifyContent: "center"}}>
                                        <input
                                            style={{marginRight: '8px'}}
                                            onChange={checkbox}
                                            type="checkbox"
                                            checked={checked}
                                        />
                                        <label style={{fontFamily: 'Source Sans Pro',
                                                fontStyle: "normal",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                color: "black"}} id="selectAll">Select All</label>
                                    </div>
                                </div>
                                <div className="gap2-container"></div>
                                <div className="gap2-container"></div>
                                <Uploady
                                    accept="image/*"
                                    method="POST"
                                    inputFieldName="image"
                                    grouped="false"
                                    destination={{ url: "https://api.imgur.com/3/image",
                                        headers: {
                                            Authorization: "Client-ID f95c254314c975a",
                                        },
                                    }}
                                >
                                    <MyComponent></MyComponent>
                                    <div>
                                        <UploadButton>
                                            <div className="default">
                                                <div className="frame">
                                                    <div className="upload">
                                                        <img className="vector" src="Vector.png"></img>
                                                    </div>
                                                    <div className="text1">Image Mask</div>
                                                    <div className="text2" style={{marginTop: "2px"}}>upload a file from your device</div>
                                                    <div className="text2" style={{fontStyle: "italic"}}>Optional</div>
                                                </div>
                                                <div className="rect"></div>
                                            </div>
                                        </UploadButton>
                                        <div className="gap2-container"></div>
                                        <PreviewContainer >
                                            <UploadPreview/>
                                        </PreviewContainer>
                                    </div>
                                </Uploady>
                                <div className="gap2-container"></div>
                                <div className="selectbutton-container" style={{marginBottom: "30px"}}>
                                    {selectedLabels.length == 0 ?
                                        <button className="buttongray" type="button" onClick={handleSelect}>Continue</button> :
                                        <button className="button2" type="button" onClick={handleSelect}>Continue</button>}
                                </div>
                            </>
                        }
                        {state.current === "Models" &&
                            <>
                                {isLoading ? (
                                    <div className="spinner-container">
                                        <div className="loading-spinner">
                                        </div>
                                        <div className="percent">{((percent / total) * 100).toFixed(2) + "%"}</div>
                                    </div>
                                    ) : (
                                    <>
                                        {projectArr.map((item, index) => (
                                            <div key={index}>
                                                <div style={{
                                                    border: isActive[index] === 1 ? '3px solid #00A9FF' : '',
                                                    boxShadow: isActive[index] === 1 ? '0px 0px 0px 4px rgba(0, 169, 255, 0.2)': '',
                                                }}
                                                    className="item-container" onClick={() => handleClick(index)}>
                                                    <div className="name-container">
                                                        <div className="name">
                                                            {item.name}{" - "}{item.scenes.name}
                                                        </div>
                                                        <div className="description">
                                                            <div className="label-container">
                                                                {item.scenes.labels.length > 1 ?
                                                                    <div className="labels">{item.scenes.labels.length} labels</div>
                                                                    :
                                                                    <div className="labels">{item.scenes.labels.length} label</div>
                                                                }
                                                            </div>
                                                            <div className="spacer-container">
                                                                <div className="spacer">|</div>
                                                            </div>
                                                            <div className="created-container">
                                                                <div className="created">Created {item.scenes.completed}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="graph-container">
                                                        <div className="graph">
                                                            {(item.scenes.map * 100) >= 70 &&
                                                                <div className={"c100 p" + ((item.scenes.map * 100).toFixed(0)) + " small green"}>
                                                                    <span>{(item.scenes.map * 100).toFixed(0)}%</span>
                                                                    <div className="slice">
                                                                        <div className="bar"></div>
                                                                        <div className="fill"></div>
                                                                    </div>
                                                                </div>
                                                            }
                                                            {(item.scenes.map * 100) < 70 && (item.scenes.map * 100) >= 40 &&
                                                                <div className={"c100 p" + ((item.scenes.map * 100).toFixed(0)) + " small orange"}>
                                                                    <span>{(item.scenes.map * 100).toFixed(0)}%</span>
                                                                    <div className="slice">
                                                                        <div className="bar"></div>
                                                                        <div className="fill"></div>
                                                                    </div>
                                                                </div>
                                                            }
                                                            {(item.scenes.map * 100) < 40 &&
                                                                <div className={"c100 p" + ((item.scenes.map * 100).toFixed(0)) + " small red"}>
                                                                    <span>{(item.scenes.map * 100).toFixed(0)}%</span>
                                                                    <div className="slice">
                                                                        <div className="bar"></div>
                                                                        <div className="fill"></div>
                                                                    </div>
                                                                </div>
                                                            }
                                                        </div>
                                                        <div className="recog">Recognition Score</div>
                                                    </div>
                                                </div>
                                                <div className="gap2-container"></div>
                                                <div className="gap2-container"></div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                <div className="selectbutton-container" style={{marginBottom: "30px"}}>
                                    {isActive.filter(v => v === 1).length == 0 ?
                                        <button className="buttongray" type="button">Select</button> :
                                        <button className="button2" type="button" onClick={handleSelect}>Select</button>}
                                </div>
                            </>
                        };
                    </div>
                </div>
            </div>
        </div>
    );
}
export default App;