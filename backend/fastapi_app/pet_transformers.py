"""
Transformers sklearn customizados para o pipeline de recomendação de pets.

Definidos em módulo separado para que joblib consiga desserializar
os pkl tanto no init_pipeline.py quanto no main.py do FastAPI.
"""

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import MultiLabelBinarizer


class MultiLabelTransformer(BaseEstimator, TransformerMixin):
    """Converte coluna de strings com múltiplos valores separados por vírgula
    em vetores binários via MultiLabelBinarizer.

    Categorias desconhecidas no transform são ignoradas (handle_unknown='ignore').
    """

    def __init__(self, sep=', '):
        self.sep = sep

    def _split(self, X):
        col = X.iloc[:, 0] if hasattr(X, 'iloc') else X[:, 0]
        return [
            [item.strip() for item in str(v).split(self.sep)
             if item.strip() and item.strip() not in ('nan', '')]
            for v in col
        ]

    def fit(self, X, y=None):
        self.mlb_ = MultiLabelBinarizer()
        self.mlb_.fit(self._split(X))
        return self

    def transform(self, X):
        split    = self._split(X)
        known    = set(self.mlb_.classes_)
        filtered = [[lbl for lbl in row if lbl in known] for row in split]
        return self.mlb_.transform(filtered).astype(float)

    def get_feature_names_out(self, input_features=None):
        return np.array(self.mlb_.classes_)
