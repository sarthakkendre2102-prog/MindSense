"""Keras model definitions and a thread-safe lazy inference model loader."""

from __future__ import annotations

import threading
from pathlib import Path

EMOTIONS = ("angry", "disgust", "fear", "happy", "sad", "surprise", "neutral")


def build_mobilenetv2_model(input_shape=(224, 224, 3), num_classes: int = 7, weights="imagenet"):
    """Build the default FER transfer-learning network with a frozen MobileNetV2 base."""
    import tensorflow as tf

    inputs = tf.keras.Input(shape=input_shape, name="face")
    x = tf.keras.layers.RandomFlip("horizontal")(inputs)
    x = tf.keras.layers.RandomRotation(0.08)(x)
    x = tf.keras.layers.RandomZoom(0.1)(x)
    x = tf.keras.layers.Rescaling(scale=2.0, offset=-1.0, name="mobilenet_normalization")(x)
    backbone = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights=weights,
    )
    backbone.trainable = False
    x = backbone(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="emotion_probabilities")(x)
    return tf.keras.Model(inputs, outputs, name="mindsense_mobilenetv2_fer")


def build_custom_cnn(input_shape=(48, 48, 1), num_classes: int = 7):
    """Build a compact CNN fallback for 48x48 grayscale FER2013 face crops."""
    import tensorflow as tf

    inputs = tf.keras.Input(shape=input_shape, name="face_grayscale")
    x = tf.keras.layers.RandomFlip("horizontal")(inputs)
    x = tf.keras.layers.RandomRotation(0.06)(x)
    x = tf.keras.layers.RandomZoom(0.08)(x)
    for filters in (32, 64, 128):
        x = tf.keras.layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Activation("relu")(x)
        x = tf.keras.layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Activation("relu")(x)
        x = tf.keras.layers.MaxPooling2D(pool_size=2)(x)
        x = tf.keras.layers.Dropout(0.2 if filters < 128 else 0.3)(x)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="emotion_probabilities")(x)
    return tf.keras.Model(inputs, outputs, name="mindsense_custom_cnn_fer")


class EmotionModel:
    """Lazily load a trained Keras artifact and serialize access to model loading."""

    def __init__(self, model_path: Path):
        self.model_path = Path(model_path)
        self._model = None
        self._lock = threading.Lock()

    def get_model(self):
        if self._model is not None:
            return self._model
        with self._lock:
            if self._model is None:
                if not self.model_path.is_file():
                    raise FileNotFoundError(
                        f"Trained model not found at {self.model_path}. Run backend/train_model.py first."
                    )
                import tensorflow as tf

                self._model = tf.keras.models.load_model(self.model_path, compile=False)
        return self._model

    def predict(self, batch):
        return self.get_model().predict(batch, verbose=0)[0]

    def input_shape(self) -> tuple:
        return tuple(self.get_model().input_shape)
