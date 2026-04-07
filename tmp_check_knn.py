import joblib
import os
import sys

AI_PATH = os.path.join("server", "services", "Biodiversity_AI_Integrated")
knn_path = os.path.join(AI_PATH, "models", "knn_species_classifier.pkl")

try:
    knn = joblib.load(knn_path)
    print(f"Type: {type(knn)}")
    if hasattr(knn, 'classes_'):
        print(f"Classes: {len(knn.classes_)}")
    if hasattr(knn, '_y'):
        print(f"_y shape: {knn._y.shape}")
    if hasattr(knn, '_fit_X'):
        print(f"_fit_X shape: {knn._fit_X.shape}")
except Exception as e:
    print(f"Error: {e}")
