// ── Hold-and-drag reordering ──────────────────────────────────────────────────
// Replaces the old "⋯ → Move up / Move down" one-step-at-a-time shuffle. Press
// and hold anywhere on a card (~350ms) and it lifts; drag it where you want it
// and let go. The ⠿ grip picks a card up instantly (no hold), and also works
// from the keyboard: focus it, then ArrowUp/ArrowDown.
//
// Why Pointer Events *plus* a non-passive touchmove guard: on touch, the
// browser decides at touchstart whether a gesture is a scroll. A long-press
// starts with the finger still, so no scroll has begun yet — preventDefault()
// on the touchmoves that follow keeps the page from scrolling out from under
// the lifted card (and stops the pointercancel a scroll would fire). Before the
// hold completes we do nothing, so a normal swipe still scrolls the page.
//
// Nothing here knows about workouts: the caller gets onReorder(from,to) with
// final indices and re-renders however it likes.

let _sortActive=null; // the one drag in progress, page-wide

document.addEventListener('touchmove',e=>{ if(_sortActive&&_sortActive.dragging) e.preventDefault(); },{passive:false});

function enableSortable(container,opts){
  if(!container) return;
  // Re-renders call this again on the same element — just refresh the options
  // (onReorder closes over the latest state) instead of stacking listeners.
  container._sortOpts={longPressMs:350,...opts};
  if(container._sortBound) return;
  container._sortBound=true;
  container.addEventListener('pointerdown',e=>_sortPointerDown(container,e));
  container.addEventListener('contextmenu',e=>{ if(_sortActive&&_sortActive.container===container) e.preventDefault(); });
  container.addEventListener('keydown',e=>_sortKeydown(container,e));
}

function _sortItems(container){
  const {itemSelector}=container._sortOpts;
  return [...container.children].filter(el=>el.matches(itemSelector));
}

function _sortScroller(el){
  for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
    const oy=getComputedStyle(p).overflowY;
    if((oy==='auto'||oy==='scroll')&&p.scrollHeight>p.clientHeight) return p;
  }
  return window;
}
const _scrollTop=s=>s===window?window.scrollY:s.scrollTop;

function _sortPointerDown(container,e){
  if(_sortActive) return;
  if(e.pointerType==='mouse'&&e.button!==0) return;
  const o=container._sortOpts;
  const item=e.target.closest(o.itemSelector);
  if(!item||!container.contains(item)) return;
  const onHandle=o.handleSelector&&e.target.closest(o.handleSelector);
  // Inputs/buttons keep their normal tap behaviour; only "dead" card surface
  // (or the grip) starts a hold.
  if(!onHandle&&e.target.closest('input,textarea,select,button,a,label,[contenteditable="true"]')) return;

  const st={container,item,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,
            lastY:e.clientY,dragging:false,timer:null};
  _sortActive=st;
  const move=ev=>{ if(ev.pointerId===st.pointerId) _sortMove(st,ev); };
  const up=ev=>{
    if(ev.pointerId!==st.pointerId) return;
    if(st.dragging&&ev.type==='pointerup'){ st.lastY=ev.clientY; _sortLayout(st); }
    finish(ev.type==='pointercancel');
  };
  const finish=cancelled=>{
    clearTimeout(st.timer);
    window.removeEventListener('pointermove',move);
    window.removeEventListener('pointerup',up);
    window.removeEventListener('pointercancel',up);
    item.classList.remove('sort-pressing');
    _sortEnd(st,cancelled);
  };
  window.addEventListener('pointermove',move);
  window.addEventListener('pointerup',up);
  window.addEventListener('pointercancel',up);

  if(onHandle){
    e.preventDefault();
    _sortBegin(st);
  } else {
    item.classList.add('sort-pressing');
    st.timer=setTimeout(()=>{ item.classList.remove('sort-pressing'); _sortBegin(st); },o.longPressMs);
  }
}

function _sortBegin(st){
  const items=_sortItems(st.container);
  st.items=items;
  st.from=st.to=items.indexOf(st.item);
  if(st.from<0){ _sortActive=null; return; }
  st.rects=items.map(el=>{ const r=el.getBoundingClientRect(); return {top:r.top,height:r.height}; });
  // Distance a neighbour slides to fill the gap = lifted card's height plus
  // the gutter between cards (0 for table rows, a few px for flex/grid lists).
  const gaps=st.rects.slice(1).map((r,i)=>r.top-(st.rects[i].top+st.rects[i].height)).filter(g=>g>=0);
  const gap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0;
  st.shift=st.rects[st.from].height+gap;
  st.scroller=_sortScroller(st.container);
  st.startScroll=_scrollTop(st.scroller);
  st.dragging=true;
  st.container.classList.add('sort-active');
  document.body.classList.add('sort-no-select');
  st.item.classList.add('sort-dragging');
  items.forEach(el=>{ if(el!==st.item) el.classList.add('sort-shiftable'); });
  try{ st.item.setPointerCapture(st.pointerId); }catch(_){}
  if(navigator.vibrate) navigator.vibrate(12);
  const tick=()=>{ if(_sortActive!==st||!st.dragging) return; _sortAutoScroll(st); _sortLayout(st); st.raf=requestAnimationFrame(tick); };
  st.raf=requestAnimationFrame(tick);
}

