from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def is_probability(value):
    """Check if numbers are in [0,100]"""
    if not (0 <= value <= 100):
        raise ValidationError(
            _('Please enter a number between 0 and 100'),
            params={'value': value},
        )


def is_age(value):
    """Check if a number is conceivably an age """
    if not (0 < value <= 120):
        raise ValidationError(
            _('Please enter a valid age'),
            params={'value': value},
        )
