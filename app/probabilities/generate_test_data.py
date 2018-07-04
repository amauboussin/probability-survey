from random import choice, randrange

from probabilities.forms import PROB_FIELDS
from probabilities.models import SurveyResponse, GENDER_CHOICES, ESL_CHOICES, AGE_CHOICES


def clear_responses():
    SurveyResponse.objects.all().delete()


def generate_fake_responses(n):
    """Add n fake data points to the db for testing"""
    get_first_of_each = lambda x: list(zip(*x))[0]
    gender_options = get_first_of_each(GENDER_CHOICES)
    esl_options = get_first_of_each(ESL_CHOICES)
    age_options = get_first_of_each(AGE_CHOICES)

    fake_responses = []
    for i in range(n):
        args = {
            'gender': choice(gender_options),
            'esl': choice(esl_options),
            'age': choice(age_options)
        }
        args.update({word: randrange(0, 101) * float(i + 1)/len(PROB_FIELDS)
                     for i, word in enumerate(PROB_FIELDS)})
        fake_responses.append(SurveyResponse(**args))

    SurveyResponse.objects.bulk_create(fake_responses)

