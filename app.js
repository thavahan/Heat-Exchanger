"use strict";

const CP = 4187;
const AREA = Math.PI * 0.0125 * 1.5;
const defaults = [
  {th:36.2,tc:54.8,thi:48.4,tho:42.7,tci:28.9,tco:34.6},
  {th:39.5,tc:58.0,thi:50.2,tho:44.1,tci:29.4,tco:35.7},
  {th:42.0,tc:61.5,thi:52.1,tho:46.0,tci:30.0,tco:36.2},
  {th:45.0,tc:65.0,thi:53.8,tho:47.6,tci:30.8,tco:36.9},
  {th:48.0,tc:68.5,thi:55.0,tho:49.3,tci:31.2,tco:37.1}
];
let mode = "parallel";
let readings = structuredClone(defaults);
let activeRun = 0;

const body = document.querySelector("#readingsBody");
const tabs = [...document.querySelectorAll("[role=tab]")];
const fields = ["th","tc","thi","tho","tci","tco"];

function safeLMTD(a,b){
  if(a<=0||b<=0) return NaN;
  if(Math.abs(a-b)<1e-9) return a;
  return (a-b)/Math.log(a/b);
}

function calculate(r){
  const mh=1/r.th, mc=1/r.tc;
  const qh=mh*CP*(r.thi-r.tho), qc=mc*CP*(r.tco-r.tci);
  const qavg=(qh+qc)/2;
  const d1=mode==="parallel"?r.thi-r.tci:r.thi-r.tco;
  const d2=mode==="parallel"?r.tho-r.tco:r.tho-r.tci;
  const lmtd=safeLMTD(d1,d2);
  const u=qavg/(AREA*lmtd);
  const cmin=Math.min(mh*CP,mc*CP);
  const effectiveness=qavg/(cmin*(r.thi-r.tci));
  return {mh,mc,qh,qc,qavg,lmtd,u,effectiveness};
}

function format(value,digits=1){return Number.isFinite(value)?value.toFixed(digits):"—"}

function updateApparatusReadings(){
  const reading=readings[activeRun];
  const calculated=calculate(reading);
  document.querySelectorAll("[data-sensor]").forEach(sensor=>{
    sensor.querySelector("output").textContent=`${format(reading[sensor.dataset.sensor],1)} °C`;
  });
  document.querySelectorAll("[data-flow-sensor]").forEach(sensor=>{
    sensor.querySelector("output").textContent=`${format(calculated[sensor.dataset.flowSensor],4)} kg/s`;
  });
  document.querySelectorAll("[data-run-select]").forEach(select=>select.value=String(activeRun));
}

function render(){
  body.innerHTML=readings.map((r,index)=>{
    const c=calculate(r);
    const input=key=>`<td><input type="number" min="0.1" step="0.1" value="${r[key]}" data-row="${index}" data-key="${key}" aria-label="Run ${index+1} ${key}"></td>`;
    return `<tr class="${index===activeRun?"active-run":""}" data-reading-row="${index}"><th scope="row">${index+1}</th>${input("th")}${input("tc")}<td class="output flow-output">${format(c.mh,4)}</td><td class="output flow-output">${format(c.mc,4)}</td>${input("thi")}${input("tho")}${input("tci")}${input("tco")}<td class="output">${format(c.qh)}</td><td class="output">${format(c.qc)}</td><td class="output">${format(c.lmtd,2)}</td><td class="output">${format(c.u,1)}</td><td class="output">${format(c.effectiveness,3)}</td></tr>`;
  }).join("");
  const results=readings.map(calculate).filter(r=>Number.isFinite(r.u));
  const avg=key=>results.reduce((sum,r)=>sum+r[key],0)/results.length;
  document.querySelector("#avgQ").textContent=format(avg("qavg"),1);
  document.querySelector("#avgU").textContent=format(avg("u"),1);
  document.querySelector("#avgE").textContent=format(avg("effectiveness"),3);
  updateApparatusReadings();
}

document.querySelectorAll("[data-run-select]").forEach(select=>{
  select.innerHTML=readings.map((_,index)=>`<option value="${index}">Run ${index+1}</option>`).join("");
  select.addEventListener("change",event=>{activeRun=Number(event.target.value);render()});
});

tabs.forEach(tab=>tab.addEventListener("click",()=>{
  mode=tab.dataset.mode;
  tabs.forEach(t=>t.setAttribute("aria-selected",String(t===tab)));
  document.querySelector("#parallel-panel").hidden=mode!=="parallel";
  document.querySelector("#counter-panel").hidden=mode!=="counter";
  document.querySelector("#modeLabel").textContent=mode==="parallel"?"Parallel flow":"Counter flow";
  render();
}));

