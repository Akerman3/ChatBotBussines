interface Profile {
  name: string;
  colors: {
    [key: string]: {
      price6m: string;
      pricePerM: string;
    };
  };
}

interface Hardware {
  name: string;
  pricePerPackage: string;
  pricePerPiece: string;
}

interface Glass {
  name: string;
  pricePerPiece: string;
  pricePerM2: string;
}

/**
 * Obtiene el precio de un perfil con IVA incluido
 */
export function getProfilePriceWithIVA(
  profileName: string, 
  color: string, 
  profilesData: Profile[],
  ivaRate: number = 16
): { price6m: number; pricePerM: number } {
  const profile = profilesData.find(p => p.name === profileName);
  if (!profile || !profile.colors[color]) {
    console.warn(`No se encontró precio para ${profileName} en color ${color}`);
    return { price6m: 0, pricePerM: 0 };
  }

  const basePrice6m = parseFloat(profile.colors[color].price6m) || 0;
  const basePricePerM = parseFloat(profile.colors[color].pricePerM) || 0;

  // Aplicar IVA a los precios base (convertir porcentaje a decimal)
  const ivaDecimal = ivaRate / 100;
  const price6mWithIVA = basePrice6m * (1 + ivaDecimal);
  const pricePerMWithIVA = basePricePerM * (1 + ivaDecimal);

  return {
    price6m: price6mWithIVA,
    pricePerM: pricePerMWithIVA
  };
}

/**
 * Obtiene el precio de un herraje con IVA incluido
 */
export function getHardwarePriceWithIVA(
  hardwareName: string, 
  hardwareData: Hardware[],
  ivaRate: number = 16
): { 
  pricePerPackage: number; 
  pricePerPiece: number;
  basePricePerPackage: number;
  basePricePerPiece: number;
} {
  const hardware = hardwareData.find(h => h.name === hardwareName);
  if (!hardware) {
    console.warn(`No se encontró precio para herraje ${hardwareName}`);
    return { pricePerPackage: 0, pricePerPiece: 0, basePricePerPackage: 0, basePricePerPiece: 0 };
  }

  const basePricePerPackage = parseFloat(hardware.pricePerPackage) || 0;
  const basePricePerPiece = parseFloat(hardware.pricePerPiece) || 0;

  // Aplicar IVA a los precios base (convertir porcentaje a decimal)
  const ivaDecimal = ivaRate / 100;
  const pricePerPackageWithIVA = basePricePerPackage * (1 + ivaDecimal);
  const pricePerPieceWithIVA = basePricePerPiece * (1 + ivaDecimal);

  return {
    pricePerPackage: pricePerPackageWithIVA,
    pricePerPiece: pricePerPieceWithIVA,
    basePricePerPackage: basePricePerPackage,
    basePricePerPiece: basePricePerPiece
  };
}

/**
 * Obtiene los precios base de un vidrio SIN IVA (precios originales de la base de datos)
 */
export function getGlassBasePrices(
  glassName: string, 
  glassData: Glass[]
): { pricePerPiece: number; pricePerM2: number } {
  const glass = glassData.find(g => g.name === glassName);
  if (!glass) {
    console.warn(`No se encontró precio para vidrio ${glassName}`);
    return { pricePerPiece: 0, pricePerM2: 0 };
  }

  const basePricePerPiece = parseFloat(glass.pricePerPiece) || 0;
  const basePricePerM2 = parseFloat(glass.pricePerM2) || 0;

  console.log(`🔍 Glass base prices for ${glassName}:`, {
    basePricePerPiece,
    basePricePerM2
  });

  return {
    pricePerPiece: basePricePerPiece,
    pricePerM2: basePricePerM2
  };
}

/**
 * Obtiene el precio de un vidrio con IVA incluido
 */
