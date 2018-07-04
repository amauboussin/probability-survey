from django.db import models
from probabilities.validators import is_probability

GENDER_CHOICES = (
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
)

ESL_CHOICES = (
    ('E', 'Native English Speaker'),
    ('S', 'Non-native english speaker'),
)

AGE_CHOICES = tuple([('17', 'Below 18')]
                    + [(str(i), str(i)) for i in range(18, 81)]
                    + [('81', 'Above 80')])
PROBABILITY_CHOICES = [(str(i), '{} %'.format(i)) for i in range(0, 101)]

DEMOGRAPHIC_FIELDS = ['gender', 'age', 'esl']


class SurveyResponse(models.Model):

    gender = models.CharField(max_length=1, null=True, blank=True, choices=GENDER_CHOICES)
    age = models.CharField(max_length=2, null=True, blank=True, choices=AGE_CHOICES)
    esl = models.CharField(max_length=2, null=True, blank=True, choices=ESL_CHOICES)

    always = models.IntegerField(null=True, blank=True, validators=[is_probability])
    almost_always = models.IntegerField(null=True, blank=True, validators=[is_probability])
    certainly = models.IntegerField(null=True, blank=True, validators=[is_probability])
    likely = models.IntegerField(null=True, blank=True, validators=[is_probability])
    unlikely = models.IntegerField(null=True, blank=True, validators=[is_probability])
    probably = models.IntegerField(null=True, blank=True, validators=[is_probability])
    frequently = models.IntegerField(null=True, blank=True, validators=[is_probability])
    not_often = models.IntegerField(null=True, blank=True, validators=[is_probability])
    usually = models.IntegerField(null=True, blank=True, validators=[is_probability])
    possibly = models.IntegerField(null=True, blank=True, validators=[is_probability])
    never = models.IntegerField(null=True, blank=True, validators=[is_probability])
    almost_certainly = models.IntegerField(null=True, blank=True, validators=[is_probability])
    with_high_probability = models.IntegerField(null=True, blank=True, validators=[is_probability])
    with_low_probability = models.IntegerField(null=True, blank=True, validators=[is_probability])
    with_moderate_probability = models.IntegerField(null=True, blank=True, validators=[is_probability])
    more_often_than_not = models.IntegerField(null=True, blank=True, validators=[is_probability])
    often = models.IntegerField(null=True, blank=True, validators=[is_probability])
    rarely = models.IntegerField(null=True, blank=True, validators=[is_probability])

    maybe = models.IntegerField(null=True, blank=True, validators=[is_probability])
    might_happen = models.IntegerField(null=True, blank=True, validators=[is_probability])
    serious_possibility = models.IntegerField(null=True, blank=True, validators=[is_probability])
    real_possibility = models.IntegerField(null=True, blank=True, validators=[is_probability])
    slam_dunk = models.IntegerField(null=True, blank=True, validators=[is_probability])
