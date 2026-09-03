# backend / crop_model_artifacts

Serialized scikit-learn artifacts from the original crop-recommendation notebook:

| File | Contents |
|------|----------|
| `model.joblib` | K-Nearest-Neighbors classifier |
| `scaler.joblib` | StandardScaler for the 5 input features |
| `label_encoder.joblib` | crop label ↔ index |
| `metadata.json` | feature order, class list, training metrics |

**Feature order:** `temperature, humidity, light_intensity, air_pressure, rainfall`

## Why the app does not call this model

`metadata.json` records `test_accuracy ≈ 0.062` against a `chance_level_accuracy ≈
0.04` — the training data showed near-chance separability between classes (see the
notebook's ANOVA results). A model at chance level would give operators
arbitrary crop picks.

The **Model & Simulation Layer** therefore ranks crops with a transparent
trapezoid-membership fit of the live station observation to each crop's
agronomic envelope — see
[`../frontend/src/twin/cropCatalog.ts`](../frontend/src/twin/cropCatalog.ts).
Every input and sub-score is shown in the **Crop Intelligence** tab.

Re-train on a dataset with real feature–label structure to restore a learned
model; the feature contract above is what the frontend already collects.
