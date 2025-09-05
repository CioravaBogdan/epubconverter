const BOOK_TEMPLATES = {
  mobile: {
    name: "Optimizat Mobil",
    description: "Perfect pentru telefoane - text mare, paginare optimă",
    calibreSettings: {
      '--output-profile': 'tablet',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '160',
      '--margin-left': '0',
      '--margin-right': '0', 
      '--margin-top': '0',
      '--margin-bottom': '0',
      '--max-toc-links': '0',
      '--chapter': 'detect-none',
      '--no-chapters': '',
      '--expand-css': '',
      '--extra-css': 'html { height: 100% !important; } body { font-size: 1.3em !important; line-height: 1.7 !important; margin: 0 !important; padding: 0.5em !important; height: 100vh !important; max-width: 100vw !important; box-sizing: border-box !important; } p { margin: 0.6em 0 !important; text-align: justify !important; } img { max-width: 100% !important; width: 100% !important; height: auto !important; display: block !important; margin: 1em auto !important; page-break-inside: avoid !important; } @media (max-width: 430px) { body { font-size: 1.4em !important; padding: 0.3em !important; } } @media (min-width: 431px) and (max-width: 768px) { body { font-size: 1.3em !important; padding: 0.4em !important; } }'
    }
  },

  tablet: {
    name: "Optimizat Tablet/iPad",
    description: "Perfect pentru iPad - layout fluid, imagini mari",
    calibreSettings: {
      '--output-profile': 'ipad3',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '150',
      '--margin-left': '5',
      '--margin-right': '5',
      '--margin-top': '5', 
      '--margin-bottom': '5',
      '--max-toc-links': '0',
      '--chapter': 'detect-none',
      '--no-chapters': '',
      '--expand-css': '',
      '--extra-css': 'body { font-size: 1.1em !important; max-width: 100% !important; } p { text-align: justify !important; margin: 0.8em 0 !important; } img { max-width: 100% !important; width: 100% !important; height: auto !important; page-break-inside: avoid !important; } @media (max-width: 600px) { body { font-size: 1.3em !important; } }'
    }
  },

  children: {
    name: "Cărți de Copii",
    description: "Optimizat pentru imagini mari și text simplu",
    calibreSettings: {
      '--output-profile': 'ipad3',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '150',
      '--margin-left': '10',
      '--margin-right': '10',
      '--margin-top': '10', 
      '--margin-bottom': '10',
      '--max-toc-links': '0',
      '--chapter': 'detect-none',
      '--no-chapters': '',
      '--expand-css': ''
    }
  },
  
  novel: {
    name: "Roman/Ficțiune",
    description: "Optimizat pentru citit text lung",
    calibreSettings: {
      '--output-profile': 'kindle',
      '--epub-version': '3',
      '--smarten-punctuation': '',
      '--chapter': '//h:h1 | //h:h2',
      '--page-breaks-before': '//h:h1',
      '--margin-left': '5',
      '--margin-right': '5',
      '--margin-top': '5',
      '--margin-bottom': '5',
      '--minimum-line-height': '120',
      '--embed-all-fonts': '',
      '--disable-font-rescaling': ''
    }
  },

  technical: {
    name: "Cărți Tehnice",
    description: "Păstrează formatare complexă și tabele",
    calibreSettings: {
      '--output-profile': 'generic_eink',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--expand-css': '',
      '--margin-left': '8',
      '--margin-right': '8',
      '--margin-top': '8',
      '--margin-bottom': '8',
      '--minimum-line-height': '130',
      '--chapter': '//h:h1 | //h:h2 | //h:h3',
      '--page-breaks-before': '//h:h1'
    }
  },

  magazine: {
    name: "Reviste/Ziare", 
    description: "Layout cu coloane și imagini complexe",
    calibreSettings: {
      '--output-profile': 'ipad3',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--margin-left': '3',
      '--margin-right': '3',
      '--margin-top': '3',
      '--margin-bottom': '3',
      '--minimum-line-height': '110',
      '--max-toc-links': '0',
      '--chapter': 'detect-none',
      '--no-chapters': ''
    }
  },

  magazine: {
    name: "Revistă/Imagini",
    description: "Pentru cărți cu multe imagini - optimizat mobile",
    calibreSettings: {
      '--output-profile': 'tablet',
      '--epub-version': '3', 
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--minimum-line-height': '140',
      '--margin-left': '2',
      '--margin-right': '2',
      '--margin-top': '2',
      '--margin-bottom': '2',
      '--expand-css': '',
      '--extra-css': 'body { font-size: 1.1em !important; } img { max-width: 100% !important; width: 100% !important; height: auto !important; display: block !important; margin: 1em auto !important; page-break-inside: avoid !important; } p { text-align: justify !important; margin: 0.6em 0 !important; } @media (max-width: 768px) { body { font-size: 1.4em !important; padding: 0.5em !important; } img { margin: 0.5em 0 !important; } }'
    }
  },

  fullscreen: {
    name: "Ecran Complet Mobile",
    description: "Ocupă întreg ecranul pe telefon - fără margini",
    calibreSettings: {
      '--output-profile': 'tablet',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',
 
      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '155',
      '--margin-left': '0',
      '--margin-right': '0',
      '--margin-top': '0',
      '--margin-bottom': '0',
      '--max-toc-links': '0',
      '--expand-css': '',
      '--extra-css': 'html { height: 100% !important; overflow-x: hidden !important; } body { font-size: 1.4em !important; padding: 0 !important; margin: 0 !important; max-width: 100vw !important; height: 100vh !important; line-height: 1.8 !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; justify-content: center !important; } p { text-align: center !important; margin: 0.8em 0.5em !important; padding: 0 0.5em !important; } img { max-width: 100% !important; width: 100% !important; height: auto !important; display: block !important; margin: 1em auto !important; border-radius: 8px !important; box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; page-break-inside: avoid !important; } h1, h2, h3 { text-align: center !important; margin: 1em 0.5em !important; } @media (max-width: 430px) { body { font-size: 1.5em !important; } } @media (orientation: landscape) { body { flex-direction: row !important; justify-content: space-around !important; } }'
    }
  },

  iphone15: {
    name: "iPhone 15 Pro Max - Apple Books",
    description: "Clean Apple Books style - centered content",
    calibreSettings: {
      '--output-profile': 'tablet',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',

      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '160',
      '--margin-left': '0',
      '--margin-right': '0',
      '--margin-top': '0',
      '--margin-bottom': '0',
      '--max-toc-links': '0',
      '--expand-css': '',
      '--use-auto-toc': '',
      '--extra-css': '@page { margin: 0 !important; } html { margin: 0 !important; padding: 0 !important; background: #39454F !important; height: 100% !important; } body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif !important; font-size: 1.2em !important; line-height: 1.6 !important; color: #ffffff !important; background: #39454F !important; margin: 0 !important; padding: 0 !important; text-align: center !important; width: 100% !important; height: 100vh !important; box-sizing: border-box !important; -webkit-font-smoothing: antialiased !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; } svg { display: block !important; margin: 0 auto !important; max-width: 100% !important; width: auto !important; max-height: 95vh !important; height: auto !important; object-fit: contain !important; border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; page-break-before: always !important; page-break-after: always !important; page-break-inside: avoid !important; position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; } svg image { max-width: 100% !important; max-height: 95vh !important; width: auto !important; height: auto !important; object-fit: contain !important; border-radius: 12px !important; } .content, div, section, article, main { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; height: 100% !important; } h1, h2, h3, h4, h5, h6 { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif !important; font-weight: 600 !important; color: #ffffff !important; text-align: center !important; margin: 20px 10px !important; page-break-before: auto !important; page-break-after: avoid !important; } h1 { font-size: 2em !important; font-weight: 700 !important; page-break-before: always !important; } h2 { font-size: 1.6em !important; } h3 { font-size: 1.3em !important; } p { text-align: center !important; margin: 10px 20px !important; color: #ffffff !important; hyphens: auto !important; -webkit-hyphens: auto !important; text-indent: 0 !important; page-break-inside: avoid !important; } img { display: block !important; margin: 0 auto !important; max-width: 100% !important; width: auto !important; max-height: 95vh !important; height: auto !important; object-fit: contain !important; border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; page-break-before: always !important; page-break-after: always !important; page-break-inside: avoid !important; position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; } .calibre_3, .calibre_4, .calibre_5, .calibre_6, .calibre_7, .calibre_8 { display: flex !important; justify-content: center !important; align-items: center !important; height: 100vh !important; width: 100% !important; position: relative !important; } blockquote { font-style: italic !important; margin: 20px 0 !important; padding: 20px 25px !important; border-left: 4px solid #007aff !important; background: #2c353d !important; color: #ffffff !important; border-radius: 8px !important; page-break-inside: avoid !important; }'
    }
  },

  default: {
    name: "Standard",
    description: "Setări echilibrate pentru majoritatea cărților",
    calibreSettings: {
      '--output-profile': 'generic_eink',
      '--epub-version': '3',
      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '130',
      '--margin-left': '5',
      '--margin-right': '5',
      '--margin-top': '5',
      '--margin-bottom': '5'
    }
  }
};

