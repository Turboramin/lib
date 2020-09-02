//console.log(`In ${window.location.href} starting script: ${import.meta.url}`);


import {loadScriptAsync,DomList,LinkToggleButton,subscribe,getElement,MonitorVisible,ForAllElements,setElementVal,publish,GetJson,LinkClickButton,LinkVisible,GetCSVIPFS,sleep} from '../lib/koiosf_util.mjs';
//import {GetCourseInfo,GlobalCourseList} from './koiosf_course.mjs';
//import {GlobalLessonList} from './koiosf_lessons.mjs';
import {GetToggleState} from '../genhtml/startgen.mjs'


window.addEventListener('DOMContentLoaded', init);  // load  

function init() {
	subscribe("setcurrentcourse",NewCourseSelected)
	LinkClickButton("quizleft",QuizLeft);
	LinkClickButton("quizright",QuizRight);
	subscribe("loadvideo",NewVideoSelected);
	LinkVisible("scr_quiz" ,ScrQuizMadeVisible)   
	LinkClickButton("checkanswer",CheckAnwer)

    NewCourseSelected(); //TEMP
}	

class QuizList {    
    constructor (source) {
        this.QuizListPromise=GetCSVIPFS(source)
    }
 
    async GetList() {
        return await this.QuizListPromise;
    }
    
    async SetMatch(match) {    
        if (match.includes("-"))
            match=match.split("-")[1] // take the part after the -
        
        var List=await this.GetList();
        
        console.log(`In GetMatchingQuestions match=${match}`);
        this.subset=[]
        for (var i=0;i<List.length;i++) {
            var line=List[i]
            if (line[0]===match) 
               this.subset.push(line)
        } 
        this.start=0
		console.log(this.subset)
        return this.subset.length;
    }    
    
	GetNrQuestions() {
		return this.subset.length;
	}
	
    GetCurrentQuestion() {
       if (this.start >= this.subset.length) 
           return undefined;       
	   console.log(`In GetCurrent ${ this.start} ${this.subset[this.start]}`)
       return this.subset[this.start]
    }
    
    Move(delta) {		
       this.start += delta
	   if (this.start < 0) this.start=0
	   if (this.start >= this.subset.length) this.start=this.subset.length-1
	   console.log(`In Move ${ this.start}`)
        
    }
    isFirst() { return this.start<=0 }
	isLast()  { return this.start>=this.subset.length-1 }
}    




export var GlobalQuizList;

async function NewCourseSelected() {   
    console.log("In NewCourseSelected");
    var quizcid=await GetCourseInfo("quizinfo") 
    console.log("quizcid");
    console.log(quizcid);
    quizcid = "QmXsnYGKXxrAKiZKQ6AHtiwJq19xQoav9ea5Fs6tmB7xtU"; //TEMP
    if (quizcid) {
        GlobalQuizList=new QuizList(quizcid)   
 
        var List=await GlobalQuizList.GetList();
        console.log(List);
    }    
}    

function QuizLeft() {
	console.log("QuizLeft")
	GlobalQuizList.Move(-1)
	UpdateButtons() 
	ScrQuizMadeVisible()
}

function QuizRight() {
	console.log("QuizRight")
	GlobalQuizList.Move(+1)
	UpdateButtons() 
	ScrQuizMadeVisible()
}

function UpdateButtons() {
	console.log("UpdateButtons")
	getElement("quizleft").dispatchEvent(new CustomEvent(GlobalQuizList.isFirst()?"displaydisabled":"displaydefault"));
	getElement("quizright").dispatchEvent(new CustomEvent(GlobalQuizList.isLast()?"displaydisabled":"displaydefault"));
}	


  
	

