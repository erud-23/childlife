const STORE_KEY = "childLifeStudyLab_v1";
let state = loadState();
let session = null;
let flash = {items:[],index:0,back:false};
const $ = id => document.getElementById(id);

function blankRecord(){return {attempts:0,correct:0,streak:0,misses:0,mastered:false,due:0,lastSeen:0};}
function loadState(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||{records:{},totalAnswered:0,totalCorrect:0,sessions:0};}catch(e){return {records:{},totalAnswered:0,totalCorrect:0,sessions:0};}}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state));renderDashboard();}
function rec(id){if(!state.records[id])state.records[id]=blankRecord();return state.records[id];}
function shuffle(a){let x=[...a];for(let i=x.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function unique(a){return [...new Set(a)];}
function renderDashboard(){
 let pct=state.totalAnswered?Math.round(100*state.totalCorrect/state.totalAnswered):0;
 $("overallMetric").textContent=state.totalAnswered?pct+"%":"—";
 const queue=BANK.filter(q=>{let r=rec(q.id);return !r.mastered&&(r.misses>0||r.attempts>0);});
 $("dueMetric").textContent=queue.length;
 $("masteredMetric").textContent=BANK.filter(q=>rec(q.id).mastered).length+" / "+BANK.length;
 const topics=unique(BANK.map(q=>q.topic));
 $("topicSelect").innerHTML=topics.map(t=>`<option>${esc(t)}</option>`).join("");
 $("topicProgress").innerHTML=topics.map(t=>{
   let qs=BANK.filter(q=>q.topic===t), mastered=qs.filter(q=>rec(q.id).mastered).length;
   let tried=qs.filter(q=>rec(q.id).attempts>0).length;
   return `<div class="topicrow"><div style="flex:1"><strong>${esc(t)}</strong><div class="muted" style="font-size:.82rem">${tried}/${qs.length} attempted · ${mastered} mastered</div><div class="bar"><div style="width:${100*mastered/qs.length}%"></div></div></div><strong>${Math.round(100*mastered/qs.length)}%</strong></div>`;
 }).join("");
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function show(id){
 const views=["home","practiceView","progressView","quizView","resultsView","flashView"];
 views.forEach(v=>{const el=$(v);if(el)el.classList.toggle("hidden",v!==id);});
 const activeNav=({quizView:"practiceView",resultsView:"practiceView"})[id]||id;
 document.querySelectorAll(".site-nav [data-view]").forEach(link=>link.classList.toggle("active",link.dataset.view===activeNav));
 window.scrollTo({top:0,behavior:"smooth"});
}
function goHome(){if(session&&!session.finished){if(!confirm("Leave this session? Answers already submitted will remain saved."))return;clearInterval(session.interval);session=null;}show("home");renderDashboard();}
function startQuiz(mode){
 let candidates=BANK;
 if(mode==="topic")candidates=BANK.filter(q=>q.topic===$("topicSelect").value);
 if(mode==="review"){
   let weak=BANK.filter(q=>{let r=rec(q.id);return !r.mastered&&(r.misses>0||r.attempts>0);});
   candidates=weak.length?weak:BANK.filter(q=>!rec(q.id).mastered);
   if(!candidates.length)candidates=BANK;
 } else {
   // Prefer unseen questions; repeat previously answered questions early only when the learner has struggled with them.
   const unseen=candidates.filter(q=>rec(q.id).attempts===0);
   const struggled=candidates.filter(q=>{let r=rec(q.id);return r.misses>0&&!r.mastered;});
   const preferred=[...unseen,...struggled.filter(q=>!unseen.some(u=>u.id===q.id))];
   candidates=preferred.length?preferred:candidates.filter(q=>!rec(q.id).mastered);
   if(!candidates.length)candidates=BANK;
 }
 const n=mode==="exam"?Math.min(150,candidates.length):mode==="quick"?10:Math.min(10,Math.max(1,candidates.length));
 let ordered;
 if(mode==="review"){
   ordered=shuffle(candidates).sort((a,b)=>{
    const ra=rec(a.id), rb=rec(b.id);
    return (rb.misses*3+(rb.attempts-rb.correct))-(ra.misses*3+(ra.attempts-ra.correct));
   }).slice(0,n);
 } else {
   // Mix subtopics before filling the quiz so a short session is less likely to repeat the same generic concept template.
   const pool=shuffle(candidates), groups=new Map();
   for(const q of pool){const key=q.topic+"::"+q.subtopic;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
   const buckets=shuffle([...groups.values()]);
   ordered=[];
   while(ordered.length<n&&buckets.length){
     for(let i=buckets.length-1;i>=0;i--){if(buckets[i].length)ordered.push(buckets[i].shift());if(!buckets[i].length)buckets.splice(i,1);}
   }
   ordered=ordered.slice(0,n);
 }
 session={mode,items:ordered,index:0,correct:0,answered:0,results:[],finished:false,seconds:mode==="exam"?14400:mode==="quick"?300:null,started:Date.now()};
 $("modePill").textContent=mode==="exam"?"Full exam simulation":mode==="quick"?"5-minute practice":mode==="review"?"Review weak areas":"Topic practice";
 $("timer").textContent=mode==="quick"?"05:00":"Untimed";
 $("timer").classList.toggle("hidden",mode!=="quick");
 $("nextBtn").disabled=true;show("quizView");renderQuestion();
 if(session.seconds!==null)session.interval=setInterval(tick,1000);
}
function tick(){if(!session||session.finished)return;session.seconds--;let total=Math.max(0,session.seconds),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;$("timer").textContent=session.mode==="exam"?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(session.seconds<=0)finishQuiz(true);}
function renderQuestion(){
 const q=session.items[session.index];$("qCounter").textContent=`Question ${session.index+1} of ${session.items.length}`;$("quizProgress").style.width=(session.index/session.items.length*100)+"%";
 $("qTopic").textContent=q.topic+" · "+q.subtopic;$("qDifficulty").textContent=(q.format==="truefalse"?"True / False":q.format==="fillblank"?"Fill in the blank":"Multiple choice")+" · "+q.difficulty;
 $("qText").textContent=q.q;$("feedback").className="hidden";$("feedback").innerHTML="";$("nextBtn").disabled=true;
 $("nextBtn").textContent=session.index===session.items.length-1?"See results →":"Next question →";
 $("choices").innerHTML=shuffle(q.choices.map((text,i)=>({text,orig:i}))).map(c=>`<button class="choice" data-orig="${c.orig}" onclick="answerQuestion(${c.orig})">${esc(c.text)}</button>`).join("");
}
function answerQuestion(idx){
 if(!session||session.results[session.index])return;
 const q=session.items[session.index],correct=idx===q.answer,r=rec(q.id),now=Date.now();
 r.attempts++;r.lastSeen=now;state.totalAnswered++;session.answered++;
 if(correct){r.correct++;r.streak++;r.due=now+(r.streak===1?24:r.streak===2?72:168)*3600000;if(r.streak>=3)r.mastered=true;state.totalCorrect++;session.correct++;}
 else{r.misses++;r.streak=0;r.mastered=false;r.due=now+10*60000;}
 session.results[session.index]={id:q.id,selected:idx,correct};
 [...$("choices").querySelectorAll("button")].forEach(btn=>{const i=Number(btn.dataset.orig);btn.disabled=true;if(session.mode!=="exam"){if(i===q.answer)btn.classList.add("correct");if(i===idx&&!correct)btn.classList.add("incorrect");}else if(i===idx)btn.classList.add("selected");});
 const fb=$("feedback");
 if(session.mode==="exam"){fb.className="hidden";fb.innerHTML="";}
 else{fb.className="feedback "+(correct?"good":"bad");fb.innerHTML=`<strong>${correct?"Correct!":"Not quite."}</strong><p>${esc(q.explanation)}</p><p class="muted" style="font-size:.85rem">${correct?(r.mastered?"Mastery reached for this item after repeated correct answers.":"This item remains in review until you build a consistent streak."):"This item has been added to your review queue."}</p>`;}
 $("nextBtn").disabled=false;saveState();
}
function nextQuestion(){if(!session)return;if(!session.results[session.index])return;if(session.index===session.items.length-1){finishQuiz(false);return;}session.index++;renderQuestion();}
function endQuiz(){if(!session)return;if(confirm("End this session and see your results?"))finishQuiz(false);}
function finishQuiz(timeUp){
 if(!session||session.finished)return;session.finished=true;clearInterval(session.interval);
 let s=session, pct=s.answered?Math.round(s.correct/s.answered*100):0;
 state.sessions++;saveState();
 $("resultTitle").textContent=pct>=80&&s.answered>0?"Practice benchmark met!": "Keep building your knowledge";
 $("resultSummary").textContent=`You answered ${s.correct} of ${s.answered} attempted questions correctly (${pct}%). ${timeUp?"The timer ended or the session was stopped. ":""}Your result is a practice indicator, not an official certification result.`;
 $("resultStats").innerHTML=`<span><strong>${pct}%</strong> accuracy</span><span><strong>${s.correct}/${s.answered}</strong> correct</span><span><strong>${s.items.length-s.answered}</strong> not answered</span>`;
 $("answerReview").innerHTML=s.items.map((q,i)=>{let a=s.results[i];return `<div class="topicrow"><div><strong>${i+1}. ${esc(q.q)}</strong><div class="muted">${a?(a.correct?"✓ Correct":"✕ Incorrect"):"Not answered"} · ${esc(q.topic)} · ${esc(q.difficulty)}</div><p><strong>Correct answer:</strong> ${esc(q.choices[q.answer])}</p><p>${esc(q.explanation)}</p></div></div>`;}).join("");
 session=null;show("resultsView");
}
function openFlashcards(){
 flash.items=shuffle(BANK);flash.index=0;flash.back=false;show("flashView");renderFlash();
}
function renderFlash(){if(!flash.items.length)return;let q=flash.items[flash.index];$("flashCounter").textContent=`Card ${flash.index+1} of ${flash.items.length}`;$("flashTopic").textContent=q.topic+" · "+q.subtopic;$("flashText").textContent=flash.back?q.explanation:q.q;$("flashHint").textContent=flash.back?"Answer / explanation · tap to see question":"Tap or click to reveal answer";}
function flipCard(){flash.back=!flash.back;renderFlash();}
function nextCard(){flash.index=(flash.index+1)%flash.items.length;flash.back=false;renderFlash();}
function prevCard(){flash.index=(flash.index-1+flash.items.length)%flash.items.length;flash.back=false;renderFlash();}
function exportData(){const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="child-life-study-progress.json";a.click();URL.revokeObjectURL(a.href);$("dataMessage").textContent="Progress backup exported.";}
function importData(ev){const file=ev.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(!obj.state||!obj.state.records)throw new Error("Invalid backup");if(!confirm("Import and replace the progress currently saved in this browser?"))return;state=obj.state;saveState();$("dataMessage").textContent="Progress backup imported.";}catch(e){$("dataMessage").textContent="Could not import that file. Please choose a valid Study Lab backup.";}ev.target.value="";};reader.readAsText(file);}
function resetProgress(){if(!confirm("Reset all progress stored in this browser? Export a backup first if you want to keep it."))return;state={records:{},totalAnswered:0,totalCorrect:0,sessions:0};saveState();$("dataMessage").textContent="Progress reset.";}
document.addEventListener("keydown",e=>{if(!$("flashView").classList.contains("hidden")&&e.key===" "){e.preventDefault();flipCard();}});
renderDashboard();