body.addEventListener("input",event=>{
  if(!event.target.matches("input")) return;
  const {row,key}=event.target.dataset;
  activeRun=Number(row);
  const value=Number(event.target.value);
  if(Number.isFinite(value)&&value>0) readings[row][key]=value;
  body.querySelectorAll("[data-reading-row]").forEach(item=>item.classList.toggle("active-run",Number(item.dataset.readingRow)===activeRun));
  updateApparatusReadings();
});

body.addEventListener("change",event=>{if(event.target.matches("input")) render()});

body.addEventListener("click",event=>{
  const row=event.target.closest("[data-reading-row]");
  if(row&&!event.target.matches("input")){activeRun=Number(row.dataset.readingRow);render()}
});

document.querySelector("#resetButton").addEventListener("click",()=>{readings=structuredClone(defaults);activeRun=0;render()});
document.querySelector("#printButton").addEventListener("click",()=>window.print());
document.querySelector("#exportButton").addEventListener("click",()=>{
  const header=["Run","Hot collection time (s)","Cold collection time (s)","mh (kg/s)","mc (kg/s)","T1 hot inlet (C)","T2 hot outlet (C)","t1 cold inlet (C)","t2 cold outlet (C)","Qh (W)","Qc (W)","LMTD (K)","U (W/m2.K)","Effectiveness"];
  const rows=readings.map((r,i)=>{const c=calculate(r);return[i+1,r.th,r.tc,c.mh,c.mc,r.thi,r.tho,r.tci,r.tco,c.qh,c.qc,c.lmtd,c.u,c.effectiveness].map(v=>typeof v==="number"?v.toFixed(4):v)});
  const csv=[header,...rows].map(row=>row.join(",")).join("\n");
  const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));link.download=`${mode}-flow-readings.csv`;link.click();URL.revokeObjectURL(link.href);
});

render();

// Student quiz and local class mark register
const QUIZ_SIZE=4;
const MAX_STUDENTS=30;
const MARKS_KEY="thermal-flow-lab-marks-v1";
const PASSWORD_KEY="thermal-flow-lab-teacher-password-v1";
const DEFAULT_PASSWORD_HASH="af97a92ca820112c7e7e2b2d82d73c684371e704296db16da1fa9be86540c1b8";
const quizStart=document.querySelector("#quizStart");
const studentForm=document.querySelector("#studentForm");
const quizForm=document.querySelector("#quizForm");
const markReport=document.querySelector("#markReport");
const quizQuestions=document.querySelector("#quizQuestions");
const quizMessage=document.querySelector("#quizMessage");
let assignedQuestions=[];
let currentStudent=null;

function normalizedScope(value){return ["parallel","counter"].includes(value)?value:"combined"}
function scopeLabel(value){return value==="parallel"?"Parallel flow":value==="counter"?"Counter flow":"Combined flow"}

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char])}
function loadMarks(){try{return JSON.parse(localStorage.getItem(MARKS_KEY)||"[]")}catch{return[]}}
function saveMarks(marks){try{localStorage.setItem(MARKS_KEY,JSON.stringify(marks));return true}catch{return false}}
function shuffle(items){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const random=new Uint32Array(1);crypto.getRandomValues(random);const j=random[0]%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy;
}
function normalizeAnswer(value){return String(value).toLowerCase().normalize("NFKD").replace(/²/g,"2").replace(/ε/g,"epsilon").replace(/δ/g,"delta").replace(/×/g,"x").replace(/[^a-z0-9]+/g,"")}
function answerVariants(answer){
  const text=String(answer); const variants=new Set([normalizeAnswer(text)]);
  const parenthetical=text.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if(parenthetical){variants.add(normalizeAnswer(parenthetical[1]));variants.add(normalizeAnswer(parenthetical[2]))}
  return variants;
}
function isCorrect(question,response){return answerVariants(question.answer).has(normalizeAnswer(response))}
function typeLabel(type){return type==="mcq"?"Multiple choice":type==="true-false"?"True or false":"Fill in the blank"}
function correctAnswerLabel(question){
  if(question.type!=="mcq") return question.answer;
  const option=question.options.find(item=>item.key===question.answer);
  return option?`${option.key}) ${option.text}`:question.answer;
}
function questionMarkup(question,index){
  let answerControl="";
  if(question.type==="mcq") answerControl=`<div class="answer-options">${question.options.map(option=>`<label class="option-label"><input type="radio" name="q-${index}" value="${option.key}" required><span><b>${option.key})</b> ${escapeHtml(option.text)}</span></label>`).join("")}</div>`;
  else if(question.type==="true-false") answerControl=`<div class="answer-options"><label class="option-label"><input type="radio" name="q-${index}" value="True" required><span>True</span></label><label class="option-label"><input type="radio" name="q-${index}" value="False" required><span>False</span></label></div>`;
  else answerControl=`<input class="fill-answer" name="q-${index}" type="text" maxlength="100" required autocomplete="off" placeholder="Type your answer">`;
  return `<article class="question-card"><div class="question-head"><span class="question-number">${index+1}</span><h4>${escapeHtml(question.question)}</h4></div><span class="question-type">${typeLabel(question.type)} · ${question.flow} flow</span>${answerControl}</article>`;
}
function renderRegister(){
  const marks=loadMarks();
  document.querySelector("#studentCount").textContent=marks.length;
  document.querySelector("#marksBody").innerHTML=marks.length?marks.map((entry,index)=>`<tr><th scope="row">${index+1}</th><td>${escapeHtml(entry.studentId)}</td><td>${escapeHtml(entry.studentName)}</td><td><span class="scope-pill ${normalizedScope(entry.scope)}">${scopeLabel(normalizedScope(entry.scope))}</span></td><td>${entry.questionIds.length}</td><td><strong>${entry.score}/4</strong></td><td>${entry.percentage}%</td><td>${escapeHtml(entry.submittedLabel)}</td></tr>`).join(""):`<tr><td colspan="8" class="empty-register">No quiz submissions yet.</td></tr>`;
}