/**
 * Obține setările pentru un template specificat și format
 * @param {string} templateName - Numele template-ului
 * @param {string} format - Formatul de output (epub/mobi)
 * @returns {object} Setările template-ului
 */
function getTemplateSettings(templateName, format = 'epub') {
  const template = BOOK_TEMPLATES[templateName] || BOOK_TEMPLATES.default;
  const settings = { ...template.calibreSettings };
  
  // Elimină setările incompatibile pentru MOBI
  if (format === 'mobi') {
    const mobiIncompatible = [
      '--epub-version', '--epub-flatten', '--epub-toc-at-end', 
      '--no-chapters', '--chapter', '--page-breaks-before'
    ];
    
    mobiIncompatible.forEach(key => {
      delete settings[key];
    });
    
    // Înlocuiește cu setări compatibile MOBI
    if (settings['--output-profile'] === 'ipad3') {
      settings['--output-profile'] = 'kindle_pw3';
    }
  }
  
  return { ...template, calibreSettings: settings };
}

/**
 * Obține lista tuturor template-urilor disponibile
 * @returns {object} Lista template-urilor cu nume și descrieri
 */
function getAvailableTemplates() {
  const templates = {};
  Object.keys(BOOK_TEMPLATES).forEach(key => {
    templates[key] = {
      name: BOOK_TEMPLATES[key].name,
      description: BOOK_TEMPLATES[key].description
    };
  });
  return templates;
}

/**
 * Validează dacă un template există
 * @param {string} templateName - Numele template-ului de validat
 * @returns {boolean} True dacă template-ul există
 */
function isValidTemplate(templateName) {
  return templateName && BOOK_TEMPLATES.hasOwnProperty(templateName);
}

module.exports = {
  BOOK_TEMPLATES,
  getTemplateSettings,
  getAvailableTemplates,
  isValidTemplate
};
