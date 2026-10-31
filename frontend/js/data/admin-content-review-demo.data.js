export const contentReviewDemo=[
  {
    id:'prop-demo-lesson-math-1',
    type:'lesson',
    courseId:'math',
    courseName:'Matemática',
    grade:4,
    unitId:'unit-math-4-1',
    unitTitle:'Números y operaciones',
    title:'Sumas con reagrupación',
    author:'demo-monitor',
    version:'v1.0',
    createdAt:'2026-10-01T10:00:00.000Z',
    state:'sin-revisar',
    source:'Borrador de demostración',
    blocks:[
      {id:'b1',type:'title',text:'Sumas con reagrupación'},
      {id:'b2',type:'explanation',text:'Cuando sumamos y hay más de 9 en una columna, reagrupamos al orden superior.'},
      {id:'b3',type:'example',text:'246 + 128'},
      {id:'b4',type:'image',src:'../assets/images/lessons/math-suma.svg',alt:''},
      {id:'b5',type:'practice-link',text:'Practica con ejercicios guiados'},
      {id:'b6',type:'summary',text:'Reagrupamos las unidades, decenas y centenas.'}
    ],
    resources:[
      {id:'res-img-1',type:'image',name:'math-suma.svg',path:'../assets/images/lessons/math-suma.svg',altMissing:true,offline:'unknown'}
    ],
    objective:'Resolver sumas con reagrupación hasta centenas.'
  }
];
