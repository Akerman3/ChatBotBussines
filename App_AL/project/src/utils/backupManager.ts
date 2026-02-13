// Definir todas las claves de localStorage organizadas por categorías
const CATEGORIES = {
  // Configuración Global
  ConfiguracionGlobal: [
    'selectedColor',
    'defaultChargingMethod',
    'defaultGlassChargingMethod',
    'materialIvaPercentage',
    'userIvaPercentage',
    'selectedCostMethod'
  ],

  // Notas y Lienzo
  NotasLienzo: [
    'notesCanvasComponents',
    'savedPackages'
  ],

  // Base de Datos de Precios
  BaseDatosPrecios: [
    'windowProfiles',
    'windowHardware', 
    'windowGlass'
  ],

  // Calculadoras de Trabajo - Línea Nacional de 3
  CalculadorasTrabajoL3: [
    // Fijo Corredizo L3
    'windowWidth',
    'windowHeight',
    'windowZoclo',
    'windowFormula',
    'windowGlassAdjustment',

    // Doble Corrediza L3
    'xxWidth',
    'xxHeight',
    'xxZocloSelection',
    'xxFormula_L3',
    'xxGlassAdjustment',

    // 2 Fijos 2 Corredizos L3
    'twoFixedTwoSlidingWidth',
    'twoFixedTwoSlidingHeight',
    'twoFixedTwoSlidingZoclo',
    'twoFixedTwoSlidingFormula',
    'twoFixedTwoSlidingGlassAdjustment',

    // 4 Corredizas L3
    'fourSlidingWidth',
    'fourSlidingHeight',
    'fourSlidingZoclo',
    'fourSlidingFormula',
    'fourSlidingGlassAdjustment'
  ],

  // Calculadoras de Trabajo - Línea Nacional de 2
  CalculadorasTrabajoL2: [
    // Fijo Corredizo L2
    'windowLine2Width',
    'windowLine2Height',
    'windowLine2Zoclo',
    'windowLine2Formula',
    'windowCalculatorLine2Formula',
    'windowLine2GlassAdjustment',

    // Doble Corrediza L2
    'xxFormula_L2'
  ],

  // Calculadora de Puertas
  CalculadoraPuertas: [
    'doorWidth',
    'doorHeight',
    'doorDrag',
    'doorFormula'
  ],

  // Fórmulas Personalizadas de Cotizadores
  FormulasPersonalizadasCotizadores: [
    'fixedSlidingFormula',
    'fourSlidingFormula',
    'fourSlidingQuoteFormula',
    'twoFixedTwoSlidingFormula',
    'two_fixed_two_sliding_quote_formula',
    'double_sliding_quote_formula',
    'fixedSlidingLine2QuoteFormula',
    'doubleSlidingLine2QuoteFormula'
  ],

  // Cotizadores - Línea Nacional de 3
  CotizadoresL3: [
    // Fijo Corredizo Quote L3
    'fixedSlidingWidth',
    'fixedSlidingHeight',
    'fixedSlidingZoclo',
    'selectedAdditionalHardware',
    'selectedAdditionalGlass',
    'fixed_sliding_line3_glass_adjustment',

    // Doble Corrediza Quote L3
    'double_sliding_quote_width',
    'double_sliding_quote_height',
    'double_sliding_quote_zoclo',
    'selectedDoubleSlidingHardware',
    'selectedDoubleSlidingQuoteGlass',
    'double_sliding_quote_glass_adjustment',

    // 2 Fijos 2 Corredizos Quote L3
    'two_fixed_two_sliding_quote_width',
    'two_fixed_two_sliding_quote_height',
    'two_fixed_two_sliding_quote_zoclo',
    'selectedTwoFixedTwoSlidingHardware',
    'selectedTwoFixedTwoSlidingGlass',
    'two_fixed_two_sliding_quote_glass_adjustment',

    // 4 Corredizas Quote L3
    'fourSlidingQuoteWidth',
    'fourSlidingQuoteHeight',
    'fourSlidingQuoteZoclo',
    'selectedFourSlidingHardware',
    'selectedFourSlidingGlass',
    'fourSlidingQuoteGlassAdjustment'
  ],

  // Cotizadores - Línea Nacional de 2
  CotizadoresL2: [
    // Fijo Corredizo Quote L2
    'fixedSlidingLine2QuoteWidth',
    'fixedSlidingLine2QuoteHeight',
    'fixedSlidingLine2QuoteZoclo',
    'selectedFixedSlidingLine2Hardware',
    'selectedFixedSlidingLine2Glass',
    'fixedSlidingLine2GlassAdjustment',

    // Doble Corrediza Quote L2
    'doubleSlidingLine2QuoteWidth',
    'doubleSlidingLine2QuoteHeight',
    'doubleSlidingLine2QuoteZoclo',
    'selectedDoubleSlidingLine2Hardware',
    'selectedDoubleSlidingLine2Glass',
    'doubleSlidingLine2GlassAdjustment'
  ],

  // Generador de Fórmulas Personalizadas
  GeneradorFormulas: [
    'customCalculators',
    'formulaGeneratorPackagePieces',
    'savedFormulaPiecePackages',
    'customFormula'
  ],

  // Generador de Fórmulas de Puertas
  GeneradorFormulasPuertas: [
    'doorCustomCalculators',
    'doorFormulaGeneratorPackagePieces',
    'savedDoorFormulaPiecePackages'
  ],

  // Paquete de Piezas de Trabajo
  PaquetePiezasTrabajo: [
    'packagePieces',
    'packageGlasses',
    'savedPiecePackages'
  ],

  // Paquete Cotizado
  PaqueteCotizado: [
    'quotedWindowsPackage',
    'savedQuotedPackages',
    'standaloneHardwareItems'
  ],

  // Cotizador General
  CotizadorGeneral: [
    'generalQuoteSelectedProfiles',
    'generalQuoteSelectedHardware',
    'generalQuoteSelectedGlass',
    'generalQuoteProfitPercentage',
    'generalQuoteIvaPercentage',
    'generalQuoteExtraCostsList',
    'generalQuoteNewExtraCostName',
    'generalQuoteNewExtraCostAmount',
    'generalQuoteName',
    'savedGeneralQuotes'
  ],

  // Estado de Cotizaciones Actuales
  SistemaCotizaciones: [
    'currentWindowPackageQuoteId',
    'currentWindowPackageQuoteName',
    'generalQuoteCurrentId'
  ],

  // Sistema de Inventario
  SistemaInventario: [
    'inventory_suppliers',
    'inventory_profiles',
    'inventory_glass',
    'inventory_hardware',
    'inventory_transactions',
    'inventory_price_history'
  ],

  // Optimización de Vidrios
  OptimizacionVidrios: [
    'glassOptimizationProjects'
  ],

  // Hoja de Cotización
  HojaCotizacion: [
    'alcalc_quote_fixedData_v1',
    'alcalc_quote_savedQuotes_v1'
  ],

  // Autenticación y Dispositivos
  Autenticacion: [
    'alcalc.deviceLockNotice.pending',
    'alcalc.lastEmail'
  ],

  // Configuración de Debug
  ConfiguracionDebug: [
    'ALC_DEBUG'
  ]
};