function _sortMove(st,e){
  st.lastY=e.clientY;
  if(!st.dragging){
    // Moved before the hold completed → it's a scroll/swipe, not a pickup.
    if(Math.hypot(e.clientX-st.startX,e.clientY-st.startY)>8){
      clearTimeout(st.timer); st.item.classList.remove('sort-pressing');
      st.cancelledPending=true;
    }
    return;
  }
  e.preventDefault();
  // Lay out on the event itself, not just the next animation frame — on a busy
  // device the release can arrive before that frame, and the card would then
  // drop one slot short of where the finger actually was.
  _sortLayout(st);
}

function _sortAutoScroll(st){
  const edge=56, y=st.lastY;
  let top=0,bottom=window.innerHeight;
  if(st.scroller!==window){ const r=st.scroller.getBoundingClientRect(); top=r.top; bottom=r.bottom; }
  // Only scroll toward an edge you're actually dragging toward: a card picked
  // up near the bottom of the screen in order to move it *up* must not start
  // the page scrolling down underneath it the moment it lifts.
  let dy=0;
  if(y<top+edge&&y<st.startY-10) dy=-Math.ceil((top+edge-y)/4);
  else if(y>bottom-edge&&y>st.startY+10) dy=Math.ceil((y-(bottom-edge))/4);
  if(!dy) return;
  if(st.scroller===window) window.scrollBy(0,dy); else st.scroller.scrollTop+=dy;
}

function _sortLayout(st){
  // Everything is measured once at pickup, in that moment's viewport
  // coordinates; scrolling since then moves every card equally, so it's
  // folded into the drag offset rather than re-measuring layout per frame.
  const dy=(st.lastY-st.startY)+(_scrollTop(st.scroller)-st.startScroll);
  const r=st.rects[st.from];
  const center=r.top+r.height/2+dy;
  let to=st.from;
  for(let i=st.from+1;i<st.rects.length;i++) if(center>st.rects[i].top+st.rects[i].height/2) to=i;
  for(let i=st.from-1;i>=0;i--) if(center<st.rects[i].top+st.rects[i].height/2) to=i;
  st.to=to;
  st.item.style.transform=`translateY(${dy}px)`;
  st.items.forEach((el,i)=>{
    if(i===st.from) return;
    const off=(i>st.from&&i<=to)?-st.shift:(i<st.from&&i>=to)?st.shift:0;
    el.style.transform=off?`translateY(${off}px)`:'';
  });
}

function _sortEnd(st,cancelled){
  _sortActive=null;
  if(!st.dragging) return;
  cancelAnimationFrame(st.raf);
  st.dragging=false;
  st.container.classList.remove('sort-active');
  document.body.classList.remove('sort-no-select');
  st.items.forEach(el=>{ el.classList.remove('sort-dragging','sort-shiftable'); el.style.transform=''; });
  // A drag that ends over a button must not also "click" it. The browser
  // dispatches that click in the same input task as this pointerup, so the
  // guard only needs to live until the next tick — any longer and (when no
  // click follows, e.g. the pointer ended up outside the original target) it
  // would eat the user's next genuine tap.
  const swallow=ev=>{ ev.stopPropagation(); ev.preventDefault(); };
  window.addEventListener('click',swallow,{capture:true,once:true});
  setTimeout(()=>window.removeEventListener('click',swallow,{capture:true}),0);
  if(!cancelled&&st.to!==st.from) st.container._sortOpts.onReorder(st.from,st.to);
}

function _sortKeydown(container,e){
  const o=container._sortOpts;
  if(!o.handleSelector||!e.target.closest(o.handleSelector)) return;
  if(e.key!=='ArrowUp'&&e.key!=='ArrowDown') return;
  const items=_sortItems(container);
  const from=items.indexOf(e.target.closest(o.itemSelector));
  const to=from+(e.key==='ArrowUp'?-1:1);
  if(from<0||to<0||to>=items.length) return;
  e.preventDefault();
  o.onReorder(from,to);
  // onReorder re-rendered the list — put focus back on the moved card's grip
  requestAnimationFrame(()=>{ const h=_sortItems(container)[to]?.querySelector(o.handleSelector); if(h) h.focus(); });
}
