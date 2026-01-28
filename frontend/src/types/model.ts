export type ModelId = 'tree' | 'forest' | 'gradient';

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
    name: 'Gradient Boosted Trees',
    description: 'Ensemble with gradient boosting (HistGradientBoostingClassifier)',
    script: 'train-gradient-forest.py',
  },
};
