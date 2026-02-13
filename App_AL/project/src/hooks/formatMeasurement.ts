export function formatMeasurement(pieces: number, measure: string | number): string {
  if (!measure || isNaN(Number(measure))) return '';
  
  const measureNum = typeof measure === 'number' ? measure : Number(measure);
  
  // No redondear el número, mantener todos los decimales
  const formattedMeasure = measureNum.toString();
    
  return `${pieces} pz ${formattedMeasure} cm`;
}