studentForm.addEventListener("submit",event=>{
  event.preventDefault(); quizMessage.textContent="";
  const marks=loadMarks();
  if(marks.length>=MAX_STUDENTS){quizMessage.textContent="This class session has reached the maximum of 30 students.";return}
  const studentName=document.querySelector("#studentName").value.trim();
  const studentId=document.querySelector("#studentId").value.trim();
  const scope=normalizedScope(document.querySelector("#quizScope").value);
  if(marks.some(entry=>entry.studentId.toLowerCase()===studentId.toLowerCase()&&normalizedScope(entry.scope)===scope)){quizMessage.textContent=`This Student ID has already completed the ${scopeLabel(scope).toLowerCase()} quiz.`;return}
  currentStudent={studentName,studentId,scope};
  if(scope==="combined"){
    const parallelQuestions=shuffle(window.QUIZ_BANK.filter(question=>question.flow==="parallel")).slice(0,QUIZ_SIZE/2);
    const counterQuestions=shuffle(window.QUIZ_BANK.filter(question=>question.flow==="counter")).slice(0,QUIZ_SIZE/2);
    assignedQuestions=shuffle([...parallelQuestions,...counterQuestions]);
  }else{
    assignedQuestions=shuffle(window.QUIZ_BANK.filter(question=>question.flow===scope)).slice(0,QUIZ_SIZE);
  }
  quizQuestions.innerHTML=assignedQuestions.map(questionMarkup).join("");
  document.querySelector("#quizStudent").textContent=`${studentName} · ${studentId} · ${scopeLabel(scope)}`;
  quizStart.hidden=true; markReport.hidden=true; quizForm.hidden=false;
  quizForm.scrollIntoView({behavior:"smooth",block:"start"});
});

quizForm.addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(quizForm);
  const responses=assignedQuestions.map((_,index)=>String(data.get(`q-${index}`)||""));
  const outcomes=assignedQuestions.map((question,index)=>({question,response:responses[index],correct:isCorrect(question,responses[index])}));
  const score=outcomes.filter(item=>item.correct).length;
  const now=new Date();
  const entry={studentName:currentStudent.studentName,studentId:currentStudent.studentId,scope:currentStudent.scope,questionIds:assignedQuestions.map(q=>q.id),score,percentage:Math.round(score/QUIZ_SIZE*100),submittedAt:now.toISOString(),submittedLabel:now.toLocaleString()};
  const marks=loadMarks(); marks.push(entry); saveMarks(marks);
  document.querySelector("#reportStudent").textContent=currentStudent.studentName;
  document.querySelector("#reportStudentId").textContent=`Student ID: ${currentStudent.studentId} · ${scopeLabel(currentStudent.scope)}`;
  document.querySelector("#reportScore").textContent=`${score}/4`;
  document.querySelector("#reportPercent").textContent=`${entry.percentage}%`;
  document.querySelector("#reportDate").textContent=`Submitted: ${entry.submittedLabel}`;
  document.querySelector("#answerReview").innerHTML=outcomes.map((item,index)=>`<div class="review-row ${item.correct?"correct":"wrong"}"><span class="review-status">${item.correct?"✓":"×"}</span><p><b>Q${index+1}.</b> ${escapeHtml(item.question.question)}</p><small>${item.correct?"Correct":`Correct answer: ${escapeHtml(correctAnswerLabel(item.question))}`}</small></div>`).join("");
  quizForm.hidden=true; markReport.hidden=false; renderRegister();
  markReport.scrollIntoView({behavior:"smooth",block:"start"});
});

