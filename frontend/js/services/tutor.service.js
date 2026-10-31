import {normalizeDemoPrompt,validateTutorInput} from '../utils/tutor-validation.js';

/** Solo consulta datos ya cargados. Nunca usa red, almacenamiento o un proveedor IA. */
export async function getTutorDemoResponse({text,action,exampleId,examples}){
 const input=validateTutorInput(text);
 if(!input.valid)throw new TypeError(input.error);
 const example=action?examples.find(item=>item.id===exampleId):examples.find(item=>normalizeDemoPrompt(item.prompt)===normalizeDemoPrompt(input.text));
 if(!example)return {mode:'unavailable',provenance:'predefined',blocks:[{kind:'unavailable'}]};
 const mode=action??'explain';
 const review={kind:'review',example};
 const responses={
  explain:[{kind:'paragraph',text:example.explanation},...(example.math?[example.math]:[]),{kind:'question',text:example.guide}],
  easy:[{kind:'paragraph',text:example.easy},{kind:'question',text:example.guide}],
  steps:[{kind:'steps',items:example.steps},{kind:'question',text:example.guide}],
  example:[{kind:'example',text:example.example},...(example.math?[example.math]:[])],
  another:[{kind:'example',text:example.another}],
  hint:[{kind:'hint',text:example.hint}],
  guide:[{kind:'hint',text:example.hint},{kind:'question',text:example.guide}],
  drawing:example.visual?[{kind:'visual',image:example.visual}]:[{kind:'noVisual'}],
  review:[{kind:'paragraph',text:example.explanation},review],
 };
 if(!Object.hasOwn(responses,mode))throw new TypeError('Estrategia de demostración no válida.');
 return {mode:'demonstration',provenance:'predefined',exampleId:example.id,blocks:[...responses[mode],...(mode==='review'?[]:[review])]};
}
