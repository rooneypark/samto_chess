import {initArtPress} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {applyCloseIcon} from './close-icon.js';

const labels={success:'성공',error:'실패',info:'안내'};
function inferState(message){
  if(/실패|오류|부족|못했|못했습니다|수 없|다시 시도|유효하지/.test(message))return 'error';
  if(/완료|했습니다|받았습니다|받았어요|지급됐|획득$/.test(message))return 'success';
  return 'info';
}

export function createToast(element){
  const label=document.createElement('strong');
  const text=document.createElement('span');
  const close=document.createElement('button');
  close.className='toast-close';
  close.type='button';
  close.setAttribute('aria-label','알림 닫기');
  applyCloseIcon(close,'알림 닫기');
  element.replaceChildren(label,text,close);
  initArtPress(element);
  let timer;
  const hide=()=>{clearTimeout(timer);element.hidden=true;};
  close.onclick=hide;
  function show(message,state){
    const value=String(message);
    const tone=Object.hasOwn(labels,state)?state:inferState(value);
    label.textContent=labels[tone];
    text.textContent=value;
    element.dataset.state=tone;
    element.hidden=false;
    nineSlice(element,'blue',{button:false,corner:12,fitCorner:true,stablePixels:true}).catch(console.error);
    clearTimeout(timer);
    timer=setTimeout(hide,3200);
  }
  return {show,hide};
}
