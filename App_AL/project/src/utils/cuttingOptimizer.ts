interface CutPiece {
  length: number;
  windowType: string;
  pieceType?: string; // Nuevo campo para identificar el tipo de pieza (vertical, horizontal)
}

interface CuttingResult {
  piecesNeeded: number;
  remainders: number[];
  cuts: {
    fromNewProfile: CutPiece[];
    fromRemainders: CutPiece[];
    newProfilesRequired: number;
  };
  detailedCuts?: {
    profileNumber: number;
    cuts: {
      piece: CutPiece;
      remainderAfterCut: number;
    }[];
  }[];
}

/**
 * Algoritmo de optimización de corte mejorado - First Fit Decreasing (FFD)
 * Regla principal: NUNCA unir dos sobrantes para formar una pieza
 * Si una pieza no cabe en un único sobrante, se compra un perfil nuevo
 */
export function optimizeCutting(pieces: CutPiece[], profileLength: number = 600): CuttingResult {
  console.log('🔧 Iniciando optimización de corte con piezas:', pieces);
  
  // Expandir piezas que son más largas que un perfil
  const expandedPieces: CutPiece[] = [];
  
  pieces.forEach(piece => {
    if (piece.length > profileLength) {
      // Dividir la pieza en perfiles completos y un sobrante
      const completeProfiles = Math.floor(piece.length / profileLength);
      const remainder = piece.length % profileLength;
      
      console.log(`📏 Pieza de ${piece.length}cm es más larga que ${profileLength}cm:`);
      console.log(`   - Se divide en ${completeProfiles} perfil(es) completo(s) de ${profileLength}cm`);
      if (remainder > 0) {
        console.log(`   - Más un sobrante de ${remainder}cm`);
      }
      
      // Agregar los perfiles completos
      for (let i = 0; i < completeProfiles; i++) {
        expandedPieces.push({
          length: profileLength,
          windowType: piece.windowType,
          pieceType: `${piece.pieceType || 'pieza'}_parte_${i + 1}`
        });
      }
      
      // Agregar el sobrante si existe
      if (remainder > 0) {
        expandedPieces.push({
          length: remainder,
          windowType: piece.windowType,
          pieceType: `${piece.pieceType || 'pieza'}_sobrante`
        });
      }
    } else {
      expandedPieces.push(piece);
    }
  });
  
  // Ordenar piezas de mayor a menor (First Fit Decreasing)
  const sortedPieces = [...expandedPieces].sort((a, b) => b.length - a.length);
  console.log('📋 Piezas ordenadas de mayor a menor:', sortedPieces.map(p => `${p.length}cm (${p.windowType})`));
  
  let remainders: number[] = [];
  let newProfilesUsed = 0;
  const fromNewProfile: CutPiece[] = [];
  const fromRemainders: CutPiece[] = [];
  const detailedCuts: { profileNumber: number; cuts: { piece: CutPiece; remainderAfterCut: number }[] }[] = [];

  for (const piece of sortedPieces) {
    console.log(`\n🔍 Procesando pieza de ${piece.length}cm (${piece.windowType})`);
    
    // Buscar un sobrante que pueda contener la pieza completa
    const suitableRemainderIndex = remainders.findIndex(remainder => remainder >= piece.length);
    
    if (suitableRemainderIndex !== -1) {
      // Usar el sobrante existente
      const usedRemainder = remainders[suitableRemainderIndex];
      const newRemainder = usedRemainder - piece.length;
      
      console.log(`✅ Usando sobrante de ${usedRemainder}cm`);
      console.log(`   - Después del corte queda: ${newRemainder}cm`);
      
      // Remover el sobrante usado
      remainders.splice(suitableRemainderIndex, 1);
      
      // Agregar el nuevo sobrante si es mayor a 0
      if (newRemainder > 0) {
        remainders.push(newRemainder);
      }
      
      fromRemainders.push(piece);
    } else {
      // REGLA CLAVE: No unir sobrantes, comprar perfil nuevo
      console.log(`🆕 No hay sobrante único suficiente. Comprando perfil nuevo.`);
      console.log(`   - Sobrantes disponibles: [${remainders.join(', ')}]cm`);
      
      // Comprar un perfil nuevo
      newProfilesUsed++;
      const newRemainder = profileLength - piece.length;
      
      console.log(`   - Perfil nuevo #${newProfilesUsed}: cortando ${piece.length}cm`);
      console.log(`   - Sobrante generado: ${newRemainder}cm`);
      
      // Registrar el corte detallado
      const profileIndex = detailedCuts.findIndex(p => p.profileNumber === newProfilesUsed);
      if (profileIndex === -1) {
        detailedCuts.push({
          profileNumber: newProfilesUsed,
          cuts: [{ piece, remainderAfterCut: newRemainder }]
        });
      } else {
        detailedCuts[profileIndex].cuts.push({ piece, remainderAfterCut: newRemainder });
      }
      
      if (newRemainder > 0) {
        remainders.push(newRemainder);
      }
      
      fromNewProfile.push(piece);
    }
  }

  // Ordenar sobrantes de mayor a menor para mejor visualización
  remainders.sort((a, b) => b - a);

  console.log(`\n📊 Resultado final:`);
  console.log(`   - Perfiles nuevos necesarios: ${newProfilesUsed}`);
  console.log(`   - Sobrantes finales: [${remainders.join(', ')}]cm`);
  console.log(`   - Piezas cortadas de perfiles nuevos: ${fromNewProfile.length}`);
  console.log(`   - Piezas cortadas de sobrantes: ${fromRemainders.length}`);

  return {
    piecesNeeded: newProfilesUsed,
    remainders,
    cuts: {
      fromNewProfile,
      fromRemainders,
      newProfilesRequired: newProfilesUsed
    },
    detailedCuts
  };
}

