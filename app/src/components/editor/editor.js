import axios from "axios";
import React, {Component} from "react";
import "../../helper/iframeLoader.js";
import DOMHelper from "../../helper/dom-helper.js";

export default class Editor extends Component {
    constructor() {
        super();
        this.currentPage = "index.html";
        this.state  = {
            pageList: [],
            newPageName: ""
        }
    }

    componentDidMount(){
        this.init(this.currentPage);
    }

    init = page => {
        this.iframe = document.querySelector('iframe');
        this.open(page);
        this.loadPageList();
    }

    open = page => {
        this.currentPage = page;
        axios
            .get(`../${page}?rnd=${Math.random()}`)
            .then(res => DOMHelper.parseStrToDOM(res.data))
            .then(DOMHelper.wrapTextNodes)
            .then(dom => {
                this.virtualDom = dom;
                return dom;
            })
            .then(DOMHelper.serializeDOMToString)
            .then(html => axios.post("./api/save_temp_page.php", {html}))
            .then(() => this.iframe.load("../temp.html"))
            .then(() => this.enableEditing());
    }

    save() {
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDOMToString(newDom);
        axios
            .post("./api/save_page.php", {pageName: this.currentPage, html});
    }

    enableEditing = () => {
        this.iframe.contentDocument.body.querySelectorAll("text-editor").forEach(element => {
            element.contentEditable = "true";
            element.addEventListener("input", () => {
                this.onTextEdit(element);
            })
        }
        )
    }
    onTextEdit(element){
        const id = element.getAttribute("nodeid");
        this.virtualDom.body.querySelector(`[nodeid="${id}"]`).innerHTML = element.innerHTML;
    }

    loadPageList = () => {
        axios
            .get("./api")
            .then(res => this.setState({pageList: res.data}));
    }
    
    createNewPage = () => {
        axios
            .post("./api/create_new_page.php", {"name": this.state.newPageName})
            .then(this.loadPageList())
            .catch(() => alert("This page is already exist, change page name!"))
    }

    deletePage = page => {
        axios
            .post("./api/delete_page.php", {"name" : page})
            .then(this.loadPageList())
            .catch(() => alert("This page is not exist"));
    }

    render(){
        // const {pageList} = this.state;
        // const pages = pageList.map((page,i) => {
        //     return <h1 key={i}>
        //         {page}
        //         <a href="#" onClick={() => {this.deletePage(page)}}>(x)</a>
        //     </h1>
        // });
        

        return (
            <>
                <button onClick={() => this.save()}>Click</button>
                <iframe src={this.currentPage} frameBorder="0"></iframe>
            </>
            // <>
            // <input onChange={(e) => {this.setState({newPageName: e.target.value})}} type="text"/>
            // <button onClick={this.createNewPage}>Create new page</button>
            // {pages}
            // </>
        )
    }
}
