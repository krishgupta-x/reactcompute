// Import dependencies
import React, { useRef, useState, useEffect } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { prod } from "@tensorflow/tfjs";

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
        clickIndex: -1,
        project: "",
        projectItems: "",
        scene: "",
        sceneItems: "",
        experiment: "",
        experimentItems: "",
        run: "",
        runItems: "",
        //runIndex: "",
        url: "",
        apikey: "",
        apisecret: "",
        productionModel: "",
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

    const project = {
        name: "",
        id: "",
        scenes: {
            name: "",
            id: "",
            productionModel: {
                experimentID: "",
                runID: "",
            },
            models: {
                name: "",
                experiId: "",
                runId: "",
                labels: "",
                completed: "",
                map: "",
            }
        }
    };

    var runtmp = [];
    var runItems = [];

    async function readyCloud(){
        if(params.state === null) navigate("/");
        console.log(params.state.url);
        state.url = "https://" + params.state.url;
        state.apikey = params.state.apikey
        state.apisecret = params.state.apisecret;
        state.current = params.state.current;

        var token = await getToken();
        if(token == "error") state.current = "Error";
        else {
            state.token = token.trim();
            /* projects(); */
            var projects = [];
            var temp = [];
            var data = await getProjects(state.token);
            if(data == "error") state.current = "Error";
            else {
                /*
                for(var i = 0; i < data.length; i++) {
                    var projectID = data[i].id;
                    var scene = await scenes(projectID);
                    console.log(i + ", " + projectID);
                    for(var j = 0; j < scene.length; j++){
                        var experi = await experiments(scene[j].id);
                        for(var k = 0; k < experi.length; k++){
                            var run = await runs(experi[k].id);
                            if(run.length >= 1){
                                projects.push({
                                    id: projectID,
                                    name: data[i].name,
                                    scenes: {
                                        id: scene[j].id,
                                        name: scene[j].name,
                                        models: {
                                            experiId: experi[k].id,
                                            runId: run[0].id,
                                            name: experi[k].name,
                                            map: run[0].map,
                                            completed: run[0].completed,
                                            labels: ""
                                        }
                                    }
                                })
                            }
                        }
                    }
                }
                console.log("hello");
                console.log(projects); */
            }

            if(state.current == "Projects"){
                console.log("hello");
                projectData();
            }
            else {
                state.current = params.state.current;
                state.token = params.state.token;
                state.clickIndex = params.state.clickIndex;
                state.project = params.state.project;
                state.projectItems = params.state.projectItems;
                state.scene = params.state.scene;
                state.sceneItems = params.state.sceneItems;
                state.experiment = params.state.experiment;
                state.experimentItems = params.state.experimentItems;
                state.run = params.state.run;
                state.runItems = params.state.runItems;
                state.url = "https://" + params.state.url;
                state.apikey = params.state.apikey;
                state.apisecret = params.state.apisecret;
                //update(state.runItems);
                //runData(state.experiment);
                //console.log(state.url);
                projectData();
            }
        }
    }

    async function scenes(projectID){
        var data = await getScenes2(state.token, projectID);
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

    async function experiments(sceneID){
        var data = await getExperiments2(state.token, sceneID);
        if(data == "error") state.current = "Error";
        var experi = [];
        for(var i = 0; i < data.length; i++) {
            experi.push({
                id: data[i].id,
                name: data[i].name,
            })
        }
        return experi;
    }

    async function runs(experimentID){
        var data = await getRuns2(state.token, experimentID);
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

    async function projectData(){
        state.current = "Projects";
        var data = await getProjects(state.token);
        var newItems = [], newprods = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                newItems.push(data[i]);
            }
            update(newItems);
        }
        state.projectItems = items;
    }

    async function sceneData(index, back){
        state.current = "Scenes";
        if(back == false) state.project = items[index].id;
        var data = await getScenes(state.token);
        var newItems = [], newprods = [], newexperi = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                newItems.push(data[i]);
                newprods.push(data[i].productionModel.runId);
                newexperi.push(data[i].productionModel.experimentId);
            }
            update(newItems);
            //updateprods(newprods);
            //updateprodexperi(newexperi);
            //console.log(newprods);
        }
        state.sceneItems = items;
    }

    async function experisData(index, back){
        state.current = "Models";
        if(back == false) state.scene = items[index].id;
        var data = await getExperiments(state.token);
        //var item = prods[index];
        //var experi = prodsExper[index];
        var newItems = [], newprods = [], newexperi = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                if(data[i].name == null) data[i].name = data[i].id;
                newItems.push(data[i]);
            }
            //newprods.push(item);
            //newexperi.push(experi);
            update(newItems);
            //updateprods(newprods);
            //updateprodexperi(newexperi);
        }
        state.experimentItems = items;
        console.log(index);
    }

    async function runData(index){
        console.log("run");
        state.current = "Runs";
        console.log(items);
        if(state.runItems == "") state.experiment = items[index].id;
        else state.experiment = state.runItems[index].id;
        var data = await getRuns(state.token);
        var newItems = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                if(data[i].name == null) data[i].name = data[i].id;
                newItems.push(data[i]);
                console.log(data[i]);
            }
            update(newItems);
        }
        console.log(data);
        state.run = data[0].id;
        state.runItems = items;
        console.log(state.runItems);
    }

    async function runDataLoad(index){
        console.log("run");
        //state.current = "Runs";
        console.log(items);
        console.log(state.runItems);
        state.experiment = items[index].id;
        var data = await getRuns(state.token);
        var newItems = [];
        if(data == "error") state.current = "Error";
        else {
            for(var i = 0; i < data.length; i++) {
                if(data[i].name == null) data[i].name = data[i].id;
                newItems.push(data[i]);
                console.log(data[i]);
            }
            //update(newItems);
        }
        console.log(data);
        state.run = newItems[0].id;
        state.runItems = newItems;
        console.log(state.runItems);
    }

    async function predictData(index, bool){
        state.current = "Runs";
        /*
        if(bool){
            state.run = prods;
            state.experiment = prodsExper;
        }
        else */

        //warm up api call:
        const image = await fetch("logo192.png");
		const imageBlob = await image.blob();
		const file = new File([imageBlob], "testImage.png", { type: imageBlob.type });

        let formData = new FormData();
        formData.set('image', file);

        //405 error
        //state.run = items[index].id;

        console.log("run " + state.run);
	    axios.post(state.url + "/api/ar/data/experiments/" + state.experiment + "/run/" + state.run + "/infer", formData, {
			headers: {
				Accept: "application/json",
				'Content-Type': 'multipart/form-data',
				'Authorization': 'Bearer ' + state.token
            }
		});

        var current = state.current;
        var token = state.token;
        var clickIndex = state.clickIndex;
        var project = state.project;
        var projectItems = state.projectItems;
        var scene = state.scene;
        var sceneItems = state.sceneItems;
        var experiment = state.experiment;
        var experimentItems = state.experimentItems;
        var run = state.run;
        var runItems = state.runItems;
        var url = state.url;
        var apikey = state.apikey;
        var apisecret = state.apisecret;
        navigate("/detect/run", {
            state: {
                current,
                token,
                clickIndex,
                project,
                projectItems,
                scene,
                sceneItems,
                experiment,
                experimentItems,
                run,
                runItems,
                url,
                apikey,
                apisecret
            },
        });
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
        console.log(state.url);
		return axios.get(state.url + "/api/ar/data/projects/", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then((response) => response.data).catch(error => "error");
    }

    async function getScenes(token) {
        return axios.get(state.url + "/api/ar/data/projects/" + state.project + "/scenes", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getScenes2(token, projectID) {
        return axios.get(state.url + "/api/ar/data/projects/" + projectID + "/scenes", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getExperiments(token) {
		return axios.get(state.url + "/api/ar/data/scenes/" + state.scene + "/experiments", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getExperiments2(token, sceneID) {
		return axios.get(state.url + "/api/ar/data/scenes/" + sceneID + "/experiments", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getRuns(token) {
		return axios.get(state.url + "/api/ar/data/experiments/" + state.experiment + "/run", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    async function getRuns2(token, experimentID) {
		return axios.get(state.url + "/api/ar/data/experiments/" + experimentID + "/run", {
			headers: {
				Accept: "application/json",
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
            }
		}).then((response) => response.data).catch(error => "error");
    }

    const update = (newItems) => {
        setItems(newItems);
    }

    const handleClick = (index) => {
        if(state.current == "Projects") sceneData(index, false);
        else if(state.current == "Scenes"){
            experisData(index, false);
        }
        else if(state.current == "Models"){
            runDataLoad(index);
            var tmp = isActive.map((obj, index2) => {
                return index2 === index ? (obj === 1 ? 0: 1) : 0;
            });
            setIsActive(tmp);
        }
        //else if(state.current == "Runs") predictData(index, false);
    };

    const handleSelect = () => {
        //var index = isActive.indexOf(1);
        predictData(0, false);
    }

    const handleRun = () => {
        predictData(0, true);
    }

    const handleBack = () => {
        if(state.current == "Scenes") projectData(state.prevIndex, true);
        else if(state.current == "Models") sceneData(state.prevIndex, true);
        else if(state.current == "Runs") experisData(state.prevIndex, true);
    }

    useEffect(() => {
        run();
    }, []);

    return (
        <div className="container">
            <div style={{ display: "block" }}>
                <Toolbar modifier="material">
                    <div className="left">
                        <BackButton onClick={() => navigate("/")}>Back</BackButton>
                    </div>
                </Toolbar>
            </div>

            <div className="app-background">
                <div className="main-container">
                    <div className="project-container">
                        <div className="title-container">
                            <div className="title-button">
                                {state.current !== "Projects" &&
                                    <button disabled={state.current === "Projects"} onClick={() => handleBack()}>
                                        <FontAwesomeIcon icon={faChevronLeft}/>
                                    </button>
                                }
                                {state.current === "Projects" &&
                                    <button disabled={state.current === "Projects"} onClick={() => handleBack()}>
                                    </button>
                                }
                            </div>
                            <div className="project-title">{state.current === "Models" ? "Select Model" : state.current}</div>
                        </div>
                        {state.current !== "Models" &&
                            items.map((item, index) => (
                                <>
                                    <div className="project-list" onClick={() => handleClick(index)}>
                                        <div className="project-item">{item.name}</div>
                                    </div>
                                    <spacer>spacer</spacer>
                                </>
                            ))
                        }
                        {state.current === "Models" &&
                            <>
                                {items.map((item, index) => (
                                    <>
                                        <div style={{
                                            border: isActive[index] === 1 ? '3px solid #00A9FF' : '',
                                            boxShadow: isActive[index] === 1 ? '0px 0px 0px 4px rgba(0, 169, 255, 0.2)': '',
                                        }}
                                            className="item-container" onClick={() => handleClick(index)}>
                                            <div className="name-container">
                                                <div className="name">{item.name}</div>
                                                <div className="description">
                                                    <div className="label-container">
                                                        <div className="labels">32 labels</div>
                                                    </div>
                                                    <div className="spacer-container">
                                                        <div className="spacer">|</div>
                                                    </div>
                                                    <div className="created-container">
                                                        <div className="created">Created on 12 Oct, 2021</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="graph-container">
                                                <div className="graph">
                                                    <div class="c100 p30 small green">
                                                        <span>30%</span>
                                                        <div class="slice">
                                                            <div class="bar"></div>
                                                            <div class="fill"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="recog">Recognition Score</div>
                                            </div>
                                        </div>
                                        <spacer>spacer</spacer>
                                    </>
                                ))}
                                <button class="button2" type="button" onClick={handleSelect}>Select</button>
                            </>
                        };
                    </div>
                </div>
            </div>
        </div>
    );
}
export default App;

