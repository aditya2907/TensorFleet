export const MLTrainingPresets = {
  'computer-vision-basic': {
    name: 'Computer Vision - Basic',
    description: 'Good starting point for image classification tasks',
    model_type: 'resnet50',
    num_workers: 2,
    epochs: 25,
    hyperparameters: {
      learning_rate: 0.001,
      batch_size: 32,
      optimizer: 'adam',
      loss_function: 'categorical_crossentropy',
      validation_split: 0.2,
    },
    training_config: {
      early_stopping: true,
      save_checkpoints: true,
    },
  },
  'computer-vision-advanced': {
    name: 'Computer Vision - Advanced',
    description: 'High-performance setup for complex image tasks',
    model_type: 'resnet101',
    num_workers: 4,
    epochs: 50,
    hyperparameters: {
      learning_rate: 0.0001,
      batch_size: 16,
      optimizer: 'adamw',
      loss_function: 'categorical_crossentropy',
      validation_split: 0.15,
    },
    training_config: {
      early_stopping: true,
      save_checkpoints: true,
    },
  },
  'nlp-basic': {
    name: 'NLP - Basic',
    description: 'Text processing with BERT base model',
    model_type: 'bert-base',
    num_workers: 2,
    epochs: 10,
    hyperparameters: {
      learning_rate: 0.00005,
      batch_size: 16,
      optimizer: 'adamw',
      loss_function: 'sparse_categorical_crossentropy',
      validation_split: 0.2,
    },
    training_config: {
      early_stopping: true,
      save_checkpoints: true,
    },
  },
  'nlp-advanced': {
    name: 'NLP - Advanced',
    description: 'Large language model fine-tuning',
    model_type: 'bert-large',
    num_workers: 3,
    epochs: 5,
    hyperparameters: {
      learning_rate: 0.00002,
      batch_size: 8,
      optimizer: 'adamw',
      loss_function: 'sparse_categorical_crossentropy',
      validation_split: 0.15,
    },
    training_config: {
      early_stopping: true,
      save_checkpoints: true,
    },
  },
  'traditional-ml-fast': {
    name: 'Traditional ML - Fast',
    description: 'Quick training with traditional algorithms',
    model_type: 'random-forest',
    num_workers: 1,
    epochs: 1,
    hyperparameters: {
      learning_rate: 0.1,
      batch_size: 100,
      optimizer: 'sgd',
      loss_function: 'categorical_crossentropy',
      validation_split: 0.3,
    },
    training_config: {
      early_stopping: false,
      save_checkpoints: true,
    },
  },
  'experimental': {
    name: 'Experimental Setup',
    description: 'For testing and experimentation',
    model_type: 'cnn',
    num_workers: 1,
    epochs: 5,
    hyperparameters: {
      learning_rate: 0.01,
      batch_size: 64,
      optimizer: 'sgd',
      loss_function: 'mean_squared_error',
      validation_split: 0.2,
    },
    training_config: {
      early_stopping: false,
      save_checkpoints: false,
    },
  },
};

export const getPresetRecommendations = (modelType, taskType) => {
  const recommendations = [];
  
  // Computer Vision models
  if (['resnet50', 'resnet101', 'vit', 'cnn'].includes(modelType)) {
    recommendations.push('computer-vision-basic', 'computer-vision-advanced');
  }
  
  // NLP models
  if (['bert-base', 'bert-large', 'gpt2', 'gpt2-medium'].includes(modelType)) {
    recommendations.push('nlp-basic', 'nlp-advanced');
  }
  
  // Traditional ML
  if (['random-forest', 'logistic-regression', 'svm', 'decision-tree'].includes(modelType)) {
    recommendations.push('traditional-ml-fast');
  }
  
  // Always include experimental
  recommendations.push('experimental');
  
  return recommendations;
};

export const applyPreset = (presetKey, currentFormData) => {
  const preset = MLTrainingPresets[presetKey];
  if (!preset) return currentFormData;
  
  return {
    ...currentFormData,
    model_type: preset.model_type,
    num_workers: preset.num_workers,
    epochs: preset.epochs,
    learning_rate: preset.hyperparameters.learning_rate.toString(),
    batch_size: preset.hyperparameters.batch_size.toString(),
    optimizer: preset.hyperparameters.optimizer,
    loss_function: preset.hyperparameters.loss_function,
    validation_split: preset.hyperparameters.validation_split.toString(),
    early_stopping: preset.training_config.early_stopping,
    save_checkpoints: preset.training_config.save_checkpoints,
  };
};
