export type DatasetId = 'Iris' | 'Income';

export interface Dataset {
  id: DatasetId;
  name: string;
  description: string;
  features: string[];
  targetClasses: string[];
}

export const DATASETS: Record<DatasetId, Dataset> = {
  Iris: {
    id: 'Iris',
    name: 'Iris',
    description: 'Classic iris flower classification dataset',
    features: ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm'],
    targetClasses: ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'],
  },
  Income: {
    id: 'Income',
    name: 'Income (Adult Census)',
    description: 'Predict income level from census data',
    features: [
      'age', 'workclass', 'fnlwgt', 'education', 'education_num',
      'marital_status', 'occupation', 'relationship', 'race', 'sex',
      'capital_gain', 'capital_loss', 'hours_per_week', 'native_country'
    ],
    targetClasses: ['<=50K', '>50K'],
  },
};
