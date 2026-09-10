import numpy as np


def calibrate(predicted: list[float], actual: list[float]) -> dict:
    if not predicted or len(predicted) != len(actual):
        raise ValueError('Predicted and actual observations must have equal non-zero length')
    residuals = np.asarray(actual, dtype=float) - np.asarray(predicted, dtype=float)
    return {'sample_count': len(actual), 'bias': float(np.mean(residuals)), 'mae': float(np.mean(np.abs(residuals))), 'residual_std': float(np.std(residuals))}