export function getGlassPriceWithIVA(
  glassName: string, 
  glassData: Glass[],
  ivaRate: number = 16
): { pricePerPiece: number; pricePerM2: number } {
  const glass = glassData.find(g => g.name === glassName);
  if (!glass) {
    console.warn(`No se encontró precio para vidrio ${glassName}`);
    return { pricePerPiece: 0, pricePerM2: 0 };
  }

  const basePricePerPiece = parseFloat(glass.pricePerPiece) || 0;
  const basePricePerM2 = parseFloat(glass.pricePerM2) || 0;

  console.log(`🔍 Glass price calculation for ${glassName}:`, {
    basePricePerPiece,
    basePricePerM2,
    ivaRate
  });

  // Aplicar IVA a los precios base (convertir porcentaje a decimal)
  const ivaDecimal = ivaRate / 100;
  const pricePerPieceWithIVA = basePricePerPiece * (1 + ivaDecimal);
  const pricePerM2WithIVA = basePricePerM2 * (1 + ivaDecimal);

  console.log(`🔍 Glass prices with IVA:`, {
    pricePerPieceWithIVA,
    pricePerM2WithIVA
  });

  return {
    pricePerPiece: pricePerPieceWithIVA,
    pricePerM2: pricePerM2WithIVA
  };
}

/**
 * Calcula el precio sin IVA a partir de un precio con IVA
 * (Útil para mostrar al usuario el precio base cuando sea necesario)
 */
export function getPriceWithoutIVA(priceWithIVA: number, ivaRate: number = 16): number {
  const ivaDecimal = ivaRate / 100;
  return priceWithIVA / (1 + ivaDecimal);
}

/**
 * Calcula el IVA de un precio base
 */
export function calculateIVAAmount(basePrice: number, ivaRate: number = 16): number {
  const ivaDecimal = ivaRate / 100;
  return basePrice * ivaDecimal;
}

/**
 * Calcula el costo total de un herraje con IVA dinámico
 */
export function calculateHardwareCostWithIVA(
  basePricePerPackage: number,
  basePricePerPiece: number,
  quantity: number,
  chargingMethod: 'package' | 'piece' | 'm2',
  ivaRate: number = 16,
  basePricePerM2?: number
): { price: number; total: number } {
  let basePrice: number;

  if (chargingMethod === 'm2') {
    basePrice = basePricePerM2 || 0;
  } else if (chargingMethod === 'package') {
    basePrice = basePricePerPackage;
  } else {
    basePrice = basePricePerPiece;
  }

  const ivaDecimal = ivaRate / 100;
  const priceWithIVA = basePrice * (1 + ivaDecimal);
  const total = priceWithIVA * quantity;

  return {
    price: priceWithIVA,
    total: total
  };
}

/**
 * Recalcula completamente una cotización guardada con los precios actuales de la base de datos
 */