// Crear un array plano con todas las claves para facilitar operaciones
const ALL_LOCAL_STORAGE_KEYS = Object.values(CATEGORIES).flat();

/**
 * Genera un JSON estructurado con todos los datos de la aplicación
 * organizados por categorías y con etiquetas descriptivas
 */
function generateBackupJson(): string {
  const backupData: any = {
    // Metadatos del backup
    _metadata: {
      appName: "AL Calculadora",
      version: "1.1.0",
      backupDate: new Date().toISOString(),
      description: "Copia de seguridad completa de AL Calculadora - Incluye todas las configuraciones, datos de trabajo y cotizaciones",
      totalCategorias: Object.keys(CATEGORIES).length,
      totalClaves: ALL_LOCAL_STORAGE_KEYS.length
    }
  };

  // Iterar sobre cada categoría y organizar los datos
  Object.entries(CATEGORIES).forEach(([categoryName, keys]) => {
    const categoryData: any = {};
    let hasData = false;

    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Intentar parsear como JSON, si falla usar el valor directo
          try {
            categoryData[key] = JSON.parse(value);
          } catch {
            categoryData[key] = value;
          }
          hasData = true;
        }
      } catch (error) {
        console.warn(`Error al leer la clave ${key} de localStorage:`, error);
      }
    });

    // Solo agregar la categoría si tiene datos
    if (hasData) {
      backupData[categoryName] = {
        _descripcion: getCategoryDescription(categoryName),
        _totalElementos: Object.keys(categoryData).length,
        ...categoryData
      };
    }
  });

  // Agregar información adicional sobre el estado de la aplicación
  backupData._estadoAplicacion = {
    totalCategoriasConDatos: Object.keys(backupData).length - 2, // -2 por _metadata y _estadoAplicacion
    fechaGeneracion: new Date().toLocaleString('es-MX'),
    navegadorInfo: {
      userAgent: navigator.userAgent,
      idioma: navigator.language,
      plataforma: navigator.platform
    },
    estadisticasBackup: getBackupStats()
  };

  return JSON.stringify(backupData, null, 2); // Formatear con indentación para legibilidad
}

