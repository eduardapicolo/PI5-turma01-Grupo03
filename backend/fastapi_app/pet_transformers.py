import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import MultiLabelBinarizer


class MultiLabelTransformer(BaseEstimator, TransformerMixin):

    def __init__(self, separador=', '):
        self.separador = separador

    def _dividir(self, X):
        coluna = X.iloc[:, 0] if hasattr(X, 'iloc') else X[:, 0]
        return [
            [item.strip() for item in str(v).split(self.separador)
             if item.strip() and item.strip() not in ('nan', '')]
            for v in coluna
        ]

    def fit(self, X, y=None):
        self.binarizador = MultiLabelBinarizer()
        self.binarizador.fit(self._dividir(X))
        return self

    def transform(self, X):
        dividido = self._dividir(X)
        conhecidas = set(self.binarizador.classes_)
        filtrado = [[label for label in linha if label in conhecidas] for linha in dividido]
        return self.binarizador.transform(filtrado).astype(float)

    def get_feature_names_out(self, input_features=None):
        return np.array(self.binarizador.classes_)