export function recalculateSavedQuotation(
  savedQuote: any,
  profilesData: Profile[],
  hardwareData: Hardware[]
): any {
  try {
    const ivaRate = savedQuote.totals?.ivaPercentage ?? 16;
    const profitPercentage = savedQuote.totals?.profitPercentage ?? 0;

    const updatedQuotedWindows = savedQuote.quotedWindows.map((window: any) => {
      const updatedProfiles = window.profiles.map((profile: any) => {
        const realPrice = getProfilePriceWithIVA(profile.name, window.color, profilesData, ivaRate);
        const totalLengthInMeters = profile.totalLength / 100;
        const updatedCost = totalLengthInMeters * realPrice.pricePerM;

        return {
          ...profile,
          cost: updatedCost
        };
      });

      let updatedHardware = window.hardware;
      if (window.hardware && window.hardware.length > 0) {
        updatedHardware = window.hardware.map((item: any) => {
          const hardwareInDB = hardwareData.find((h: Hardware) => h.name === item.name);
          if (hardwareInDB) {
            const basePricePerPiece = parseFloat(hardwareInDB.pricePerPiece) || 0;
            const { total } = calculateHardwareCostWithIVA(
              0,
              basePricePerPiece,
              item.pieces,
              'piece',
              ivaRate
            );
            return {
              ...item,
              cost: total
            };
          }
          return item;
        });
      }

      const newTotalCost = updatedProfiles.reduce((sum: number, p: any) => sum + p.cost, 0) +
                          (updatedHardware?.reduce((sum: number, h: any) => sum + h.cost, 0) || 0);

      return {
        ...window,
        profiles: updatedProfiles,
        hardware: updatedHardware,
        totalCost: newTotalCost
      };
    });

    const profileSummary: { [key: string]: any } = {};

    updatedQuotedWindows.forEach((quote: any) => {
      quote.profiles.forEach((profile: any) => {
        const key = `${profile.name}-${quote.color}`;

        if (!profileSummary[key]) {
          profileSummary[key] = {
            name: profile.name,
            color: quote.color,
            totalLength: 0,
            totalMeters: 0,
            piecesNeeded: 0,
            totalPiecesNeededGross: 0,
            fractionCost: 0,
            grossCost: 0
          };
        }

        const totalLength = isNaN(Number(profile.totalLength)) ? 0 : Number(profile.totalLength);
        const cost = isNaN(Number(profile.cost)) ? 0 : Number(profile.cost);

        profileSummary[key].totalLength += totalLength;
        profileSummary[key].fractionCost += cost;
      });
    });

    Object.values(profileSummary).forEach((profile: any) => {
      profile.totalMeters = profile.totalLength / 100;
      profile.piecesNeeded = Math.ceil(profile.totalLength / 600);

      const realPrice = getProfilePriceWithIVA(profile.name, profile.color, profilesData, ivaRate);
      profile.grossCost = profile.piecesNeeded * realPrice.price6m;
    });

    const hardwareSummary: { [key: string]: any } = {};

    updatedQuotedWindows.forEach((quote: any) => {
      if (quote.hardware && quote.hardware.length > 0) {
        quote.hardware.forEach((item: any) => {
          const key = item.name;

          if (!hardwareSummary[key]) {
            hardwareSummary[key] = {
              name: item.name,
              pieces: 0,
              cost: 0
            };
          }

          const pieces = isNaN(Number(item.pieces)) ? 0 : Number(item.pieces);

          const hardwareInDB = hardwareData.find((h: Hardware) => h.name === item.name);
          let cost = 0;

          if (hardwareInDB && pieces > 0) {
            const basePricePerPiece = parseFloat(hardwareInDB.pricePerPiece) || 0;
            if (basePricePerPiece > 0) {
              const { total } = calculateHardwareCostWithIVA(
                0,
                basePricePerPiece,
                pieces,
                'piece',
                ivaRate
              );
              cost = total;
            } else {
              cost = isNaN(Number(item.cost)) ? 0 : Number(item.cost);
            }
          } else {
            cost = isNaN(Number(item.cost)) ? 0 : Number(item.cost);
          }

          hardwareSummary[key].pieces += pieces;
          hardwareSummary[key].cost += cost;
        });
      }
    });

    if (savedQuote.standaloneHardwareItems && savedQuote.standaloneHardwareItems.length > 0) {
      savedQuote.standaloneHardwareItems.forEach((item: any) => {
        const key = item.name;

        if (!hardwareSummary[key]) {
          hardwareSummary[key] = {
            name: item.name,
            pieces: 0,
            cost: 0
          };
        }

        const { total } = calculateHardwareCostWithIVA(
          item.basePricePerPackage,
          item.basePricePerPiece,
          item.quantity,
          item.chargingMethod,
          ivaRate
        );

        hardwareSummary[key].pieces += item.quantity;
        hardwareSummary[key].cost += total;
      });
    }

    const totalFractionCost = Object.values(profileSummary).reduce((sum: number, profile: any) => sum + profile.fractionCost, 0);
    const totalGrossCost = Object.values(profileSummary).reduce((sum: number, profile: any) => sum + profile.grossCost, 0);
    const totalHardwareCost = Object.values(hardwareSummary).reduce((sum: number, item: any) => sum + item.cost, 0);
    const totalExtraCosts = savedQuote.extraCostsList?.reduce((sum: number, cost: any) => sum + cost.amount, 0) || 0;

    const baseCost = totalGrossCost;
    const totalWithProfit = (baseCost + totalHardwareCost) * (1 + profitPercentage / 100) + totalExtraCosts;
    const ivaAmount = totalWithProfit * (ivaRate / 100);
    const finalPriceWithIVA = totalWithProfit + ivaAmount;

    return {
      ...savedQuote,
      totalAmount: finalPriceWithIVA,
      quotedWindows: updatedQuotedWindows,
      profileSummary: Object.values(profileSummary),
      hardwareSummary: Object.values(hardwareSummary),
      totals: {
        ...savedQuote.totals,
        fractionCost: totalFractionCost,
        grossCost: totalGrossCost + totalHardwareCost,
        hardwareCost: totalHardwareCost,
        finalPrice: totalWithProfit,
        extraCosts: totalExtraCosts,
        ivaAmount: ivaAmount,
        finalPriceWithIVA: finalPriceWithIVA
      }
    };
  } catch (error) {
    console.error('Error recalculando cotización:', error);
    return savedQuote;
  }
}

