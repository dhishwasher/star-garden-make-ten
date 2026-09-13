(function(){
  const STORAGE_KEY='star-garden-make-ten-v1';
  const state={
    screen:'home',
    scaffold:'more',
    buildTarget:4,
    buildFilled:0,
    bondStart:7,
    bondAdded:0,
    bondIndex:0,
    bonds:[0,5,3,8,2],
    storyIndex:0,
    storyDone:{},
    stories:[
      {id:'s1',text:'3 fireflies sit on a leaf. 2 more land. How many now?',start:3,delta:2,op:'+',answer:5},
      {id:'s2',text:'A nest has 6 eggs. 1 hatches and leaves. How many eggs stay?',start:6,delta:1,op:'-',answer:5},
      {id:'s3',text:'You pick 4 berries. A friend gives 4 more. How many berries?',start:4,delta:4,op:'+',answer:8},
      {id:'s4',text:'9 seeds are in a pouch. You plant 3. How many seeds are left?',start:9,delta:3,op:'-',answer:6},
      {id:'s5',text:'1 snail. 0 friends join. How many snails?',start:1,delta:0,op:'+',answer:1},
      {id:'s6',text:'10 petals on a flower. Wind takes 5. How many petals remain?',start:10,delta:5,op:'-',answer:5},
      {id:'final',text:'Fresh mix: Start with 8 stars. Add enough to make 10. How many did you add?',start:8,delta:2,op:'+',answer:2,bond:true}
    ]
  };

  function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({scaffold:state.scaffold,screen:state.screen,bondIndex:state.bondIndex,storyIndex:state.storyIndex,storyDone:state.storyDone})); }catch(e){} }
  function load(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return;
      const d=JSON.parse(raw);
      if(d.scaffold) state.scaffold=d.scaffold;
      if(d.screen) state.screen=d.screen;
      if(typeof d.bondIndex==='number') state.bondIndex=d.bondIndex;
      if(typeof d.storyIndex==='number') state.storyIndex=d.storyIndex;
      if(d.storyDone) state.storyDone=d.storyDone;
    }catch(e){}
  }

  // Domain helpers (also covered by tests/domain.mjs)
  function clampCount(n){ n=Number(n); if(!Number.isFinite(n)||n<0) return 0; if(n>10) return 10; return Math.floor(n); }
  function addWithinTen(a,b){ return clampCount(clampCount(a)+clampCount(b)); }
  function subWithinTen(a,b){ a=clampCount(a); b=clampCount(b); return a>=b?a-b:a; }
  function makeTenNeed(start){ start=clampCount(start); return 10-start; }
  window.MakeTenDomain={clampCount,addWithinTen,subWithinTen,makeTenNeed};

  const view=document.getElementById('view');
  const progress=document.getElementById('progress');
  document.getElementById('scaffold').value=state.scaffold;
  document.getElementById('scaffold').addEventListener('change',e=>{state.scaffold=e.target.value;save();render();});
  document.getElementById('resetAll').addEventListener('click',()=>{
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state,{screen:'home',buildTarget:4,buildFilled:0,bondStart:7,bondAdded:0,bondIndex:0,storyIndex:0,storyDone:{}});
    render();
  });
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>{state.screen=btn.getAttribute('data-go');save();render();}));

  function setProgress(){
    const order=['home','build','bond','story','summary'];
    const idx=order.indexOf(state.screen);
    progress.innerHTML=order.map((_,i)=>`<span class="dot ${i<=idx?'on':''}"></span>`).join('');
  }

  function tenFrame(filled, onToggle){
    const cells=[];
    for(let i=0;i<10;i++){
      const on=i<filled;
      cells.push(`<button type="button" class="slot ${on?'filled':''}" aria-label="Slot ${i+1} ${on?'filled':'empty'}" data-i="${i}">${on?'★':''}</button>`);
    }
    setTimeout(()=>{
      view.querySelectorAll('.slot').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const i=Number(btn.dataset.i);
          // toggle fill up to clicked+1 semantics: click empty fills through that index; click filled trims
          if(i<filled) onToggle(i); else onToggle(i+1);
        });
      });
    },0);
    return `<div class="tenframe" role="group" aria-label="Ten frame">${cells.join('')}</div>
      <p class="muted">Tap a slot to set how many stars. Each slot holds at most one star.</p>`;
  }

  function speakHint(msg){
    if(state.scaffold==='more') return `<p class="muted">${msg}</p>`;
    return '';
  }

  function renderHome(){
    view.innerHTML=`<h2>Welcome to Star Garden</h2>
      <p>We will practice numbers from <strong>0</strong> to <strong>10</strong> with stars on a ten-frame.</p>
      <ol>
        <li>Build a number</li>
        <li>Make ten from two parts</li>
        <li>Solve short star stories</li>
      </ol>
      <button type="button" class="primary" id="goBuild">Start building</button>`;
    view.querySelector('#goBuild').onclick=()=>{state.screen='build'; state.buildTarget=Math.floor(Math.random()*11); state.buildFilled=0; save(); render();};
  }

  function renderBuild(){
    const t=state.buildTarget; const f=state.buildFilled;
    const ok=f===t;
    view.innerHTML=`<h2>1. Build a quantity</h2>
      <p>Make this many stars: <span class="big" aria-label="Target ${t}">${t}</span></p>
      ${tenFrame(f,(n)=>{state.buildFilled=clampCount(n); render();})}
      <p class="eq">Numeral ${t} · Stars ${f}</p>
      <p class="feedback ${ok?'ok':'bad'}" id="fb">${ok?'Yes — numeral and quantity match.':'Not yet. Count the stars, then empty spaces.'}</p>
      ${speakHint(ok?'':'Try filling empty slots one by one until the count matches the big number.')}
      <div class="row">
        <button type="button" id="newTarget">New target</button>
        <button type="button" id="clear">Clear frame</button>
        <button type="button" class="primary" id="toBond" ${ok?'':'disabled'}>Next: Make ten</button>
      </div>`;
    view.querySelector('#newTarget').onclick=()=>{state.buildTarget=Math.floor(Math.random()*11); state.buildFilled=0; render();};
    view.querySelector('#clear').onclick=()=>{state.buildFilled=0; render();};
    view.querySelector('#toBond').onclick=()=>{state.screen='bond'; state.bondIndex=0; beginBond(); save(); render();};
  }

  function beginBond(){
    const start=state.bonds[state.bondIndex % state.bonds.length];
    state.bondStart=start; state.bondAdded=0;
  }

  function renderBond(){
    const start=state.bondStart; const added=state.bondAdded; const total=addWithinTen(start,added); const need=makeTenNeed(start);
    const ok=total===10 && added===need;
    view.innerHTML=`<h2>2. Make ten</h2>
      <p>You start with <span class="big">${start}</span> stars. Add more to make <strong>10</strong>.</p>
      ${tenFrame(total,(n)=>{
        // interpret n as desired total; added = total-start, non-negative
        const desired=clampCount(n);
        state.bondAdded=desired>=start?desired-start:0;
        render();
      })}
      <p class="eq">${start} + ${added} = ${total}</p>
      <p class="feedback ${ok?'ok':'bad'}">${ok?`Nice — ${start}+${added}=10.`:`Keep going. Empty spaces left: ${10-total}.`}</p>
      ${speakHint(`A number bond for ten: ${start} and ${need} make 10.`)}
      <div class="row">
        <button type="button" id="bondReset">Reset parts</button>
        <button type="button" id="bondNext" class="primary" ${ok?'':'disabled'}>Next bond</button>
        <button type="button" id="toStory" ${ok?'':'disabled'}>Go to stories</button>
      </div>
      <p class="muted">Bonds in this lesson include 0+10 and 5+5 among others.</p>`;
    view.querySelector('#bondReset').onclick=()=>{state.bondAdded=0; render();};
    view.querySelector('#bondNext').onclick=()=>{
      if(state.bondIndex < state.bonds.length-1){ state.bondIndex++; beginBond(); save(); render(); }
      else { state.screen='story'; save(); render(); }
    };
    view.querySelector('#toStory').onclick=()=>{state.screen='story'; save(); render();};
  }

  function renderStory(){
    const s=state.stories[Math.min(state.storyIndex, state.stories.length-1)];
    const filled = state._storyFill ?? s.start;
    const expected = s.bond ? makeTenNeed(s.start) : s.answer;
    // For bond final: learner sets how many ADDED; for others set result quantity
    let checkVal, label;
    if(s.bond){
      checkVal = Math.max(0, filled - s.start);
      label = `Added ${checkVal}`;
    } else {
      checkVal = filled;
      label = `Now ${filled}`;
    }
    const ok = checkVal === expected;
    const eq = s.bond ? `${s.start} + ? = 10` : (s.op==='+' ? `${s.start} + ${s.delta} = ?` : `${s.start} − ${s.delta} = ?`);
    view.innerHTML=`<h2>3. Star stories</h2>
      <p>${s.text}</p>
      <p class="eq" aria-label="Equation model">${eq}</p>
      ${tenFrame(filled,(n)=>{state._storyFill=clampCount(n); render();})}
      <p>${label}</p>
      <p class="feedback ${ok?'ok':'bad'}">${ok?'That matches the story.':'Not yet. Use the picture: count what you have.'}</p>
      ${speakHint(s.op==='-' ? 'Take stars away by tapping a lower slot.' : 'Add stars by tapping a higher slot.')}
      <div class="row">
        <button type="button" id="storyReset">Reset picture</button>
        <button type="button" id="storyHint">Hint</button>
        <button type="button" class="ok" id="storyNext" ${ok?'':'disabled'}>${state.storyIndex>=state.stories.length-1?'Finish':'Next story'}</button>
      </div>
      <p class="muted">Story ${state.storyIndex+1} of ${state.stories.length}</p>
      <div id="hintBox"></div>`;
    view.querySelector('#storyReset').onclick=()=>{state._storyFill=s.start; render();};
    view.querySelector('#storyHint').onclick=()=>{
      const box=view.querySelector('#hintBox');
      if(s.bond) box.textContent=`Count empty spaces from ${s.start} to 10.`;
      else if(s.op==='+') box.textContent=`Start at ${s.start}, count on ${s.delta} more.`;
      else box.textContent=`Start at ${s.start}, count back ${s.delta}.`;
    };
    view.querySelector('#storyNext').onclick=()=>{
      state.storyDone[s.id]=true; state._storyFill=undefined;
      if(state.storyIndex>=state.stories.length-1){ state.screen='summary'; }
      else { state.storyIndex++; const ns=state.stories[state.storyIndex]; state._storyFill=ns.start; }
      save(); render();
    };
    if(state._storyFill===undefined){ state._storyFill=s.start; }
  }

  function renderSummary(){
    const done=Object.keys(state.storyDone).length;
    view.innerHTML=`<h2>You tended the Star Garden</h2>
      <p>You practiced matching numbers to stars, making ten, and solving stories.</p>
      <p>Stories completed this visit: <strong>${done}</strong>.</p>
      <p><strong>Next practice idea (offline):</strong> with ten buttons or pebbles, make pairs that add to ten (0+10, 1+9, …, 5+5).</p>
      <div class="row">
        <button type="button" class="primary" id="replay">Replay lesson</button>
      </div>`;
    view.querySelector('#replay').onclick=()=>{state.screen='home'; state.storyIndex=0; state.bondIndex=0; state.storyDone={}; state._storyFill=undefined; save(); render();};
  }

  function render(){
    setProgress();
    document.getElementById('scaffold').value=state.scaffold;
    if(state.screen==='home') renderHome();
    else if(state.screen==='build') renderBuild();
    else if(state.screen==='bond') renderBond();
    else if(state.screen==='story') renderStory();
    else renderSummary();
    save();
  }

  load();
  // ensure bond starts coherent
  if(state.screen==='bond') beginBond();
  render();
})();
