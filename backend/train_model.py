"""Train MindSense FER2013 emotion classifiers (MobileNetV2 by default).

Supports the msambare Kaggle image directories, the original FER2013 CSV,
or split image directories:
    data/{train,test}/{angry,disgust,fear,happy,sad,surprise,neutral}/...
  data/fer2013.csv
  data/{train,validation,test}/{angry,disgust,fear,happy,sad,surprise,neutral}/...
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

from app.config import BACKEND_DIR
from app.models.emotion_model import EMOTIONS, build_custom_cnn, build_mobilenetv2_model

DATA_DEFAULT = BACKEND_DIR / "data"
MODEL_DEFAULT = BACKEND_DIR / "models" / "mindsense_emotion_model.keras"


def parse_pixels(pixels: str) -> np.ndarray:
    values = np.fromstring(str(pixels), sep=" ", dtype=np.uint8)
    if values.size != 48 * 48:
        raise ValueError(f"FER2013 pixel row must contain 2304 values, found {values.size}")
    return values.reshape(48, 48, 1)


def load_csv_data(csv_path: Path):
    frame = pd.read_csv(csv_path)
    required = {"emotion", "pixels"}
    if not required.issubset(frame.columns):
        raise ValueError("FER2013 CSV must contain 'emotion' and 'pixels' columns")

    label_lookup = {name: index for index, name in enumerate(EMOTIONS)}
    if pd.api.types.is_numeric_dtype(frame["emotion"]):
        labels = frame["emotion"].astype(int).to_numpy()
    else:
        normalized = frame["emotion"].astype(str).str.strip().str.lower()
        unknown = sorted(set(normalized) - set(label_lookup))
        if unknown:
            raise ValueError(f"Unknown FER emotion labels: {unknown}")
        labels = normalized.map(label_lookup).to_numpy(dtype=np.int64)
    if np.any((labels < 0) | (labels >= len(EMOTIONS))):
        raise ValueError("FER2013 emotion labels must be integers from 0 to 6")

    images = np.stack([parse_pixels(value) for value in frame["pixels"]])
    if "Usage" in frame.columns:
        usage = frame["Usage"].astype(str).str.strip().str.lower()
        train_mask = usage == "training"
        validation_mask = usage.isin(("publictest", "validation", "valid"))
        test_mask = usage.isin(("privatetest", "test"))
        if train_mask.any() and validation_mask.any() and test_mask.any():
            return (images[train_mask], labels[train_mask]), (images[validation_mask], labels[validation_mask]), (images[test_mask], labels[test_mask])

    train_x, remainder_x, train_y, remainder_y = train_test_split(
        images, labels, test_size=0.2, random_state=42, stratify=labels
    )
    val_x, test_x, val_y, test_y = train_test_split(
        remainder_x, remainder_y, test_size=0.5, random_state=42, stratify=remainder_y
    )
    return (train_x, train_y), (val_x, val_y), (test_x, test_y)


def make_tf_dataset(images, labels, architecture: str, batch_size: int, training: bool):
    image_size = (224, 224) if architecture == "mobilenetv2" else (48, 48)
    dataset = tf.data.Dataset.from_tensor_slices((images, labels))
    if training:
        dataset = dataset.shuffle(min(len(labels), 8192), seed=42, reshuffle_each_iteration=True)

    def prepare(image, label):
        image = tf.cast(image, tf.float32) / 255.0
        if architecture == "mobilenetv2":
            image = tf.image.resize(image, image_size, antialias=True)
            image = tf.image.grayscale_to_rgb(image)
        return image, tf.cast(label, tf.int64)

    return dataset.map(prepare, num_parallel_calls=tf.data.AUTOTUNE).batch(batch_size).prefetch(tf.data.AUTOTUNE)


def load_directory_data(data_dir: Path, architecture: str, batch_size: int):
    train_dir = data_dir / "train"
    validation_dir = data_dir / "validation"
    if not validation_dir.exists():
        validation_dir = data_dir / "val"
    test_dir = data_dir / "test"
    if not train_dir.is_dir() or not test_dir.is_dir():
        raise ValueError("Directory dataset must have train/ and test/ splits")

    def load_split(path: Path, training: bool, subset: str | None = None):
        kwargs = {}
        if subset is not None:
            kwargs = {"validation_split": 0.1, "subset": subset}
        return tf.keras.utils.image_dataset_from_directory(
            path,
            labels="inferred",
            label_mode="int",
            class_names=list(EMOTIONS),
            color_mode="grayscale",
            image_size=(48, 48),
            batch_size=batch_size,
            shuffle=training,
            seed=42,
            **kwargs,
        )

    if validation_dir.is_dir():
        train = load_split(train_dir, True)
        validation = load_split(validation_dir, False)
    else:
        # The msambare Kaggle release supplies train/ and test/ only. Carve
        # validation from training so the official test split stays untouched.
        train = load_split(train_dir, True, subset="training")
        validation = load_split(train_dir, False, subset="validation")
    test = load_split(test_dir, False)
    train_labels = np.concatenate([labels.numpy() for _, labels in train])

    def prepare(image, label):
        image = tf.cast(image, tf.float32) / 255.0
        if architecture == "mobilenetv2":
            image = tf.image.resize(image, (224, 224), antialias=True)
            image = tf.image.grayscale_to_rgb(image)
        return image, tf.cast(label, tf.int64)

    options = tf.data.AUTOTUNE
    return (
        train.map(prepare, num_parallel_calls=options).prefetch(options),
        validation.map(prepare, num_parallel_calls=options).prefetch(options),
        test.map(prepare, num_parallel_calls=options).prefetch(options),
        train_labels,
    )


def evaluate_model(model, test_ds, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    y_true = np.concatenate([labels.numpy() for _, labels in test_ds])
    probabilities = model.predict(test_ds, verbose=1)
    y_pred = np.argmax(probabilities, axis=1)
    report = classification_report(
        y_true,
        y_pred,
        labels=np.arange(len(EMOTIONS)),
        target_names=list(EMOTIONS),
        zero_division=0,
        digits=4,
    )
    matrix = confusion_matrix(y_true, y_pred, labels=np.arange(len(EMOTIONS)))
    (output_dir / "classification_report.txt").write_text(report, encoding="utf-8")
    np.savetxt(output_dir / "confusion_matrix.csv", matrix, delimiter=",", fmt="%d")
    with (output_dir / "evaluation.json").open("w", encoding="utf-8") as output:
        json.dump({"emotions": list(EMOTIONS), "confusion_matrix": matrix.tolist()}, output, indent=2)

    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from sklearn.metrics import ConfusionMatrixDisplay

    display = ConfusionMatrixDisplay(confusion_matrix=matrix, display_labels=EMOTIONS)
    display.plot(cmap="Purples", xticks_rotation=35, values_format="d")
    plt.title("MindSense FER2013 Test Confusion Matrix")
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png", dpi=160)
    plt.close()
    print("\nClassification report:\n" + report)
    print(f"Evaluation artifacts saved to: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Train a FER2013 emotion classifier")
    parser.add_argument("--data", type=Path, default=DATA_DEFAULT, help="FER2013 CSV path or dataset directory (default: backend/data)")
    parser.add_argument("--architecture", choices=("mobilenetv2", "custom_cnn"), default="mobilenetv2")
    parser.add_argument("--backbone-weights", choices=("imagenet", "none"), default="imagenet")
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--output", type=Path, default=MODEL_DEFAULT)
    args = parser.parse_args()

    if args.epochs < 1 or args.batch_size < 1:
        parser.error("--epochs and --batch-size must be positive")
    if args.data.is_dir():
        train_ds, validation_ds, test_ds, train_labels = load_directory_data(
            args.data, args.architecture, args.batch_size
        )
    elif args.data.is_file():
        train_data, validation_data, test_data = load_csv_data(args.data)
        train_ds = make_tf_dataset(*train_data, args.architecture, args.batch_size, True)
        validation_ds = make_tf_dataset(*validation_data, args.architecture, args.batch_size, False)
        test_ds = make_tf_dataset(*test_data, args.architecture, args.batch_size, False)
        train_labels = train_data[1]
    else:
        parser.error(f"Dataset not found: {args.data}")

    classes = np.unique(train_labels)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=train_labels)
    class_weights = {int(label): float(weight) for label, weight in zip(classes, weights)}
    input_shape = (224, 224, 3) if args.architecture == "mobilenetv2" else (48, 48, 1)
    if args.architecture == "mobilenetv2":
        model = build_mobilenetv2_model(
            input_shape=input_shape,
            weights="imagenet" if args.backbone_weights == "imagenet" else None,
        )
    else:
        model = build_custom_cnn(input_shape=input_shape)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=7, restore_best_weights=True, verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=args.output, monitor="val_loss", save_best_only=True, verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1
        ),
    ]
    model.fit(
        train_ds,
        validation_data=validation_ds,
        epochs=args.epochs,
        class_weight=class_weights,
        callbacks=callbacks,
    )
    model.save(args.output)
    evaluate_model(model, test_ds, args.output.parent / "evaluation")
    print(f"Trained model saved to: {args.output}")


if __name__ == "__main__":
    main()