/**
 * Obtiene una descripción legible para cada categoría
 */
function getCategoryDescription(categoryName: string): string {
  const descriptions: { [key: string]: string } = {
    ConfiguracionGlobal: "Configuraciones generales de la aplicación como colores, métodos de cobro e IVA",
    NotasLienzo: "Datos del lienzo de notas y paquetes guardados de componentes",
    BaseDatosPrecios: "Base de datos de precios de perfiles, herrajes y vidrios",
    CalculadorasTrabajoL3: "Estados y configuraciones de calculadoras de trabajo para Línea Nacional de 3 incluyendo ajustes de vidrios",
    CalculadorasTrabajoL2: "Estados y configuraciones de calculadoras de trabajo para Línea Nacional de 2 incluyendo ajustes de vidrios",
    CalculadoraPuertas: "Configuraciones y estados de la calculadora de puertas",
    CotizadoresL3: "Estados y configuraciones de cotizadores para Línea Nacional de 3 incluyendo vidrios seleccionados y ajustes de vidrios",
    CotizadoresL2: "Estados y configuraciones de cotizadores para Línea Nacional de 2 incluyendo vidrios seleccionados y ajustes de vidrios",
    GeneradorFormulas: "Calculadoras personalizadas y paquetes de fórmulas creados por el usuario",
    FormulasPersonalizadasCotizadores: "Fórmulas personalizadas guardadas para calculadoras de cotización de ventanas y puertas",
    GeneradorFormulasPuertas: "Calculadoras personalizadas y paquetes de fórmulas de puertas creados por el usuario",
    PaquetePiezasTrabajo: "Paquetes de piezas y vidrios para trabajo y proyectos guardados",
    PaqueteCotizado: "Paquetes cotizados y elementos adicionales para cotizaciones",
    CotizadorGeneral: "Configuraciones y cotizaciones del cotizador general personalizado",
    SistemaCotizaciones: "IDs y nombres de cotizaciones actualmente en progreso, esenciales para continuar trabajos al cambiar de dispositivo",
    SistemaInventario: "Sistema de gestión de inventario incluyendo proveedores, productos, transacciones e historial de precios",
    OptimizacionVidrios: "Proyectos guardados del optimizador de cortes de vidrio",
    HojaCotizacion: "Sistema de hojas de cotización con datos fijos de la empresa y cotizaciones guardadas",
    Autenticacion: "Datos de autenticación y configuración de dispositivos del usuario",
    ConfiguracionDebug: "Configuraciones de depuración y logs del sistema"
  };

  return descriptions[categoryName] || "Categoría de datos de la aplicación";
}

