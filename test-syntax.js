export const diagnosticRules=Object.freeze([
  {id:'js-modules',test:function(){try{Function('import("x")');return true;}catch{return false;},success:'Módulos ES6 soportados',failure:'Módulos ES6 no soportados',remediation:'Use un navegador moderno con soporte ES6'},
]);