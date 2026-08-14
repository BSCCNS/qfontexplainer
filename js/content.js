/*
 * Quantum Compass — companion site content
 * ----------------------------------------
 * All copy for every language lives here. Nothing else in the project contains
 * user-facing text, so this is the only file a translator needs to touch, and
 * the only one to lift when the public website gets built.
 *
 * LANGUAGE STATUS
 *   es — AUTHORITATIVE. Pulled from the Figma file (touch screen_ESP).
 *        Last synced: 2026-08-13, after the copy rewrite.
 *   en — DRAFT TRANSLATION written for this build. NEEDS REVIEW.
 *   ca — DRAFT TRANSLATION written for this build. NEEDS REVIEW.
 *
 * The Figma file only ever contained Spanish. The en/ca strings exist so the
 * language switcher works end to end; they are not approved copy. The credits
 * list and the BSC / Creative Intelligence Lab boilerplate should be replaced
 * with each organisation's own official wording rather than translated.
 *
 * FORMATTING
 *   Each `body` is an array of paragraphs, rendered with a blank line between
 *   them. A "\n" inside a string is a hard line break with no extra spacing —
 *   use it only where the design breaks a line deliberately (it is rendered
 *   via `white-space: pre-line`). Titles may contain "\n" for the same reason.
 *
 * To re-sync Spanish after further edits in Figma, see tools/sync-text.py.
 */

