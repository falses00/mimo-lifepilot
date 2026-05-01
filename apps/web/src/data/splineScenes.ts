export interface SplineSceneConfig {
  sceneUrl: string;
  source: string;
  sourceType: 'official-demo' | 'official-homepage-demo';
  licenseConfidence: 'medium';
  usageDecision: 'use-temporary';
  status: 'temporary-demo-scene';
  replaceNote: string;
}

export const temporaryDemoReplaceNote =
  '当前使用公开 Spline demo scene 作为临时 3D 视觉，用于验证嵌入与性能。最终品牌视觉建议在 Spline 中创建自有场景后替换。';

export const splineScenes = {
  lifepilot: {
    sceneUrl: 'https://prod.spline.design/U9O6K7fXziMEU7Wu/scene.splinecode',
    source: 'https://prod.spline.design/U9O6K7fXziMEU7Wu/scene.splinecode',
    sourceType: 'official-demo',
    licenseConfidence: 'medium',
    usageDecision: 'use-temporary',
    status: 'temporary-demo-scene',
    replaceNote: temporaryDemoReplaceNote,
  },
} satisfies Record<string, SplineSceneConfig>;

export const defaultSplineScene = splineScenes.lifepilot;