async function CheckAnwer() {
    console.log("In CheckAnwer");
	setElementVal("quizresult","");
    
    var answers=[]
    answers.push(GetToggleState(getElement("answera","scr_quiz"),"displayactive"))
    answers.push(GetToggleState(getElement("answerb","scr_quiz"),"displayactive"))
    answers.push(GetToggleState(getElement("answerc","scr_quiz"),"displayactive"))
    answers.push(GetToggleState(getElement("answerd","scr_quiz"),"displayactive"))
    
    console.log(answers);
    
    var btnlist=[];
    
    btnlist.push(getElement("answera","scr_quiz"))
    btnlist.push(getElement("answerb","scr_quiz"))
    btnlist.push(getElement("answerd","scr_quiz"))  // note order, d after b
    btnlist.push(getElement("answerc","scr_quiz"))
    

    for (var i=0;i<10;i++) {    
        btnlist[(i )  % btnlist.length].dispatchEvent(new CustomEvent("displaydisabled"));
        btnlist[(i+1) % btnlist.length].dispatchEvent(new CustomEvent("displaydefault"));
        btnlist[(i+2) % btnlist.length].dispatchEvent(new CustomEvent("displayactive"));
        //window.getComputedStyle(btnlist[nr])
        await sleep(50);
    }
    
    var question=GlobalQuizList.GetCurrentQuestion();
    console.log(`In CheckAnwer`);
    console.log(question[2]); // that's the column with the answers
    
    
    var btnlist2=[];
    
    btnlist2.push(getElement("answera","scr_quiz"))
    btnlist2.push(getElement("answerb","scr_quiz"))    
    btnlist2.push(getElement("answerc","scr_quiz"))
    btnlist2.push(getElement("answerd","scr_quiz"))  
    
    var countok=0
    for (var i=0;i<btnlist2.length;i++) {    
        var letter=String.fromCharCode(65+i);
		
        var answerok=question[2].includes(letter) // check answer column
		
		
		
        btnlist2[i].dispatchEvent(new CustomEvent(answerok?"displayactive":"displaydefault"));
        
        var rightanswer=(answers[i] == answerok)
		
		if (rightanswer)
			 countok++
        
		console.log(`answer: ${letter} should be selected:${answerok} done right: ${rightanswer} countok:${countok}`)
		
        //btnlist2[i].style.borderColor=rightanswer?"green":"red";
        //btnlist2[i].style.borderStyle="solid";        
        btnlist2[i].style.outline=(rightanswer?"#4DFFC1 solid 5px":"#FF79A8 dashed 5px")
        btnlist2[i].style.outlineOffset="2px"
        //console.log(btnlist2[i].style);
    }
    
        
       var str=(countok==4)?"Well done":`${countok*25}% right, try again`
	   console.log(str)
	   setElementVal("quizresult",str);
    
    
}    
function ResetAnswer() {
}	





async function ScrQuizMadeVisible() { // also used with next/prev question
    console.log("In ScrQuizMadeVisible");
    setElementVal("quizresult","");
    
	
	
    console.log(`In ScrQuizMadeVisible`);
    
	const answerlist = ["answera", "answerb", "answerc","answerd"]

	for (const element of answerlist) {
		console.log(element);	
		var domid=getElement(element,"scr_quiz")
		domid.dispatchEvent(new CustomEvent("displaydefault"));			
		domid.style.borderColor=""
		domid.style.borderStyle=""
	    domid.style.outline=""
        domid.style.outlineOffset=""
	}
    
    if (!GlobalQuizList) return;
    
    var question=GlobalQuizList.GetCurrentQuestion() // GetNext();
    console.log(question);
    if (!question) return;
    setElementVal("question",question[1],"scr_quiz")
    setElementVal("__label",question[3],"answera","scr_quiz")
    setElementVal("__label",question[4],"answerb","scr_quiz")
    setElementVal("__label",question[5],"answerc","scr_quiz")
    setElementVal("__label",question[6],"answerd","scr_quiz")

}




async function NewVideoSelected() {   
    if (GlobalQuizList) {
        var vidinfo=await GlobalLessonList.GetCurrentLessonData()    
        var match=(vidinfo.title).split(" ")[0]
        var nrquestions=await GlobalQuizList.SetMatch(match);    
    }
    console.log(`In NewVideoSelected match=${match} nrquestions:${nrquestions}`);
    
    
     var btn=getElement("btnquiz","scr_viewer")
     
     console.log(btn);
	 if (btn)
		btn.dispatchEvent(new CustomEvent((nrquestions >0 )?"show":"hide"));
    
}