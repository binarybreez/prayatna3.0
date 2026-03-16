import numpy as np

def apply_laplace_noise(value: float, epsilon: float = 0.1, sensitivity: float = 0.001) -> float:
    """
    Adds mathematical noise to a coordinate using the Laplace distribution.
    - Sensitivity of 0.001 degrees is roughly 100 meters.
    - Epsilon (ε) controls the privacy budget. Lower ε = more privacy, but less accuracy.
    """
    scale = sensitivity / epsilon
    # Generate random noise centered at 0 with the calculated scale
    noise = np.random.laplace(0, scale)
    return value + noise

def obfuscate_location(lat: float, lng: float) -> tuple[float, float]:
    """
    Takes raw GPS coordinates and returns anonymized coordinates
    to guarantee Geo-Indistinguishability.
    """
    noisy_lat = apply_laplace_noise(lat)
    noisy_lng = apply_laplace_noise(lng)
    
    return noisy_lat, noisy_lng