/**
 * Obtiene las fórmulas de medidas para un tipo de ventana específico
 */
function getWindowFormulas(windowType: string, line: string) {
  const formulas = {
    'L3': {
      'Fija Corrediza': {
        jambaVerticalHeight: 2.7,
        ventilaFijaHeight: 2.8,
        ventilaCorrHeight: 3.7,
        zocloWidth: 18,
      },
      'Doble Corrediza': {
        jambaVerticalHeight: 2.7,
        ventilaCorrHeight: 3.7,
        rielAdicionalWidth: 2.7,
        zocloWidth: 18,
      },
      '2 Fijos 2 Corredizos': {
        jambaVerticalHeight: 2.7,
        ventilaFijaHeight: 2.8,
        ventilaCorrHeight: 3.7,
        zocloWidth: 33.5,
      },
      '4 Corredizas': {
        jambaVerticalHeight: 2.7,
        ventilaCorrHeight: 3.7,
        rielAdicionalWidth: 2.7,
        zocloWidth: 34,
      }
    },
    'L2': {
      'Fija Corrediza': {
        jambaVerticalHeight: 2.8,
        ventilaFijaHeight: 3.0,
        ventilaCorrHeight: 4.0,
        zocloWidth: 16.2,
      },
      'Doble Corrediza': {
        jambaVerticalHeight: 2.8,
        ventilaCorrHeight: 4.0,
        rielAdicionalWidth: 2.7,
        zocloWidth: 16.2,
      }
    }
  };

  const lineFormulas = formulas[line as keyof typeof formulas];
  if (!lineFormulas) return null;
  
  return lineFormulas[windowType as keyof typeof lineFormulas] || null;
}

/**
 * Calcula las piezas individuales de cualquier perfil para una ventana específica
 */
