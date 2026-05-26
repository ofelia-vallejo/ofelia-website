/** Datos PDP por slug — galería por color, acordeón, editorial */
module.exports = {
  'travel-bag-i': {
    colorData: {
      espresso: {
        label: 'Espresso',
        leather: ['#4a362e', '#3B2B26', '#2e211c'],
        images: [
          '/imagenes nuevas/producto/mujer/travel-bag-cognac-estudio.jpg',
          '/assets/img/nuevas/producto/mujer/estudio-01.jpg',
          '/assets/img/nuevas/producto/mujer/estudio-02.jpg',
          '/assets/img/nuevas/producto/mujer/estudio-03.jpg',
        ],
        alts: [
          'Travel Bag I — cuero espresso',
          'Travel Bag I — detalle de costura',
          'Travel Bag I — herrajes latón',
          'Travel Bag I — grabado láser OV',
        ],
      },
      navy: {
        label: 'Navy Profundo',
        leather: ['#152a45', '#0B1F3A', '#081628'],
        images: [
          '/imagenes nuevas/producto/hombre/travel-bag-negro-estudio.jpg',
          '/imagenes nuevas/producto/hombre/mochila-negro-estudio.jpg',
          '/imagenes nuevas/producto/hombre/mochila-negro-estudio-02.jpg',
          '/imagenes nuevas/detalle/firma-mochila-negro.jpg',
        ],
        alts: [
          'Travel Bag I — cuero navy',
          'Travel Bag I — vista lateral',
          'Travel Bag I — detalle de grano',
          'Travel Bag I — monograma láser',
        ],
      },
      verde: {
        label: 'Verde Andino',
        leather: ['#2a4535', '#1F3527', '#152a1f'],
        images: [
          '/imagenes nuevas/producto/hombre/mochila-chocolate-estudio.jpg',
          '/imagenes nuevas/producto/hombre/mochila-chocolate-estudio-02.jpg',
          '/assets/img/nuevas/producto/mujer/estudio-04.jpg',
          '/assets/img/nuevas/producto/mujer/estudio-05.jpg',
        ],
        alts: [
          'Travel Bag I — verde andino',
          'Travel Bag I — detalle verde',
          'Travel Bag I — costuras',
          'Travel Bag I — grabado',
        ],
      },
    },
    accordion: [
      { title: 'Materiales', body: 'Cuero pleno colombiano curtido vegetal · forro en lino crudo · herrajes de latón antiguo · costuras reforzadas a mano en Medellín.' },
      { title: 'Dimensiones', body: '48 × 28 × 22 cm · capacidad ~38 L · peso 1,4 kg · correa desmontable · asas reforzadas.' },
      { title: 'Grabado láser', body: 'Monograma OV en CO₂ · ~0,35 mm · esquina inferior derecha del panel frontal · personalizable antes del envío.' },
    ],
    editorialImage: '/imagenes nuevas/lifestyle/hombre/duffel-cognac-lifestyle.jpg',
    editorialCaption: 'Una pieza para el viaje que permanece.',
  },
  'travel-bag-ii': {
    colorData: {
      negro: {
        label: 'Negro',
        leather: ['#1a1a1a', '#141414', '#0a0a0a'],
        images: ['/imagenes nuevas/producto/hombre/travel-bag-negro-estudio.jpg'],
        alts: ['Travel Bag II — negro'],
      },
    },
    accordion: [
      { title: 'Materiales', body: 'Cuero full-grain negro · herrajes latón antiguo · estructura de maletín.' },
      { title: 'Grabado láser', body: 'Zona oficial esquina inferior derecha · iniciales o nombre.' },
    ],
  },
  'bolso-dama': {
    colorData: {
      cognac: {
        label: 'Cognac',
        leather: ['#9a6b42', '#8B5E3C', '#6d4a2c'],
        images: ['/imagenes nuevas/lifestyle/mujer/tote-cognac-lifestyle.jpg'],
        alts: ['Bolso Dama — cognac'],
      },
    },
    accordion: [
      { title: 'Materiales', body: 'Cuero pleno · tote estructurado · forro en lino.' },
    ],
  },
  'morral-elite': {
    colorData: {
      negro: {
        label: 'Negro',
        leather: ['#1a1a1a', '#141414', '#0a0a0a'],
        images: ['/imagenes nuevas/lifestyle/hombre/mochila-negro-lifestyle.jpg'],
        alts: ['Morral Elite — negro'],
      },
    },
    accordion: [
      { title: 'Materiales', body: 'Cuero negro full-grain · compartimentos internos.' },
    ],
  },
  cinturon: {
    colorData: {
      'negro-liso': {
        label: 'Negro · Liso',
        leather: ['#1a1a1a', '#141414', '#0a0a0a'],
        images: [
          '/imagenes nuevas/producto/accesorios/cinturon/negro-liso-estudio.jpg',
          '/imagenes nuevas/producto/accesorios/cinturon/negro-liso-detalle.jpg',
        ],
        alts: ['Cinturón — negro liso', 'Cinturón — grabado en punta'],
      },
      'negro-granulado': {
        label: 'Negro · Granulado',
        leather: ['#222222', '#141414', '#0a0a0a'],
        images: ['/imagenes nuevas/producto/accesorios/cinturon/negro-granulado-estudio.jpg'],
        alts: ['Cinturón — negro granulado'],
      },
      'navy-granulado': {
        label: 'Navy · Granulado',
        leather: ['#152a45', '#0B1F3A', '#081628'],
        images: [
          '/imagenes nuevas/producto/accesorios/cinturon/navy-granulado-estudio.jpg',
          '/imagenes nuevas/producto/accesorios/cinturon/navy-granulado-detalle.jpg',
        ],
        alts: ['Cinturón — navy granulado', 'Cinturón — detalle de grano'],
      },
      'espresso-liso': {
        label: 'Espresso · Liso',
        leather: ['#4a362e', '#3B2B26', '#2e211c'],
        images: [
          '/imagenes nuevas/producto/accesorios/cinturon/espresso-liso-estudio.jpg',
          '/imagenes nuevas/producto/accesorios/cinturon/espresso-liso-plano.jpg',
        ],
        alts: ['Cinturón — espresso liso', 'Cinturón — plano editorial'],
      },
      'espresso-granulado': {
        label: 'Espresso · Granulado',
        leather: ['#4a362e', '#3B2B26', '#2e211c'],
        images: [
          '/imagenes nuevas/producto/accesorios/cinturon/espresso-granulado-estudio.jpg',
          '/imagenes nuevas/producto/accesorios/cinturon/espresso-granulado-detalle.jpg',
        ],
        alts: ['Cinturón — espresso granulado', 'Cinturón — pasador grabado'],
      },
      'cognac-liso': {
        label: 'Cognac · Liso',
        leather: ['#9a6b42', '#8B5E3C', '#6d4a2c'],
        images: [
          '/imagenes nuevas/producto/accesorios/cinturon/cognac-liso-estudio.jpg',
          '/imagenes nuevas/producto/accesorios/cinturon/cognac-liso-plano.jpg',
          '/imagenes nuevas/producto/accesorios/cinturon/cognac-liso-detalle.jpg',
        ],
        alts: ['Cinturón — cognac liso', 'Cinturón — cognac plano', 'Cinturón — monograma punta'],
      },
    },
    accordion: [
      { title: 'Materiales', body: 'Cuero pleno colombiano · hebilla gunmetal cepillada.' },
      { title: 'Acabados', body: 'Liso o granulado · seis combinaciones de color.' },
      { title: 'Grabado láser', body: 'Monograma OV en la punta · ~2 cm del extremo.' },
    ],
    editorialImage: '/imagenes nuevas/producto/accesorios/cinturon/cognac-liso-plano.jpg',
    editorialCaption: 'Seis acabados. Una firma en cuero.',
  },
};
