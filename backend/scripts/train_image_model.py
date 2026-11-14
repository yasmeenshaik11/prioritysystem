"""Train a small complaint image classifier.

Expected folders: data/image_dataset/<class_name>/*.jpg
Run from backend/: python scripts/train_image_model.py
"""
from pathlib import Path
import tensorflow as tf

ROOT=Path('data/image_dataset')
OUT=Path('app/ai/models/complaint_image_model.keras')
OUT.parent.mkdir(parents=True,exist_ok=True)
train=tf.keras.utils.image_dataset_from_directory(ROOT,validation_split=0.2,subset='training',seed=42,image_size=(224,224),batch_size=16)
val=tf.keras.utils.image_dataset_from_directory(ROOT,validation_split=0.2,subset='validation',seed=42,image_size=(224,224),batch_size=16)
classes=train.class_names
base=tf.keras.applications.MobileNetV2(include_top=False,weights='imagenet',input_shape=(224,224,3))
base.trainable=False
model=tf.keras.Sequential([tf.keras.layers.Input((224,224,3)),tf.keras.layers.Rescaling(1./127.5,offset=-1),base,tf.keras.layers.GlobalAveragePooling2D(),tf.keras.layers.Dropout(.25),tf.keras.layers.Dense(len(classes),activation='softmax')])
model.compile(optimizer='adam',loss='sparse_categorical_crossentropy',metrics=['accuracy'])
model.fit(train,validation_data=val,epochs=8)
model.save(OUT)
Path('app/ai/models/classes.txt').write_text('\n'.join(classes),encoding='utf-8')
print('Saved',OUT,'classes=',classes)