function calculateIndividualProfilePieces(
  profileType: string,
  windowType: string,
  line: string,
  width: number,
  height: number,
  windowId: string
): CutPiece[] {
  const pieces: CutPiece[] = [];
  const formulas = getWindowFormulas(windowType, line);
  
  if (!formulas) {
    console.warn(`No se encontraron fórmulas para ${windowType} en línea ${line}`);
    return pieces;
  }

  console.log(`📐 Calculando piezas de ${profileType} para ${windowId}: ${width}cm x ${height}cm`);

  switch (profileType) {
    case 'JAMBA':
      // Jamba vertical (siempre 2 piezas)
      const jambaVerticalLength = height - formulas.jambaVerticalHeight;
      pieces.push({
        length: jambaVerticalLength,
        windowType: windowId,
        pieceType: 'jamba_vertical_1'
      });
      pieces.push({
        length: jambaVerticalLength,
        windowType: windowId,
        pieceType: 'jamba_vertical_2'
      });
      
      // Jamba horizontal (siempre 1 pieza)
      pieces.push({
        length: width,
        windowType: windowId,
        pieceType: 'jamba_horizontal'
      });
      break;

    case 'RIEL':
      // Riel principal (siempre 1 pieza del ancho)
      pieces.push({
        length: width,
        windowType: windowId,
        pieceType: 'riel_principal'
      });
      break;

    case 'RIEL ADICIONAL':
      // Solo para tipos que lo requieren
      if (windowType === 'Doble Corrediza' || windowType === '4 Corredizas') {
        const rielAdicionalLength = width - (formulas.rielAdicionalWidth || 2.7);
        pieces.push({
          length: rielAdicionalLength,
          windowType: windowId,
          pieceType: 'riel_adicional'
        });
      }
      break;

    case 'CERCO':
      if (windowType === 'Fija Corrediza') {
        // Ventila fija: 1 pieza
        const ventilaFijaLength = height - formulas.ventilaFijaHeight;
        pieces.push({
          length: ventilaFijaLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_fija'
        });
        
        // Ventila corrediza: 1 pieza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_corrediza'
        });
      } else if (windowType === 'Doble Corrediza') {
        // 2 piezas de ventila corrediza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_corrediza_1'
        });
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_corrediza_2'
        });
      } else if (windowType === '2 Fijos 2 Corredizos') {
        // 2 piezas de ventila fija
        const ventilaFijaLength = height - formulas.ventilaFijaHeight;
        pieces.push({
          length: ventilaFijaLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_fija_1'
        });
        pieces.push({
          length: ventilaFijaLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_fija_2'
        });
        
        // 2 piezas de ventila corrediza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_corrediza_1'
        });
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'cerco_ventila_corrediza_2'
        });
      } else if (windowType === '4 Corredizas') {
        // 4 piezas de ventila corrediza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        for (let i = 1; i <= 4; i++) {
          pieces.push({
            length: ventilaCorrLength,
            windowType: windowId,
            pieceType: `cerco_ventila_corrediza_${i}`
          });
        }
      }
      break;

    case 'TRASLAPE':
      if (windowType === 'Fija Corrediza') {
        // Ventila fija: 1 pieza
        const ventilaFijaLength = height - formulas.ventilaFijaHeight;
        pieces.push({
          length: ventilaFijaLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_fija'
        });
        
        // Ventila corrediza: 1 pieza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_corrediza'
        });
      } else if (windowType === 'Doble Corrediza') {
        // 2 piezas de ventila corrediza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_corrediza_1'
        });
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_corrediza_2'
        });
      } else if (windowType === '2 Fijos 2 Corredizos') {
        // 2 piezas de ventila fija
        const ventilaFijaLength = height - formulas.ventilaFijaHeight;
        pieces.push({
          length: ventilaFijaLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_fija_1'
        });
        pieces.push({
          length: ventilaFijaLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_fija_2'
        });
        
        // 2 piezas de ventila corrediza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_corrediza_1'
        });
        pieces.push({
          length: ventilaCorrLength,
          windowType: windowId,
          pieceType: 'traslape_ventila_corrediza_2'
        });
      } else if (windowType === '4 Corredizas') {
        // 4 piezas de ventila corrediza
        const ventilaCorrLength = height - formulas.ventilaCorrHeight;
        for (let i = 1; i <= 4; i++) {
          pieces.push({
            length: ventilaCorrLength,
            windowType: windowId,
            pieceType: `traslape_ventila_corrediza_${i}`
          });
        }
      }
      break;

    case 'ZOCLO':
      // Calcular longitud de zócalo según el tipo de ventana
      let zocloLength: number;
      let zocloPieces: number;
      
      if (windowType === 'Fija Corrediza' || windowType === 'Doble Corrediza') {
        zocloLength = (width - formulas.zocloWidth) / 2;
        zocloPieces = 4; // 2 superiores + 2 inferiores
      } else if (windowType === '2 Fijos 2 Corredizos' || windowType === '4 Corredizas') {
        zocloLength = (width - formulas.zocloWidth) / 4;
        zocloPieces = 8; // 4 superiores + 4 inferiores
      } else {
        break;
      }
      
      // Agregar todas las piezas de zócalo
      for (let i = 1; i <= zocloPieces; i++) {
        const isUpper = i <= zocloPieces / 2;
        pieces.push({
          length: zocloLength,
          windowType: windowId,
          pieceType: `zoclo_${isUpper ? 'superior' : 'inferior'}_${i}`
        });
      }
      break;
  }
  
  return pieces;
}

