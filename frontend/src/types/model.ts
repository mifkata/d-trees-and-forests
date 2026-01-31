export type ModelId = 'tree' | 'forest' | 'gradient' | 'hist-gradient';

export interface Model {
  id: ModelId;
  name: string;
  description: string;
  script: string;
}

export const MODELS: Record<ModelId, Model> = {
  tree: {
    id: 'tree',
    name: 'Decision Tree',
    description: 'Single decision tree classifier',
    script: 'train-tree.py',
  },
  forest: {
    id: 'forest',
    name: 'Random Forest',
    description: 'Ensemble of decision trees with bagging',
    script: 'train-forest.py',
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient Boosting',
    description: 'Classic gradient boosting (GradientBoostingClassifier)',
    script: 'train-gradient.py',
  },
  'hist-gradient': {
    id: 'hist-gradient',
    name: 'Hist Gradient Boosting',
    description: 'Histogram-based gradient boosting (HistGradientBoostingClassifier)',
    script: 'train-hist-gradient.py',
  },
};
