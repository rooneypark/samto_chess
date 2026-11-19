const labels={success:'성공',error:'실패',info:'안내'};
function inferState(message){
  if(/실패|오류|부족|못했|못했습니다|수 없|다시 시도|유효하지/.test(message))return 'error';
  if(/완료|했습니다|받았습니다|받았어요|지급됐|획득$/.test(message))return 'success';
  return 'info';
}

export function createToast(element){
  const label=document.createElement('strong');
  const text=document.createElement('span');
  const copy=document.createElement('div');
  copy.className='toast-copy';
  copy.append(label,text);
  element.replaceChildren(copy);
  let timer;
  const hide=()=>{clearTimeout(timer);element.hidden=true;};
  function show(message,state){
    const value=String(message);
    const tone=Object.hasOwn(labels,state)?state:inferState(value);
    label.textContent=labels[tone];
    text.textContent=value;
    element.dataset.state=tone;
    element.hidden=false;
    clearTimeout(timer);
    timer=setTimeout(hide,3200);
  }
  return {show,hide};
}