/**
 * Calcula las piezas individuales de jamba para una ventana específica (función original)
 */
function calculateIndividualJambaPieces(
  windowType: string,
  width: number,
  height: number,
  windowId: string
): CutPiece[] {
  return calculateIndividualProfilePieces('JAMBA', windowType, 'L3', width, height, windowId);
}

/**
 * Calcula la optimización para un tipo específico de perfil usando piezas individuales
 */
export function calculateProfileOptimization(
  profileType: string,
  quotedWindows: any[],
  profileLength: number = 600,
  zocloPosition?: 'superior' | 'inferior'
): CuttingResult {
  console.log(`🏗️ Calculando optimización de ${profileType} con piezas individuales${zocloPosition ? ` (${zocloPosition})` : ''}`);

  const allProfilePieces: CutPiece[] = [];

  quotedWindows.forEach((window, index) => {
    const width = parseFloat(window.width);
    const height = parseFloat(window.height);
    const windowId = `Ventana #${index + 1} - ${window.type}`;

    console.log(`📐 Procesando ${windowId}: ${width}cm x ${height}cm`);

    if (!isNaN(width) && !isNaN(height)) {
      const individualPieces = calculateIndividualProfilePieces(
        profileType,
        window.type,
        window.line.includes('2') ? 'L2' : 'L3',
        width,
        height,
        windowId
      );

      let filteredPieces = individualPieces;

      if (profileType === 'ZOCLO' && zocloPosition) {
        filteredPieces = individualPieces.filter(piece =>
          piece.pieceType?.includes(zocloPosition)
        );
        console.log(`   - Piezas de ZOCLO ${zocloPosition}:`, filteredPieces.map(p => `${p.length.toFixed(1)}cm (${p.pieceType})`));
      } else {
        console.log(`   - Piezas individuales de ${profileType}:`, individualPieces.map(p => `${p.length.toFixed(1)}cm (${p.pieceType})`));
      }

      allProfilePieces.push(...filteredPieces);
    }
  });

  console.log(`\n📦 Total de piezas individuales de ${profileType}${zocloPosition ? ` (${zocloPosition})` : ''}: ${allProfilePieces.length}`);
  console.log('📋 Lista completa:', allProfilePieces.map(p => `${p.length.toFixed(1)}cm - ${p.windowType} (${p.pieceType})`));

  return optimizeCutting(allProfilePieces, profileLength);
}

/**
 * Calcula la optimización específica para jambas usando piezas individuales (función original mantenida para compatibilidad)
 */
export function calculateJambaOptimization(
  quotedWindows: any[],
  profileLength: number = 600
): CuttingResult {
  return calculateProfileOptimization('JAMBA', quotedWindows, profileLength);
}