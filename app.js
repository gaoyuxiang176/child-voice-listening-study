"use strict";
const $ = id => document.getElementById(id);
const K = "childvoice_pilot_session_v1";
const CONFIG = window.STUDY_CONFIG || {endpoint:"",studyVersion:"pilot-v1"};
let stimuli = null;
let state = null;

function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function rndId(){ if(window.crypto?.randomUUID) return crypto.randomUUID(); return 'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2); }
function shuffle(xs){const a=xs.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function saved(){try {return JSON.parse(sessionStorage.getItem(K));} catch(e) {return null;} }
function persist(){try{sessionStorage.setItem(K, JSON.stringify(state));}catch(e){}}
function currentDone(){return state.answers.emotion.length+state.answers.pairs.length+state.answers.profiles.length;}
function totalCount(){return stimuli.emotions.length+stimuli.pairs.length+stimuli.profiles.length;}
function setProgress(){
 const phase=state.phase, active=["emotion","pairs","profiles","intro-pairs","intro-profiles","final","done"].includes(phase);
 $("progress-shell").hidden=!active;
 const done=currentDone(), total=totalCount();
 $("progress-fill").style.width=`${Math.round(done/total*100)}%`;
 $("progress-text").textContent=`${done} of ${total} responses`;
 $("section-label").textContent=phase.includes("pair")?"Part B · Speaker consistency":phase.includes("profile")?"Part C · Voice characteristics":phase==="final"||phase==="done"?"Review & submit":"Part A · Emotions & quality";
 $("progress-track").setAttribute("aria-valuemax",String(total));
 $("progress-track").setAttribute("aria-valuenow",String(done));
}
function panel(x){$("stage").innerHTML=`<div class="panel">${x}</div>`;window.scrollTo(0,0);}
function pickRating(name, title, min, max){
 const radios=[1,2,3,4,5].map(n=>`<label><input type="radio" name="${name}" value="${n}"/><span>${n}</span></label>`).join("");
 return `<div class="question"><div class="question-title">${title}</div><div class="scale" role="radiogroup" aria-label="${title}">${radios}</div><div class="scale-ends"><span>1 — ${min}</span><span>5 — ${max}</span></div></div>`;
}
function selected(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||"";}
function audio(src,label){return `<div class="audio-card"><h3>${label}</h3><audio controls preload="none" src="${esc(src)}" aria-label="${esc(label)}"></audio><div class="small muted">You may replay this recording.</div></div>`;}
function nextButton(label="Save & continue"){return `<p class="error" id="error" role="alert"></p><div class="actions"><button class="button" id="next">${label} →</button></div>`;}
function showError(text){$("error").textContent=text;}
function renderConsent(){
 panel(`<span class="pill">BEFORE YOU BEGIN</span><h2>Invitation & informed consent</h2>
 <p class="hero">We are exploring whether AI-generated Dutch child-like voices are convincing enough to support the next stage of a virtual classroom research project.</p>
 <div class="consent-list">
 <p><strong>Purpose.</strong> This is an <strong>internal feasibility evaluation</strong> to help us decide whether the current research direction is promising and which aspects need improvement. It is not an assessment of your performance.</p>
 <p><strong>What you will do.</strong> Listen to synthetic speech recordings, provide simple 1–5 ratings of the voice, compare pairs, estimate age and perceived voice gender, and optionally leave comments. The audio is synthetic, developed using real child speech references.</p>
 <p><strong>Choice.</strong> Participation is voluntary. You may stop at any time before final submission by closing the page, without explanation or disadvantage. You may replay the recordings. There are no right or wrong answers.</p>
 <p><strong>Data.</strong> We do not request your name or email. Your ratings, comments, an automatically assigned anonymous response code and submission time will be sent to a project research spreadsheet if online submission is configured. Avoid identifying yourself or anyone else in comments. Web hosting and spreadsheet providers may process technical access data.</p>
 <p><strong>Use and access.</strong> Responses are intended only for internal evaluation and deciding the next research steps, accessible to the research team. The recordings are not for redistribution. The study is not intended as a public release of synthetic child voices.</p>
 </div>
 <div class="form-line"><input type="checkbox" id="consent"/><label for="consent"><strong>I have read the information above and voluntarily agree to take part in this internal listening evaluation.</strong></label></div>
 <div class="actions"><button id="consent-continue" class="button" disabled>I agree · Continue →</button><button id="decline" class="button secondary">I do not agree</button></div>`);
 $("consent").addEventListener("change",e=>$("consent-continue").disabled=!e.target.checked);
 $("decline").addEventListener("click",()=>panel(`<h2>Thank you</h2><p>No responses have been submitted. You may close this page.</p>`));
 $("consent-continue").addEventListener("click",()=>{
   state={phase:"intro",consent:true,anon_id:rndId(),submission_id:rndId(),created_at:new Date().toISOString(),language:"",order:{emotion:shuffle(stimuli.emotions.map(x=>x.id)),pairs:shuffle(stimuli.pairs.map(x=>x.id)),profiles:shuffle(stimuli.profiles.map(x=>x.id))},answers:{emotion:[],pairs:[],profiles:[]},overall:""};
   persist(); render();
 });
}
function intro(title,text,nextPhase,sectionLabel){
 panel(`<span class="pill">${esc(sectionLabel)}</span><h2>${title}</h2>${text}
 <div class="actions"><button class="button" id="start">Begin this section →</button></div>`);
 $("start").addEventListener("click",()=>{state.phase=nextPhase;persist();render();});
}
function renderIntro(){
 panel(`<span class="pill">HOW TO TAKE PART</span><h2>You're ready to begin</h2>
 <p class="hero">Thank you. You will complete three short sections:</p>
 <div class="study-meta"><span><strong>Part A</strong> · ${stimuli.emotions.length} recordings</span><span><strong>Part B</strong> · ${stimuli.pairs.length} voice pairs</span><span><strong>Part C</strong> · ${stimuli.profiles.length} age/gender judgments</span></div>
 <h3>What to listen for</h3>
 <p><strong>Emotion:</strong> How strongly does the <em>voice</em> express the emotion shown on the screen? Please judge the delivery, not only the words.</p>
 <p><strong>Naturalness:</strong> Does the speech sound like something a person would actually say, with a plausible rhythm, breathing and pronunciation?</p>
 <p><strong>Child-likeness:</strong> Does the voice sound like a real child rather than an adult or an exaggerated cartoon character?</p>
 <p class="hint">You can listen more than once. Use headphones if available. Every recording gets its own rating; there are no correct answers.</p>
 <div class="question"><label class="question-title" for="dutch-language">Optional: How comfortable are you understanding spoken Dutch?</label><select class="select-box" id="dutch-language">
 <option value="">Prefer not to say</option><option value="fluent">Native or fluent</option><option value="intermediate">Intermediate</option><option value="basic">Basic or little Dutch</option></select></div>
 <div class="actions"><button class="button" id="start">Start listening →</button></div>`);
 $("dutch-language").value=state.language||"";
 $("start").addEventListener("click",()=>{state.language=$("dutch-language").value;state.phase="emotion";persist();render();});
}
function renderEmotion(){
 const i=state.answers.emotion.length, id=state.order.emotion[i];
 if(!id){state.phase="intro-pairs";persist();render();return;}
 const clip=stimuli.emotions.find(x=>x.id===id);
 panel(`<span class="pill">PART A · RECORDING ${i+1} OF ${stimuli.emotions.length}</span>
 <h2>Emotion & voice quality</h2>
 ${audio(clip.audio,"Recording "+(i+1))}
 <p class="hint">The target is <strong>${esc(clip.emotion)}</strong>. Focus on <strong>how the speaker sounds</strong>, rather than just the meaning of the sentence.</p>
 ${pickRating("emotion",`How well does this voice express ${esc(clip.emotion.toLowerCase())}?`,"Not at all","Very convincingly")}
 ${pickRating("naturalness","How natural does the speech sound?","Very artificial","Very natural")}
 ${pickRating("childlikeness","How much does the voice sound like a real child?","Not child-like","Clearly child-like")}
 <div class="question"><label for="notes" class="question-title">Optional comments</label><textarea id="notes" class="note-field" maxlength="400" placeholder="e.g. natural hesitation, sounds too old, emotion is weak, pronunciation issue…"></textarea></div>
 ${nextButton()}`);
 $("next").addEventListener("click",()=>{
   const a=selected("emotion"),b=selected("naturalness"),c=selected("childlikeness");
   if(!a||!b||!c){showError("Please select 1–5 for all three ratings.");return;}
   state.answers.emotion.push({section:"emotion",trial_id:id,order:i+1,emotion_rating:Number(a),naturalness:Number(b),child_likeness:Number(c),comments:$("notes").value.trim()});
   persist();render();
 });
}
function renderPairs(){
 const i=state.answers.pairs.length,id=state.order.pairs[i];
 if(!id){state.phase="intro-profiles";persist();render();return;}
 const pair=stimuli.pairs.find(x=>x.id===id);
 panel(`<span class="pill">PART B · PAIR ${i+1} OF ${stimuli.pairs.length}</span>
 <h2>Do these voices sound like the same child?</h2>
 <p class="muted">Listen to both recordings. The words and emotion may differ; focus on the characteristics of the speaker's voice.</p>
 <div class="audio-pair">${audio(pair.audio_a,"Recording A")}${audio(pair.audio_b,"Recording B")}</div>
 ${pickRating("similarity","How likely are these two recordings to be from the same child?","Definitely different","Definitely the same")}
 <div class="question"><label class="question-title" for="notes">Optional comments</label><textarea id="notes" maxlength="400" class="note-field" placeholder="e.g. similar pitch but different accents, clearly same voice…"></textarea></div>
 ${nextButton()}`);
 $("next").addEventListener("click",()=>{
  const s=selected("similarity");if(!s){showError("Please select a similarity rating.");return;}
  state.answers.pairs.push({section:"pair",trial_id:id,order:i+1,same_speaker_rating:Number(s),comments:$("notes").value.trim()});persist();render();
 });
}
function renderProfiles(){
 const i=state.answers.profiles.length,id=state.order.profiles[i];
 if(!id){state.phase="final";persist();render();return;}
 const p=stimuli.profiles.find(x=>x.id===id);
 panel(`<span class="pill">PART C · VOICE ${i+1} OF ${stimuli.profiles.length}</span><h2>How would you describe this voice?</h2>
 ${audio(p.audio,"Voice sample "+(i+1))}
 <p class="hint">Please estimate the <em>perceived</em> age and gender of the voice. You do not need to identify a real person, and it is fine to choose “Not sure”.</p>
 <div class="question"><label class="question-title" for="age">How old does this speaker sound?</label><select class="select-box" id="age">
 <option value="">Select one</option><option value="3-4">3–4 years</option><option value="5-6">5–6 years</option><option value="7-8">7–8 years</option><option value="9-10">9–10 years</option><option value="11-15">11–15 years</option><option value="adult">Adult</option><option value="unsure">Not sure</option></select></div>
 <div class="question"><label class="question-title" for="gender">How does the voice sound to you?</label><select class="select-box" id="gender"><option value="">Select one</option><option value="boy-like">Boy-like</option><option value="girl-like">Girl-like</option><option value="ambiguous">Ambiguous / not sure</option></select></div>
 <div class="question"><label class="question-title" for="notes">Optional comments</label><textarea id="notes" class="note-field" maxlength="400" placeholder="e.g. sounds around six, unusually deep, young-sounding…"></textarea></div>
 ${nextButton()}`);
 $("next").addEventListener("click",()=>{
  const a=$("age").value,g=$("gender").value;if(!a||!g){showError("Please choose an age range and a perceived voice gender.");return;}
  state.answers.profiles.push({section:"profile",trial_id:id,order:i+1,perceived_age:a,perceived_gender:g,comments:$("notes").value.trim()});persist();render();
 });
}
function renderFinal(){
 panel(`<span class="pill">ALL LISTENING TASKS COMPLETE</span><h2>Your final feedback</h2>
 <p>You've completed <strong>${totalCount()} judgments</strong>. Thank you for helping us decide how to develop the synthetic voices for the next research stage.</p>
 <div class="question"><label class="question-title" for="overall">Anything else we should know? (optional)</label><textarea id="overall" class="note-field" maxlength="1500" placeholder="e.g. the voices sound natural but some emotions are subtle; one voice sounds noticeably older…"></textarea></div>
 <p class="muted small">Your anonymous response code is <span class="endcode">${esc(state.anon_id)}</span>. You may keep this code if you need to refer to your submission to the research team.</p>
 <div class="actions"><button class="button" id="submit">Submit evaluation</button><button class="button secondary" id="download">Download CSV backup</button></div>
 <p id="status" class="muted small" role="status"></p>`);
 $("overall").value=state.overall||"";
 $("overall").addEventListener("input",e=>{state.overall=e.target.value;persist();});
 $("download").addEventListener("click",downloadCSV);
 $("submit").addEventListener("click",submitResults);
}
function buildPayload(){
 return {study_version:CONFIG.studyVersion,anonymous_id:state.anon_id,submission_id:state.submission_id,consent:true,submitted_at:new Date().toISOString(),dutch_familiarity:state.language||"prefer-not-to-say",answers:state.answers,overall_comments:state.overall||""};
}
function downloadCSV(){
 const p=buildPayload(), header=["study_version","anonymous_id","submission_id","dutch_familiarity","section","trial_id","order","emotion_rating","naturalness","child_likeness","same_speaker_rating","perceived_age","perceived_gender","comments"];
 const rows=[header];
 for(const section of ["emotion","pairs","profiles"]) for(const r of state.answers[section]) rows.push(header.map(k=>({study_version:p.study_version,anonymous_id:p.anonymous_id,submission_id:p.submission_id,dutch_familiarity:p.dutch_familiarity,...r})[k]??""));
 rows.push(header.map(k=>k==="section"?"overall":k==="comments"?p.overall_comments:k==="anonymous_id"?p.anonymous_id:k==="submission_id"?p.submission_id:""));
 const escCsv=v=>'"'+String(v).replace(/"/g,'""')+'"';
 const blob=new Blob(["\ufeff"+rows.map(r=>r.map(escCsv).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`child_voice_pilot_${state.anon_id.slice(0,8)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function receiptCheck(endpoint,submissionId){
 return new Promise((resolve,reject)=>{
  const name="__receipt_"+Math.random().toString(36).slice(2),tag=document.createElement("script");
  let settled=false;
  const finish=(value,error)=>{if(settled)return;settled=true;clearTimeout(timer);tag.remove();delete window[name];if(error)reject(error);else resolve(value);};
  window[name]=v=>finish(Boolean(v&&v.found));
  tag.onerror=()=>finish(false,new Error("Receipt confirmation unavailable"));
  const timer=setTimeout(()=>finish(false,new Error("Receipt check timed out")),12000);
  tag.src=endpoint+(endpoint.includes("?")?"&":"?")+"receipt="+encodeURIComponent(submissionId)+"&callback="+encodeURIComponent(name);
  document.head.appendChild(tag);
 });
}
async function submitResults(){
 $("submit").disabled=true;$("status").textContent="Submitting…";
 const endpoint=(CONFIG.endpoint||"").trim(),payload=buildPayload();
 if(!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(endpoint)){
  $("status").textContent="Automatic collection is not configured. Please download your CSV backup and give it to the researcher.";
  $("submit").disabled=false;return;
 }
 try{
  await fetch(endpoint,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(payload)});
  let ok=false;
  for(let attempt=0;attempt<4;attempt++){
   await new Promise(r=>setTimeout(r,[700,1300,2400,4000][attempt]));
   try{ if(await receiptCheck(endpoint,payload.submission_id)){ok=true;break;} }catch(e){}
  }
  if(!ok)throw new Error("Response receipt not confirmed");
  state.phase="done";persist();render();
 }catch(e){$("status").textContent="We could not confirm the online submission. Please save your CSV backup and send it to the researcher. You can also retry submitting.";$("submit").disabled=false;}
}
function renderDone(){
 panel(`<span class="pill">SUBMISSION CONFIRMED</span><h2>Thank you for your evaluation</h2>
 <p class="success"><strong>Your responses were confirmed saved.</strong> We appreciate your contribution to our internal research feasibility assessment.</p>
 <p class="small muted">Anonymous response code: <span class="endcode">${esc(state.anon_id)}</span></p>
 <div class="actions"><button class="button secondary" id="download">Download personal CSV copy</button></div>`);
 $("download").addEventListener("click",downloadCSV);
}
function render(){if(!state){$("progress-shell").hidden=true;renderConsent();return;}setProgress();switch(state?.phase){
 case "intro":renderIntro();break;
 case "emotion":renderEmotion();break;
 case "intro-pairs":intro("Speaker consistency","<p>Next, you will hear pairs of recordings. Rate how likely they are to be the <strong>same child's voice</strong>, even when the words or style are different.</p><p>1 = definitely two different children; 5 = definitely the same child. The pairs may be either the same or different speakers.</p>","pairs","PART B · 8 PAIRS");break;
 case "pairs":renderPairs();break;
 case "intro-profiles":intro("Age and voice gender","<p>Finally, you will hear four voice samples. Estimate the age group and whether each voice sounds boy-like, girl-like or ambiguous.</p><p>Judge only what you hear. We do not ask you to identify the original speakers.</p>","profiles","PART C · 4 VOICES");break;
 case "profiles":renderProfiles();break;
 case "final":renderFinal();break;
 case "done":renderDone();break;
 default:renderConsent();
}}
async function init(){
 try{
  const r=await fetch("stimuli.json",{cache:"no-cache"});if(!r.ok)throw new Error("Stimuli not found");
  stimuli=await r.json();
  if(!stimuli.emotions?.length||!stimuli.pairs?.length||!stimuli.profiles?.length)throw new Error("Incomplete trial data");
  state=saved();
  if(state && (!state.consent||!state.answers||state.order.emotion.length!==stimuli.emotions.length)) state=null;
  render();
 }catch(e){panel(`<h2>Listening files not available</h2><p>Unable to load the study data. If you're testing locally, open the site through a local web server rather than by double-clicking index.html.</p><p class="small muted">${esc(e.message)}</p>`);}
}
init();
