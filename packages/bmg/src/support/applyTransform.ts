import type { Transformation, TransformStep } from "../types";

export const isTransformStep = (t: Transformation): t is TransformStep =>
  typeof t === 'function' || typeof t === 'string';

export const applyStep = (value: unknown, step: TransformStep): unknown => {
  if (typeof step === 'function') return step(value);
  switch (step) {
    case 'string': return value == null ? value : String(value);
    case 'integer': return value == null ? value : Math.trunc(Number(value));
    case 'date': return value == null ? value : new Date(value as any);
  }
};

export const applyPipeline = (value: unknown, pipeline: TransformStep | TransformStep[]): unknown => {
  if (Array.isArray(pipeline)) {
    return pipeline.reduce((v, step) => applyStep(v, step), value);
  }
  return applyStep(value, pipeline);
};

export const applyTransformation = (
  value: unknown,
  attr: string,
  transformation: Transformation,
): unknown => {
  if (isTransformStep(transformation)) {
    return applyStep(value, transformation);
  }
  if (Array.isArray(transformation)) {
    return applyPipeline(value, transformation);
  }
  const step = (transformation as Record<string, TransformStep | TransformStep[]>)[attr];
  if (step === undefined) return value;
  return applyPipeline(value, step);
};