window.CONTENT = {
  languages: [
    { code: 'en', label: 'English' },
    { code: 'ca', label: 'Catalan' },
    { code: 'es', label: 'Español' },
  ],

  /* ================================================================== */
  /* ES — authoritative, from Figma                                     */
  /* ================================================================== */
  es: {
    htmlLang: 'es',

    home: {
      blocks: [
        {
          title: 'La verdad en superposición',
          body: [
            'La verdad ya no se construye de forma compartida. Los algoritmos convierten sesgos y emociones en hechos incuestionables que generan realidades distintas y enfrentadas. Como el gato de Schrödinger, la verdad está en una superposición de posibilidades que cada observador colapsa de forma distinta, fragmentando el consenso y erosionando la convivencia democrática.',
            'En esta época de la posverdad, la física cuántica nos ofrece un lenguaje inesperado para pensar el presente: Un mundo donde los objetos tienen múltiples representaciones simultaneas, donde observar es transformar y donde la contradicción es inherente al funcionamiento de las cosas.',
          ],
        },
        {
          title: 'Escribir la contradicción',
          body: [
            'Quantum Font es una tipografía cuántica, inspirada en el experimento de la doble rendija y la dualidad onda-partícula para representar simultáneamente conceptos diferentes pero relacionados.\nEn la experiencia interactiva, pares de conceptos vinculados en el debate público, como “Immigrant / Expat”, conviven e interactúan en un estado de superposición cuántica hasta que una persona, mediante el movimiento de sus manos, fija su significado y hace visible la contradicción.',
          ],
        },
      ],
      videos: [
        { id: 'immigrant', label: 'Immigrant\nVideo' },
        { id: 'expat', label: 'Expat\nVideo' },
      ],
      prompt: '¿Quieres conocer más sobre el experimento o sobre nosotros?',
      ctaExperiment: 'Experimento paso a paso',
      ctaAbout: 'Sobre nosotros',
    },

    // Labels drawn over the isometric illustration.
    sceneLabels: {
      source: 'Fuente de luz',
      barrier: 'Barrera',
      slit: 'Rendija',
      screen: 'Pantalla',
    },

    slides: [
      {
        title: 'El experimento de la doble rendija',
        body: [
          'En 1801, Thomas Young dirigió un rayo de luz hacia una barrera con dos ranuras estrechas.\nEsperaba demostrar que la luz no estaba formada de partículas, que hubieran formados dos bandas de luz en la pantalla. En cambio, al estar compuesta por ondas, la luz pasaría por ambas rendijas y formaría un patrón de franjas alternas, brillantes y oscuras. Lo que Young no sabía era que hubiera observado lo mismo si hubiera usado partículas muy pequeñas, incluso átomos o moléculas.',
          'Este es uno de los experimentos que cambió la física y nuestra percepción de la realidad.',
        ],
      },
      {
        title: 'Una partícula, dos CAMINOS',
        body: [
          'Si disparamos partículas muy pequeñas, esperamos verlas seguir alguno de los dos caminos que van desde la fuente hasta la pantalla. Y, como en el juego de sombras chinas, observamos lo mismo con luz, siempre que las rendijas sean mucho más grandes que su longitud de onda.',
          'Pero algo curioso pasa si las partículas son muy pequeñas, como un electrón.',
        ],
      },
      {
        title: 'La partícula como onda',
        body: [
          'Si no colocamos ningún detector, una partícula pequeña es gobernada por las leyes de la mecánica cuántica —radicalmente distintas a las del mundo cotidiano —y se comporta como una onda, como si atravesara por ambas rendijas simultáneamente creando frentes de onda que avanzan hacia la pantalla.',
          'Se dice que las partículas están en superposición entre ambas rendijas',
        ],
      },
      {
        title: 'Interferencia constructiva y destructiva',
        body: [
          'Los frentes de onda que salen de las rendijas se encuentran al llegar a la pantalla creando un patrón de franjas alternadas de luz y oscuridad: donde las crestas de las ondas coinciden se suman (interferencia constructiva = franja brillante); y donde una cresta y valle coinciden se cancelan (interferencia destructiva = franja oscura).',
        ],
      },
      {
        title: '¿Y si las rendijas fueran palabras?',
        body: [
          'Como es el mismo fenómeno físico, reemplazamos en el cálculo a las dos simples ranuras por otras más complejas, donde cada palabra es una máscara tipográfica.',
          'La luz o las partículas pasan a través de su forma y llegan a la pantalla formando un patrón de difracción único.',
        ],
      },
      {
        title: 'Las dos palabras interfieren',
        body: [
          'Pero, igual que con las rendijas, los frentes de onda que pasaron por cada palabra interactúan entre sí. El patrón que aparece en la pantalla no es solamente la suma de las dos palabras. También contiene lo que ocurre entre ellas: su diferencia, su tensión, su interferencia.',
        ],
      },
      {
        title: 'ENTRE LÍNEAS',
        body: [
          'En el experimento cuántico, cuando observamos por qué camino pasa la partícula, la superposición se rompe y la interferencia desaparece.\nEn nuestro experimento, también es la intervención del observador la que transforma lo que aparece. Navegando esta transformación mediante gestos de mano, la audiencia define las palabras o las mantiene en el umbral donde ninguna es todavía legible.',
          'Al intervenir, hacemos que una interpretación se imponga sobre la otra. La ambigüedad desaparece y, con ella, la interferencia.',
        ],
      },
    ],

    about: {
      sections: [
        {
          title: 'About \nQuantum Compass',
          body: [
            'Quantum Font forma parte de la instalación Quantum Compass que utiliza la física cuántica como metáfora para explorar cómo construimos el significado e interpretamos la información.\nLa propuesta, además de experimentar y entender la tipografía cuántica, incorpora dos elementos adicionales que se pueden ver en esta sala: un vídeo documental sobre los fundamentos materiales de la computación cuántica y una versión interactiva que permite explorar en detalle los componentes de un ordenador cuántico.',
          ],
        },
        {
          title: 'Creative intelligence Lab',
          body: [
            'El Creative Intelligence Lab del Barcelona Supercomputing Center (BSC) es el primer laboratorio de su tipo integrado en un centro de supercomputación en Europa, basado en más de trece años de experiencia explorando la práctica artística como parte del proceso de investigación científica. Opera en tres áreas interconectadas —Arts, Studio y Solutions— a través de un equipo interdisciplinar de personas investigadoras, creativas y tecnólogas. Desarrolla residencias, experimentos públicos, programas de formación y proyectos colaborativos para traducir la investigación en herramientas, productos y servicios tangibles para la industria y la sociedad.',
          ],
        },
        {
          title: 'Barcelona Supercomputing Center – \nCentro Nacional de Supercomputación (BSC-CNS)',
          body: [
            'El Barcelona Supercomputing Center – Centro Nacional de Supercomputación (BSC-CNS) es líder en supercomputación en Europa y un referente internacional en Inteligencia Artificial (IA) y Computación de Alto Rendimiento (HPC).',
            'Con más de 20 años de experiencia, promueve la combinación de la investigación en sus múltiples dimensiones, la gestión de datos y el desarrollo de infraestructuras de vanguardia al servicio de la comunidad científica mundial. Además, coordina la Red Española de Supercomputación (RES) y alberga el superordenador MareNostrum 5 y el primer ordenador cuántico de España.',
          ],
        },
      ],
      creditsTitle: 'Créditos',
      credits:
        'BSC Creative Intelligence Lab: Sol Bucalo, Paula Méndez, Míriam Herrero, Raquel Barrachina, Paula Fernández V., Paula Benito, Tomás Andrade, Marc Heras, David García, Guillermo Marín, Jerónimo Calderón, Juan León, Roger González, Fernando Cucchietti; en colaboración con Sophie Marandon, Nataly Buslón, Xavier Paradis.',
      back: 'Volver',
    },
  },

  /* ================================================================== */
  /* EN — DRAFT. Needs review before the installation goes live.        */
  /* ================================================================== */
  en: {
    htmlLang: 'en',

    home: {
      blocks: [
        {
          title: 'Truth in superposition',
          body: [
            'Truth is no longer built collectively. Algorithms turn biases and emotions into unquestionable facts that generate separate, opposing realities. Like Schrödinger’s cat, truth sits in a superposition of possibilities that each observer collapses differently, fragmenting consensus and eroding democratic coexistence.',
            'In this age of post-truth, quantum physics offers an unexpected language for thinking about the present: a world where objects hold multiple simultaneous representations, where to observe is to transform, and where contradiction is inherent to the way things work.',
          ],
        },
        {
          title: 'Writing contradiction',
          body: [
            'Quantum Font is a quantum typeface, inspired by the double-slit experiment and wave–particle duality to represent different but related concepts simultaneously.\nIn the interactive experience, pairs of concepts drawn from public debate, such as “Immigrant / Expat”, coexist and interact in a state of quantum superposition until a person, through the movement of their hands, fixes their meaning and makes the contradiction visible.',
          ],
        },
      ],
      videos: [
        { id: 'immigrant', label: 'Immigrant\nVideo' },
        { id: 'expat', label: 'Expat\nVideo' },
      ],
      prompt: 'Would you like to know more about the experiment, or about us?',
      ctaExperiment: 'The experiment step by step',
      ctaAbout: 'About us',
    },

    sceneLabels: {
      source: 'Light source',
      barrier: 'Barrier',
      slit: 'Slit',
      screen: 'Screen',
    },

    slides: [
      {
        title: 'The double-slit experiment',
        body: [
          'In 1801, Thomas Young directed a beam of light at a barrier with two narrow slits.\nHe expected to show that light was not made of particles, which would have formed two bands of light on the screen. Instead, being composed of waves, the light would pass through both slits and form a pattern of alternating bright and dark fringes. What Young did not know was that he would have observed the same thing had he used very small particles, even atoms or molecules.',
          'This is one of the experiments that changed physics and our perception of reality.',
        ],
      },
      {
        title: 'One particle, two PATHS',
        body: [
          'If we fire very small particles, we expect to see them follow one of the two paths running from the source to the screen. And, as in a shadow-puppet play, we observe the same with light, as long as the slits are much larger than its wavelength.',
          'But something curious happens if the particles are very small, like an electron.',
        ],
      },
      {
        title: 'The particle as a wave',
        body: [
          'If we place no detector, a small particle is governed by the laws of quantum mechanics — radically different from those of the everyday world — and behaves like a wave, as if it passed through both slits simultaneously, creating wavefronts that travel towards the screen.',
          'Particles are said to be in superposition between both slits',
        ],
      },
      {
        title: 'Constructive and destructive interference',
        body: [
          'The wavefronts leaving the slits meet as they reach the screen, creating a pattern of alternating light and dark fringes: where the crests of the waves coincide they add together (constructive interference = bright fringe); and where a crest and a trough coincide they cancel out (destructive interference = dark fringe).',
        ],
      },
      {
        title: 'What if the slits were words?',
        body: [
          'Since it is the same physical phenomenon, in the calculation we replace the two simple slits with more complex ones, where each word is a typographic mask.',
          'The light or the particles pass through its shape and reach the screen, forming a unique diffraction pattern.',
        ],
      },
      {
        title: 'The two words interfere',
        body: [
          'But, just as with the slits, the wavefronts that passed through each word interact with one another. The pattern that appears on the screen is not only the sum of the two words. It also contains what happens between them: their difference, their tension, their interference.',
        ],
      },
      {
        title: 'BETWEEN THE LINES',
        body: [
          'In the quantum experiment, when we observe which path the particle takes, the superposition breaks and the interference disappears.\nIn our experiment, it is also the observer’s intervention that transforms what appears. Navigating that transformation through hand gestures, the audience defines the words or holds them at the threshold where neither is yet legible.',
          'By intervening, we make one interpretation prevail over the other. The ambiguity disappears and, with it, the interference.',
        ],
      },
    ],

    about: {
      sections: [
        {
          title: 'About \nQuantum Compass',
          body: [
            'Quantum Font is part of the Quantum Compass installation, which uses quantum physics as a metaphor to explore how we construct meaning and interpret information.\nBeyond experiencing and understanding the quantum typeface, the proposal incorporates two further elements on show in this room: a documentary video on the material foundations of quantum computing, and an interactive version that allows the components of a quantum computer to be explored in detail.',
          ],
        },
        {
          title: 'Creative Intelligence Lab',
          body: [
            'The Creative Intelligence Lab at the Barcelona Supercomputing Center (BSC) is the first laboratory of its kind embedded in a supercomputing centre in Europe, built on more than thirteen years of experience exploring artistic practice as part of the scientific research process. It operates across three interconnected areas —Arts, Studio and Solutions— through an interdisciplinary team of researchers, creatives and technologists. It runs residencies, public experiments, training programmes and collaborative projects to translate research into tangible tools, products and services for industry and society.',
          ],
        },
        {
          title: 'Barcelona Supercomputing Center – \nCentro Nacional de Supercomputación (BSC-CNS)',
          body: [
            'The Barcelona Supercomputing Center – Centro Nacional de Supercomputación (BSC-CNS) is a leader in supercomputing in Europe and an international reference in Artificial Intelligence (AI) and High Performance Computing (HPC).',
            'With more than 20 years of experience, it promotes the combination of research in its many dimensions, data management and the development of cutting-edge infrastructure in the service of the global scientific community. It also coordinates the Spanish Supercomputing Network (RES) and hosts the MareNostrum 5 supercomputer and the first quantum computer in Spain.',
          ],
        },
      ],
      creditsTitle: 'Credits',
      credits:
        'BSC Creative Intelligence Lab: Sol Bucalo, Paula Méndez, Míriam Herrero, Raquel Barrachina, Paula Fernández V., Paula Benito, Tomás Andrade, Marc Heras, David García, Guillermo Marín, Jerónimo Calderón, Juan León, Roger González, Fernando Cucchietti; in collaboration with Sophie Marandon, Nataly Buslón, Xavier Paradis.',
      back: 'Back',
    },
  },

  /* ================================================================== */
  /* CA — DRAFT. Needs review before the installation goes live.        */
  /* ================================================================== */
  ca: {
    htmlLang: 'ca',

    home: {
      blocks: [
        {
          title: 'La veritat en superposició',
          body: [
            'La veritat ja no es construeix de forma compartida. Els algoritmes converteixen biaixos i emocions en fets inqüestionables que generen realitats distintes i enfrontades. Com el gat de Schrödinger, la veritat es troba en una superposició de possibilitats que cada observador col·lapsa de manera diferent, fragmentant el consens i erosionant la convivència democràtica.',
            'En aquesta època de la postveritat, la física quàntica ens ofereix un llenguatge inesperat per pensar el present: un món on els objectes tenen múltiples representacions simultànies, on observar és transformar i on la contradicció és inherent al funcionament de les coses.',
          ],
        },
        {
          title: 'Escriure la contradicció',
          body: [
            'Quantum Font és una tipografia quàntica, inspirada en l’experiment de la doble escletxa i la dualitat ona–partícula per representar simultàniament conceptes diferents però relacionats.\nEn l’experiència interactiva, parells de conceptes vinculats al debat públic, com “Immigrant / Expat”, conviuen i interactuen en un estat de superposició quàntica fins que una persona, mitjançant el moviment de les seves mans, fixa el seu significat i fa visible la contradicció.',
          ],
        },
      ],
      videos: [
        { id: 'immigrant', label: 'Immigrant\nVideo' },
        { id: 'expat', label: 'Expat\nVideo' },
      ],
      prompt: 'Vols conèixer més sobre l’experiment o sobre nosaltres?',
      ctaExperiment: 'Experiment pas a pas',
      ctaAbout: 'Sobre nosaltres',
    },

    sceneLabels: {
      source: 'Font de llum',
      barrier: 'Barrera',
      slit: 'Escletxa',
      screen: 'Pantalla',
    },

    slides: [
      {
        title: 'L’experiment de la doble escletxa',
        body: [
          'El 1801, Thomas Young va dirigir un raig de llum cap a una barrera amb dues escletxes estretes.\nEsperava demostrar que la llum no estava formada de partícules, que haurien format dues bandes de llum a la pantalla. En canvi, en estar composta per ones, la llum passaria per ambdues escletxes i formaria un patró de franges alternes, brillants i fosques. El que Young no sabia era que hauria observat el mateix si hagués fet servir partícules molt petites, fins i tot àtoms o molècules.',
          'Aquest és un dels experiments que va canviar la física i la nostra percepció de la realitat.',
        ],
      },
      {
        title: 'Una partícula, dos CAMINS',
        body: [
          'Si disparem partícules molt petites, esperem veure-les seguir algun dels dos camins que van des de la font fins a la pantalla. I, com en el joc d’ombres xineses, observem el mateix amb llum, sempre que les escletxes siguin molt més grans que la seva longitud d’ona.',
          'Però passa una cosa curiosa si les partícules són molt petites, com un electró.',
        ],
      },
      {
        title: 'La partícula com a ona',
        body: [
          'Si no hi col·loquem cap detector, una partícula petita és governada per les lleis de la mecànica quàntica — radicalment diferents de les del món quotidià — i es comporta com una ona, com si travessés ambdues escletxes simultàniament creant fronts d’ona que avancen cap a la pantalla.',
          'Es diu que les partícules estan en superposició entre ambdues escletxes',
        ],
      },
      {
        title: 'Interferència constructiva i destructiva',
        body: [
          'Els fronts d’ona que surten de les escletxes es troben en arribar a la pantalla creant un patró de franges alternades de llum i foscor: on les crestes de les ones coincideixen se sumen (interferència constructiva = franja brillant); i on una cresta i una vall coincideixen s’anul·len (interferència destructiva = franja fosca).',
        ],
      },
      {
        title: 'I si les escletxes fossin paraules?',
        body: [
          'Com que és el mateix fenomen físic, reemplacem en el càlcul les dues simples escletxes per unes altres de més complexes, on cada paraula és una màscara tipogràfica.',
          'La llum o les partícules passen a través de la seva forma i arriben a la pantalla formant un patró de difracció únic.',
        ],
      },
      {
        title: 'Les dues paraules interfereixen',
        body: [
          'Però, igual que amb les escletxes, els fronts d’ona que van passar per cada paraula interactuen entre si. El patró que apareix a la pantalla no és només la suma de les dues paraules. També conté el que passa entre elles: la seva diferència, la seva tensió, la seva interferència.',
        ],
      },
      {
        title: 'ENTRE LÍNIES',
        body: [
          'En l’experiment quàntic, quan observem per quin camí passa la partícula, la superposició es trenca i la interferència desapareix.\nEn el nostre experiment, també és la intervenció de l’observador la que transforma el que apareix. Navegant aquesta transformació mitjançant gestos de mà, l’audiència defineix les paraules o les manté al llindar on cap no és encara llegible.',
          'En intervenir, fem que una interpretació s’imposi sobre l’altra. L’ambigüitat desapareix i, amb ella, la interferència.',
        ],
      },
    ],

    about: {
      sections: [
        {
          title: 'About \nQuantum Compass',
          body: [
            'Quantum Font forma part de la instal·lació Quantum Compass, que utilitza la física quàntica com a metàfora per explorar com construïm el significat i interpretem la informació.\nLa proposta, a més d’experimentar i entendre la tipografia quàntica, incorpora dos elements addicionals que es poden veure en aquesta sala: un vídeo documental sobre els fonaments materials de la computació quàntica i una versió interactiva que permet explorar en detall els components d’un ordinador quàntic.',
          ],
        },
        {
          title: 'Creative Intelligence Lab',
          body: [
            'El Creative Intelligence Lab del Barcelona Supercomputing Center (BSC) és el primer laboratori del seu tipus integrat en un centre de supercomputació a Europa, basat en més de tretze anys d’experiència explorant la pràctica artística com a part del procés de recerca científica. Opera en tres àrees interconnectades —Arts, Studio i Solutions— a través d’un equip interdisciplinari de persones investigadores, creatives i tecnòlogues. Desenvolupa residències, experiments públics, programes de formació i projectes col·laboratius per traduir la recerca en eines, productes i serveis tangibles per a la indústria i la societat.',
          ],
        },
        {
          title: 'Barcelona Supercomputing Center – \nCentro Nacional de Supercomputación (BSC-CNS)',
          body: [
            'El Barcelona Supercomputing Center – Centro Nacional de Supercomputación (BSC-CNS) és líder en supercomputació a Europa i un referent internacional en Intel·ligència Artificial (IA) i Computació d’Alt Rendiment (HPC).',
            'Amb més de 20 anys d’experiència, promou la combinació de la recerca en les seves múltiples dimensions, la gestió de dades i el desenvolupament d’infraestructures d’avantguarda al servei de la comunitat científica mundial. A més, coordina la Xarxa Espanyola de Supercomputació (RES) i acull el superordinador MareNostrum 5 i el primer ordinador quàntic d’Espanya.',
          ],
        },
      ],
      creditsTitle: 'Crèdits',
      credits:
        'BSC Creative Intelligence Lab: Sol Bucalo, Paula Méndez, Míriam Herrero, Raquel Barrachina, Paula Fernández V., Paula Benito, Tomás Andrade, Marc Heras, David García, Guillermo Marín, Jerónimo Calderón, Juan León, Roger González, Fernando Cucchietti; en col·laboració amb Sophie Marandon, Nataly Buslón, Xavier Paradis.',
      back: 'Tornar',
    },
  },
};
