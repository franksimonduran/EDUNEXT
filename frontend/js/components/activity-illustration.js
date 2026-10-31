import {escapeHTML as esc} from './student-ui.js';
export function activityIllustration(kind,alt){
 const shapes={
  dog:'<ellipse cx="123" cy="108" rx="54" ry="30" fill="#bd8a57"/><circle cx="90" cy="65" r="34" fill="#d3a778"/><ellipse cx="59" cy="60" rx="13" ry="27" fill="#9b6a3f"/><ellipse cx="119" cy="58" rx="12" ry="24" fill="#9b6a3f"/><circle cx="80" cy="62" r="4" fill="#263d52"/><circle cx="100" cy="62" r="4" fill="#263d52"/><ellipse cx="90" cy="78" rx="8" ry="6" fill="#263d52"/><path d="M95 128v18m56-18v18m22-42 20-18" stroke="#9b6a3f" stroke-width="11" stroke-linecap="round"/>',
  cat:'<ellipse cx="128" cy="112" rx="47" ry="28" fill="#94a6ba"/><path d="m64 50 3-29 27 17m15 0 27-17-1 32" fill="#94a6ba"/><circle cx="100" cy="65" r="35" fill="#b6c4d4"/><path d="m75 63 9 2m31-2 9 2m-24 12-5-3h10zM65 77H43m23 8-21 5m88-13h22m-22 8 20 5" stroke="#354f6e" stroke-width="3"/><path d="M170 109q42-48 5-55" stroke="#94a6ba" stroke-width="13" fill="none" stroke-linecap="round"/>',
  bird:'<ellipse cx="120" cy="94" rx="49" ry="37" fill="#65abd6"/><circle cx="148" cy="61" r="25" fill="#81c6e8"/><path d="m173 59 24 8-24 8" fill="#e9b148"/><path d="m77 95-29-15 13 32m33-27q30-17 42 19-36 22-42-19" fill="#3d84b9"/><circle cx="155" cy="56" r="4" fill="#253d5b"/><path d="m112 127-5 17m27-17 5 17" stroke="#a57b37" stroke-width="4"/>',
  lake:'<ellipse cx="120" cy="103" rx="95" ry="35" fill="#80c8ef"/><path d="m80 100 28-14 28 14-28 14z" fill="#2868eb"/><path d="m136 100 16-12v24z" fill="#2868eb"/><path d="M37 100V48m0 20-14-12m14 25 15-16" stroke="#19734f" stroke-width="6"/>',
  desert:'<path d="M0 95q60-55 120 0t120 0v65H0" fill="#efc48b"/><circle cx="190" cy="35" r="20" fill="#f0bd48"/><path d="M95 130V50m0 35H75V65m20 37h22V77" stroke="#19734f" stroke-width="13" fill="none"/>',
  forest:'<path d="m60 25-35 75h70zm95-10-40 90h80z" fill="#4c9c6c"/><path d="M60 90v55m95-50v50" stroke="#826044" stroke-width="12"/><path d="M0 145h240" stroke="#b4d8ac" stroke-width="15"/>',
  lungs:'<path d="M120 15v55m0-15-25 24m25-24 25 24" stroke="#bd637e" stroke-width="12" fill="none"/><path d="M98 55Q40 55 48 130q36 20 50-5zm44 0q58 0 50 75-36 20-50-5z" fill="#e8a7b6" stroke="#a64c67" stroke-width="3"/>',
  heart:'<path d="M120 140 52 77C10 18 95 0 120 47c25-47 110-29 68 30Z" fill="#d56b7c"/><path d="m55 85 32-2 15-22 18 48 15-26h45" stroke="white" stroke-width="4" fill="none"/>',
  stomach:'<path d="M95 10v50q-27-8-32 32-6 55 55 52 75-2 67-62-5-38-50-30V10" fill="#e8ae91" stroke="#ac755e" stroke-width="5"/>',
  solar:'<circle cx="50" cy="35" r="23" fill="#efbd42"/><path d="m50 68 35 35m-8-62 30 17" stroke="#e9b849" stroke-width="4"/><path d="m103 60 105 10-13 66-105-10z" fill="#578fce" stroke="#18469e" stroke-width="3"/><path d="m128 64-13 65m48-60-13 65m-52-39 105 10m-61 28v18m-25 0h50" stroke="white" stroke-width="2"/>',
  coal:'<path d="m45 121 12-48 40-15 30 30 17-26 42 12 22 47z" fill="#596575"/><path d="m57 73 41 46 29-31m17-26 18 57" stroke="#344256" stroke-width="4"/>',
  oil:'<rect x="75" y="23" width="90" height="122" rx="12" fill="#6e839b"/><path d="M75 50h90m-90 68h90" stroke="#364f70" stroke-width="5"/><path d="M120 65q-30 35 0 40 30-5 0-40" fill="#253d5e"/>',
 };
 return `<svg class="activity-picture" viewBox="0 0 240 160" role="img" aria-label="${esc(alt)}"><rect width="240" height="160" rx="12" fill="#f1f7ff"/>${shapes[kind]??shapes.forest}</svg>`;
}
