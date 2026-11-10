export function duplicateKeys(text){
 const tokens=text.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g)||[];let i=0;const duplicates=[];
 function value(path,depth){if(depth>64)throw new Error('JSON 중첩이 너무 깊습니다.');const t=tokens[i++];if(t==='{'){const keys=new Set();if(tokens[i]==='}'){i++;return;}while(i<tokens.length){const k=JSON.parse(tokens[i++]);i++;if(keys.has(k))duplicates.push(`${path}.${k}`);keys.add(k);value(`${path}.${k}`,depth+1);const sep=tokens[i++];if(sep==='}')return;}}else if(t==='['){if(tokens[i]===']'){i++;return;}let index=0;while(i<tokens.length){value(`${path}[${index++}]`,depth+1);if(tokens[i++]===']')return;}}}
 value('$',0);return duplicates;
}
const integer=(x,min=0)=>Number.isInteger(x)&&x>=min;
export function inspectAtlas(text,image){
 const issues=[],frames=[];const add=(code,frame,message,level='error')=>issues.push({code,frame,message,level});let data;
 if(typeof text!=='string'||new TextEncoder().encode(text).length>5*1024*1024){add('A001','JSON','JSON은 5MB 이하여야 합니다.');return{issues,frames,status:'error'};}
 try{data=JSON.parse(text);}catch{add('A001','JSON','JSON 문법을 확인해주세요.');return{issues,frames,status:'error'};}
 if(!data||typeof data!=='object'||Array.isArray(data)){add('A001','JSON','최상위는 atlas 객체여야 합니다.');return{issues,frames,status:'error'};}
 try{duplicateKeys(text).forEach(path=>add('A002',path,'같은 객체에 동일한 키가 중복됩니다. 덮어쓰기가 발생합니다.'));}catch(e){add('A001','JSON',e.message);return{issues,frames,status:'error'};}
 if(data.meta?.related_multi_packs?.length||Array.isArray(data.textures)){add('A007','atlas','다중 페이지 atlas는 v1에서 지원하지 않습니다.','unsupported');}
 if(!image||!integer(image.width,1)||!integer(image.height,1)){add('A003','image','함께 사용할 이미지 파일이 필요합니다.');return{issues,frames,status:'error'};}
 if(image.width*image.height>16777216){add('A004','image','이미지 면적이 16,777,216픽셀을 초과합니다.');return{issues,frames,status:'error'};}
 const expected=data.meta?.image;if(typeof expected!=='string'||!expected.trim())add('A003','meta.image','이미지 참조 필드가 없습니다.');else{const leaf=expected.replace(/\\/g,'/').split('/').at(-1);if(leaf!==image.name)add('A003','meta.image',`참조 파일명과 선택한 파일명이 다릅니다: ${expected}`);if(leaf!==expected)add('A003','meta.image','폴더 경로는 단일 파일 선택으로 존재 여부를 검사할 수 없습니다. 파일명만 비교했습니다.','warning');}
 const input=data.frames;if(!input||typeof input!=='object'){add('A001','frames','frames 객체 또는 배열이 필요합니다.');return{issues,frames,status:'error'};}
 const entries=Array.isArray(input)?input.map((v,i)=>[v?.filename??`[${i}]`,v]):Object.entries(input);if(entries.length===0)add('A001','frames','프레임이 비어 있습니다.');if(entries.length>10000){add('A001','frames','프레임은 10,000개 이하만 검사합니다.');return{issues,frames,status:'error'};}
 const names=new Set();for(const[name,entry]of entries){if(typeof name!=='string'||names.has(name)){add('A002',String(name),'프레임 이름이 중복되거나 올바르지 않습니다.');}names.add(name);if(!entry||typeof entry!=='object'){add('A004',String(name),'프레임 정보가 객체가 아닙니다.');continue;}const f=entry.frame;if(!f||!integer(f.x)||!integer(f.y)||!integer(f.w,1)||!integer(f.h,1)){add('A004',String(name),'x/y는 0 이상 정수, w/h는 양의 정수여야 합니다.');continue;}
 let valid=true;if(f.x+f.w>image.width||f.y+f.h>image.height){add('A005',name,'프레임 사각형이 이미지 경계를 벗어납니다.');valid=false;}
 if(entry.rotated!==undefined&&typeof entry.rotated!=='boolean'){add('A008',name,'rotated는 true/false만 지원합니다.','unsupported');valid=false;}
 if(entry.trimmed!==undefined&&typeof entry.trimmed!=='boolean'){add('A006',name,'trimmed는 true/false여야 합니다.');valid=false;}
 const width=entry.rotated?f.h:f.w,height=entry.rotated?f.w:f.h;let source={x:0,y:0,w:width,h:height},size={w:width,h:height};if(entry.trimmed){source=entry.spriteSourceSize;size=entry.sourceSize;if(!source||!size||!integer(source.x)||!integer(source.y)||!integer(source.w,1)||!integer(source.h,1)||!integer(size.w,1)||!integer(size.h,1)||source.x+source.w>size.w||source.y+source.h>size.h||source.w!==width||source.h!==height){add('A006',name,'trim 원점·프레임 크기·원본 크기의 범위를 확인해주세요.');valid=false;}}
 if(size&&size.w*size.h>16777216){add('A006',name,'복원 미리보기 면적이 제한을 초과합니다.');valid=false;}
 frames.push({name,frame:f,rotated:!!entry.rotated,trimmed:!!entry.trimmed,source,size,valid});}
 const status=issues.some(i=>i.level==='error')?'error':issues.some(i=>i.level==='unsupported')?'unsupported':issues.length?'warning':'pass';return{issues,frames,status};
}
