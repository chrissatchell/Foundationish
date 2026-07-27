/**
 * Top-Hatch Utilities
 * "Esc complexity"
 */

/* @src joshwcomeau.com */

export const normalize = ( number, scaleMin, scaleMax, newScaleMin = 0, newScaleMax = 1 ) => {

    let normalization = (number - scaleMin) / (scaleMax - scaleMin);

    return (
        ( newScaleMax - newScaleMin ) * standardNormalization + newScaleMin
    );
};

export const exponentialNormalize = ( value, scaleMin, scaleMax, newScaleMin = 0, newScaleMax = 1, exponent = 2 ) => {

    let normalization = ( value - scaleMin ) / ( scaleMax - scaleMin );

    let exponentialOutput = Math.pow( normalization, exponent );

    return (
        newScaleMin + ( newScaleMax - newScaleMin ) * exponentialOutput
    );
};

export const convertDegreesToRadians = (angle) => (angle * Math.PI) / 180;

export const convertPolarToCartesian = (angle, distance) => {
  const angleInRadians = convertDegreesToRadians(angle);
  const x = Math.cos(angleInRadians) * distance;
  const y = Math.sin(angleInRadians) * distance;

  return [x, y];
};