document.querySelector("#nextStudent").addEventListener("click",()=>{
  studentForm.reset(); assignedQuestions=[]; currentStudent=null; markReport.hidden=true; quizStart.hidden=false; quizMessage.textContent="";
  quizStart.scrollIntoView({behavior:"smooth",block:"start"});
});
document.querySelector("#printQuizReport").addEventListener("click",()=>{document.body.classList.add("print-quiz-report");window.print()});
window.addEventListener("afterprint",()=>document.body.classList.remove("print-quiz-report"));
document.querySelector("#exportMarks").addEventListener("click",()=>{
  const marks=loadMarks();
  if(!marks.length){quizMessage.textContent="Complete at least one quiz before exporting marks.";return}
  const rows=[["S.No.","Student ID","Student Name","Question Set","Questions","Marks","Percentage","Submitted"],...marks.map((entry,index)=>[index+1,entry.studentId,entry.studentName,scopeLabel(normalizedScope(entry.scope)),entry.questionIds.join(" | "),entry.score,`${entry.percentage}%`,entry.submittedLabel])];
  const csv=rows.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(",")).join("\n");
  const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));link.download="heat-exchanger-quiz-marks.csv";link.click();URL.revokeObjectURL(link.href);
});

renderRegister();

// Teacher-only controls for this device. Passwords are stored as SHA-256 hashes.
const teacherDialog=document.querySelector("#teacherDialog");
const teacherLoginPanel=document.querySelector("#teacherLoginPanel");
const teacherAdminPanel=document.querySelector("#teacherAdminPanel");
function passwordHash(){return localStorage.getItem(PASSWORD_KEY)||DEFAULT_PASSWORD_HASH}
async function hashText(value){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
}
function lockTeacherControls(){teacherAdminPanel.hidden=true;teacherLoginPanel.hidden=false;document.querySelector("#teacherPassword").value=""}
document.querySelector("#teacherTools").addEventListener("click",()=>{lockTeacherControls();teacherDialog.showModal();document.querySelector("#teacherPassword").focus()});
document.querySelector("#teacherLock").addEventListener("click",lockTeacherControls);
document.querySelector("#teacherLogin").addEventListener("click",async()=>{
  const message=document.querySelector("#teacherAuthMessage");
  if(await hashText(document.querySelector("#teacherPassword").value)!==passwordHash()){message.textContent="Incorrect teacher password.";return}
  message.textContent="";teacherLoginPanel.hidden=true;teacherAdminPanel.hidden=false;
});
document.querySelector("#resetQuizRecords").addEventListener("click",()=>{
  const scope=document.querySelector("#resetScope").value;
  const current=loadMarks();
  const next=scope==="all"?[]:current.filter(entry=>normalizedScope(entry.scope)!==scope);
  const removed=current.length-next.length;
  const label=scope==="all"?"all quiz records":`${scopeLabel(scope).toLowerCase()} records`;
  if(!removed){document.querySelector("#resetQuizMessage").textContent=`No ${label} were found.`;return}
  if(!window.confirm(`Reset ${removed} ${label}? This cannot be undone.`)) return;
  saveMarks(next);renderRegister();
  document.querySelector("#resetQuizMessage").textContent=`${removed} ${removed===1?"record":"records"} removed successfully.`;
});
document.querySelector("#changePassword").addEventListener("click",async()=>{
  const message=document.querySelector("#passwordMessage");
  const oldValue=document.querySelector("#oldPassword").value;
  const newValue=document.querySelector("#newPassword").value;
  const confirmed=document.querySelector("#confirmPassword").value;
  if(await hashText(oldValue)!==passwordHash()){message.textContent="Current password is incorrect.";return}
  if(newValue.length<10){message.textContent="New password must contain at least 10 characters.";return}
  if(newValue!==confirmed){message.textContent="New password and confirmation do not match.";return}
  localStorage.setItem(PASSWORD_KEY,await hashText(newValue));
  document.querySelector("#oldPassword").value="";document.querySelector("#newPassword").value="";document.querySelector("#confirmPassword").value="";
  message.textContent="Teacher password updated successfully on this device.";
});