/**
 * Recalcula completamente una cotización general guardada con los precios actuales de la base de datos
 * IMPORTANTE: Los precios de materiales incluyen el IVA de la base de datos (materialIvaPercentage)
 * El ivaPercentage guardado en la cotización es un IVA ADICIONAL que se aplica al final
 */
export function recalculateGeneralQuotation(
  savedQuote: any,
  profilesData: Profile[],
  hardwareData: Hardware[],
  glassData: Glass[],
  currentMaterialIvaPercentage?: number
): any {
  try {
    const profitPercentage = savedQuote.profitPercentage ?? 0;
    const materialIvaRate = currentMaterialIvaPercentage ?? savedQuote.materialIvaPercentage ?? 16;

    const updatedProfiles = savedQuote.selectedProfiles.map((profile: any) => {
      const pricesWithIVA = getProfilePriceWithIVA(
        profile.name,
        profile.color,
        profilesData,
        materialIvaRate
      );

      return {
        ...profile,
        price6m: pricesWithIVA.price6m,
        pricePerM: pricesWithIVA.pricePerM
      };
    });

    const updatedHardware = savedQuote.selectedHardware.map((hardware: any) => {
      const hardwareInDB = hardwareData.find((h: Hardware) => h.name === hardware.name);

      if (hardwareInDB) {
        const basePricePerPackage = parseFloat(hardwareInDB.pricePerPackage) || 0;
        const basePricePerPiece = parseFloat(hardwareInDB.pricePerPiece) || 0;

        const { price, total } = calculateHardwareCostWithIVA(
          basePricePerPackage,
          basePricePerPiece,
          hardware.quantity,
          hardware.chargingMethod,
          materialIvaRate
        );

        return {
          ...hardware,
          price: price,
          total: total,
          pricePerPackage: basePricePerPackage * (1 + materialIvaRate / 100),
          pricePerPiece: basePricePerPiece * (1 + materialIvaRate / 100)
        };
      }

      return hardware;
    });

    const updatedGlass = savedQuote.selectedGlass?.map((glass: any) => {
      const glassInDB = glassData.find((g: Glass) => g.name === glass.name);

      if (glassInDB) {
        const pricesWithIVA = getGlassPriceWithIVA(glass.name, glassData, materialIvaRate);

        const price = glass.chargingMethod === 'piece' ? pricesWithIVA.pricePerPiece : pricesWithIVA.pricePerM2;
        const total = price * glass.quantity;

        return {
          ...glass,
          price: price,
          total: total,
          pricePerPiece: pricesWithIVA.pricePerPiece,
          pricePerM2: pricesWithIVA.pricePerM2
        };
      }

      return glass;
    }) || [];

    const totalProfilesCost = updatedProfiles.reduce((sum: number, profile: any) => {
      return sum + (profile.chargingMethod === 'complete'
        ? profile.price6m * profile.quantity
        : profile.pricePerM * profile.quantity);
    }, 0);

    const totalHardwareCost = updatedHardware.reduce((sum: number, item: any) => sum + item.total, 0);
    const totalGlassCost = updatedGlass.reduce((sum: number, item: any) => sum + item.total, 0);
    const totalExtraCosts = savedQuote.extraCostsList?.reduce((sum: number, cost: any) => sum + cost.amount, 0) || 0;

    const subtotal = totalProfilesCost + totalHardwareCost + totalGlassCost;
    const profitAmount = subtotal * (profitPercentage / 100);
    const priceWithProfit = subtotal + profitAmount + totalExtraCosts;

    const additionalIvaRate = savedQuote.ivaPercentage ?? 0;
    const additionalIvaAmount = priceWithProfit * (additionalIvaRate / 100);
    const finalPriceWithIVA = priceWithProfit + additionalIvaAmount;

    return {
      ...savedQuote,
      selectedProfiles: updatedProfiles,
      selectedHardware: updatedHardware,
      selectedGlass: updatedGlass,
      totals: {
        profilesCost: totalProfilesCost,
        hardwareCost: totalHardwareCost,
        glassCost: totalGlassCost,
        extraCosts: totalExtraCosts,
        subtotal: subtotal,
        profitAmount: profitAmount,
        priceWithProfit: priceWithProfit,
        ivaAmount: additionalIvaAmount,
        finalPriceWithIVA: finalPriceWithIVA
      }
    };
  } catch (error) {
    console.error('Error recalculando cotización general:', error);
    return savedQuote;
  }
}