/**
 * Genera y devuelve el string JSON de la copia de seguridad
 * Este string está listo para ser enviado a Firestore
 */
export function getBackupJsonString(): { success: boolean; jsonString?: string; message: string } {
  try {
    console.log('🔧 Generando string JSON de backup...');
    
    const jsonString = generateBackupJson();
    const stats = getBackupStats();
    
    console.log('✅ String JSON de backup generado exitosamente');
    console.log(`📊 Estadísticas: ${stats.totalKeys} elementos en ${stats.categoriesWithData} categorías`);
    
    return {
      success: true,
      jsonString,
      message: `¡String JSON de backup generado exitosamente! Contiene ${stats.totalKeys} elementos organizados en ${stats.categoriesWithData} categorías. Listo para enviar a Firestore.`
    };
    
  } catch (error) {
    console.error('❌ Error al generar el string JSON de backup:', error);
    return {
      success: false,
      message: `Error al generar la copia de seguridad: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Restaura los datos del localStorage a partir de un string JSON
 * Este string debe provenir de Firestore
 */
export function restoreFromJsonString(jsonString: string): { success: boolean; message: string } {
  try {
    console.log('🔧 Iniciando proceso de restauración desde string JSON...');
    
    // Parsear y validar el JSON
    const restoredData = JSON.parse(jsonString);
    
    // Verificar que el JSON tenga la estructura esperada
    if (!restoredData._metadata || restoredData._metadata.appName !== "AL Calculadora") {
      throw new Error('El JSON de backup no es válido para AL Calculadora');
    }

    let restoredKeysCount = 0;
    let categoriesRestored = 0;

    console.log('🔧 Limpiando localStorage antes de restaurar...');
    // Limpiar localStorage antes de restaurar para una restauración limpia
    ALL_LOCAL_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🔧 Restaurando datos por categoría...');
    // Restaurar datos por categoría
    Object.entries(CATEGORIES).forEach(([categoryName, keys]) => {
      if (restoredData[categoryName]) {
        categoriesRestored++;
        console.log(`📂 Restaurando categoría: ${categoryName}`);
        
        keys.forEach(key => {
          if (restoredData[categoryName][key] !== undefined) {
            try {
              // Convertir a string JSON si es un objeto/array, sino usar el valor directo
              const valueToStore = typeof restoredData[categoryName][key] === 'object' 
                ? JSON.stringify(restoredData[categoryName][key])
                : restoredData[categoryName][key];
              
              localStorage.setItem(key, valueToStore);
              restoredKeysCount++;
            } catch (error) {
              console.warn(`Error al restaurar la clave ${key}:`, error);
            }
          }
        });
      }
    });

    console.log(`✅ Restauración completada: ${restoredKeysCount} elementos restaurados en ${categoriesRestored} categorías`);
    
    return {
      success: true,
      message: `¡Restauración exitosa! Se restauraron ${restoredKeysCount} elementos de ${categoriesRestored} categorías. La aplicación se recargará para aplicar los cambios.`
    };
    
  } catch (error) {
    console.error('❌ Error al restaurar desde string JSON:', error);
    return {
      success: false,
      message: `Error al restaurar los datos: ${error instanceof Error ? error.message : 'JSON de backup inválido o corrupto'}`
    };
  }
}

/**
 * Función auxiliar para obtener estadísticas del backup actual
 */
export function getBackupStats(): { totalKeys: number; categoriesWithData: number } {
  let totalKeys = 0;
  let categoriesWithData = 0;

  Object.entries(CATEGORIES).forEach(([categoryName, keys]) => {
    let categoryHasData = false;
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        totalKeys++;
        categoryHasData = true;
      }
    });
    
    if (categoryHasData) {
      categoriesWithData++;
    }
  });

  return { totalKeys, categoriesWithData };
}
